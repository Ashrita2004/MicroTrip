import { calculateDistance } from "./distance";
import { Place } from "./overpass";
import { getMaxVisitTime } from "./placeTime";
import { calculateTravelTime } from "./travelTime";

type EnrichedPlace = Place & {
  distance: number;
  travelTime: number;
  visitTime: number;
};
function scorePlace(
  place: EnrichedPlace,
  vibes: string[],
  selectedCategories: string[],
) {
  let score = 0;

  const amenity = place.tags?.amenity;
  const tourism = place.tags?.tourism;
  const leisure = place.tags?.leisure;

  const category = getPlaceCategory(place);

  // Give a strong score when the place matches a requested vibe
  if (vibes.includes("coffee") && amenity === "cafe") {
    score += selectedCategories.includes("coffee") ? 5 : 20;
  }

  if (vibes.includes("park") && leisure === "park") {
    score += selectedCategories.includes("park") ? 5 : 20;
  }

  if (vibes.includes("gallery") && tourism === "museum") {
    score += selectedCategories.includes("gallery") ? 5 : 20;
  }

  if (vibes.includes("attraction") && tourism === "attraction") {
    score += selectedCategories.includes("attraction") ? 5 : 20;
  }

  // Prefer categories that haven't been selected yet
  if (!selectedCategories.includes(category)) {
    score += 10;
  }

  // Small distance penalty
  score -= place.distance;

  return score;
}

function getPlaceCategory(place: EnrichedPlace) {
  if (place.tags?.amenity === "cafe") {
    return "coffee";
  }

  if (place.tags?.leisure === "park") {
    return "park";
  }

  if (place.tags?.tourism === "museum") {
    return "gallery";
  }

  if (place.tags?.tourism === "attraction") {
    return "attraction";
  }

  return "other";
}

export function buildItinerary(
  places: EnrichedPlace[],
  startLat: number,
  startLon: number,
  timeBudget: number,
  transport: string,
  vibes: string[],
  includeBuffer: boolean,
) {
  const itinerary: EnrichedPlace[] = [];

  let currentLat = startLat;
  let currentLon = startLon;
  let totalTime = 0;

  const bufferTime = includeBuffer ? 10 : 0;
  const usableTime = timeBudget - bufferTime;

  const selectedCategories: string[] = [];

  const remainingPlaces = [...places];
  // ONE VIBE MODE
  if (vibes.length === 1 && remainingPlaces.length > 0) {
    let bestPlace: EnrichedPlace | null = null;
    let bestScore = -Infinity;

    for (const place of remainingPlaces) {
      const score = scorePlace(place, vibes, []);

      if (score > bestScore) {
        bestScore = score;
        bestPlace = place;
      }
    }

    if (bestPlace) {
      const distanceFromStart = calculateDistance(
        startLat,
        startLon,
        bestPlace.lat,
        bestPlace.lon,
      );

      const travelTime = calculateTravelTime(distanceFromStart, transport);

      const availableVisitTime = usableTime - travelTime;

      const category = getPlaceCategory(bestPlace);

      const maxVisitTime = getMaxVisitTime(category);

      const visitTime = Math.min(availableVisitTime, maxVisitTime);

      if (visitTime > 0) {
        itinerary.push({
          ...bestPlace,
          distance: distanceFromStart,
          travelTime,
          visitTime,
        });

        totalTime = travelTime + visitTime;
      }
    }

    const selectedVibes: string[] = itinerary.map((place) =>
      getPlaceCategory(place),
    );

    const missingVibes = vibes.filter((vibe) => !selectedVibes.includes(vibe));

    return {
      places: itinerary,
      totalTime,
      remainingTime: timeBudget - totalTime,
      missingVibes,
    };
  }

  while (remainingPlaces.length > 0) {
    let bestPlace: EnrichedPlace | null = null;
    let bestScore = -Infinity;
    let bestTravelTime = 0;

    const remainingTime = usableTime - totalTime;

    // Check every remaining place
    for (const place of remainingPlaces) {
      const category = getPlaceCategory(place);

      const distanceFromCurrent = calculateDistance(
        currentLat,
        currentLon,
        place.lat,
        place.lon,
      );

      const travelTime = calculateTravelTime(distanceFromCurrent, transport);

      const requiredTime = travelTime + place.visitTime;

      // Ignore places that don't fit
      if (requiredTime > remainingTime) {
        continue;
      }

      const vibeScore = scorePlace(place, vibes, selectedCategories);

      /*
       * Give a small bonus to places that use
       * more of the remaining available time.
       */
      const timeUsageScore = requiredTime / remainingTime;

      const score = vibeScore + timeUsageScore * 5;

      if (score > bestScore) {
        bestScore = score;
        bestPlace = place;
        bestTravelTime = travelTime;
      }
    }

    // No place can fit in the remaining time
    if (!bestPlace) {
      break;
    }

    const distanceFromCurrent = calculateDistance(
      currentLat,
      currentLon,
      bestPlace.lat,
      bestPlace.lon,
    );

    const requiredTime = bestTravelTime + bestPlace.visitTime;

    // Add the selected place
    itinerary.push({
      ...bestPlace,
      distance: distanceFromCurrent,
      travelTime: bestTravelTime,
      visitTime: bestPlace.visitTime,
    });

    totalTime += requiredTime;

    // New starting point becomes this place
    currentLat = bestPlace.lat;
    currentLon = bestPlace.lon;

    // Remember which category we've already visited
    selectedCategories.push(getPlaceCategory(bestPlace));

    // Remove selected place
    const index = remainingPlaces.indexOf(bestPlace);

    remainingPlaces.splice(index, 1);
  }

  const selectedVibes: string[] = itinerary.map((place) =>
    getPlaceCategory(place),
  );

  const missingVibes = vibes.filter((vibe) => !selectedVibes.includes(vibe));

  return {
    places: itinerary,
    totalTime,
    remainingTime: timeBudget - totalTime,
    missingVibes,
  };
}
