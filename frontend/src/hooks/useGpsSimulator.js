import { useState, useRef, useEffect, useCallback } from 'react';
import { getDrivingRoute } from '../services/routingService';
import api from '../services/api';

const TICK_INTERVAL_MS = 1400; // Spaced at 1.4s to safely stay above backend's ~1.0s minimum update rate limit

/**
 * Storage keys helpers for per-shipment persistent simulation state & route caching
 */
const getStorageKey = (shipmentId) => `courierDemoState_${shipmentId}`;
const getRouteCacheKey = (shipmentId) => `courierRouteCache_${shipmentId}`;

/**
 * Helper to calculate distance squared between two coordinates for finding closest point
 */
const distSq = (p1, p2) => {
  const dLat = p1[0] - p2[0];
  const dLng = p1[1] - p2[1];
  return dLat * dLat + dLng * dLng;
};

/**
 * Find index of the point along points closest to target coordinate
 */
const findClosestPointIndex = (points, targetCoord) => {
  if (!points || points.length === 0 || !targetCoord) return 0;
  let closestIdx = 0;
  let minD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = distSq(points[i], targetCoord);
    if (d < minD) {
      minD = d;
      closestIdx = i;
    }
  }
  return closestIdx;
};

/**
 * Custom hook for Persistent Road-based GPS Simulation with automated status progression
 * Guaranteed:
 * - State machine: IDLE → ROUTE_LOADING → READY → RUNNING → PAUSED → RUNNING → COMPLETED
 * - Exactly one active simulation loop per shipment
 * - No mid-route jumping or resetting
 * - Per-shipment persistent state reconciled with backend
 * - Stops in READY or PAUSED state on reopen/mount; never moves automatically
 */
