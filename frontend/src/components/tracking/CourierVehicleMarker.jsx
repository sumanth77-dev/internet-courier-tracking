import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Navigation, Compass } from 'lucide-react';

/**
 * Creates Leaflet DivIcon for the Courier Vehicle
 * The inner icon element is rotated based on the calculated bearing,
 * preserving the exact geographic anchor point of the outer container.
 */
const createVehicleDivIcon = (bearing = 0, isMoving = false, isLive = true) => {
  // Normalize bearing in degrees
  const roundedBearing = Math.round(bearing);

  return L.divIcon({
    className: 'leaflet-courier-vehicle-container',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <!-- Live Ripple Pulse Ring -->
        ${
          isLive
            ? `<div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background-color: rgba(217, 119, 6, 0.25); animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>`
            : ''
        }
        
        <!-- Rotating Vehicle Icon Shell (Preserves Container Anchor) -->
        <div class="vehicle-icon" style="
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #172033;
          border: 2.5px solid #D97706;
          box-shadow: 0 4px 12px rgba(23, 32, 51, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${roundedBearing}deg);
          transition: transform 0.15s linear;
          color: #FFFFFF;
        ">
          <!-- Direction Heading Needle / Arrow -->
          <div style="
            position: absolute;
            top: -4px;
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 6px solid #D97706;
          "></div>

          <!-- Clean Delivery Truck SVG Icon -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18.5" r="2.5"/>
            <circle cx="7" cy="18.5" r="2.5"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

export const CourierVehicleMarker = ({
  position,
  bearing = 0,
  courierName,
  trackingId,
  accuracy,
  isMoving = false,
  isLive = true,
}) => {
  const icon = useMemo(() => {
    return createVehicleDivIcon(bearing, isMoving, isLive);
  }, [bearing, isMoving, isLive]);

  if (!position || !position[0] || !position[1]) {
    return null;
  }

  return (
    <Marker position={position} icon={icon} zIndexOffset={1000}>
      <Popup>
        <div className="p-1 text-xs">
          <div className="font-bold text-[#172033] flex items-center gap-1.5 mb-1.5 border-b border-[#D9DEE5]/60 pb-1">
            <Truck className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{courierName ? `${courierName} (Courier)` : 'Courier Live Delivery'}</span>
          </div>
          <div className="text-[#667085] space-y-1 text-[11px]">
            {trackingId && (
              <p>
                Tracking ID: <strong className="text-[#172033] font-mono">{trackingId}</strong>
              </p>
            )}
            <p>
              Heading: <strong className="text-[#172033]">{Math.round(bearing)}°</strong>
              <span className="text-[#667085] text-[10px] ml-1">
                ({isMoving ? 'Moving' : 'Stationary'})
              </span>
            </p>
            <p>
              Coordinates: <span className="font-mono">{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
            </p>
            {accuracy !== null && accuracy !== undefined && (
              <p>
                GPS Accuracy: <strong className="text-[#172033]">±{Math.round(accuracy)} m</strong>
              </p>
            )}
            <p className="pt-0.5">
              Status: <span className="text-emerald-700 font-semibold">{isLive ? 'Live Tracking Active' : 'Last Known Point'}</span>
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default CourierVehicleMarker;
