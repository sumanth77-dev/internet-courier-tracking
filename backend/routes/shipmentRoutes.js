const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/shipmentController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { handleProofPhotoUpload } = require('../middleware/uploadMiddleware');

// ==========================================
// 1. CUSTOMER SPECIFIC ROUTES
// ==========================================

// Customer: View their own shipments
router.get('/my-shipments', authenticate, authorizeRoles('customer'), getMyShipments);

// Customer: Generate / view Delivery OTP
router.post('/:id/delivery-otp', authenticate, authorizeRoles('customer'), generateDeliveryOtp);

// Customer: Check Delivery OTP status
router.get('/:id/delivery-otp-status', authenticate, authorizeRoles('customer'), getDeliveryOtpStatus);

// ==========================================
// 2. ADMIN ROUTES
// ==========================================

// Admin: View all registered couriers (must be before /admin/:id)
router.get('/admin/couriers', authenticate, authorizeRoles('admin'), getCouriersList);

// Admin: View all shipments (must be before /admin/:id)
router.get('/admin/all', authenticate, authorizeRoles('admin'), getAllShipmentsAdmin);

// Admin: View single shipment details
router.get('/admin/:id', authenticate, authorizeRoles('admin'), getShipmentAdmin);

// Admin: Assign courier (supports both PUT and PATCH)
router
  .route('/admin/:id/assign')
  .put(authenticate, authorizeRoles('admin'), assignCourier)
  .patch(authenticate, authorizeRoles('admin'), assignCourier);

// Admin: Update shipment status override
router.patch('/admin/:id/status', authenticate, authorizeRoles('admin'), updateShipmentStatusAdmin);

// ==========================================
// 3. COURIER ROUTES
// ==========================================

// Courier: View all shipments assigned to authenticated courier (must be before /courier/:id)
router.get('/courier/assigned', authenticate, authorizeRoles('courier'), getCourierAssignedShipments);

// Courier: View delivery history (Delivered & Cancelled) (must be before /courier/:id)
router.get('/courier/history', authenticate, authorizeRoles('courier'), getCourierDeliveryHistory);

// Courier: Submit Proof of Delivery (Photo + OTP verification)
router.post(
  '/courier/:id/proof-of-delivery',
  authenticate,
  authorizeRoles('courier'),
  handleProofPhotoUpload,
  submitProofOfDelivery
);

// Courier: View single assigned shipment
router.get('/courier/:id', authenticate, authorizeRoles('courier'), getCourierShipmentById);

// Courier: Update delivery status
router.patch('/courier/:id/status', authenticate, authorizeRoles('courier'), updateShipmentStatusCourier);

// ==========================================
// 4. GENERAL / BASE ROUTES
// ==========================================

// Customer: Create a new shipment
router.post('/', authenticate, authorizeRoles('customer'), createShipment);

// Authenticated users (customer owner, assigned courier, admin): Get latest recorded GPS location
router.get('/:trackingId/location', authenticate, getLatestShipmentLocation);
router.get('/:trackingId/latest-location', authenticate, getLatestShipmentLocation);

// Authenticated users: Get Proof of Delivery for a delivered shipment
router.get('/:id/proof-of-delivery', authenticate, getShipmentProofOfDelivery);

// Authenticated users: Track / view shipment by tracking ID or Mongo ID
router.get('/:trackingId', authenticate, getShipmentByTrackingId);

module.exports = router;
