import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Calculates great-circle distance between two GPS coordinates in meters (Haversine formula)
 */
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Filtering thresholds
const MAX_ACCEPTABLE_ACCURACY_METERS = 150; // Reject cellular/IP triangulation fixes (> 150m)
const MAX_IMPLIED_SPEED_MPS = 45; // ~162 km/h - Max realistic speed for courier delivery
const MIN_JUMP_DISTANCE_FOR_SPEED_CHECK = 50; // Only check implied speed on jumps > 50m
const STATIONARY_JITTER_THRESHOLD_METERS = 2.0; // Filter micro-jitter when stationary

/**
 * Custom hook for courier device GPS tracking via browser Geolocation API.
 * Features:
 * - High-accuracy GPS acquisition (`enableHighAccuracy: true`, `timeout: 20000`, `maximumAge: 2000`)
 * - Invalid coordinate filtering (NaN, bounds, Null Island 0,0)
 * - Accuracy threshold validation (discards low-accuracy cell-tower readings)
 * - Outlier / speed jump filtering (discards noisy multipath leaps)
 * - Stationary jitter suppression (prevents marker shaking while idling)
 * - Robust error handling (permission denied, signal unavailable, timeout)
 */
export const useCourierLocation = () => {
  const [status, setStatus] = useState('NOT_SHARING'); // NOT_SHARING | STARTING | ACTIVE | ERROR | STOPPED
  const [coords, setCoords] = useState(null); // { latitude, longitude, accuracy, heading, speed, timestamp }
  const [error, setError] = useState(null);
  const [rawAccuracy, setRawAccuracy] = useState(null);

  const watchIdRef = useRef(null);
  const lastAcceptedFixRef = useRef(null);
  const consecutiveOutliersRef = useRef(0);
  const rejectedFixesCountRef = useRef(0);

  /**
   * Stop watching position and reset tracking state
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('STOPPED');
  }, []);

  /**
   * Start watching device GPS location with high accuracy and sensor filtering
   */
  const startTracking = useCallback(() => {
    setError(null);

    if (!('geolocation' in navigator)) {
      setStatus('ERROR');
      setError('Geolocation hardware API is not supported by your device or browser.');
      return false;
    }

    // Clean up any existing watcher before starting a new one
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Reset filtering refs for new tracking session
    lastAcceptedFixRef.current = null;
    consecutiveOutliersRef.current = 0;
    rejectedFixesCountRef.current = 0;

    setStatus('STARTING');

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 2000,
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const timestamp = position.timestamp || Date.now();

      const numLat = Number(latitude);
      const numLng = Number(longitude);
      const numAcc = accuracy !== undefined && accuracy !== null ? Number(accuracy) : null;
      const numHeading = heading !== undefined && heading !== null && !Number.isNaN(heading) ? Number(heading) : null;
      const numSpeed = speed !== undefined && speed !== null && !Number.isNaN(speed) ? Number(speed) : null;

      setRawAccuracy(numAcc);

      // 1. Validate coordinate ranges and guard against Null Island (0,0) GPS default
      if (
        Number.isNaN(numLat) ||
        Number.isNaN(numLng) ||
        numLat < -90 ||
        numLat > 90 ||
        numLng < -180 ||
        numLng > 180 ||
        (Math.abs(numLat) < 0.0001 && Math.abs(numLng) < 0.0001)
      ) {
        console.warn('[CourierGPS] Discarded invalid coordinates:', numLat, numLng);
        rejectedFixesCountRef.current += 1;
        return;
      }

      // 2. Accuracy threshold filtering
      // Reject coarse readings (> 150m) if we already have an accurate fix
      if (numAcc !== null) {
        if (lastAcceptedFixRef.current && numAcc > MAX_ACCEPTABLE_ACCURACY_METERS) {
          console.warn(`[CourierGPS] Ignored low accuracy fix: ±${Math.round(numAcc)}m (threshold: ±${MAX_ACCEPTABLE_ACCURACY_METERS}m)`);
          rejectedFixesCountRef.current += 1;
          return;
        }

        // On very first fix, reject extremely degraded accuracy (> 250m)
        if (!lastAcceptedFixRef.current && numAcc > 250) {
          console.warn(`[CourierGPS] Waiting for better GPS satellite lock. Initial accuracy: ±${Math.round(numAcc)}m`);
          rejectedFixesCountRef.current += 1;
          return;
        }
      }

      // 3. Outlier and Speed-jump filtering
      const lastFix = lastAcceptedFixRef.current;
      if (lastFix) {
        const distMeters = calculateDistanceMeters(
          lastFix.latitude,
          lastFix.longitude,
          numLat,
          numLng
        );
        const dtSeconds = Math.max(0.1, (timestamp - lastFix.timestamp) / 1000);
        const impliedSpeedMps = distMeters / dtSeconds;

        // If distance jumped is significant and implied speed is physically unrealistic for a courier:
        // Reject the glitch unless consecutive readings confirm the device genuinely relocated
        if (
          distMeters > MIN_JUMP_DISTANCE_FOR_SPEED_CHECK &&
          dtSeconds < 30 &&
          impliedSpeedMps > MAX_IMPLIED_SPEED_MPS
        ) {
          consecutiveOutliersRef.current += 1;
          if (consecutiveOutliersRef.current < 3) {
            console.warn(
              `[CourierGPS] Discarded noisy GPS jump: ${Math.round(distMeters)}m in ${dtSeconds.toFixed(1)}s (implied speed: ${Math.round(impliedSpeedMps * 3.6)} km/h)`
            );
            rejectedFixesCountRef.current += 1;
            return;
          }
          console.log('[CourierGPS] Consecutive readings confirmed new location after jump.');
        } else {
          consecutiveOutliersRef.current = 0;
        }

        // 4. Stationary jitter suppression:
        // If movement is negligible (< 2m) and speed is near 0, preserve current coordinate to avoid wobbling
        if (distMeters < STATIONARY_JITTER_THRESHOLD_METERS && (numSpeed === null || numSpeed < 0.5)) {
          // Keep coordinate stable, but refresh timestamp and accuracy
          const refreshedFix = {
            ...lastFix,
            accuracy: numAcc,
            timestamp,
          };
          lastAcceptedFixRef.current = refreshedFix;
          setCoords(refreshedFix);
          setStatus('ACTIVE');
          setError(null);
          return;
        }
      }

      // Accepted GPS Fix
      const acceptedFix = {
        latitude: numLat,
        longitude: numLng,
        accuracy: numAcc,
        heading: numHeading,
        speed: numSpeed,
        timestamp,
      };

      lastAcceptedFixRef.current = acceptedFix;
      setCoords(acceptedFix);
      setStatus('ACTIVE');
      setError(null);
    };

    const handleError = (geoErr) => {
      let friendlyMessage = 'Unable to access device location.';
      switch (geoErr.code) {
        case 1: // PERMISSION_DENIED
          friendlyMessage =
            'Location permission was denied. Please allow location access in your browser or device settings to share your live delivery route.';
          break;
        case 2: // POSITION_UNAVAILABLE
          friendlyMessage =
            'Device GPS location is currently unavailable. Please verify GPS/location sensors are enabled.';
          break;
        case 3: // TIMEOUT
          friendlyMessage =
            'GPS location request timed out. Retrying satellite acquisition...';
          break;
        default:
          friendlyMessage =
            geoErr.message || 'An unexpected error occurred while obtaining GPS coordinates.';
          break;
      }

      // If we already have an active fix and this is just a transient timeout, don't drop to ERROR state immediately
      if (geoErr.code === 3 && lastAcceptedFixRef.current) {
        console.warn('[CourierGPS] Transient GPS timeout; retaining last accepted fix.');
        return;
      }

      setError(friendlyMessage);
      setStatus('ERROR');
    };

    try {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
      watchIdRef.current = id;
      return true;
    } catch (err) {
      setStatus('ERROR');
      setError('Failed to initialize geolocation watcher: ' + err.message);
      return false;
    }
  }, []);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    status,
    coords,
    error,
    rawAccuracy,
    isTracking: status === 'ACTIVE',
    isStarting: status === 'STARTING',
    startTracking,
    stopTracking,
  };
};

export default useCourierLocation;
