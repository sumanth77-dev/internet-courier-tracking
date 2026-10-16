import React, { useMemo, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Info, Loader2 } from 'lucide-react';

// Custom Map click handler component
const MapClickHandler = ({ onMapClick, activeMode }) => {
  useMapEvents({
    click(e) {
      if (onMapClick && activeMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Automatic view and bounds adjuster
const MapBoundsAdjuster = ({ pickup, delivery, routeCoords, activeMode }) => {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    // If a full driving route is available, fit nicely to route bounds
    if (routeCoords && routeCoords.length > 1) {
      map.fitBounds(routeCoords, { padding: [40, 40], maxZoom: 16 });
      return;
    }

    // If both pickup and delivery exist, frame both
    if (
      pickup?.latitude &&
      pickup?.longitude &&
      delivery?.latitude &&
      delivery?.longitude
    ) {
      const bounds = L.latLngBounds(
        [pickup.latitude, pickup.longitude],
        [delivery.latitude, delivery.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      return;
    }

    // If only pickup exists, center on pickup
    if (pickup?.latitude && pickup?.longitude && (activeMode === 'pickup' || !delivery?.latitude)) {
      map.setView([pickup.latitude, pickup.longitude], 15, { animate: true });
      return;
    }

    // If only delivery exists or active mode is delivery, center on delivery
    if (delivery?.latitude && delivery?.longitude && activeMode === 'delivery') {
      map.setView([delivery.latitude, delivery.longitude], 15, { animate: true });
      return;
    }
  }, [
    pickup?.latitude,
    pickup?.longitude,
    delivery?.latitude,
    delivery?.longitude,
    routeCoords,
    activeMode,
    map,
  ]);

  return null;
};

// Custom SVG-based Leaflet markers for Pickup and Delivery
const createMarkerIcon = (type = 'pickup') => {
  const isPickup = type === 'pickup';
  const bgColor = isPickup ? '#15803D' : '#D97706';
  const label = isPickup ? 'Pickup' : 'Drop-off';

  return L.divIcon({
    className: `custom-picker-${type}-marker`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="background-color: ${bgColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.25); white-space: nowrap; margin-bottom: 2px; letter-spacing: 0.2px;">
          ${label}
        </div>
        <div style="width: 24px; height: 24px; border-radius: 50%; background: white; border: 3px solid ${bgColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${bgColor};"></div>
        </div>
      </div>
    `,
    iconSize: [60, 48],
    iconAnchor: [30, 46],
    popupAnchor: [0, -46],
  });
};

export const LocationPickerMap = ({
  pickup = null,
  delivery = null,
  onPickupChange,
  onDeliveryChange,
  activeMode = 'pickup', // 'pickup' | 'delivery' | 'review'
  routeCoordinates = null,
  isGeocoding = false,
  height = '360px',
}) => {
  const pickupIcon = useMemo(() => createMarkerIcon('pickup'), []);
  const deliveryIcon = useMemo(() => createMarkerIcon('delivery'), []);

  // Default initial center (Bengaluru tech corridor) if no points selected yet
  const defaultCenter = useMemo(() => [12.9716, 77.5946], []);

  const handleMapClick = (lat, lng) => {
    if (activeMode === 'pickup' && onPickupChange) {
      onPickupChange({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    } else if (activeMode === 'delivery' && onDeliveryChange) {
      onDeliveryChange({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    }
  };

  const handlePickupDragEnd = (e) => {
    const latLng = e.target.getLatLng();
    if (onPickupChange) {
      onPickupChange({
        latitude: Number(latLng.lat.toFixed(6)),
        longitude: Number(latLng.lng.toFixed(6)),
      });
    }
  };

  const handleDeliveryDragEnd = (e) => {
    const latLng = e.target.getLatLng();
    if (onDeliveryChange) {
      onDeliveryChange({
        latitude: Number(latLng.lat.toFixed(6)),
        longitude: Number(latLng.lng.toFixed(6)),
      });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#D9DEE5] shadow-xs bg-[#F4F6F8]">
      {/* Geocoding Loading Indicator Overlay */}
      {isGeocoding && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#D9DEE5] shadow-md flex items-center gap-2 text-xs text-[#172033] font-medium">
          <Loader2 className="w-3.5 h-3.5 text-[#15803D] animate-spin" />
          <span>Resolving address for pin...</span>
        </div>
      )}

      {/* Help tooltip banner */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-[#D9DEE5] text-[11px] text-[#667085] flex items-center gap-1.5 shadow-xs pointer-events-none">
        <Info className="w-3.5 h-3.5 text-[#172033]" />
        <span>Click map to reposition pin, or drag marker to fine-tune</span>
      </div>

      <MapContainer
        center={
          pickup?.latitude
            ? [pickup.latitude, pickup.longitude]
            : delivery?.latitude
            ? [delivery.latitude, delivery.longitude]
            : defaultCenter
        }
        zoom={13}
        scrollWheelZoom={true}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapBoundsAdjuster
          pickup={pickup}
          delivery={delivery}
          routeCoords={routeCoordinates}
          activeMode={activeMode}
        />

        <MapClickHandler onMapClick={handleMapClick} activeMode={activeMode} />

        {/* Pickup Marker */}
        {pickup?.latitude && pickup?.longitude && (
          <Marker
            position={[pickup.latitude, pickup.longitude]}
            icon={pickupIcon}
            draggable={activeMode === 'pickup'}
            eventHandlers={{
              dragend: handlePickupDragEnd,
            }}
          >
            <Popup className="custom-marker-popup">
              <div className="p-1 text-xs">
                <span className="font-bold text-[#15803D] block uppercase text-[10px]">
                  Pickup Location
                </span>
                <p className="text-[#172033] font-medium mt-0.5">
                  {pickup.addressLine || 'Selected Pin'}
                </p>
                {pickup.city && (
                  <p className="text-[#667085] text-[11px]">{pickup.city}, {pickup.state}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery / Drop Marker */}
        {delivery?.latitude && delivery?.longitude && (
          <Marker
            position={[delivery.latitude, delivery.longitude]}
            icon={deliveryIcon}
            draggable={activeMode === 'delivery'}
            eventHandlers={{
              dragend: handleDeliveryDragEnd,
            }}
          >
            <Popup className="custom-marker-popup">
              <div className="p-1 text-xs">
                <span className="font-bold text-[#D97706] block uppercase text-[10px]">
                  Drop-off Location
                </span>
                <p className="text-[#172033] font-medium mt-0.5">
                  {delivery.addressLine || 'Selected Pin'}
                </p>
                {delivery.city && (
                  <p className="text-[#667085] text-[11px]">{delivery.city}, {delivery.state}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* OSRM Road Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#2563EB',
              weight: 5,
              opacity: 0.85,
              lineJoin: 'round',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;
