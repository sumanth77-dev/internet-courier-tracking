import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Info,
} from 'lucide-react';

// Demonstration route coordinates (Connecting Koramangala Hub to Indiranagar, Bengaluru)
const DEMO_ROUTE_COORDS = [
  [12.9352, 77.6245], // SkyRoute Dispatch Hub, Koramangala 4th Block
  [12.9388, 77.6272], // Koramangala 1st Block
  [12.9435, 77.6315], // Sony World Signal
  [12.9490, 77.6350], // Ejipura Inner Ring Road
  [12.9550, 77.6380], // Intermediate Ring Road
  [12.9605, 77.6398], // Domlur Flyover Intersection
  [12.9660, 77.6406], // 100 Feet Road South
  [12.9719, 77.6412], // Destination: Indiranagar 100 Feet Road
];

// Helper to interpolate between two [lat, lng] points
function interpolatePoint(p1, p2, ratio) {
  return [
    p1[0] + (p2[0] - p1[0]) * ratio,
    p1[1] + (p2[1] - p1[1]) * ratio,
  ];
}

// Calculate bearing in degrees between two coordinates
function calculateBearing(p1, p2) {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Custom Map Controller to smoothly recenter
const MapCenterController = ({ center, triggerRecenter }) => {
  const map = useMap();
  useEffect(() => {
    if (triggerRecenter && center) {
      map.flyTo(center, 14, { animate: true, duration: 0.8 });
    }
  }, [triggerRecenter, center, map]);

  return null;
};

// Create custom SVG markers using Leaflet DivIcon
const createCustomPinIcon = (type = 'pickup') => {
  const isPickup = type === 'pickup';
  const bgColor = isPickup ? '#142B45' : '#18A6A0';
  const label = isPickup ? 'Origin Hub' : 'Delivery Destination';

  return L.divIcon({
    className: `custom-${type}-pin`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
        <div style="background-color: ${bgColor}; color: white; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 2px 4px rgba(20,43,69,0.3);">
          ${label}
        </div>
        <div style="width: 20px; height: 20px; border-radius: 50%; background: white; border: 3px solid ${bgColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${bgColor};"></div>
        </div>
      </div>
    `,
    iconSize: [80, 46],
    iconAnchor: [40, 44],
    popupAnchor: [0, -42],
  });
};

const createVanMarkerIcon = (bearing = 0) => {
  return L.divIcon({
    className: 'skyroute-demo-van-icon',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Telemetry Pulse Ring -->
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(24, 166, 160, 0.25); animation: pulse-ring 2s infinite;"></div>
        
        <!-- Rotating Vehicle Shell -->
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #142B45;
          border: 2px solid #18A6A0;
          box-shadow: 0 4px 10px rgba(20, 43, 69, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${Math.round(bearing)}deg);
          color: white;
        ">
          <!-- Arrow Indicator -->
          <div style="
            position: absolute;
            top: -3px;
            width: 0;
            height: 0;
            border-left: 3px solid transparent;
            border-right: 3px solid transparent;
            border-bottom: 5px solid #18A6A0;
          "></div>
          
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18.5" r="2.5"/>
            <circle cx="7" cy="18.5" r="2.5"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

export const LandingLivePreview = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [progressInSegment, setProgressInSegment] = useState(0); // 0.0 to 1.0
  const [recenterCount, setRecenterCount] = useState(0);

  // Compute current courier location and bearing along demo route
  const totalSegments = DEMO_ROUTE_COORDS.length - 1;
  const currentP1 = DEMO_ROUTE_COORDS[currentSegmentIndex];
  const currentP2 = DEMO_ROUTE_COORDS[Math.min(currentSegmentIndex + 1, totalSegments)];

  const currentLocation = useMemo(() => {
    return interpolatePoint(currentP1, currentP2, progressInSegment);
  }, [currentP1, currentP2, progressInSegment]);

  const currentBearing = useMemo(() => {
    return calculateBearing(currentP1, currentP2);
  }, [currentP1, currentP2]);

  // Trail of covered route coordinates
  const travelledPath = useMemo(() => {
    const covered = DEMO_ROUTE_COORDS.slice(0, currentSegmentIndex + 1);
    covered.push(currentLocation);
    return covered;
  }, [currentSegmentIndex, currentLocation]);

  // Animation ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgressInSegment((prev) => {
        const next = prev + 0.05; // 20 ticks per segment
        if (next >= 1) {
          setCurrentSegmentIndex((seg) => {
            if (seg >= totalSegments - 1) {
              return 0; // loop back to start
            }
            return seg + 1;
          });
          return 0;
        }
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isPlaying, totalSegments]);

  const handleReset = () => {
    setCurrentSegmentIndex(0);
    setProgressInSegment(0);
    setIsPlaying(false);
  };

  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
  };

  // Remaining progress calculation
  const overallProgressPercent = Math.round(
    ((currentSegmentIndex + progressInSegment) / totalSegments) * 100
  );
  const remainingDistanceKm = (
    4.6 * (1 - (currentSegmentIndex + progressInSegment) / totalSegments)
  ).toFixed(1);
  const remainingMinutes = Math.max(
    2,
    Math.round(15 * (1 - (currentSegmentIndex + progressInSegment) / totalSegments))
  );

  return (
    <section id="live-preview" className="py-16 lg:py-24 bg-white border-b border-[#D5DEE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EEF4] border border-[#D5DEE7] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A6A6]"></span>
            <span className="text-xs font-bold text-[#142B45] uppercase tracking-wider">
              Interactive Map Experience
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#142B45] tracking-tight">
            Live Tracking Demonstration
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#607487] leading-relaxed">
            Experience SkyRoute’s real-time road-following vehicle visualization with live telemetry indicators and progress tracking.
          </p>
        </div>

        {/* DEMONSTRATION DATA DISCLAIMER BANNER (Strictly non-fabricated active shipment compliance) */}
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold uppercase tracking-wider">
              Demonstration Mode — Sample Data Only:{' '}
            </span>
            This interface visualizes a simulated telemetry stream demonstrating SkyRoute’s Leaflet road navigation engine.
            This is non-confidential sample data for preview purposes and does not represent an actual active shipment.
          </div>
        </div>

        {/* Live Tracking Map Card Container */}
        <div className="bg-[#F0F3F7] rounded-2xl border border-[#D5DEE7] overflow-hidden shadow-sm">
          {/* Top Demo Status Bar */}
          <div className="bg-[#0B1F33] text-white p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#123B5D] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-[#00A6A6]">
                    DEMO SIMULATION
                  </span>
                  <span className="text-[11px] font-mono text-[#DCE5EC]">#DEMO-SR-8921</span>
                </div>
                <p className="text-xs text-[#DCE5EC] font-medium">
                  SkyRoute Koramangala Hub → Indiranagar 100ft Road
                </p>
              </div>
            </div>

            {/* Map Controls */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] bg-[#00A6A6] hover:bg-[#008F95] text-white text-xs font-bold transition cursor-pointer"
                title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] bg-[#123B5D] hover:bg-[#176B87] text-white text-xs font-semibold transition cursor-pointer"
                title="Reset Route to Start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleRecenter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] bg-[#123B5D] hover:bg-[#176B87] text-white text-xs font-semibold transition cursor-pointer"
                title="Center on Courier"
              >
                <Navigation className="w-3.5 h-3.5 text-[#00A6A6]" />
                <span className="hidden sm:inline">Center</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Area */}
          <div className="relative w-full h-[400px] sm:h-[480px]">
            <MapContainer
              center={[12.9535, 77.6328]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%' }}
              className="z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapCenterController
                center={currentLocation}
                triggerRecenter={recenterCount}
              />

              {/* Full Planned Route Polyline (Ocean Blue dashed) */}
              <Polyline
                positions={DEMO_ROUTE_COORDS}
                pathOptions={{
                  color: '#176B87',
                  weight: 4,
                  opacity: 0.6,
                  dashArray: '6, 8',
                }}
              />

              {/* Travelled Route Polyline (Bright Teal solid) */}
              <Polyline
                positions={travelledPath}
                pathOptions={{
                  color: '#00A6A6',
                  weight: 5,
                  opacity: 0.95,
                }}
              />

              {/* Origin Hub Marker */}
              <Marker
                position={DEMO_ROUTE_COORDS[0]}
                icon={createCustomPinIcon('pickup')}
              >
                <Popup>
                  <div className="text-xs font-bold text-[#142B45]">
                    SkyRoute Central Dispatch Hub<br />
                    <span className="text-[10px] font-normal text-[#607487]">
                      Koramangala 4th Block, Bengaluru
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Destination Marker */}
              <Marker
                position={DEMO_ROUTE_COORDS[DEMO_ROUTE_COORDS.length - 1]}
                icon={createCustomPinIcon('delivery')}
              >
                <Popup>
                  <div className="text-xs font-bold text-[#142B45]">
                    Delivery Destination<br />
                    <span className="text-[10px] font-normal text-[#607487]">
                      Indiranagar 100 Feet Road, Bengaluru
                    </span>
                  </div>
                </Popup>
              </Marker>

              {/* Moving Courier Marker */}
              <Marker
                position={currentLocation}
                icon={createVanMarkerIcon(currentBearing)}
              >
                <Popup>
                  <div className="text-xs font-bold text-[#142B45]">
                    Courier Rajesh Kumar (#CO-402)<br />
                    <span className="text-[10px] font-normal text-[#607487]">
                      Status: Out for Delivery • Speed: 28 km/h
                    </span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Floating Live Telemetry HUD Card */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white/95 backdrop-blur-xs rounded-2xl border border-[#D5DEE7] p-4 shadow-lg z-20 space-y-3">
              <div className="flex items-center justify-between border-b border-[#D5DEE7] pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#123B5D]">
                  Live Telemetry Stream
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#167A56] border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#167A56] animate-pulse"></span>
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#607487] block">Estimated Arrival</span>
                  <span className="text-sm font-bold text-[#142B45] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00A6A6]" />
                    {remainingMinutes} Mins
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#607487] block">Distance Left</span>
                  <span className="text-sm font-bold text-[#142B45] flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-[#00A6A6]" />
                    {remainingDistanceKm} km
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D5DEE7]">
                <div className="flex justify-between text-[11px] font-semibold text-[#142B45] mb-1">
                  <span>Route Journey</span>
                  <span>{overallProgressPercent}% Complete</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E8EEF4] border border-[#D5DEE7] overflow-hidden">
                  <div
                    className="h-full bg-[#00A6A6] rounded-full transition-all duration-300"
                    style={{ width: `${overallProgressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-[11px] text-[#607487] flex items-center gap-2 pt-1">
                <Truck className="w-3.5 h-3.5 text-[#142B45] shrink-0" />
                <span className="truncate">Rajesh Kumar (Partner #CO-402)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingLivePreview;

