const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const Location = require('../models/Location');
const DeliveryProof = require('../models/DeliveryProof');
const DeliveryOtp = require('../models/DeliveryOtp');

/**
 * Generate a unique, human-readable tracking ID
 * Format: TRK{YEAR}{5-digit sequential counter} e.g. TRK202600001
 * Safely handles collision detection
 */
const generateUniqueTrackingId = async () => {
  const year = new Date().getFullYear();
  const prefix = `TRK${year}`;

  const count = await Shipment.countDocuments({
    trackingId: { $regex: `^${prefix}` },
  });

  let counter = count + 1;
  let isUnique = false;
  let trackingId = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    attempts++;
    trackingId = `${prefix}${String(counter).padStart(5, '0')}`;
    const exists = await Shipment.exists({ trackingId });
    if (!exists) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  if (!isUnique) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    trackingId = `${prefix}${randomSuffix}`;
  }

  return trackingId;
};

/**
 * Helper to validate an address object
 */
const validateAddress = (address, typeName) => {
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    return `${typeName} must be a valid object`;
  }

  const { addressLine, city, state, postalCode, latitude, longitude } = address;

  if (!addressLine || typeof addressLine !== 'string' || !addressLine.trim()) {
    return `${typeName}.addressLine is required and must be a non-empty string`;
  }

  if (!city || typeof city !== 'string' || !city.trim()) {
    return `${typeName}.city is required and must be a non-empty string`;
  }

  if (!state || typeof state !== 'string' || !state.trim()) {
    return `${typeName}.state is required and must be a non-empty string`;
  }

  if (
    !postalCode ||
    typeof postalCode !== 'string' ||
    !postalCode.trim() ||
    postalCode.trim().length < 3 ||
    postalCode.trim().length > 10
  ) {
    return `${typeName}.postalCode is required and must be between 3 and 10 characters`;
  }

  if (
    latitude === undefined ||
    latitude === null ||
    typeof latitude !== 'number' ||
    Number.isNaN(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return `${typeName}.latitude is required and must be a number between -90 and 90`;
  }

  if (
    longitude === undefined ||
    longitude === null ||
    typeof longitude !== 'number' ||
    Number.isNaN(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return `${typeName}.longitude is required and must be a number between -180 and 180`;
  }

  return null;
};

/**
 * Helper to validate package details object
 */
const validatePackageDetails = (packageDetails) => {
  if (!packageDetails || typeof packageDetails !== 'object' || Array.isArray(packageDetails)) {
    return 'packageDetails must be a valid object';
  }

  const { description, weight } = packageDetails;

  if (!description || typeof description !== 'string' || !description.trim()) {
    return 'packageDetails.description is required and must be a non-empty string';
  }

  if (
    weight === undefined ||
    weight === null ||
    typeof weight !== 'number' ||
    Number.isNaN(weight) ||
    weight < 0
  ) {
    return 'packageDetails.weight is required and must be a non-negative number';
  }

  return null;
};

/**
 * Lifecycle state transitions map
 */
const ALLOWED_COURIER_TRANSITIONS = {
  Assigned: ['Picked Up'],
  'Picked Up': ['In Transit'],
  'In Transit': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const ALLOWED_ADMIN_TRANSITIONS = {
  Pending: ['Assigned', 'Cancelled'],
  Assigned: ['Picked Up', 'Cancelled'],
  'Picked Up': ['In Transit', 'Cancelled'],
  'In Transit': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

// ==========================================
// 1. CUSTOMER CONTROLLERS
// ==========================================

/**
 * @desc    Create a new shipment (Customer only)
 * @route   POST /api/shipments
 * @access  Private (Role: customer)
 */
const createShipment = async (req, res) => {
  try {
    const { pickupAddress, deliveryAddress, packageDetails } = req.body;

    const pickupError = validateAddress(pickupAddress, 'pickupAddress');
    if (pickupError) {
      return res.status(400).json({ success: false, message: pickupError });
    }

    const deliveryError = validateAddress(deliveryAddress, 'deliveryAddress');
    if (deliveryError) {
      return res.status(400).json({ success: false, message: deliveryError });
    }

    const packageError = validatePackageDetails(packageDetails);
    if (packageError) {
      return res.status(400).json({ success: false, message: packageError });
    }

    const trackingId = await generateUniqueTrackingId();

    const newShipment = await Shipment.create({
      trackingId,
      customerId: req.user.userId,
      courierId: null,
      pickupAddress: {
        addressLine: pickupAddress.addressLine.trim(),
        city: pickupAddress.city.trim(),
        state: pickupAddress.state.trim(),
        postalCode: pickupAddress.postalCode.trim(),
        latitude: pickupAddress.latitude,
        longitude: pickupAddress.longitude,
      },
      deliveryAddress: {
        addressLine: deliveryAddress.addressLine.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state.trim(),
        postalCode: deliveryAddress.postalCode.trim(),
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
      },
      packageDetails: {
        description: packageDetails.description.trim(),
        weight: packageDetails.weight,
      },
      status: 'Pending',
      pickedUpAt: null,
      deliveredAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: { shipment: newShipment },
    });
  } catch (error) {
    console.error('Create Shipment Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating shipment',
    });
  }
};

/**
 * @desc    Get all shipments belonging to authenticated customer
 * @route   GET /api/shipments/my-shipments
 * @access  Private (Role: customer)
 */
const getMyShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ customerId: req.user.userId })
      .populate('courierId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('Get My Shipments Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching customer shipments',
    });
  }
};

