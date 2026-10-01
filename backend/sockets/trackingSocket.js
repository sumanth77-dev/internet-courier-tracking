const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const Location = require('../models/Location');

// Trackable statuses according to lifecycle
const TRACKABLE_STATES = ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'];

// Minimum allowed interval between location updates per socket in milliseconds
const MIN_UPDATE_INTERVAL_MS = 1000;

/**
 * Socket.IO Authentication Middleware
 * Validates JWT token from handshake auth or headers
 */
const authenticateSocket = (socket, next) => {
  try {
    let token = null;

    // 1. Check handshake auth object (standard in Socket.IO client: { auth: { token: '...' } })
    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }
    // 2. Check authorization header (e.g. Bearer <token>)
    else if (socket.handshake.headers && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        token = authHeader;
      }
    }
    // 3. Fallback: query param (?token=...)
    else if (socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      const err = new Error('Authentication error: No authentication token provided');
      err.data = { code: 'UNAUTHORIZED' };
      return next(err);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const err = new Error('Authentication error: JWT_SECRET not configured');
      return next(err);
    }

    const decoded = jwt.verify(token, secret);

    // Attach verified user identity
    socket.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    const err = new Error('Authentication error: Invalid or expired token');
    err.data = { code: 'INVALID_TOKEN', details: error.message };
    return next(err);
  }
};

/**
 * Helper to acknowledge client via callback or fallback emit
 */
const reply = (socket, eventName, callback, payload) => {
  if (typeof callback === 'function') {
    callback(payload);
  } else {
    socket.emit(`${eventName}:response`, payload);
  }
};

/**
 * Resolve shipment by Mongo ObjectId or Tracking ID
 */
const findShipmentByIdOrTracking = async (idOrTracking) => {
  if (!idOrTracking) return null;
  const query = mongoose.Types.ObjectId.isValid(idOrTracking)
    ? { _id: idOrTracking }
    : { trackingId: idOrTracking.toString().toUpperCase() };
  return await Shipment.findOne(query);
};

/**
 * Initialize Live GPS Tracking Socket Handlers
 * @param {import('socket.io').Server} io 
 */
