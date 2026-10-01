const mongoose = require('mongoose');

const deliveryProofSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Shipment ID is required'],
      unique: true,
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
    confirmation: {
      type: Boolean,
      required: [true, 'Delivery confirmation is required'],
      default: false,
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
