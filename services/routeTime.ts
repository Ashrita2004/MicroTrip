import { calculateDistance } from "./distance";
import { calculateTravelTime } from "./travelTime";

export function calculateRouteTime(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  transport: string,
) {
  const distance = calculateDistance(fromLat, fromLon, toLat, toLon);

  const travelTime = calculateTravelTime(distance, transport);

  return {
    distance,
    travelTime,
  };
}
