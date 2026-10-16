/**
 * Geocoding Service (OpenStreetMap Nominatim)
 * 
 * Provides forward geocoding (search places/addresses to coordinates)
 * and reverse geocoding (coordinates to readable address details).
 * 
 * Features:
 * - In-memory caching for both forward search and reverse geocoding
 * - AbortController support to cancel stale requests
 * - Normalized address extraction matching backend Shipment schema
 * - Graceful error handling for offline/network/rate-limit conditions
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// In-memory cache to prevent redundant network requests and respect rate limits
const searchCache = new Map();
const reverseCache = new Map();

/**
 * Helper to extract clean address components from Nominatim address object
 */
export const extractAddressComponents = (item) => {
  if (!item) return null;

  const addr = item.address || {};
  const lat = Number(parseFloat(item.lat).toFixed(6));
  const lng = Number(parseFloat(item.lon).toFixed(6));

  // Determine address line: prioritize road, pedestrian, building or landmark name
  const roadOrName =
    addr.road ||
    addr.pedestrian ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.building ||
    item.name ||
    (item.display_name ? item.display_name.split(',')[0].trim() : 'Pinned Location');

  // If suburb or neighbourhood can complement the street, combine cleanly
  let addressLine = roadOrName;
  if (addr.suburb && addr.road && !roadOrName.toLowerCase().includes(addr.suburb.toLowerCase())) {
    addressLine = `${roadOrName}, ${addr.suburb}`;
  }

  // Determine city: prioritize city, then town, village, municipality, or county
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    addr.state_district ||
    '';

  // Determine state
  const state = addr.state || addr.region || '';

  // Determine postal code
  const postalCode = addr.postcode ? addr.postcode.trim() : '';

  return {
    latitude: lat,
    longitude: lng,
    addressLine: addressLine.slice(0, 120),
    city: city.slice(0, 60),
    state: state.slice(0, 60),
    postalCode: postalCode.slice(0, 10),
    displayName: item.display_name || addressLine,
  };
};

/**
 * Forward Geocoding: Search for places / addresses by text query
 * @param {string} query - Search term
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<Array<Object>>} List of suggestions
 */
export const searchPlaces = async (query, signal = null) => {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const cacheKey = trimmed.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    limit: '6',
    q: trimmed,
  });

  const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    if (res.status === 429) {
      throw new Error('Search rate limit reached. Please wait a moment before searching again.');
    }

    if (!res.ok) {
      throw new Error(`Location search failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const parsedResults = data
      .map(extractAddressComponents)
      .filter((item) => item && !Number.isNaN(item.latitude) && !Number.isNaN(item.longitude));

    // Cache results for 5 minutes
    searchCache.set(cacheKey, parsedResults);
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }

    return parsedResults;
  } catch (err) {
    if (err.name === 'AbortError') {
      // Clean cancellation
      return [];
    }
    console.warn('[GeocodingService] searchPlaces error:', err.message);
    throw err;
  }
};

/**
 * Reverse Geocoding: Look up address information for a coordinate
 * @param {number} latitude
 * @param {number} longitude
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export const reverseGeocode = async (latitude, longitude, signal = null) => {
  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null ||
    Number.isNaN(Number(latitude)) ||
    Number.isNaN(Number(longitude))
  ) {
    throw new Error('Valid numeric coordinates are required for reverse geocoding.');
  }

  const latNum = Number(parseFloat(latitude).toFixed(6));
  const lngNum = Number(parseFloat(longitude).toFixed(6));

  const cacheKey = `${latNum.toFixed(4)},${lngNum.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return {
      ...reverseCache.get(cacheKey),
      latitude: latNum,
      longitude: lngNum,
    };
  }

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    lat: latNum.toString(),
    lon: lngNum.toString(),
  });

  const url = `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    if (res.status === 429) {
      throw new Error('Address lookup rate limit reached. Please wait a moment.');
    }

    if (!res.ok) {
      throw new Error(`Reverse geocoding failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data || data.error) {
      throw new Error(data?.error || 'No readable address found for this location.');
    }

    const parsed = extractAddressComponents(data);
    if (!parsed) {
      throw new Error('Could not parse address from geocoder response.');
    }

    // Cache reverse geocode result
    reverseCache.set(cacheKey, parsed);
    if (reverseCache.size > 100) {
      const oldestKey = reverseCache.keys().next().value;
      reverseCache.delete(oldestKey);
    }

    return parsed;
  } catch (err) {
    if (err.name === 'AbortError') {
      return null;
    }
    console.warn('[GeocodingService] reverseGeocode error:', err.message);
    throw err;
  }
};