/**
 * @desc    Track/Get shipment by trackingId (or _id)
 * @route   GET /api/shipments/:trackingId
 * @access  Private (Authenticated users: customer owner, assigned courier, admin)
 */
const getShipmentByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(trackingId)
      ? { _id: trackingId }
      : { trackingId: trackingId.toUpperCase() };

    const shipment = await Shipment.findOne(query).populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'courierId', select: 'name email phone' },
    ]);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Role-based visibility check:
    const shipmentCustomerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    const shipmentCourierId = shipment.courierId?._id?.toString() || shipment.courierId?.toString();

    if (req.user.role === 'customer' && shipmentCustomerId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this shipment',
      });
    }

    if (req.user.role === 'courier' && shipmentCourierId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to this shipment',
      });
    }

    return res.status(200).json({
      success: true,
      data: { shipment },
    });
  } catch (error) {
    console.error('Get Shipment By Tracking ID Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shipment',
    });
  }
};

/**
 * @desc    Get latest recorded GPS location for a shipment
 * @route   GET /api/shipments/:trackingId/location
 * @access  Private (Authenticated users: customer owner, assigned courier, admin)
 */
const getLatestShipmentLocation = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(trackingId)
      ? { _id: trackingId }
      : { trackingId: trackingId.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Role-based visibility check:
    const shipmentCustomerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    const shipmentCourierId = shipment.courierId?._id?.toString() || shipment.courierId?.toString();

    if (req.user.role === 'customer' && shipmentCustomerId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view location for this shipment',
      });
    }

    if (req.user.role === 'courier' && shipmentCourierId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to this shipment',
      });
    }

    // Find the single most recent location record using compound index { shipmentId: 1, timestamp: -1 }
    const latestLocation = await Location.findOne({ shipmentId: shipment._id })
      .sort({ timestamp: -1 });

    if (!latestLocation) {
      return res.status(200).json({
        success: true,
        data: { location: null },
        message: 'No recorded location for this shipment yet',
      });
    }

    console.log(
      `[LiveTracking] Served latest location for shipment ${shipment._id} (${shipment.trackingId}) to user ${req.user.userId} (${req.user.role}): lat=${latestLocation.latitude}, lng=${latestLocation.longitude}, time=${latestLocation.timestamp.toISOString()}`
    );

    return res.status(200).json({
      success: true,
      data: {
        location: {
          shipmentId: shipment._id.toString(),
          trackingId: shipment.trackingId,
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          accuracy: latestLocation.accuracy,
          timestamp: latestLocation.timestamp.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get Latest Location Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching latest shipment location',
    });
  }
};

// ==========================================
// 2. ADMIN CONTROLLERS
// ==========================================

