export function getVisitTime(placeType: string) {
  if (placeType === "cafe") return 15;
  if (placeType === "park") return 10;
  if (placeType === "museum") return 20;
  if (placeType === "attraction") return 15;

  return 10;
}

export function getMaxVisitTime(placeType: string) {
  if (placeType === "coffee") return 60;
  if (placeType === "park") return 60;
  if (placeType === "gallery") return 90;
  if (placeType === "attraction") return 60;

  return 30;
}
