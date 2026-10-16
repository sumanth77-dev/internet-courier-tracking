import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TrackingHeader from './TrackingHeader';
import CourierVehicleMarker from './CourierVehicleMarker';
import RoutePath from './RoutePath';
import useSmoothVehicleTracking from '../../hooks/useSmoothVehicleTracking';
import { MapPin, Info, ShieldCheck, Route, Clock } from 'lucide-react';

// Custom Map Controller to smoothly pan/zoom and handle user recenter clicks
const MapController = ({ centerCoords, zoom, triggerRecenter, onRecenterHandled, hasInitializedRef }) => {
  const map = useMap();

  // Recenter when triggered by user
  useEffect(() => {
    if (triggerRecenter && centerCoords) {
      map.flyTo([centerCoords[0], centerCoords[1]], zoom || 15, {
        animate: true,
        duration: 1.2,
      });
      if (onRecenterHandled) {
        onRecenterHandled();
      }
    }
  }, [triggerRecenter, centerCoords, zoom, map, onRecenterHandled]);

  // Initial center on first valid coordinates arrival if no full route is available
  useEffect(() => {
    if (centerCoords && !hasInitializedRef.current) {
      map.setView([centerCoords[0], centerCoords[1]], zoom || 15);
      hasInitializedRef.current = true;
    }
  }, [centerCoords, zoom, map, hasInitializedRef]);

  return null;
};