/**
 * @desc    Get all shipments with optional status filter (Admin only)
 * @route   GET /api/shipments/admin/all
 * @access  Private (Role: admin)
 */
const getAllShipmentsAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const shipments = await Shipment.find(filter)
      .populate('customerId', 'name email phone')
      .populate('courierId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('Admin Get All Shipments Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shipments for admin',
    });
  }
};

/**
 * @desc    Get specific shipment details for admin
 * @route   GET /api/shipments/admin/:id
 * @access  Private (Role: admin)
 */
const getShipmentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query).populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'courierId', select: 'name email phone' },
    ]);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { shipment },
    });
  } catch (error) {
    console.error('Admin Get Shipment Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shipment',
    });
  }
};

/**
 * @desc    Get list of all registered couriers (Admin only)
 * @route   GET /api/shipments/admin/couriers
 * @access  Private (Role: admin)
 */
const getCouriersList = async (req, res) => {
  try {
    const couriers = await User.find({ role: 'courier' })
      .select('-password')
      .sort({ name: 1 });

    const safeCouriers = couriers.map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: safeCouriers.length,
      data: { couriers: safeCouriers },
    });
  } catch (error) {
    console.error('Admin Get Couriers Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching couriers',
    });
  }
};

/**
 * @desc    Assign a courier to a shipment (Admin only)
 * @route   PUT /api/shipments/admin/:id/assign, PATCH /api/shipments/admin/:id/assign
 * @access  Private (Role: admin)
 */
const assignCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body;

    if (!courierId) {
      return res.status(400).json({
        success: false,
        message: 'courierId is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid courierId format',
      });
    }

    const courier = await User.findById(courierId);
    if (!courier || courier.role !== 'courier') {
      return res.status(400).json({
        success: false,
        message: 'The specified user does not exist or is not a registered courier',
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // State machine check: cannot reassign if Delivered or Cancelled
    if (shipment.status === 'Delivered' || shipment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign courier: Shipment is already '${shipment.status}' and cannot be reassigned.`,
      });
    }

    shipment.courierId = courier._id;
    shipment.status = 'Assigned';
    await shipment.save();

    return res.status(200).json({
      success: true,
      message: 'Courier assigned to shipment successfully',
      data: { shipment },
    });
  } catch (error) {
    console.error('Assign Courier Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while assigning courier',
    });
  }
};

/**
 * @desc    Admin update shipment status
 * @route   PATCH /api/shipments/admin/:id/status
 * @access  Private (Role: admin)
 */
const updateShipmentStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid status string is required',
      });
    }

    const trimmedStatus = status.trim();
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    const nextAllowed = ALLOWED_ADMIN_TRANSITIONS[shipment.status] || [];
    if (!nextAllowed.includes(trimmedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${shipment.status}' to '${trimmedStatus}'. Allowed next status: ${
          nextAllowed.length > 0 ? nextAllowed.join(', ') : 'None (Terminal state)'
        }`,
      });
    }

    if (trimmedStatus === 'Picked Up' && !shipment.pickedUpAt) {
      shipment.pickedUpAt = new Date();
    } else if (trimmedStatus === 'Delivered') {
      const existingProof = await DeliveryProof.findOne({ shipmentId: shipment._id });
      if (!existingProof) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot mark shipment as 'Delivered' without valid Proof of Delivery. Delivery must be verified through the courier Proof of Delivery process with customer OTP and photo.",
        });
      }
      if (!shipment.deliveredAt) {
        shipment.deliveredAt = existingProof.deliveredAt || new Date();
      }
    }

    shipment.status = trimmedStatus;
    await shipment.save();

    // Broadcast real-time status update to shipment room
    const io = req.app.get('io');
    if (io) {
      const statusPayload = {
        shipmentId: shipment._id.toString(),
        trackingId: shipment.trackingId,
        status: trimmedStatus,
        pickedUpAt: shipment.pickedUpAt ? shipment.pickedUpAt.toISOString() : null,
        deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.toISOString() : null,
        updatedAt: shipment.updatedAt ? shipment.updatedAt.toISOString() : new Date().toISOString(),
      };
      io.to(`shipment:${shipment._id}`).emit('shipment:statusUpdate', statusPayload);
      console.log(`[LiveTracking] Broadcasted shipment:statusUpdate by Admin to shipment:${shipment._id}:`, statusPayload);
    }

    return res.status(200).json({
      success: true,
      message: `Shipment status updated to '${trimmedStatus}' successfully by Admin`,
      data: { shipment },
    });
  } catch (error) {
    console.error('Admin Update Status Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating shipment status',
    });
  }
};

