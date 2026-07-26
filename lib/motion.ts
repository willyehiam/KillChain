import {
  bearingDegrees,
  distanceNm,
  interpolateCoordinate,
  type Coordinate
} from "./geography";

export interface RouteMotion {
  position: Coordinate;
  route: Coordinate[];
  routeIndex: number;
  speedKnots: number;
  heading: number;
  stationary: boolean;
  loopRoute: boolean;
}

const nextRouteIndex = (motion: RouteMotion) => {
  if (motion.route.length < 2) return motion.routeIndex;
  if (motion.routeIndex < motion.route.length) return motion.routeIndex;
  return motion.loopRoute ? 0 : motion.route.length - 1;
};

export function advanceRoute<T extends RouteMotion>(motion: T, minutes = 1): T {
  if (motion.stationary || motion.speedKnots <= 0 || motion.route.length < 2 || minutes <= 0) return motion;
  let remaining = motion.speedKnots * minutes / 60;
  let position: Coordinate = [...motion.position];
  let routeIndex = nextRouteIndex(motion);
  let heading = motion.heading;
  let guard = 0;

  while (remaining > .00001 && guard < motion.route.length * 4) {
    guard += 1;
    const target = motion.route[routeIndex];
    const segmentDistance = distanceNm(position, target);
    heading = bearingDegrees(position, target);
    if (segmentDistance > remaining) {
      position = interpolateCoordinate(position, target, remaining / segmentDistance);
      remaining = 0;
      break;
    }
    position = [...target];
    remaining -= segmentDistance;
    if (routeIndex >= motion.route.length - 1) {
      if (!motion.loopRoute) {
        remaining = 0;
        break;
      }
      routeIndex = 0;
    } else {
      routeIndex += 1;
    }
  }

  return { ...motion, position, routeIndex, heading };
}

export function projectRoutePose(motion: RouteMotion, fractionalMinutes: number) {
  const projected = advanceRoute(motion, Math.max(0, fractionalMinutes));
  return { position: projected.position, heading: projected.heading };
}
