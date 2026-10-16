import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for courier device GPS tracking via browser Geolocation API
 * Uses navigator.geolocation.watchPosition with high accuracy
 */
export const useCourierLocation = () => {
  const [status, setStatus] = useState('NOT_SHARING'); // NOT_SHARING | STARTING | ACTIVE | ERROR | STOPPED
  const [coords, setCoords] = useState(null); // { latitude, longitude, accuracy }
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  /**
   * Stop watching position and clean up
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('STOPPED');
  }, []);

  /**
   * Start watching position
   */
  const startTracking = useCallback(() => {
    setError(null);

    if (!('geolocation' in navigator)) {
      setStatus('ERROR');
      setError('Geolocation is not supported by your device or browser.');
      return false;
    }

    // Clean up any existing watcher before starting a new one
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setStatus('STARTING');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCoords({
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : null,
      });
      setStatus('ACTIVE');
      setError(null);
    };

    const handleError = (geoErr) => {
      let friendlyMessage = 'Unable to access device location.';
      switch (geoErr.code) {
        case 1: // PERMISSION_DENIED
          friendlyMessage =
            'Location permission was denied. Please allow location access to share your delivery location.';
          break;
        case 2: // POSITION_UNAVAILABLE
          friendlyMessage = 'Your device location is currently unavailable.';
          break;
        case 3: // TIMEOUT
          friendlyMessage =
            'Unable to obtain your current location. The location request timed out.';
          break;
        default:
          friendlyMessage = 'An unexpected error occurred while obtaining GPS coordinates.';
          break;
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
      setError('Failed to initialize geolocation watcher.');
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
    isTracking: status === 'ACTIVE',
    isStarting: status === 'STARTING',
    startTracking,
    stopTracking,
  };
};

export default useCourierLocation;