// ==========================================
// 3. COURIER CONTROLLERS
// ==========================================

/**
 * @desc    Get all shipments assigned to authenticated courier
 * @route   GET /api/shipments/courier/assigned
 * @access  Private (Role: courier)
 */
const getCourierAssignedShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ courierId: req.user.userId })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('Courier Get Assigned Shipments Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assigned shipments',
    });
  }
};

/**
 * @desc    Get specific assigned shipment for courier
 * @route   GET /api/shipments/courier/:id
 * @access  Private (Role: courier)
 */
const getCourierShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query).populate('customerId', 'name email phone');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    const shipmentCourierId = shipment.courierId?._id?.toString() || shipment.courierId?.toString();
    if (shipmentCourierId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to this shipment',
      });
    }

    return res.status(200).json({
      success: true,
      data: { shipment },
    });
  } catch (error) {
    console.error('Courier Get Shipment Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shipment',
    });
  }
};

/**
 * @desc    Courier update shipment delivery status
 * @route   PATCH /api/shipments/courier/:id/status
 * @access  Private (Role: courier)
 */
const updateShipmentStatusCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid status string is required',
      });
    }

    const trimmedStatus = status.trim();
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Ownership check
    const shipmentCourierId = shipment.courierId?._id?.toString() || shipment.courierId?.toString();
    if (shipmentCourierId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not the courier assigned to this shipment',
      });
    }

    const nextAllowed = ALLOWED_COURIER_TRANSITIONS[shipment.status] || [];
    if (!nextAllowed.includes(trimmedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${shipment.status}' to '${trimmedStatus}'. Allowed next status: ${
          nextAllowed.length > 0 ? nextAllowed.join(', ') : 'None (Terminal state)'
        }`,
      });
    }

    // Guard: Couriers cannot mark Delivered directly; must submit Proof of Delivery (OTP + photo)
    if (trimmedStatus === 'Delivered') {
      return res.status(400).json({
        success: false,
        message:
          "Shipment cannot be marked as Delivered through direct status update. Please complete Proof of Delivery with package photo, customer OTP, and recipient confirmation at /api/shipments/courier/:id/proof-of-delivery.",
      });
    }

    if (trimmedStatus === 'Picked Up' && !shipment.pickedUpAt) {
      shipment.pickedUpAt = new Date();
    }

    shipment.status = trimmedStatus;
    await shipment.save();

    // Broadcast real-time status update to shipment room
    const io = req.app.get('io');
    if (io) {
      const statusPayload = {
        shipmentId: shipment._id.toString(),
        trackingId: shipment.trackingId,
        status: trimmedStatus,
        pickedUpAt: shipment.pickedUpAt ? shipment.pickedUpAt.toISOString() : null,
        deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.toISOString() : null,
        updatedAt: shipment.updatedAt ? shipment.updatedAt.toISOString() : new Date().toISOString(),
      };
      io.to(`shipment:${shipment._id}`).emit('shipment:statusUpdate', statusPayload);
      console.log(`[LiveTracking] Broadcasted shipment:statusUpdate by Courier to shipment:${shipment._id}:`, statusPayload);
    }

    return res.status(200).json({
      success: true,
      message: `Shipment status updated to '${trimmedStatus}' successfully`,
      data: { shipment },
    });
  } catch (error) {
    console.error('Courier Update Status Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating shipment status',
    });
  }
};

/**
 * @desc    Get delivery history (Delivered & Cancelled) for authenticated courier
 * @route   GET /api/shipments/courier/history
 * @access  Private (Role: courier)
 */
const getCourierDeliveryHistory = async (req, res) => {
  try {
    const shipments = await Shipment.find({
      courierId: req.user.userId,
      status: { $in: ['Delivered', 'Cancelled'] },
    })
      .populate('customerId', 'name email phone')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('Courier Delivery History Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching delivery history',
    });
  }
};

// ==========================================
// 4. PROOF OF DELIVERY & DELIVERY OTP
// ==========================================

/**
 * @desc    Generate or view Delivery OTP (Customer only)
 * @route   POST /api/shipments/:id/delivery-otp
 * @access  Private (Role: customer)
 */
const generateDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Ownership verification: only customer owner can request OTP
    const shipmentCustomerId =
      shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    if (shipmentCustomerId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to access the delivery OTP for this shipment',
      });
    }

    // Must be Out for Delivery
    if (shipment.status !== 'Out for Delivery') {
      return res.status(400).json({
        success: false,
        message: `Delivery OTP can only be generated when shipment is 'Out for Delivery'. Current status: '${shipment.status}'`,
      });
    }

    // Check if shipment is already delivered
    if (shipment.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivery has already been completed for this shipment.',
      });
    }

    // Check existing OTP for cooldown / rate limiting
    const existingOtp = await DeliveryOtp.findOne({ shipmentId: shipment._id }).select('+otpHash');
    const now = Date.now();

    if (existingOtp && !existingOtp.consumedAt && existingOtp.lastGeneratedAt) {
      const elapsedMs = now - new Date(existingOtp.lastGeneratedAt).getTime();
      // Cooldown of 30 seconds to prevent rapid regeneration spam
      if (elapsedMs < 30000) {
        const remainingSeconds = Math.ceil((30000 - elapsedMs) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          retryAfter: remainingSeconds,
        });
      }
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes expiry

    // Atomically upsert DeliveryOtp record
    await DeliveryOtp.findOneAndUpdate(
      { shipmentId: shipment._id },
      {
        customerId: req.user.userId,
        otpHash,
        expiresAt,
        attemptCount: 0,
        isLocked: false,
        lastGeneratedAt: new Date(now),
        consumedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(
      `[DeliveryOTP] Generated demo OTP for shipment ${shipment.trackingId} (owner: ${req.user.userId}). Expires at: ${expiresAt.toISOString()}`
    );

    return res.status(200).json({
      success: true,
      message: 'Delivery OTP generated successfully (DEMO Mode)',
      data: {
        otp, // Returned exclusively to authenticated customer owner for demo verification
        expiresAt: expiresAt.toISOString(),
        expiresInSeconds: 600,
        trackingId: shipment.trackingId,
        shipmentId: shipment._id.toString(),
        isDemo: true,
        note: 'DEMO OTP: Provide this 6-digit code to the courier upon package delivery.',
      },
    });
  } catch (error) {
    console.error('Generate Delivery OTP Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while generating delivery OTP',
    });
  }
};

/**
 * @desc    Check Delivery OTP status without revealing OTP (Customer only)
 * @route   GET /api/shipments/:id/delivery-otp-status
 * @access  Private (Role: customer)
 */
const getDeliveryOtpStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    const shipmentCustomerId =
      shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    if (shipmentCustomerId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this shipment',
      });
    }

    const otpDoc = await DeliveryOtp.findOne({ shipmentId: shipment._id });

    if (!otpDoc) {
      return res.status(200).json({
        success: true,
        data: {
          hasOtp: false,
          isConsumed: false,
          isExpired: false,
          isLocked: false,
          expiresAt: null,
          remainingSeconds: 0,
        },
      });
    }

    const isConsumed = Boolean(otpDoc.consumedAt);
    const isExpired = !isConsumed && new Date() > new Date(otpDoc.expiresAt);
    const remainingSeconds =
      !isConsumed && !isExpired
        ? Math.max(0, Math.floor((new Date(otpDoc.expiresAt).getTime() - Date.now()) / 1000))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        hasOtp: true,
        isConsumed,
        isExpired,
        isLocked: otpDoc.isLocked || otpDoc.attemptCount >= 5,
        expiresAt: otpDoc.expiresAt.toISOString(),
        remainingSeconds,
        attemptCount: otpDoc.attemptCount,
        maxAttempts: otpDoc.maxAttempts,
      },
    });
  } catch (error) {
    console.error('Get Delivery OTP Status Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while checking OTP status',
    });
  }
};

/**
 * @desc    Submit Proof of Delivery with OTP verification & package photo (Courier only)
 * @route   POST /api/shipments/courier/:id/proof-of-delivery
 * @access  Private (Role: courier)
 */
const submitProofOfDelivery = async (req, res) => {
  const uploadedFilePath = req.file?.path;

  // Cleanup helper for failed validations
  const cleanupFile = () => {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (err) {
        console.warn('Failed to clean up uploaded file:', err.message);
      }
    }
  };

  try {
    const { id } = req.params;
    const { otp, confirmation, recipientName, recipientType } = req.body;

    // 1. Photo presence check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'A package delivery photo is required to complete delivery.',
      });
    }

    // 2. Courier handover confirmation check
    if (confirmation !== true && confirmation !== 'true') {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message:
          'Courier must check and confirm: "I confirm that I handed over the package to the customer or an authorized recipient."',
      });
    }

    // 3. OTP format validation
    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit numeric delivery OTP is required.',
      });
    }

    // 4. Fetch shipment
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      cleanupFile();
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // 5. Courier assignment check
    const shipmentCourierId =
      shipment.courierId?._id?.toString() || shipment.courierId?.toString();
    if (shipmentCourierId !== req.user.userId.toString()) {
      cleanupFile();
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not the courier assigned to this shipment',
      });
    }

    // 6. State check: Must be 'Out for Delivery'
    if (shipment.status === 'Delivered') {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'Shipment has already been marked as Delivered.',
      });
    }

    if (shipment.status !== 'Out for Delivery') {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: `Proof of Delivery can only be submitted when shipment is 'Out for Delivery'. Current status: '${shipment.status}'`,
      });
    }

    // 7. Prevent duplicate proof submissions
    const existingProof = await DeliveryProof.findOne({ shipmentId: shipment._id });
    if (existingProof) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'Proof of Delivery has already been submitted for this shipment.',
      });
    }

    // 8. Validate OTP against stored hash
    const deliveryOtp = await DeliveryOtp.findOne({ shipmentId: shipment._id }).select('+otpHash');

    if (!deliveryOtp) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message:
          'No delivery OTP has been generated for this shipment. Please ask the customer to generate their delivery OTP.',
      });
    }

    if (deliveryOtp.consumedAt) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'This delivery OTP has already been used and cannot be reused.',
      });
    }

    if (deliveryOtp.isLocked || deliveryOtp.attemptCount >= 5) {
      cleanupFile();
      return res.status(429).json({
        success: false,
        message:
          'Maximum OTP verification attempts exceeded (5/5). OTP is locked. Customer must generate a new OTP.',
      });
    }

    if (new Date() > new Date(deliveryOtp.expiresAt)) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        message: 'The delivery OTP has expired. Customer must generate a new OTP.',
      });
    }

    // Cryptographic comparison
    const isOtpValid = await bcrypt.compare(otp.trim(), deliveryOtp.otpHash);

    if (!isOtpValid) {
      deliveryOtp.attemptCount += 1;
      if (deliveryOtp.attemptCount >= 5) {
        deliveryOtp.isLocked = true;
        await deliveryOtp.save();
        cleanupFile();
        return res.status(400).json({
          success: false,
          message:
            'Invalid delivery OTP. Maximum verification attempts exceeded (5/5). OTP is now locked. Customer must generate a new OTP.',
          remainingAttempts: 0,
          isLocked: true,
        });
      }
      await deliveryOtp.save();
      cleanupFile();

      const remainingAttempts = Math.max(0, 5 - deliveryOtp.attemptCount);
      return res.status(400).json({
        success: false,
        message: `Invalid delivery OTP. ${remainingAttempts} attempt${
          remainingAttempts === 1 ? '' : 's'
        } remaining before lock.`,
        remainingAttempts,
      });
    }

    // 9. All validations passed! Create DeliveryProof
    const photoUrl = `/uploads/delivery-proofs/${req.file.filename}`;
    const serverTimestamp = new Date();

    const proof = await DeliveryProof.create({
      shipmentId: shipment._id,
      courierId: req.user.userId,
      photoUrl,
      recipientName: recipientName ? recipientName.trim() : null,
      recipientType: recipientType ? recipientType.trim() : 'Customer',
      confirmation: true,
      verificationMethod: 'OTP',
      verificationStatus: 'Verified',
      deliveredAt: serverTimestamp,
    });

    // 10. Atomically consume OTP
    deliveryOtp.consumedAt = serverTimestamp;
    await deliveryOtp.save();

    // 11. Transition shipment to Delivered
    shipment.status = 'Delivered';
    shipment.deliveredAt = serverTimestamp;
    await shipment.save();

    console.log(
      `[DeliveryPOD] Shipment ${shipment.trackingId} successfully marked Delivered with verified OTP and photo by courier ${req.user.userId}.`
    );

    // 12. Broadcast status update to room
    const io = req.app.get('io');
    if (io) {
      const statusPayload = {
        shipmentId: shipment._id.toString(),
        trackingId: shipment.trackingId,
        status: 'Delivered',
        deliveredAt: shipment.deliveredAt.toISOString(),
        pickedUpAt: shipment.pickedUpAt ? shipment.pickedUpAt.toISOString() : null,
        updatedAt: shipment.updatedAt ? shipment.updatedAt.toISOString() : serverTimestamp.toISOString(),
        proof: {
          photoUrl: proof.photoUrl,
          recipientName: proof.recipientName,
          recipientType: proof.recipientType,
          deliveredAt: proof.deliveredAt.toISOString(),
          verificationMethod: proof.verificationMethod,
        },
      };
      io.to(`shipment:${shipment._id}`).emit('shipment:statusUpdate', statusPayload);
      console.log(`[LiveTracking] Broadcasted Delivered statusUpdate with POD to shipment:${shipment._id}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Proof of Delivery verified successfully. Shipment marked as Delivered.',
      data: {
        shipment,
        proof,
      },
    });
  } catch (error) {
    cleanupFile();
    console.error('Submit Proof of Delivery Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing Proof of Delivery',
    });
  }
};