const initializeTrackingSocket = (io) => {
  // Apply JWT authentication middleware to all incoming socket connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    // In-memory rate limiting tracker for this socket connection
    let lastLocationUpdateTime = 0;

    // ==========================================
    // 1. COURIER: START TRACKING
    // ==========================================
    socket.on('courier:startTracking', async (data = {}, callback) => {
      try {
        if (!socket.user || socket.user.role !== 'courier') {
          return reply(socket, 'courier:startTracking', callback, {
            success: false,
            message: 'Forbidden: Only authenticated couriers can start courier tracking',
          });
        }

        const { shipmentId } = data;
        if (!shipmentId) {
          return reply(socket, 'courier:startTracking', callback, {
            success: false,
            message: 'shipmentId is required',
          });
        }

        const shipment = await findShipmentByIdOrTracking(shipmentId);
        if (!shipment) {
          return reply(socket, 'courier:startTracking', callback, {
            success: false,
            message: 'Shipment not found',
          });
        }

        // Ownership verification
        const assignedCourierId = shipment.courierId?._id?.toString() || shipment.courierId?.toString();
        if (assignedCourierId !== socket.user.userId.toString()) {
          return reply(socket, 'courier:startTracking', callback, {
            success: false,
            message: 'Forbidden: You are not the courier assigned to this shipment',
          });
        }

        // Trackable state check
        if (!TRACKABLE_STATES.includes(shipment.status)) {
          return reply(socket, 'courier:startTracking', callback, {
            success: false,
            message: `Shipment is in '${shipment.status}' status and cannot be tracked. Trackable states: ${TRACKABLE_STATES.join(', ')}`,
          });
        }

        const roomName = `shipment:${shipment._id}`;
        socket.join(roomName);

        return reply(socket, 'courier:startTracking', callback, {
          success: true,
          message: 'Tracking started',
          data: {
            shipmentId: shipment._id.toString(),
            trackingId: shipment.trackingId,
            room: roomName,
            status: shipment.status,
          },
        });
      } catch (error) {
        console.error('courier:startTracking Error:', error.message);
        return reply(socket, 'courier:startTracking', callback, {
          success: false,
          message: 'Internal server error while starting courier tracking',
        });
      }
    });

    // ==========================================
    // 2. COURIER: LOCATION UPDATE
    // ==========================================
    socket.on('courier:locationUpdate', async (data = {}, callback) => {
      try {
        if (!socket.user || socket.user.role !== 'courier') {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Forbidden: Only authenticated couriers can send location updates',
          });
        }

        const { shipmentId, latitude, longitude, accuracy } = data;

        // 1. Basic field checks
        if (!shipmentId) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'shipmentId is required',
          });
        }

        // 2. Coordinates validation
        if (
          latitude === undefined ||
          latitude === null ||
          typeof latitude !== 'number' ||
          Number.isNaN(latitude) ||
          latitude < -90 ||
          latitude > 90
        ) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Invalid latitude. Must be a number between -90 and 90',
          });
        }

        if (
          longitude === undefined ||
          longitude === null ||
          typeof longitude !== 'number' ||
          Number.isNaN(longitude) ||
          longitude < -180 ||
          longitude > 180
        ) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Invalid longitude. Must be a number between -180 and 180',
          });
        }

        if (
          accuracy !== undefined &&
          accuracy !== null &&
          (typeof accuracy !== 'number' || Number.isNaN(accuracy) || accuracy < 0)
        ) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Invalid accuracy. Must be a non-negative number if provided',
          });
        }

        // 3. Rate limiting / Flood Protection (~1 sec minimum interval)
        const now = Date.now();
        if (now - lastLocationUpdateTime < MIN_UPDATE_INTERVAL_MS) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Rate limit: Location updates must be spaced at least 1 second apart',
          });
        }
        lastLocationUpdateTime = now;

        // 4. Verify shipment existence & ownership
        const shipment = await findShipmentByIdOrTracking(shipmentId);
        if (!shipment) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Shipment not found',
          });
        }

        const assignedCourierId = shipment.courierId?._id?.toString() || shipment.courierId?.toString();
        if (assignedCourierId !== socket.user.userId.toString()) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: 'Forbidden: You are not the courier assigned to this shipment',
          });
        }

        if (!TRACKABLE_STATES.includes(shipment.status)) {
          return reply(socket, 'courier:locationUpdate', callback, {
            success: false,
            message: `Cannot record location: Shipment is in '${shipment.status}' status`,
          });
        }

        // 5. Save location to MongoDB using server timestamp
        const serverTimestamp = new Date();
        const savedLocation = await Location.create({
          shipmentId: shipment._id,
          courierId: socket.user.userId,
          latitude,
          longitude,
          accuracy: accuracy !== undefined && accuracy !== null ? accuracy : null,
          timestamp: serverTimestamp,
        });

        // 6. Broadcast to the shipment room
        const roomName = `shipment:${shipment._id}`;
        const broadcastPayload = {
          shipmentId: shipment._id.toString(),
          trackingId: shipment.trackingId,
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          accuracy: savedLocation.accuracy,
          timestamp: savedLocation.timestamp.toISOString(),
        };

        io.to(roomName).emit('location:update', broadcastPayload);

        return reply(socket, 'courier:locationUpdate', callback, {
          success: true,
          message: 'Location saved and broadcasted successfully',
          data: broadcastPayload,
        });
      } catch (error) {
        console.error('courier:locationUpdate Error:', error.message);
        return reply(socket, 'courier:locationUpdate', callback, {
          success: false,
          message: 'Internal server error while processing location update',
        });
      }
    });

    // ==========================================
    // 3. CUSTOMER: START TRACKING
    // ==========================================
    socket.on('customer:startTracking', async (data = {}, callback) => {
      try {
        if (!socket.user || socket.user.role !== 'customer') {
          return reply(socket, 'customer:startTracking', callback, {
            success: false,
            message: 'Forbidden: Only authenticated customers can start customer tracking',
          });
        }

        const { shipmentId } = data;
        if (!shipmentId) {
          return reply(socket, 'customer:startTracking', callback, {
            success: false,
            message: 'shipmentId is required',
          });
        }

        const shipment = await findShipmentByIdOrTracking(shipmentId);
        if (!shipment) {
          return reply(socket, 'customer:startTracking', callback, {
            success: false,
            message: 'Shipment not found',
          });
        }

        // Customer ownership check
        const customerOwnerId = shipment.customerId?._id?.toString() || shipment.customerId?.toString();
        if (customerOwnerId !== socket.user.userId.toString()) {
          return reply(socket, 'customer:startTracking', callback, {
            success: false,
            message: 'Forbidden: You are not authorized to track this shipment',
          });
        }

        if (shipment.status === 'Cancelled') {
          return reply(socket, 'customer:startTracking', callback, {
            success: false,
            message: 'Cannot track a cancelled shipment',
          });
        }

        const roomName = `shipment:${shipment._id}`;
        socket.join(roomName);

        return reply(socket, 'customer:startTracking', callback, {
          success: true,
          message: 'Tracking started',
          data: {
            shipmentId: shipment._id.toString(),
            trackingId: shipment.trackingId,
            room: roomName,
            status: shipment.status,
          },
        });
      } catch (error) {
        console.error('customer:startTracking Error:', error.message);
        return reply(socket, 'customer:startTracking', callback, {
          success: false,
          message: 'Internal server error while starting customer tracking',
        });
      }
    });

    // ==========================================
    // 4. ADMIN: START TRACKING
    // ==========================================
    socket.on('admin:startTracking', async (data = {}, callback) => {
      try {
        if (!socket.user || socket.user.role !== 'admin') {
          return reply(socket, 'admin:startTracking', callback, {
            success: false,
            message: 'Forbidden: Only administrators can use admin tracking',
          });
        }

        const { shipmentId } = data;
        if (!shipmentId) {
          return reply(socket, 'admin:startTracking', callback, {
            success: false,
            message: 'shipmentId is required',
          });
        }

        const shipment = await findShipmentByIdOrTracking(shipmentId);
        if (!shipment) {
          return reply(socket, 'admin:startTracking', callback, {
            success: false,
            message: 'Shipment not found',
          });
        }

        const roomName = `shipment:${shipment._id}`;
        socket.join(roomName);

        return reply(socket, 'admin:startTracking', callback, {
          success: true,
          message: 'Admin tracking started',
          data: {
            shipmentId: shipment._id.toString(),
            trackingId: shipment.trackingId,
            room: roomName,
            status: shipment.status,
          },
        });
      } catch (error) {
        console.error('admin:startTracking Error:', error.message);
        return reply(socket, 'admin:startTracking', callback, {
          success: false,
          message: 'Internal server error while starting admin tracking',
        });
      }
    });

    // ==========================================
    // 5. STOP TRACKING
    // ==========================================
    socket.on('tracking:stop', async (data = {}, callback) => {
      try {
        const { shipmentId } = data;
        if (shipmentId) {
          const shipment = await findShipmentByIdOrTracking(shipmentId);
          const targetId = shipment ? shipment._id.toString() : shipmentId;
          socket.leave(`shipment:${targetId}`);
        }

        return reply(socket, 'tracking:stop', callback, {
          success: true,
          message: 'Tracking stopped',
        });
      } catch (error) {
        return reply(socket, 'tracking:stop', callback, {
          success: false,
          message: 'Error stopping tracking',
        });
      }
    });

    // ==========================================
    // 6. DISCONNECT
    // ==========================================
    socket.on('disconnect', (reason) => {
      // Clean up in-memory socket state without deleting MongoDB records or modifying ownership
      lastLocationUpdateTime = 0;
    });
  });
};

module.exports = {
  initializeTrackingSocket,
  authenticateSocket,
};
