/**
 * Generates an interpolated coordinate path between pickup and delivery locations for GPS simulation
 * @param {Object} pickup - { latitude, longitude }
 * @param {Object} delivery - { latitude, longitude }
 * @param {number} numSteps - Number of intermediate steps (default: 80)
 * @returns {Array<{ latitude: number, longitude: number }>}
 */
export const generateSimulationPath = (pickup, delivery, numSteps = 80) => {
  if (
    !pickup ||
    !delivery ||
    pickup.latitude === undefined ||
    pickup.longitude === undefined ||
    delivery.latitude === undefined ||
    delivery.longitude === undefined
  ) {
    return [];
  }

  const lat1 = Number(pickup.latitude);
  const lon1 = Number(pickup.longitude);
  const lat2 = Number(delivery.latitude);
  const lon2 = Number(delivery.longitude);

  if (Number.isNaN(lat1) || Number.isNaN(lon1) || Number.isNaN(lat2) || Number.isNaN(lon2)) {
    return [];
  }

  // Ensure minimum steps
  const steps = Math.max(20, Math.min(numSteps, 250));
  const path = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Linear interpolation
    const lat = lat1 + (lat2 - lat1) * t;
    const lon = lon1 + (lon2 - lon1) * t;

    path.push({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
    });
  }

  return path;
};

export default generateSimulationPath;
