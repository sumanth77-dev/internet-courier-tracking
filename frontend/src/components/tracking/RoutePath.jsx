import { useEffect, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Renders the planned road route and the travelled portion on the Leaflet map
 */
export const RoutePath = ({
  fullRoute = [],
  travelledPath = [],
  autoFit = true,
}) => {
  const map = useMap();
  const hasFittedRef = useRef(false);

  // Fit map bounds to full route on initial route load
  useEffect(() => {
    if (autoFit && fullRoute && fullRoute.length > 1 && !hasFittedRef.current) {
      try {
        const bounds = L.latLngBounds(fullRoute);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          hasFittedRef.current = true;
        }
      } catch (err) {
        console.warn('Map fitBounds warning:', err.message);
      }
    }
  }, [fullRoute, autoFit, map]);

  return (
    <>
      {/* 1. Full Planned Road Route (Base Track) */}
      {fullRoute && fullRoute.length > 1 && (
        <>
          {/* Subtle Outer Glow / Casing */}
          <Polyline
            positions={fullRoute}
            pathOptions={{
              color: '#18A6A0',
              weight: 6,
              opacity: 0.25,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Main Road Line */}
          <Polyline
            positions={fullRoute}
            pathOptions={{
              color: '#245B78',
              weight: 3.5,
              opacity: 0.65,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}

      {/* 2. Travelled Road Route (Active Live Trail) */}
      {travelledPath && travelledPath.length > 1 && (
        <Polyline
          positions={travelledPath}
          pathOptions={{
            color: '#142B45',
            weight: 5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
    </>
  );
};

export default RoutePath;
