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
} = require('../controllers/shipmentController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// ==========================================
// 1. CUSTOMER SPECIFIC ROUTES
// ==========================================

// Customer: View their own shipments
router.get('/my-shipments', authenticate, authorizeRoles('customer'), getMyShipments);

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

// Courier: View single assigned shipment
router.get('/courier/:id', authenticate, authorizeRoles('courier'), getCourierShipmentById);

// Courier: Update delivery status
router.patch('/courier/:id/status', authenticate, authorizeRoles('courier'), updateShipmentStatusCourier);

// ==========================================
// 4. GENERAL / BASE ROUTES
// ==========================================

// Customer: Create a new shipment
router.post('/', authenticate, authorizeRoles('customer'), createShipment);

// Authenticated users: Track / view shipment by tracking ID or Mongo ID
router.get('/:trackingId', authenticate, getShipmentByTrackingId);

module.exports = router;
