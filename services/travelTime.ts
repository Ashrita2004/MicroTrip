export function calculateTravelTime(distanceKm: number, transport: string) {
  let speedKmh = 5;

  if (transport === "walking") {
    speedKmh = 5;
  } else if (transport === "biking") {
    speedKmh = 15;
  } else if (transport === "transit") {
    speedKmh = 25;
  }

  const timeHours = distanceKm / speedKmh;
  const timeMinutes = timeHours * 60;

  return Math.ceil(timeMinutes);
}
