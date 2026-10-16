import axios from 'axios';

const ROUTING_BASE_URL =
  import.meta.env.VITE_ROUTING_API_URL || 'https://router.project-osrm.org';

/**
 * Validates latitude and longitude values
 */
export const isValidCoordinate = (lat, lon) => {
  if (lat === undefined || lat === null || lon === undefined || lon === null) {
    return false;
  }
  const nLat = Number(lat);
  const nLon = Number(lon);
  return (
    !Number.isNaN(nLat) &&
    !Number.isNaN(nLon) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLon >= -180 &&
    nLon <= 180
  );
};

/**
 * Interpolates additional points along long segments to guarantee smooth vehicle movement
 * @param {Array<[number, number]>} coords - Array of [lat, lng]
 * @param {number} maxSegmentMeters - Maximum distance in meters between consecutive points
 * @returns {Array<[number, number]>}
 */
export const densifyRoadCoordinates = (coords, maxSegmentMeters = 40) => {
  if (!coords || coords.length < 2) return coords || [];

  const result = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    result.push(p1);

    const lat1 = p1[0];
    const lon1 = p1[1];
    const lat2 = p2[0];
    const lon2 = p2[1];

    // Approximate distance in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distanceMeters = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (distanceMeters > maxSegmentMeters) {
      const intermediatePoints = Math.floor(distanceMeters / maxSegmentMeters);
      for (let j = 1; j <= intermediatePoints; j++) {
        const t = j / (intermediatePoints + 1);
        const intLat = lat1 + (lat2 - lat1) * t;
        const intLon = lon1 + (lon2 - lon1) * t;
        result.push([Number(intLat.toFixed(6)), Number(intLon.toFixed(6))]);
      }
    }
  }

  result.push(coords[coords.length - 1]);
  return result;
};

/**
 * Fetches a driving road route from OSRM between pickup and delivery coordinates
 * @param {Object} start - { latitude, longitude }
 * @param {Object} end - { latitude, longitude }
 * @returns {Promise<{
 *   coordinates: Array<[number, number]>,
 *   denseCoordinates: Array<[number, number]>,
 *   distanceMeters: number,
 *   distanceKm: string,
 *   durationSeconds: number,
 *   durationMinutes: number,
 *   steps: Array<any>
 * }>}
 */
export const getDrivingRoute = async (start, end) => {
  if (
    !start ||
    !end ||
    !isValidCoordinate(start.latitude, start.longitude) ||
    !isValidCoordinate(end.latitude, end.longitude)
  ) {
    throw new Error('Invalid pickup or delivery coordinates for routing.');
  }

  const startLon = Number(start.longitude);
  const startLat = Number(start.latitude);
  const endLon = Number(end.longitude);
  const endLat = Number(end.latitude);

  // OSRM format: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true
  const url = `${ROUTING_BASE_URL}/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await axios.get(url, { timeout: 12000 });

    if (
      !response.data ||
      response.data.code !== 'Ok' ||
      !response.data.routes ||
      response.data.routes.length === 0
    ) {
      throw new Error(
        'Unable to find a road route between the pickup and delivery locations.'
      );
    }

    const route = response.data.routes[0];
    const geoJsonCoords = route.geometry?.coordinates || [];

    if (geoJsonCoords.length < 2) {
      throw new Error(
        'Routing engine returned insufficient road geometry points.'
      );
    }

    // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
    const leafletCoords = geoJsonCoords.map(([lon, lat]) => [
      Number(lat.toFixed(6)),
      Number(lon.toFixed(6)),
    ]);

    // Subdivide segments for smooth vehicle interpolation
    const denseCoords = densifyRoadCoordinates(leafletCoords, 35);

    const distanceMeters = route.distance || 0;
    const durationSeconds = route.duration || 0;

    return {
      coordinates: leafletCoords, // [ [lat, lon], ... ]
      denseCoordinates: denseCoords, // Resampled [ [lat, lon], ... ]
      distanceMeters: distanceMeters,
      distanceKm: (distanceMeters / 1000).toFixed(1),
      durationSeconds: durationSeconds,
      durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
      steps: route.legs?.[0]?.steps || [],
    };
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(
        `Routing error: ${error.response.data.message}`
      );
    }
    if (error.message.includes('Unable to find a road route')) {
      throw error;
    }
    throw new Error(
      'Unable to find a road route between the pickup and delivery locations. Please check internet connection or routing service availability.'
    );
  }
};

export default {
  getDrivingRoute,
  isValidCoordinate,
  densifyRoadCoordinates,
};
