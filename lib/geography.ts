export type Coordinate = [number, number];

const earthRadiusNm = 3440.065;

const radians = (value: number) => value * Math.PI / 180;
const degrees = (value: number) => value * 180 / Math.PI;

export const normalizeLongitude = (longitude: number) => {
  let normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
  if (normalized === -180 && longitude > 0) normalized = 180;
  return normalized;
};

export const shortestLongitudeDelta = (from: number, to: number) => {
  const delta = normalizeLongitude(to) - normalizeLongitude(from);
  if (delta > 180) return delta - 360;
  if (delta < -180) return delta + 360;
  return delta;
};

export const distanceNm = (a: Coordinate, b: Coordinate) => {
  const latitudeA = radians(a[1]);
  const latitudeB = radians(b[1]);
  const deltaLatitude = latitudeB - latitudeA;
  const deltaLongitude = radians(shortestLongitudeDelta(a[0], b[0]));
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusNm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(Math.max(0, 1 - haversine)));
};

export const bearingDegrees = (a: Coordinate, b: Coordinate) => {
  const latitudeA = radians(a[1]);
  const latitudeB = radians(b[1]);
  const deltaLongitude = radians(shortestLongitudeDelta(a[0], b[0]));
  const y = Math.sin(deltaLongitude) * Math.cos(latitudeB);
  const x = Math.cos(latitudeA) * Math.sin(latitudeB)
    - Math.sin(latitudeA) * Math.cos(latitudeB) * Math.cos(deltaLongitude);
  return (degrees(Math.atan2(y, x)) + 360) % 360;
};

export const interpolateCoordinate = (a: Coordinate, b: Coordinate, fraction: number): Coordinate => {
  const bounded = Math.max(0, Math.min(1, fraction));
  return [
    normalizeLongitude(a[0] + shortestLongitudeDelta(a[0], b[0]) * bounded),
    a[1] + (b[1] - a[1]) * bounded
  ];
};

export const projectCoordinate = (origin: Coordinate, bearing: number, distance: number): Coordinate => {
  if (distance <= 0) return [...origin];
  const angularDistance = distance / earthRadiusNm;
  const initialBearing = radians(bearing);
  const latitude = radians(origin[1]);
  const longitude = radians(origin[0]);
  const targetLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance)
    + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(initialBearing)
  );
  const targetLongitude = longitude + Math.atan2(
    Math.sin(initialBearing) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(targetLatitude)
  );
  return [normalizeLongitude(degrees(targetLongitude)), degrees(targetLatitude)];
};

export const circlePolygon = (center: Coordinate, radiusNm: number, steps = 48): Coordinate[] => {
  const points: Coordinate[] = [];
  for (let index = 0; index <= steps; index += 1) {
    points.push(projectCoordinate(center, index / steps * 360, radiusNm));
  }
  return points;
};

export const boundsPolygon = (bounds: [number, number, number, number]): Coordinate[] => {
  const [west, south, east, north] = bounds;
  return [[west, south], [east, south], [east, north], [west, north], [west, south]];
};
