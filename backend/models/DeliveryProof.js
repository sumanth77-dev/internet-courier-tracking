const mongoose = require('mongoose');

const deliveryProofSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      unique: true,
      index: true,
    },
    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Courier ID is required'],
      index: true,
    },
    photoUrl: {
      type: String,
      required: [true, 'Proof photo URL is required'],
      trim: true,
    },
    recipientName: {
      type: String,
      trim: true,
      default: null,
    },
    recipientType: {
      type: String,
      enum: ['Customer', 'Family Member', 'Authorized Recipient', 'Neighbor', 'Other'],
      default: 'Customer',
    },
    confirmation: {
      type: Boolean,
      required: [true, 'Delivery confirmation is required'],
      default: false,
    },
    verificationMethod: {
      type: String,
      default: 'OTP',
    },
    verificationStatus: {
      type: String,
      default: 'Verified',
    },
    deliveredAt: {
      type: Date,
      required: [true, 'Delivery date and time is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryProof = mongoose.model('DeliveryProof', deliveryProofSchema);

module.exports = DeliveryProof;
