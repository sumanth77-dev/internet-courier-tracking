const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const User = require('../models/User');

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
    } else if (trimmedStatus === 'Delivered' && !shipment.deliveredAt) {
      shipment.deliveredAt = new Date();
    }

    shipment.status = trimmedStatus;
    await shipment.save();

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

    if (trimmedStatus === 'Picked Up' && !shipment.pickedUpAt) {
      shipment.pickedUpAt = new Date();
    } else if (trimmedStatus === 'Delivered' && !shipment.deliveredAt) {
      shipment.deliveredAt = new Date();
    }

    shipment.status = trimmedStatus;
    await shipment.save();

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
};
