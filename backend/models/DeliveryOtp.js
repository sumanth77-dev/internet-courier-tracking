const mongoose = require('mongoose');

const deliveryOtpSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    otpHash: {
      type: String,
      required: [true, 'OTP hash is required'],
      select: false, // Never expose in queries by default
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lastGeneratedAt: {
      type: Date,
      default: Date.now,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
deliveryOtpSchema.index({ shipmentId: 1, expiresAt: 1 });

const DeliveryOtp = mongoose.model('DeliveryOtp', deliveryOtpSchema);

module.exports = DeliveryOtp;
