const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      index: true,
    },
    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Courier ID is required'],
      index: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    accuracy: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for querying a shipment's location history chronologically
locationSchema.index({ shipmentId: 1, timestamp: -1 });
locationSchema.index({ courierId: 1, timestamp: -1 });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