/**
 * @desc    Get Proof of Delivery for a shipment
 * @route   GET /api/shipments/:id/proof-of-delivery
 * @access  Private (Role: customer owner, assigned courier, admin)
 */
const getShipmentProofOfDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { trackingId: id.toUpperCase() };

    const shipment = await Shipment.findOne(query);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // Role-based visibility check:
    const shipmentCustomerId =
      shipment.customerId?._id?.toString() || shipment.customerId?.toString();
    const shipmentCourierId =
      shipment.courierId?._id?.toString() || shipment.courierId?.toString();

    if (req.user.role === 'customer' && shipmentCustomerId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view proof for this shipment',
      });
    }

    if (req.user.role === 'courier' && shipmentCourierId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to this shipment',
      });
    }

    const proof = await DeliveryProof.findOne({ shipmentId: shipment._id })
      .populate('courierId', 'name email phone');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'No Proof of Delivery record found for this shipment',
      });
    }

    return res.status(200).json({
      success: true,
      data: { proof },
    });
  } catch (error) {
    console.error('Get Proof of Delivery Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving Proof of Delivery',
    });
  }
};

module.exports = {
  createShipment,
  getMyShipments,
  getShipmentByTrackingId,
  getAllShipmentsAdmin,
  getShipmentAdmin,
  getCouriersList,
  assignCourier,
  updateShipmentStatusAdmin,
  getCourierAssignedShipments,
  getCourierShipmentById,
  updateShipmentStatusCourier,
  getCourierDeliveryHistory,
  getLatestShipmentLocation,
  generateDeliveryOtp,
  getDeliveryOtpStatus,
  submitProofOfDelivery,
  getShipmentProofOfDelivery,
};