export const useGpsSimulator = ({
  shipmentId,
  trackingId,
  initialShipmentStatus = 'Assigned',
  pickupAddress,
  deliveryAddress,
  onLocationEmit,
  onStatusChange,
}) => {
  const [simState, setSimState] = useState('idle'); // 'idle' | 'route_loading' | 'ready' | 'running' | 'paused' | 'completed'
  const [currentShipmentStatus, setCurrentShipmentStatus] = useState(initialShipmentStatus);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // 0.5 | 1 | 2 | 5 | 10
  const [routePoints, setRoutePoints] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [travelledPath, setTravelledPath] = useState([]);
  const [simulatedAccuracy, setSimulatedAccuracy] = useState(10);
  const [startedAt, setStartedAt] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);

  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const pointsRef = useRef([]);
  const speedRef = useRef(speed);
  const simStateRef = useRef(simState);
  const startedAtRef = useRef(startedAt);
  const completedAtRef = useRef(completedAt);
  const onLocationEmitRef = useRef(onLocationEmit);
  const onStatusChangeRef = useRef(onStatusChange);
  const shipmentIdRef = useRef(shipmentId);
  const trackingIdRef = useRef(trackingId);
  const lastCommittedStatusRef = useRef(initialShipmentStatus);
  const routeDataRef = useRef(null);
  const lastPersistTimeRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const hasLoadedShipmentIdRef = useRef(null);

  // Sync refs to completely avoid stale closures
  speedRef.current = speed;
  simStateRef.current = simState;
  startedAtRef.current = startedAt;
  completedAtRef.current = completedAt;
  onLocationEmitRef.current = onLocationEmit;
  onStatusChangeRef.current = onStatusChange;
  shipmentIdRef.current = shipmentId;
  trackingIdRef.current = trackingId;
  routeDataRef.current = routeData;

  /**
   * Persist simulator state to localStorage
   */
  const persistState = useCallback(
    (overrides = {}, force = false) => {
      const sId = shipmentIdRef.current;
      if (!sId) return;

      const now = Date.now();
      if (!force && now - lastPersistTimeRef.current < 600) {
        return;
      }
      lastPersistTimeRef.current = now;

      const points = pointsRef.current;
      const idx = overrides.routeIndex !== undefined ? overrides.routeIndex : indexRef.current;
      const total = points.length;
      const progress = total > 1 ? Math.min(100, Math.round((idx / (total - 1)) * 100)) : 0;
      const coord = points[idx] || null;

      const totalDist = routeDataRef.current?.distanceMeters || 0;
      const distTravelledKm = ((totalDist * (progress / 100)) / 1000).toFixed(1);
      const distRemainingKm = ((totalDist * ((100 - progress) / 100)) / 1000).toFixed(1);

      const currentState = overrides.state !== undefined ? overrides.state : simStateRef.current;

      const payload = {
        shipmentId: sId.toString(),
        trackingId: trackingIdRef.current,
        mode: 'demo',
        state: currentState,
        progress: overrides.progress !== undefined ? overrides.progress : progress,
        routeIndex: idx,
        totalRoutePoints: total,
        latitude: coord ? coord[0] : null,
        longitude: coord ? coord[1] : null,
        status: overrides.status || lastCommittedStatusRef.current,
        speed: speedRef.current,
        distanceTravelled: `${distTravelledKm} km`,
        distanceRemaining: `${distRemainingKm} km`,
        startedAt: overrides.startedAt !== undefined ? overrides.startedAt : startedAtRef.current,
        pausedAt: overrides.pausedAt || (currentState === 'paused' ? new Date().toISOString() : null),
        completedAt: overrides.completedAt !== undefined ? overrides.completedAt : completedAtRef.current,
        lastUpdatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(getStorageKey(sId), JSON.stringify(payload));
      } catch (e) {
        console.warn('[Simulator] Failed to persist demo state:', e);
      }
    },
    []
  );

  // Sync initial status when external shipment changes without resetting route progress
  useEffect(() => {
    if (initialShipmentStatus) {
      lastCommittedStatusRef.current = initialShipmentStatus;
      setCurrentShipmentStatus(initialShipmentStatus);
      if (initialShipmentStatus === 'Delivered') {
        simStateRef.current = 'completed';
        setSimState('completed');
      }
    }
  }, [initialShipmentStatus]);

  // Stop / Clear timer helper
  const clearSimulationTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Helper to perform backend status transitions strictly adhering to the state machine
   */
  const transitionStatusTo = useCallback(
    async (targetStatus) => {
      const sId = shipmentIdRef.current;
      if (!sId || !targetStatus || lastCommittedStatusRef.current === targetStatus) {
        return true;
      }

      if (isTransitioningRef.current) {
        return false;
      }

      isTransitioningRef.current = true;
      try {
        console.log(`[Simulator] Requesting backend status transition to '${targetStatus}' for shipment ${sId}`);
        const res = await api.patch(`/shipments/courier/${sId}/status`, {
          status: targetStatus,
        });

        if (res.data?.success && res.data.data?.shipment) {
          const updated = res.data.data.shipment;
          lastCommittedStatusRef.current = updated.status;
          setCurrentShipmentStatus(updated.status);
          if (onStatusChangeRef.current) {
            onStatusChangeRef.current(updated);
          }
          setStatusError(null);
          persistState({ status: updated.status }, true);
          console.log(`[Simulator] Successfully transitioned backend status to '${updated.status}'`);
          return true;
        } else {
          throw new Error(res.data?.message || `Failed to transition status to ${targetStatus}`);
        }
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || 'Unable to update shipment status.';
        console.error('[Simulator] Status transition error:', msg);
        setStatusError(msg);
        return false;
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [persistState]
  );

  // Emit current step coordinate and update travelled trail
  const emitStep = useCallback(
    (idx) => {
      const points = pointsRef.current;
      if (!points || points.length === 0 || idx >= points.length) return;

      const coord = points[idx];
      setCurrentPosition(coord);
      setCurrentIndex(idx);

      setTravelledPath(points.slice(0, idx + 1));

      // Realistic simulated accuracy fluctuation (8m - 14m)
      const accuracy = Math.round(9 + Math.sin(idx * 0.5) * 3);
      setSimulatedAccuracy(accuracy);

      if (onLocationEmitRef.current && shipmentIdRef.current) {
        onLocationEmitRef.current({
          shipmentId: shipmentIdRef.current,
          latitude: coord[0],
          longitude: coord[1],
          accuracy: accuracy,
        });
      }

      persistState({ routeIndex: idx });
    },
    [persistState]
  );

  // Step advancement loop with sequential status milestone evaluation
  const runSimulationLoop = useCallback(() => {
    clearSimulationTimer();

    timerRef.current = setInterval(async () => {
      // Pause step ticks if a status transition is currently in flight
      if (isTransitioningRef.current) {
        return;
      }

      const points = pointsRef.current;
      if (!points || points.length === 0) {
        clearSimulationTimer();
        return;
      }

      if (simStateRef.current !== 'running') {
        clearSimulationTimer();
        return;
      }

      // Compute step jump based on speed multiplier (0.5x to 10x)
      const stepDelta = Math.max(1, Math.round(speedRef.current * 2));
      const nextIndex = Math.min(indexRef.current + stepDelta, points.length - 1);
      indexRef.current = nextIndex;

      emitStep(nextIndex);

      const total = points.length - 1;
      const progressPercent = total > 0 ? (nextIndex / total) * 100 : 0;

      // Status Milestone Evaluation (send ONCE when next milestone is entered)
      // Milestone 1: In Transit (at >= 15% progress)
      if (
        progressPercent >= 15 &&
        progressPercent < 70 &&
        lastCommittedStatusRef.current === 'Picked Up'
      ) {
        const ok = await transitionStatusTo('In Transit');
        if (!ok) {
          clearSimulationTimer();
          simStateRef.current = 'paused';
          setSimState('paused');
          persistState({ state: 'paused' }, true);
          return;
        }
      }

      // Milestone 2: Out for Delivery (at >= 70% progress)
      if (
        progressPercent >= 70 &&
        progressPercent < 100 &&
        (lastCommittedStatusRef.current === 'In Transit' || lastCommittedStatusRef.current === 'Picked Up')
      ) {
        if (lastCommittedStatusRef.current === 'Picked Up') {
          await transitionStatusTo('In Transit');
        }
        const ok = await transitionStatusTo('Out for Delivery');
        if (!ok) {
          clearSimulationTimer();
          simStateRef.current = 'paused';
          setSimState('paused');
          persistState({ state: 'paused' }, true);
          return;
        }
      }

      // Milestone 3: Destination reached (100% progress)
      // Stop movement at destination in 'Out for Delivery'. Await courier Proof of Delivery (Photo + OTP verification).
      if (nextIndex >= points.length - 1) {
        clearSimulationTimer();

        // Advance through intermediate states if needed
        if (lastCommittedStatusRef.current === 'Picked Up') {
          await transitionStatusTo('In Transit');
        }
        if (lastCommittedStatusRef.current === 'In Transit' || lastCommittedStatusRef.current === 'Picked Up') {
          await transitionStatusTo('Out for Delivery');
        }

        // Hold at destination in Out for Delivery
        simStateRef.current = 'paused';
        setSimState('paused');
        persistState(
          {
            state: 'paused',
            routeIndex: points.length - 1,
            progress: 100,
            status: 'Out for Delivery',
          },
          true
        );
      }
    }, TICK_INTERVAL_MS);
  }, [clearSimulationTimer, emitStep, transitionStatusTo, persistState]);

  /**
   * Fetch OSRM Road Route, cache it, and reconcile persistent state with backend
   */
  useEffect(() => {
    let isMounted = true;

    const fetchAndRestore = async () => {
      if (
        !pickupAddress?.latitude ||
        !pickupAddress?.longitude ||
        !deliveryAddress?.latitude ||
        !deliveryAddress?.longitude ||
        !shipmentId
      ) {
        simStateRef.current = 'idle';
        setSimState('idle');
        return;
      }

      const shipmentKey = shipmentId.toString();
      hasLoadedShipmentIdRef.current = shipmentKey;

      setIsLoadingRoute(true);
      simStateRef.current = 'route_loading';
      setSimState('route_loading');
      setRouteError(null);

      try {
        let routeResult = null;

        // 1. Check local route geometry cache
        const cacheKey = getRouteCacheKey(shipmentKey);
        try {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (
              cached &&
              cached.coordinates &&
              cached.coordinates.length > 1 &&
              Math.abs(cached.pickupLat - pickupAddress.latitude) < 0.001 &&
              Math.abs(cached.pickupLng - pickupAddress.longitude) < 0.001 &&
              Math.abs(cached.deliveryLat - deliveryAddress.latitude) < 0.001 &&
              Math.abs(cached.deliveryLng - deliveryAddress.longitude) < 0.001
            ) {
              routeResult = cached.routeData;
            }
          }
        } catch (e) {
          // Cache parse error fallback
        }

        // If not cached, fetch driving route via OSRM
        if (!routeResult) {
          routeResult = await getDrivingRoute(pickupAddress, deliveryAddress);
          if (!isMounted) return;

          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                pickupLat: pickupAddress.latitude,
                pickupLng: pickupAddress.longitude,
                deliveryLat: deliveryAddress.latitude,
                deliveryLng: deliveryAddress.longitude,
                routeData: routeResult,
              })
            );
          } catch (e) {}
        }

        if (!isMounted) return;

        setRouteData(routeResult);
        routeDataRef.current = routeResult;

        const points = routeResult.denseCoordinates || routeResult.coordinates;
        setRoutePoints(points);
        pointsRef.current = points;

        // 2. Load saved simulation state from localStorage
        let savedState = null;
        try {
          const raw = localStorage.getItem(getStorageKey(shipmentKey));
          if (raw) savedState = JSON.parse(raw);
        } catch (err) {
          console.warn('[Simulator] Error reading saved demo state:', err);
        }

        // 3. Fetch latest confirmed location from backend to reconcile state
        let backendLatestLocation = null;
        try {
          const locRes = await api.get(`/shipments/${shipmentKey}/location`);
          if (locRes.data?.success && locRes.data.data?.location) {
            backendLatestLocation = locRes.data.data.location;
          }
        } catch (err) {
          // Non-blocking: rely on savedState if backend location fetch fails
        }

        if (!isMounted) return;

        // 4. Reconcile progress and status without moving backwards
        const currentBackendStatus = lastCommittedStatusRef.current;

        // Case A: Shipment already marked Delivered
        if (currentBackendStatus === 'Delivered') {
          const lastIdx = points.length - 1;
          indexRef.current = lastIdx;
          setCurrentIndex(lastIdx);
          setCurrentPosition(points[lastIdx]);
          setTravelledPath(points);
          simStateRef.current = 'completed';
          setSimState('completed');
          lastCommittedStatusRef.current = 'Delivered';
          setCurrentShipmentStatus('Delivered');
          return;
        }

        // Determine minimum index guaranteed by confirmed backend milestone
        let minStatusIndex = 0;
        if (currentBackendStatus === 'Out for Delivery') {
          minStatusIndex = Math.floor(points.length * 0.7);
        } else if (currentBackendStatus === 'In Transit') {
          minStatusIndex = Math.floor(points.length * 0.15);
        }

        // Determine index from saved localStorage state
        let savedIndex = 0;
        if (savedState && typeof savedState.routeIndex === 'number') {
          savedIndex = Math.min(Math.max(0, savedState.routeIndex), points.length - 1);
        }

        // Determine index from backend's latest saved GPS coordinates
        let backendLocIndex = 0;
        if (backendLatestLocation && backendLatestLocation.latitude && backendLatestLocation.longitude) {
          backendLocIndex = findClosestPointIndex(points, [
            backendLatestLocation.latitude,
            backendLatestLocation.longitude,
          ]);
        }

        // Reconcile: Never move backwards
        const reconciledIndex = Math.max(savedIndex, backendLocIndex, minStatusIndex);
        indexRef.current = reconciledIndex;
        setCurrentIndex(reconciledIndex);

        const currentPos = points[reconciledIndex];
        setCurrentPosition(currentPos);
        setTravelledPath(points.slice(0, reconciledIndex + 1));

        // Restore speed if saved
        if (savedState?.speed) {
          setSpeed(savedState.speed);
          speedRef.current = savedState.speed;
        }

        // Reconcile simulation state: STOP IN READY OR PAUSED STATE; NEVER AUTO-START
        if (reconciledIndex > 0) {
          simStateRef.current = 'paused';
          setSimState('paused'); // Paused, waiting for user to click Resume
        } else {
          simStateRef.current = 'ready';
          setSimState('ready'); // Ready at start
        }

        if (savedState?.startedAt) {
          startedAtRef.current = savedState.startedAt;
          setStartedAt(savedState.startedAt);
        }
      } catch (err) {
        if (!isMounted) return;
        setRoutePoints([]);
        pointsRef.current = [];
        setRouteData(null);
        simStateRef.current = 'idle';
        setSimState('idle');
        setRouteError(
          err.message || 'Unable to find a road route between the pickup and delivery locations.'
        );
      } finally {
        if (isMounted) {
          setIsLoadingRoute(false);
        }
      }
    };

    fetchAndRestore();

    return () => {
      isMounted = false;
    };
  }, [
    shipmentId,
    pickupAddress?.latitude,
    pickupAddress?.longitude,
    deliveryAddress?.latitude,
    deliveryAddress?.longitude,
  ]);

  /**
   * Resume simulation from exact current route position
   */
  const resume = useCallback(() => {
    const points = pointsRef.current;
    if (!points || points.length === 0) {
      setStatusError('Route points are not loaded yet.');
      return;
    }

    if (simStateRef.current === 'completed' || indexRef.current >= points.length - 1) {
      return;
    }

    setStatusError(null);
    isTransitioningRef.current = false;
    simStateRef.current = 'running';
    setSimState('running');
    persistState({ state: 'running' }, true);

    // Immediately emit current coordinate so listeners receive instant update
    emitStep(indexRef.current);

    // Start fresh animation loop
    runSimulationLoop();
  }, [emitStep, runSimulationLoop, persistState]);

  /**
   * Start simulation from the beginning
   * (If already progressed, delegates to resume)
   */
  const start = useCallback(async () => {
    const points = pointsRef.current;
    if (!points || points.length === 0) {
      setStatusError('Route points are not loaded yet.');
      return false;
    }

    if (simStateRef.current === 'completed') {
      return false;
    }

    // If already progressed past start, safely resume instead of restarting from 0
    if (indexRef.current > 0) {
      resume();
      return true;
    }

    setStatusError(null);
    indexRef.current = 0;
    setCurrentIndex(0);
    simStateRef.current = 'running';
    setSimState('running');
    const startTime = new Date().toISOString();
    startedAtRef.current = startTime;
    setStartedAt(startTime);

    // 1. Advance initial status to 'Picked Up' if currently 'Assigned'
    if (lastCommittedStatusRef.current === 'Assigned') {
      const ok = await transitionStatusTo('Picked Up');
      if (!ok) {
        simStateRef.current = 'ready';
        setSimState('ready');
        return false;
      }
    }

    persistState(
      {
        state: 'running',
        routeIndex: 0,
        progress: 0,
        status: lastCommittedStatusRef.current,
        startedAt: startTime,
      },
      true
    );

    // 2. Emit initial coordinate
    emitStep(0);

    // 3. Run simulation loop
    runSimulationLoop();
    return true;
  }, [emitStep, runSimulationLoop, transitionStatusTo, persistState, resume]);

  /**
   * Pause simulation at current position
   */
  const pause = useCallback(() => {
    if (simStateRef.current !== 'running') return;
    clearSimulationTimer();
    simStateRef.current = 'paused';
    setSimState('paused');
    persistState({ state: 'paused', pausedAt: new Date().toISOString() }, true);
  }, [clearSimulationTimer, persistState]);

  /**
   * Stop simulation session (preserves current position without resetting progress)
   */
  const stop = useCallback(() => {
    clearSimulationTimer();
    if (simStateRef.current === 'completed') return;
    simStateRef.current = 'paused';
    setSimState('paused');
    persistState({ state: 'paused', pausedAt: new Date().toISOString() }, true);
  }, [clearSimulationTimer, persistState]);

  /**
   * Restart Demo explicitly (user-confirmed action)
   */
  const restartDemo = useCallback(() => {
    clearSimulationTimer();
    const sId = shipmentIdRef.current;
    if (sId) {
      localStorage.removeItem(getStorageKey(sId));
    }
    indexRef.current = 0;
    setCurrentIndex(0);
    simStateRef.current = 'ready';
    setSimState('ready');
    startedAtRef.current = null;
    setStartedAt(null);
    completedAtRef.current = null;
    setCompletedAt(null);

    const points = pointsRef.current;
    if (points.length > 0) {
      setCurrentPosition(points[0]);
      setTravelledPath([points[0]]);
    }
  }, [clearSimulationTimer]);

  // Synchronous flush to localStorage on page beforeunload and component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (simStateRef.current === 'running') {
        simStateRef.current = 'paused';
        persistState({ state: 'paused', pausedAt: new Date().toISOString() }, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearSimulationTimer();
      handleBeforeUnload();
    };
  }, [clearSimulationTimer, persistState]);

  // Progress percentage
  const totalPoints = routePoints.length;
  const progress =
    totalPoints > 1 ? Math.min(100, Math.round((currentIndex / (totalPoints - 1)) * 100)) : 0;

  // Remaining and travelled road distance
  const totalDistMeters = routeData?.distanceMeters || 0;
  const distanceTravelledKm = ((totalDistMeters * (progress / 100)) / 1000).toFixed(1);
  const distanceRemainingKm = ((totalDistMeters * ((100 - progress) / 100)) / 1000).toFixed(1);

  return {
    start,
    pause,
    resume,
    stop,
    restartDemo,
    status: simState,
    currentShipmentStatus,
    isRunning: simState === 'running',
    isPaused: simState === 'paused',
    isCompleted: simState === 'completed',
    isReady: simState === 'ready',
    isRouteLoading: simState === 'route_loading',
    isIdle: simState === 'idle',
    progress,
    currentIndex,
    totalPoints,
    currentPosition,
    simulatedAccuracy,
    routePoints,
    routeData,
    isLoadingRoute,
    routeError,
    statusError,
    travelledPath,
    distanceTravelledKm,
    distanceRemainingKm,
    speed,
    setSpeed,
  };
};

export default useGpsSimulator;