// Create SVG-based Leaflet DivIcons for Pickup and Delivery pins
const createAddressIcon = (type = 'pickup') => {
  const isPickup = type === 'pickup';
  const bgColor = isPickup ? '#15803D' : '#D97706';
  const label = isPickup ? 'Pickup' : 'Delivery';

  return L.divIcon({
    className: `custom-${type}-marker`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: ${bgColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 2px 5px rgba(0,0,0,0.25); white-space: nowrap; margin-bottom: 2px;">
          ${label}
        </div>
        <div style="width: 22px; height: 22px; border-radius: 50%; background: white; border: 3px solid ${bgColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 7px; height: 7px; border-radius: 50%; background: ${bgColor};"></div>
        </div>
      </div>
    `,
    iconSize: [60, 46],
    iconAnchor: [30, 44],
    popupAnchor: [0, -44],
  });
};

export const LiveTrackingMap = ({
  liveLocation,
  pickupAddress,
  deliveryAddress,
  fullRoute = [],
  travelledPath: externalTravelledPath = null,
  routeDistanceKm = null,
  routeDurationMinutes = null,
  connectionStatus = 'connected',
  trackingId,
  courierName,
  height = '480px',
}) => {
  const [triggerRecenter, setTriggerRecenter] = useState(false);
  const [now, setNow] = useState(Date.now());
  const hasInitializedRef = useRef(false);

  // Smooth Vehicle Movement and GPS Trail state hook
  const { animatedPosition, bearing, trackingPath, isMoving } = useSmoothVehicleTracking(liveLocation);

  // Periodic timer to keep "Last updated X ago" fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Compute freshness & relative timestamp string
  const { isLive, relativeTimeText } = useMemo(() => {
    if (!liveLocation || !liveLocation.timestamp) {
      return { isLive: false, relativeTimeText: null };
    }

    const updateTime = new Date(liveLocation.timestamp).getTime();
    const diffSec = Math.max(0, Math.floor((now - updateTime) / 1000));

    let text = 'Just now';
    if (diffSec < 5) {
      text = 'Just now';
    } else if (diffSec < 60) {
      text = `${diffSec} seconds ago`;
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      text = `${mins} min${mins > 1 ? 's' : ''} ago`;
    } else {
      text = new Date(updateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Active if received within last 45 seconds and socket is connected
    const live = diffSec <= 45 && connectionStatus === 'connected';

    return { isLive: live, relativeTimeText: text };
  }, [liveLocation, connectionStatus, now]);

  // Determine initial fallback map center
  const defaultCenter = useMemo(() => {
    if (liveLocation?.latitude && liveLocation?.longitude) {
      return [liveLocation.latitude, liveLocation.longitude];
    }
    if (pickupAddress?.latitude && pickupAddress?.longitude) {
      return [Number(pickupAddress.latitude), Number(pickupAddress.longitude)];
    }
    if (deliveryAddress?.latitude && deliveryAddress?.longitude) {
      return [Number(deliveryAddress.latitude), Number(deliveryAddress.longitude)];
    }
    return [20.5937, 78.9629];
  }, [liveLocation, pickupAddress, deliveryAddress]);

  const defaultZoom = liveLocation ? 15 : pickupAddress ? 12 : 5;

  const pickupIcon = useMemo(() => createAddressIcon('pickup'), []);
  const deliveryIcon = useMemo(() => createAddressIcon('delivery'), []);

  const handleCenterCourier = () => {
    if (animatedPosition) {
      setTriggerRecenter(true);
    }
  };

  // Active path to display on map: prefer externally supplied road travelled path or calculated trail
  const activeTravelledPath = externalTravelledPath && externalTravelledPath.length > 0
    ? externalTravelledPath
    : trackingPath;

  return (
    <div className="bg-white rounded-xl border border-[#D9DEE5] shadow-xs overflow-hidden flex flex-col">
      {/* Header bar */}
      <TrackingHeader
        isLive={isLive}
        connectionStatus={connectionStatus}
        lastUpdatedText={relativeTimeText}
        onCenterCourier={handleCenterCourier}
        hasCourierLocation={Boolean(animatedPosition)}
      />

      {/* Map Canvas */}
      <div className="relative w-full overflow-hidden" style={{ height: height || '480px', minHeight: '340px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapController
            centerCoords={animatedPosition}
            zoom={15}
            triggerRecenter={triggerRecenter}
            onRecenterHandled={() => setTriggerRecenter(false)}
            hasInitializedRef={hasInitializedRef}
          />

          {/* Real OSRM Road Route & Travelled Path */}
          <RoutePath
            fullRoute={fullRoute}
            travelledPath={activeTravelledPath}
            autoFit={true}
          />

          {/* Smooth Moving Courier Vehicle Marker */}
          {animatedPosition && (
            <>
              <CourierVehicleMarker
                position={animatedPosition}
                bearing={bearing}
                courierName={courierName}
                trackingId={trackingId}
                accuracy={liveLocation?.accuracy}
                isMoving={isMoving}
                isLive={isLive}
              />

              {/* GPS Accuracy Radius Circle */}
              {liveLocation?.accuracy && liveLocation.accuracy < 2000 && (
                <Circle
                  center={animatedPosition}
                  radius={liveLocation.accuracy}
                  pathOptions={{
                    color: '#D97706',
                    fillColor: '#D97706',
                    fillOpacity: 0.1,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
              )}
            </>
          )}

          {/* Pickup Address Marker */}
          {pickupAddress?.latitude && pickupAddress?.longitude && (
            <Marker
              position={[Number(pickupAddress.latitude), Number(pickupAddress.longitude)]}
              icon={pickupIcon}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-[#15803D] flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pickup Address (Origin)</span>
                  </div>
                  <p className="text-[#263449] font-medium">{pickupAddress.addressLine}</p>
                  <p className="text-[#667085] text-[11px]">
                    {pickupAddress.city}, {pickupAddress.state} - {pickupAddress.postalCode}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Delivery Address Marker */}
          {deliveryAddress?.latitude && deliveryAddress?.longitude && (
            <Marker
              position={[Number(deliveryAddress.latitude), Number(deliveryAddress.longitude)]}
              icon={deliveryIcon}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-[#D97706] flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Address (Destination)</span>
                  </div>
                  <p className="text-[#263449] font-medium">{deliveryAddress.addressLine}</p>
                  <p className="text-[#667085] text-[11px]">
                    {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.postalCode}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating status card if no live location yet */}
        {!animatedPosition && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-xs z-[1000] bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-[#D9DEE5] shadow-md text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#172033]">Waiting for courier's first location</p>
                <p className="text-[#667085] text-[11px] mt-0.5">
                  {fullRoute && fullRoute.length > 0
                    ? 'Road route mapped. The vehicle will appear and smoothly track once coordinates are received.'
                    : 'The map will automatically display and smoothly track the courier vehicle once coordinates are received.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top-Right Road Telemetry Tag */}
        {routeDistanceKm && (
          <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#D9DEE5] shadow-xs flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#172033]">
              <Route className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{routeDistanceKm} km</span>
            </div>
            {routeDurationMinutes && (
              <div className="flex items-center gap-1 text-[#667085] text-[11px] border-l border-[#D9DEE5] pl-2.5">
                <Clock className="w-3 h-3" />
                <span>~{routeDurationMinutes} min</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-3 bg-[#F4F6F8] border-t border-[#D9DEE5] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#263449]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">
            {isLive ? 'Courier is actively sharing live road coordinates.' : 'Live GPS telemetry stream.'}
          </span>
        </div>

        {animatedPosition && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#667085]">
            <span>
              Lat: <strong className="text-[#172033] font-mono">{animatedPosition[0].toFixed(6)}</strong>
            </span>
            <span>
              Lng: <strong className="text-[#172033] font-mono">{animatedPosition[1].toFixed(6)}</strong>
            </span>
            {liveLocation?.accuracy && (
              <span>
                GPS accuracy: <strong className="text-[#172033]">±{Math.round(liveLocation.accuracy)} m</strong>
              </span>
            )}
            <span>
              Heading: <strong className="text-[#172033]">{Math.round(bearing)}°</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
