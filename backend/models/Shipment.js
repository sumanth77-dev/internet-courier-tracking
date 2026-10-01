const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    addressLine: {
      type: String,
      required: [true, 'Address line is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
  },
  { _id: false }
);

const packageDetailsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Package description is required'],
      trim: true,
    },
    weight: {
      type: Number,
      required: [true, 'Package weight (kg) is required'],
      min: [0, 'Weight cannot be negative'],
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: [true, 'Tracking ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    pickupAddress: {
      type: addressSchema,
      required: [true, 'Pickup address is required'],
    },
    deliveryAddress: {
      type: addressSchema,
      required: [true, 'Delivery address is required'],
    },
    packageDetails: {
      type: packageDetailsSchema,
      required: [true, 'Package details are required'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'Pending',
          'Assigned',
          'Picked Up',
          'In Transit',
          'Out for Delivery',
          'Delivered',
          'Cancelled',
        ],
        message: '{VALUE} is not a valid shipment status',
      },
      default: 'Pending',
      index: true,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
shipmentSchema.index({ customerId: 1, status: 1 });
shipmentSchema.index({ courierId: 1, status: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;
