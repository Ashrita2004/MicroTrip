export type Place = {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    amenity?: string;
    tourism?: string;
    leisure?: string;
    cuisine?: string;
  };
};
export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
): Promise<Place[]> {
  const query = `
  [out:json][timeout:15];

  (
    nwr["amenity"="cafe"](around:1900,${latitude},${longitude});
    nwr["leisure"="park"](around:1900,${latitude},${longitude});
    nwr["leisure"="garden"](around:1900,${latitude},${longitude});
    nwr["tourism"="museum"](around:1900,${latitude},${longitude});
    nwr["tourism"="attraction"](around:1900,${latitude},${longitude});
  );

  out center;
`;

  const url =
    "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "MICROTRIP/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log("Overpass Error:", response.status, errorText);
    throw new Error(`Overpass request failed: ${response.status}`);
  }

  const data = await response.json();

  return data.elements
    .map((element: any) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;

      if (lat === undefined || lon === undefined) {
        return null;
      }

      return {
        id: element.id,
        lat,
        lon,
        tags: element.tags,
      };
    })
    .filter((place: Place | null): place is Place => place !== null);
}
