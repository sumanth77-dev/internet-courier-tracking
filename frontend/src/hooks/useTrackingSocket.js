import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const THROTTLE_INTERVAL_MS = 2500; // 2.5 seconds throttle to stay comfortably within backend ~1s rate limit
const ACK_TIMEOUT_MS = 1500; // 1.5s fallback so UI action loops never freeze

/**
 * Custom hook for Socket.IO live tracking operations
 * Handles persistent socket lifecycle, auto-reconnect, room subscriptions, throttled coordinate transmission, and location broadcasts
 */
export const useTrackingSocket = ({ shipmentId, role = 'customer', autoJoin = false } = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'
  const [connectionError, setConnectionError] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [liveStatusUpdate, setLiveStatusUpdate] = useState(null);
  const [lastEmittedTime, setLastEmittedTime] = useState(null);

  const socketRef = useRef(null);
  const pendingCoordsRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  const throttleTimerRef = useRef(null);
  const currentShipmentIdRef = useRef(shipmentId);
  const roleRef = useRef(role);
  const autoJoinRef = useRef(autoJoin);
  const joinedRoomRef = useRef(null);

  // Sync refs to avoid stale closures
  currentShipmentIdRef.current = shipmentId;
  roleRef.current = role;
  autoJoinRef.current = autoJoin;

  // Helper to join appropriate tracking room
  const emitRoomJoin = useCallback((socket, targetShipmentId, userRole) => {
    if (!socket || !socket.connected || !targetShipmentId) return;
    const sId = targetShipmentId.toString();

    console.log(`[LiveTracking] Emitting room join: role=${userRole}, shipmentId=${sId}`);
    if (userRole === 'courier') {
      socket.emit('courier:startTracking', { shipmentId: sId }, (res) => {
        console.log('[LiveTracking] courier:startTracking response:', res);
      });
    } else if (userRole === 'admin') {
      socket.emit('admin:startTracking', { shipmentId: sId }, (res) => {
        console.log('[LiveTracking] admin:startTracking response:', res);
      });
    } else {
      socket.emit('customer:startTracking', { shipmentId: sId }, (res) => {
        console.log('[LiveTracking] customer:startTracking response:', res);
      });
    }
    joinedRoomRef.current = sId;
  }, []);

  // Initialize Socket connection once per auth token lifecycle
  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setConnectionStatus('error');
      setConnectionError('Authentication token missing');
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[LiveTracking] Connected to tracking server at ${SOCKET_URL} (socketId: ${socket.id})`);
      setConnectionStatus('connected');
      setConnectionError(null);

      // Auto-join room on connect/reconnect if requested
      if (autoJoinRef.current && currentShipmentIdRef.current) {
        emitRoomJoin(socket, currentShipmentIdRef.current, roleRef.current);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[LiveTracking] Disconnected from tracking server: ${reason}`);
      joinedRoomRef.current = null;
      if (reason === 'io client disconnect') {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('reconnecting');
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[LiveTracking] Socket connection error:', err.message);
      setConnectionStatus('error');
      setConnectionError(err.message || 'Unable to connect to live tracking server');
    });

    // Listen for live location broadcasts
    socket.on('location:update', (payload) => {
      if (!payload) return;
      console.log('[LiveTracking] Client received location:update event:', payload);

      // Ensure data belongs to current shipment
      const targetShipmentId = currentShipmentIdRef.current;
      if (
        targetShipmentId &&
        payload.shipmentId &&
        payload.shipmentId.toString() !== targetShipmentId.toString() &&
        payload.trackingId !== targetShipmentId
      ) {
        return;
      }

      // Validate coordinates
      const lat = Number(payload.latitude);
      const lng = Number(payload.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return;
      }

      setLiveLocation({
        shipmentId: payload.shipmentId,
        trackingId: payload.trackingId,
        latitude: lat,
        longitude: lng,
        accuracy: payload.accuracy !== undefined && payload.accuracy !== null ? Number(payload.accuracy) : null,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      });
    });

    // Listen for live status broadcasts
    socket.on('shipment:statusUpdate', (payload) => {
      if (!payload) return;
      console.log('[LiveTracking] Client received shipment:statusUpdate event:', payload);
      const targetShipmentId = currentShipmentIdRef.current;
      if (
        targetShipmentId &&
        payload.shipmentId &&
        payload.shipmentId.toString() !== targetShipmentId.toString() &&
        payload.trackingId !== targetShipmentId
      ) {
        return;
      }

      setLiveStatusUpdate(payload);
    });

    return () => {
      // Clean up throttler timer
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }

      // Stop tracking on server if in a room
      if (joinedRoomRef.current && socket.connected) {
        socket.emit('tracking:stop', { shipmentId: joinedRoomRef.current });
      }

      // Remove listeners & disconnect cleanly
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('location:update');
      socket.off('shipment:statusUpdate');
      socket.disconnect();
      socketRef.current = null;
      joinedRoomRef.current = null;
    };
  }, [emitRoomJoin]);

  // Separate effect: Join or re-join room whenever shipmentId becomes available or changes without recreating socket
  useEffect(() => {
    if (!autoJoin || !shipmentId || !socketRef.current || !socketRef.current.connected) {
      return;
    }

    const sId = shipmentId.toString();
    if (joinedRoomRef.current === sId) {
      return; // Already joined
    }

    if (joinedRoomRef.current && joinedRoomRef.current !== sId) {
      socketRef.current.emit('tracking:stop', { shipmentId: joinedRoomRef.current });
    }

    emitRoomJoin(socketRef.current, sId, role);
  }, [shipmentId, autoJoin, role, connectionStatus, emitRoomJoin]);

  /**
   * Start tracking as courier (with safe timeout fallback)
   */
  const startCourierTracking = useCallback((targetShipmentId) => {
    const sId = targetShipmentId || currentShipmentIdRef.current;
    if (!sId) return Promise.resolve({ success: false });

    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[LiveTracking] startCourierTracking called before socket connected; queued.');
      joinedRoomRef.current = sId.toString();
      return Promise.resolve({ success: true, queued: true });
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.warn('[LiveTracking] courier:startTracking ack timed out; proceeding.');
        joinedRoomRef.current = sId.toString();
        resolve({ success: true, timeout: true });
      }, ACK_TIMEOUT_MS);

      socketRef.current.emit('courier:startTracking', { shipmentId: sId.toString() }, (res) => {
        clearTimeout(timer);
        console.log('[LiveTracking] Manual courier:startTracking response:', res);
        joinedRoomRef.current = sId.toString();
        resolve(res || { success: true });
      });
    });
  }, []);

  /**
   * Start tracking as customer (with safe timeout fallback)
   */
  const startCustomerTracking = useCallback((targetShipmentId) => {
    const sId = targetShipmentId || currentShipmentIdRef.current;
    if (!sId) return Promise.resolve({ success: false });

    if (!socketRef.current || !socketRef.current.connected) {
      joinedRoomRef.current = sId.toString();
      return Promise.resolve({ success: true, queued: true });
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        joinedRoomRef.current = sId.toString();
        resolve({ success: true, timeout: true });
      }, ACK_TIMEOUT_MS);

      socketRef.current.emit('customer:startTracking', { shipmentId: sId.toString() }, (res) => {
        clearTimeout(timer);
        console.log('[LiveTracking] Manual customer:startTracking response:', res);
        joinedRoomRef.current = sId.toString();
        resolve(res || { success: true });
      });
    });
  }, []);

  /**
   * Start tracking as admin (with safe timeout fallback)
   */
  const startAdminTracking = useCallback((targetShipmentId) => {
    const sId = targetShipmentId || currentShipmentIdRef.current;
    if (!sId) return Promise.resolve({ success: false });

    if (!socketRef.current || !socketRef.current.connected) {
      joinedRoomRef.current = sId.toString();
      return Promise.resolve({ success: true, queued: true });
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        joinedRoomRef.current = sId.toString();
        resolve({ success: true, timeout: true });
      }, ACK_TIMEOUT_MS);

      socketRef.current.emit('admin:startTracking', { shipmentId: sId.toString() }, (res) => {
        clearTimeout(timer);
        console.log('[LiveTracking] Manual admin:startTracking response:', res);
        joinedRoomRef.current = sId.toString();
        resolve(res || { success: true });
      });
    });
  }, []);

  /**
   * Stop tracking
   */
  const stopTracking = useCallback((targetShipmentId) => {
    const sId = targetShipmentId || currentShipmentIdRef.current || joinedRoomRef.current;
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    pendingCoordsRef.current = null;

    if (!sId || !socketRef.current || !socketRef.current.connected) {
      joinedRoomRef.current = null;
      return Promise.resolve({ success: true });
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        joinedRoomRef.current = null;
        resolve({ success: true, timeout: true });
      }, ACK_TIMEOUT_MS);

      socketRef.current.emit('tracking:stop', { shipmentId: sId.toString() }, (res) => {
        clearTimeout(timer);
        joinedRoomRef.current = null;
        resolve(res || { success: true });
      });
    });
  }, []);

  /**
   * Internal direct emit for location update
   */
  const emitLocationUpdateDirect = useCallback((targetShipmentId, coords) => {
    if (!socketRef.current || !socketRef.current.connected) return;

    const payload = {
      shipmentId: targetShipmentId.toString(),
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      accuracy: coords.accuracy !== undefined && coords.accuracy !== null ? Number(coords.accuracy) : null,
    };

    socketRef.current.emit('courier:locationUpdate', payload, (res) => {
      if (res && res.success) {
        setLastEmittedTime(new Date());
      }
    });

    lastSendTimeRef.current = Date.now();
  }, []);

  /**
   * Send courier location update with 2-3s throttling
   */
  const sendLocationUpdate = useCallback(
    ({ shipmentId: sIdParam, latitude, longitude, accuracy }) => {
      const targetShipmentId = sIdParam || currentShipmentIdRef.current;
      if (!targetShipmentId || latitude === undefined || longitude === undefined) return;

      const coords = { latitude, longitude, accuracy };
      pendingCoordsRef.current = coords;

      const now = Date.now();
      const elapsed = now - lastSendTimeRef.current;

      // If enough time has elapsed since last update, send immediately
      if (elapsed >= THROTTLE_INTERVAL_MS) {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        emitLocationUpdateDirect(targetShipmentId, coords);
        pendingCoordsRef.current = null;
      } else {
        // Otherwise schedule trailing emit
        if (!throttleTimerRef.current) {
          const remaining = THROTTLE_INTERVAL_MS - elapsed;
          throttleTimerRef.current = setTimeout(() => {
            throttleTimerRef.current = null;
            if (pendingCoordsRef.current) {
              emitLocationUpdateDirect(targetShipmentId, pendingCoordsRef.current);
              pendingCoordsRef.current = null;
            }
          }, remaining);
        }
      }
    },
    [emitLocationUpdateDirect]
  );

  return {
    socket: socketRef.current,
    connectionStatus,
    connectionError,
    liveLocation,
    liveStatusUpdate,
    lastEmittedTime,
    startCourierTracking,
    startCustomerTracking,
    startAdminTracking,
    stopTracking,
    sendLocationUpdate,
    setLiveLocation,
  };
};

export default useTrackingSocket;
