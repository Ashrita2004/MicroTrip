export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export async function getRoadRoute(
  points: RouteCoordinate[],
): Promise<RouteCoordinate[]> {
  if (points.length < 2) {
    return points;
  }

  const coordinates = points
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(";");

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${coordinates}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Routing request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No route found.");
  }

  const routeCoordinates = data.routes[0].geometry.coordinates;

  return routeCoordinates.map(([longitude, latitude]: [number, number]) => ({
    latitude,
    longitude,
  }));
}
