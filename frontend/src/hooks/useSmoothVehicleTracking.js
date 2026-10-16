import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Calculates the great-circle distance between two points in meters (Haversine formula)
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
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

/**
 * Calculates initial compass bearing (azimuth in degrees [0, 360)) from point 1 to point 2
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

/**
 * Computes shortest angular difference between two angles in degrees (-180 to +180)
 */
export const getShortestAngleDelta = (fromAngle, toAngle) => {
  return ((toAngle - fromAngle + 540) % 360) - 180;
};

const MIN_ANIMATION_DURATION_MS = 1000;
const DEFAULT_ANIMATION_DURATION_MS = 2500;
const MAX_ANIMATION_DURATION_MS = 5000;
const JUMP_DISTANCE_THRESHOLD_METERS = 3000; // Jump without animation if > 3km (GPS teleport/glitch)
const MIN_DISTANCE_FOR_BEARING_METERS = 1.0; // Min distance to calculate direction change

/**
 * Custom hook for smooth vehicle position and rotation interpolation using requestAnimationFrame
 */
export const useSmoothVehicleTracking = (incomingLocation) => {
  // Current animated position & bearing exposed to UI
  const [animatedPosition, setAnimatedPosition] = useState(null); // [lat, lng]
  const [bearing, setBearing] = useState(0);
  const [trackingPath, setTrackingPath] = useState([]); // Array of [lat, lng]
  const [isMoving, setIsMoving] = useState(false);

  // Animation internal state refs
  const prevPositionRef = useRef(null); // [lat, lng]
  const targetPositionRef = useRef(null); // [lat, lng]
  const currentPosRef = useRef(null); // [lat, lng]
  const startBearingRef = useRef(0);
  const targetBearingRef = useRef(0);
  const currentBearingRef = useRef(0);

  const lastUpdateTimeRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const animStartTimeRef = useRef(null);
  const animDurationRef = useRef(DEFAULT_ANIMATION_DURATION_MS);

  // Stop any active animation frame
  const cancelAnimation = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsMoving(false);
  }, []);

  // Update target coordinates and drive the smooth interpolation
  useEffect(() => {
    if (!incomingLocation || incomingLocation.latitude === undefined || incomingLocation.longitude === undefined) {
      return;
    }

    const newLat = Number(incomingLocation.latitude);
    const newLng = Number(incomingLocation.longitude);

    if (Number.isNaN(newLat) || Number.isNaN(newLng) || newLat < -90 || newLat > 90 || newLng < -180 || newLng > 180) {
      return;
    }

    const newCoord = [newLat, newLng];
    const now = Date.now();

    // 1. Initial location arrival: set position instantly without animation
    if (!currentPosRef.current) {
      currentPosRef.current = newCoord;
      prevPositionRef.current = newCoord;
      targetPositionRef.current = newCoord;
      lastUpdateTimeRef.current = now;
      setAnimatedPosition(newCoord);
      setTrackingPath([newCoord]);
      return;
    }

    const [prevLat, prevLng] = currentPosRef.current;
    const distanceMeters = calculateDistanceMeters(prevLat, prevLng, newLat, newLng);

    // If coordinates haven't changed (or change < 0.2m), do nothing
    if (distanceMeters < 0.2) {
      return;
    }

    // 2. Append to tracking path trail (prevent duplicate consecutive coordinates)
    setTrackingPath((prev) => {
      if (prev.length === 0) return [newCoord];
      const last = prev[prev.length - 1];
      if (Math.abs(last[0] - newLat) < 0.000001 && Math.abs(last[1] - newLng) < 0.000001) {
        return prev;
      }
      return [...prev, newCoord];
    });

    // 3. Handle GPS Teleport / Major Jump (> 3km)
    if (distanceMeters > JUMP_DISTANCE_THRESHOLD_METERS) {
      cancelAnimation();
      currentPosRef.current = newCoord;
      prevPositionRef.current = newCoord;
      targetPositionRef.current = newCoord;
      lastUpdateTimeRef.current = now;
      setAnimatedPosition(newCoord);
      return;
    }

    // 4. Calculate adaptive animation duration based on update frequency
    let duration = DEFAULT_ANIMATION_DURATION_MS;
    if (lastUpdateTimeRef.current) {
      const elapsedSinceLastUpdate = now - lastUpdateTimeRef.current;
      duration = Math.max(MIN_ANIMATION_DURATION_MS, Math.min(elapsedSinceLastUpdate, MAX_ANIMATION_DURATION_MS));
    }
    lastUpdateTimeRef.current = now;
    animDurationRef.current = duration;

    // 5. Calculate new bearing if distance is meaningful
    if (distanceMeters >= MIN_DISTANCE_FOR_BEARING_METERS) {
      const newBearing = calculateBearing(prevLat, prevLng, newLat, newLng);
      startBearingRef.current = currentBearingRef.current;
      targetBearingRef.current = newBearing;
    }

    // Set animation bounds
    prevPositionRef.current = [...currentPosRef.current];
    targetPositionRef.current = newCoord;
    animStartTimeRef.current = performance.now();

    // Cancel previous RAF before starting new one
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    setIsMoving(true);

    // 6. Animation Step function using requestAnimationFrame
    const animate = (timestamp) => {
      const elapsed = timestamp - animStartTimeRef.current;
      const progress = Math.min(elapsed / animDurationRef.current, 1);

      // Linear interpolation for constant vehicle speed between GPS points
      const startP = prevPositionRef.current;
      const targetP = targetPositionRef.current;

      const currentLat = startP[0] + (targetP[0] - startP[0]) * progress;
      const currentLng = startP[1] + (targetP[1] - startP[1]) * progress;
      const interpolatedPos = [currentLat, currentLng];

      currentPosRef.current = interpolatedPos;
      setAnimatedPosition(interpolatedPos);

      // Interpolate bearing using shortest angular distance
      const angleDelta = getShortestAngleDelta(startBearingRef.current, targetBearingRef.current);
      const interpolatedBearing = (startBearingRef.current + angleDelta * progress + 360) % 360;
      currentBearingRef.current = interpolatedBearing;
      setBearing(interpolatedBearing);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        animFrameIdRef.current = null;
        setIsMoving(false);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  }, [incomingLocation, cancelAnimation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelAnimation();
    };
  }, [cancelAnimation]);

  return {
    animatedPosition,
    bearing,
    trackingPath,
    isMoving,
  };
};

export default useSmoothVehicleTracking;
