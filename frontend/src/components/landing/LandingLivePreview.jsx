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
  Clock,
  AlertTriangle,
  Truck,
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
  const bgColor = isPickup ? '#171717' : '#FF7547';
  const label = isPickup ? 'Origin Hub' : 'Delivery Destination';

  return L.divIcon({
    className: `custom-${type}-pin`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
        <div style="background-color: ${bgColor}; color: white; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 2px 4px rgba(23,23,23,0.4);">
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
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(255, 117, 71, 0.3); animation: pulse-ring 2s infinite;"></div>
        
        <!-- Rotating Vehicle Shell -->
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #171717;
          border: 2px solid #FF7547;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${Math.round(bearing)}deg);
          color: white;
        ">
          <!-- Arrow Indicator -->
          <div style="
            position: absolute;
            top: -4px;
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 6px solid #FF7547;
          "></div>
          
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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

  // Construct dynamic travelled route slice
  const travelledPath = useMemo(() => {
    const coords = DEMO_ROUTE_COORDS.slice(0, currentSegmentIndex + 1);
    coords.push(currentLocation);
    return coords;
  }, [currentSegmentIndex, currentLocation]);

  // Animation simulation loop
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    const stepDurationMs = 2800; // Duration per route segment

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setProgressInSegment((prevProgress) => {
        const increment = deltaTime / stepDurationMs;
        const newProgress = prevProgress + increment;

        if (newProgress >= 1.0) {
          setCurrentSegmentIndex((prevSegment) => {
            if (prevSegment >= totalSegments - 1) {
              return 0; // Loop route seamlessly
            }
            return prevSegment + 1;
          });
          return 0.0;
        }

        return newProgress;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, totalSegments]);

  const handleReset = () => {
    setCurrentSegmentIndex(0);
    setProgressInSegment(0);
    setIsPlaying(false);
  };

  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
  };

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
    <section id="live-preview" className="py-16 lg:py-24 bg-white border-b border-[#DEDCD8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F0ED] border border-[#DEDCD8] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>
            <span className="text-xs font-bold text-[#202020] uppercase tracking-wider">
              Interactive Map Experience
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#202020] tracking-tight">
            Live Tracking Demonstration
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#777777] leading-relaxed">
            Experience SkyRoute’s real-time road-following vehicle visualization with live telemetry indicators and progress tracking.
          </p>
        </div>

        {/* DEMONSTRATION DATA DISCLAIMER BANNER */}
        <div className="mb-6 bg-[#FEF7ED] border border-[#FDE3C8] rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-[#C48429] shrink-0 mt-0.5" />
          <div className="text-xs text-[#202020] leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-[#C48429]">
              Demonstration Mode — Sample Data Only:{' '}
            </span>
            This interface visualizes a simulated telemetry stream demonstrating SkyRoute’s Leaflet road navigation engine.
            This is non-confidential sample data for preview purposes and does not represent an actual active shipment.
          </div>
        </div>

        {/* Live Tracking Map Card Container (Dark Tracking Panel) */}
        <div className="bg-[#242424] rounded-2xl border border-[#383838] overflow-hidden shadow-lg">
          {/* Top Demo Status Bar */}
          <div className="bg-[#171717] text-white p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#383838]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#242424] border border-[#383838] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-[#FF7547]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-[#FF7547]">
                    DEMO SIMULATION
                  </span>
                  <span className="text-[11px] font-mono text-[#C5C5C5]">#DEMO-SR-8921</span>
                </div>
                <p className="text-xs text-[#C5C5C5] font-medium">
                  SkyRoute Koramangala Hub → Indiranagar 100ft Road
                </p>
              </div>
            </div>

            {/* Map Controls */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF7547] hover:bg-[#F06438] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-white text-xs font-semibold border border-[#383838] transition cursor-pointer"
                title="Reset Route to Start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleRecenter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-white text-xs font-semibold border border-[#383838] transition cursor-pointer"
                title="Center on Courier"
              >
                <Navigation className="w-3.5 h-3.5 text-[#FF7547]" />
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

              {/* Full Planned Route Polyline */}
              <Polyline
                positions={DEMO_ROUTE_COORDS}
                pathOptions={{
                  color: '#777777',
                  weight: 3.5,
                  opacity: 0.6,
                  dashArray: '6, 8',
                }}
              />

              {/* Travelled Route Polyline in Coral Orange */}
              <Polyline
                positions={travelledPath}
                pathOptions={{
                  color: '#FF7547',
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
                  <div className="text-xs font-bold text-[#202020]">
                    SkyRoute Central Dispatch Hub<br />
                    <span className="text-[10px] font-normal text-[#777777]">
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
                  <div className="text-xs font-bold text-[#202020]">
                    Delivery Destination<br />
                    <span className="text-[10px] font-normal text-[#777777]">
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
                  <div className="text-xs font-bold text-[#202020]">
                    Courier Rajesh Kumar (#CO-402)<br />
                    <span className="text-[10px] font-normal text-[#777777]">
                      Status: Out for Delivery • Speed: 28 km/h
                    </span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Floating Live Telemetry HUD Card in Dark Charcoal */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-[#171717]/95 backdrop-blur-md rounded-2xl border border-[#383838] p-4 shadow-xl z-20 space-y-3 text-white">
              <div className="flex items-center justify-between border-b border-[#383838] pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5C5C5]">
                  Live Telemetry Stream
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7F1] text-[#238259] border border-[#C4E8D8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#36A879] animate-pulse"></span>
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#929292] block">Estimated Arrival</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF7547]" />
                    {remainingMinutes} Mins
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#929292] block">Distance Left</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-[#FF7547]" />
                    {remainingDistanceKm} km
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#383838]">
                <div className="flex justify-between text-[11px] font-semibold text-[#C5C5C5] mb-1">
                  <span>Route Journey</span>
                  <span>{overallProgressPercent}% Complete</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#303030] border border-[#383838] overflow-hidden">
                  <div
                    className="h-full bg-[#FF7547] rounded-full transition-all duration-300"
                    style={{ width: `${overallProgressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-[11px] text-[#C5C5C5] flex items-center gap-2 pt-1">
                <Truck className="w-3.5 h-3.5 text-[#FF7547] shrink-0" />
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
