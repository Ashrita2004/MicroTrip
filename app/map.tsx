import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { calculateDistance } from "../services/distance";
import { getNearbyPlaces, Place } from "../services/overpass";
import { getVisitTime } from "../services/placeTime";
import { calculateRouteTime } from "../services/routeTime";
import { calculateTravelTime } from "../services/travelTime";

export default function MapScreen() {
  const { transport } = useLocalSearchParams<{ transport?: string }>();

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});

    setLocation(currentLocation);

    const nearbyPlaces = await getNearbyPlaces(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
    );

    const placesWithDistance = nearbyPlaces.map((place) => {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        place.lat,
        place.lon,
      );

      const travelTime = calculateTravelTime(distance, transport || "walking");

      const placeType =
        place.tags?.amenity || place.tags?.tourism || place.tags?.leisure || "";

      const visitTime = getVisitTime(placeType);

      return {
        ...place,
        distance,
        travelTime,
        visitTime,
      };
    });

    setPlaces(placesWithDistance);

    if (placesWithDistance.length >= 2) {
      const firstPlace = placesWithDistance[0];
      const secondPlace = placesWithDistance[1];

      const route = calculateRouteTime(
        firstPlace.lat,
        firstPlace.lon,
        secondPlace.lat,
        secondPlace.lon,
        transport || "walking",
      );

      console.log("Route between places:", route);
    }

    console.log("Places with distance:", placesWithDistance);
  };

  if (!location) {
    return <View style={styles.container} />;
  }

  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;

  const markers = places
    .map((place) => {
      const name = place.tags?.name || "Unnamed place";

      const type =
        place.tags?.amenity ||
        place.tags?.tourism ||
        place.tags?.leisure ||
        "Place";

      return `
        L.marker([${place.lat}, ${place.lon}])
          .addTo(map)
          .bindPopup(
            "<b>${escapeHtml(name)}</b><br/>${escapeHtml(type)}"
          );
      `;
    })
    .join("\n");

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          html,
          body,
          #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        ></script>

        <script>
          const map = L.map("map").setView(
            [${latitude}, ${longitude}],
            14
          );

          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution:
                '&copy; OpenStreetMap contributors'
            }
          ).addTo(map);

          L.marker([${latitude}, ${longitude}])
            .addTo(map)
            .bindPopup("<b>You are here</b>")
            .openPopup();

          ${markers}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.map}
      />
    </View>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },
});
