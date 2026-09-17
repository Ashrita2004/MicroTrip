import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { calculateDistance } from "../services/distance";
import {
  cancelTripNotifications,
  scheduleTripNotifications,
} from "../services/notifications";
import { getRoadRoute, RouteCoordinate } from "../services/Routing";
import { calculateTravelTime } from "../services/travelTime";

export default function TrackingScreen() {
  const TEST_MODE = false;
  const { totalTime, transport, places } = useLocalSearchParams();

  const [remainingSeconds, setRemainingSeconds] = useState(
    (Number(totalTime) || 30) * 60, //How much time is left for the entire Local Hour?
  );

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [startLocation, setStartLocation] =
    useState<Location.LocationObject | null>(null);
  const [returnDistance, setReturnDistance] = useState(0);
  const [returnTime, setReturnTime] = useState(0);

  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [arrivedAtStop, setArrivedAtStop] = useState(false);
  const [itineraryPlaces, setItineraryPlaces] = useState<any[]>([]);
  const [tripStatus, setTripStatus] = useState<
    "travelling" | "visiting" | "completed"
  >("travelling");

  const [visitRemainingSeconds, setVisitRemainingSeconds] = useState(0); //How much recommended time is left at the current stop?

  useEffect(() => {
    try {
      const parsedPlaces = JSON.parse(places?.toString() || "[]");

      if (TEST_MODE && location) {
        const testPlace = {
          ...parsedPlaces[0],
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          visitTime: 0.1,
          tags: {
            ...parsedPlaces[0]?.tags,
            name: "Test Stop",
          },
        };

        setItineraryPlaces([testPlace]);

        console.log("🧪 TEST MODE: Stop moved to current location");
      } else {
        setItineraryPlaces(parsedPlaces);
      }
    } catch (error) {
      console.log("Could not parse itinerary:", error);
    }
  }, [places, location]);

  //  Schedule Local Hour notifications
  useEffect(() => {
    const timeBudget = Number(totalTime) || 30;

    scheduleTripNotifications(timeBudget);
  }, [totalTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 0) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tripStatus !== "visiting") {
      return;
    }

    const timer = setInterval(() => {
      setVisitRemainingSeconds((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tripStatus]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Location permission needed",
            "Please allow location access to track your trip.",
          );
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation(currentLocation);
        if (!startLocation) {
          setStartLocation(currentLocation);
        }

        console.log("Initial tracking location:", currentLocation.coords);

        console.log("Trip start location:", currentLocation.coords);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (newLocation) => {
            setLocation(newLocation);

            console.log("Updated location:", newLocation.coords);
          },
        );
      } catch (error) {
        console.log("Tracking location error:", error);

        Alert.alert(
          "Location error",
          "We couldn't track your current location.",
        );
      }
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!location || !startLocation) {
      return;
    }
    console.log("CURRENT LOCATION:", {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    });

    console.log("START LOCATION:", {
      lat: startLocation.coords.latitude,
      lng: startLocation.coords.longitude,
    });
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      startLocation.coords.latitude,
      startLocation.coords.longitude,
    );
    console.log("RETURN DISTANCE:", distance);
    const estimatedTime = calculateTravelTime(
      distance,
      (transport as "walking" | "biking" | "transit") || "walking",
    );
    console.log("RETURN TIME:", estimatedTime);
    setReturnDistance(distance);
    setReturnTime(estimatedTime);

    console.log("Return distance:", distance.toFixed(3), "km");

    console.log("Estimated return time:", estimatedTime, "minutes");
  }, [location, startLocation, transport]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location permission needed",
          "Please allow location access to track your trip.",
        );

        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);

      console.log("Tracking location:", currentLocation.coords);
    } catch (error) {
      console.log("Tracking location error:", error);

      Alert.alert("Location error", "We couldn't get your current location.");
    }
  };

  useEffect(() => {
    if (!location || itineraryPlaces.length === 0) {
      return;
    }

    if (TEST_MODE) {
      setRouteCoordinates([]);
      return;
    }

    createRoute();
  }, [itineraryPlaces.length, location]);

  const createRoute = async () => {
    if (!location) {
      return;
    }

    try {
      const routePoints: RouteCoordinate[] = [
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      ];

      itineraryPlaces.forEach((place) => {
        routePoints.push({
          latitude: place.lat,
          longitude: place.lon,
        });
      });

      console.log("Tracking route points:", routePoints);

      const route = await getRoadRoute(routePoints);

      setRouteCoordinates(route);

      console.log("Tracking route received:", route.length, "points");
    } catch (error) {
      console.log("Tracking route error:", error);
    }
  };

  const mapMarkers = itineraryPlaces
    .map((place, index) => {
      const name = place.tags?.name || "Unnamed place";

      return `
      L.marker([${place.lat}, ${place.lon}])
        .addTo(map)
        .bindPopup("<b>${index + 1}. ${name}</b>");
    `;
    })
    .join("\n");

  const routeLine =
    routeCoordinates.length > 1
      ? `
      L.polyline(
        ${JSON.stringify(
          routeCoordinates.map((point) => [point.latitude, point.longitude]),
        )},
        {
          color: "#173F5F",
          weight: 5
        }
      ).addTo(map);
    `
      : "";
  const mapLatitude = location?.coords.latitude || 26.7509;

  const mapLongitude = location?.coords.longitude || 94.2037;

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
          width: 100%;
          height: 100%;
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
          [${mapLatitude}, ${mapLongitude}],
          14
        );

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              "&copy; OpenStreetMap contributors"
          }
        ).addTo(map);

        L.marker([
          ${mapLatitude},
          ${mapLongitude}
        ])
          .addTo(map)
          .bindPopup("<b>You are here</b>");

        ${mapMarkers}

        ${routeLine}
      </script>
    </body>
  </html>
`;
  const minutes = Math.floor(remainingSeconds / 60);

  const seconds = remainingSeconds % 60;
  const returnWarning =
    returnTime > 0 && remainingSeconds <= (returnTime + 5) * 60;

  const nextStop =
    itineraryPlaces.length > currentStopIndex
      ? itineraryPlaces[currentStopIndex]
      : null;

  // 👇 PASTE THE NEW useEffect HERE
  useEffect(() => {
    if (
      !location ||
      !nextStop ||
      tripStatus !== "travelling" ||
      arrivedAtStop
    ) {
      return;
    }

    const distanceToStop = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      nextStop.lat,
      nextStop.lon,
    );

    console.log("Distance to next stop:", distanceToStop.toFixed(3), "km");

    const arrivalThreshold = 0.05; // 50 meters

    if (distanceToStop <= arrivalThreshold) {
      setArrivedAtStop(true);
      setTripStatus("visiting");

      const visitTime = nextStop.visitTime || 10;

      setVisitRemainingSeconds(visitTime * 60);

      Alert.alert(
        "📍 You've arrived!",
        `You have reached ${nextStop.tags?.name || "your next stop"}.`,
      );

      console.log("Arrived at:", nextStop.tags?.name);

      console.log("Visit time:", visitTime, "minutes");
    }
  }, [location, nextStop, tripStatus, arrivedAtStop]);

  useEffect(() => {
    if (tripStatus !== "visiting" || visitRemainingSeconds > 0) {
      return;
    }

    console.log("Visit time finished for:", nextStop?.tags?.name);

    // Last stop
    if (currentStopIndex >= itineraryPlaces.length - 1) {
      setTripStatus("completed");
      setArrivedAtStop(false);

      Alert.alert(
        "Yayy Trip complete!",
        "You've completed all the stops from your plan.",
      );

      return;
    }

    // There is another stop
    setCurrentStopIndex((previousIndex) => previousIndex + 1);

    setArrivedAtStop(false);

    setTripStatus("travelling");

    console.log("Travelling to next stop...");
  }, [
    visitRemainingSeconds,
    tripStatus,
    currentStopIndex,
    itineraryPlaces.length,
    nextStop,
  ]);

  const transportName =
    transport === "biking"
      ? "🚲 Biking"
      : transport === "transit"
        ? "🚌 Transit"
        : "🚶 Walking";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Active Journey</Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>
          {tripStatus === "travelling"
            ? "🚶 TRAVELLING"
            : tripStatus === "visiting"
              ? "📍 VISITING"
              : "✅ COMPLETED"}
        </Text>
      </View>

      <Text style={styles.statusDescription}>
        {tripStatus === "travelling"
          ? `Heading to ${nextStop?.tags?.name || "your next stop"}`
          : tripStatus === "visiting"
            ? `Enjoy your time at ${nextStop?.tags?.name || "this stop"}`
            : "You've completed all your planned stops."}
      </Text>

      <View style={styles.timerCircle}>
        <Text style={styles.timerLabel}>TIME REMAINING</Text>

        <Text style={styles.timer}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>
        {tripStatus === "visiting" && (
          <Text style={styles.visitTimer}>
            Visit: {Math.floor(visitRemainingSeconds / 60)}:
            {(visitRemainingSeconds % 60).toString().padStart(2, "0")}
          </Text>
        )}

        <Text style={styles.transport}>{transportName}</Text>
      </View>

      <View style={styles.nextStopCard}>
        <Text style={styles.nextStopLabel}>
          {tripStatus === "travelling"
            ? "NEXT STOP"
            : tripStatus === "visiting"
              ? "CURRENT STOP"
              : "TRIP COMPLETE"}
        </Text>

        <Text style={styles.nextStopName}>
          {tripStatus === "completed"
            ? "You've finished your Local Hour 🎉"
            : nextStop?.tags?.name || "No stops"}
        </Text>

        <Pressable
          style={styles.endTripButton}
          onPress={async () => {
            await cancelTripNotifications();
            router.replace("/");
          }}
        >
          <Text style={styles.endTripButtonText}>END TRIP</Text>
        </Pressable>

        {tripStatus === "travelling" && nextStop && (
          <Text style={styles.nextStopInfo}>
            {nextStop.travelTime || 0} min away · {nextStop.visitTime || 0} min
            visit
          </Text>
        )}

        {tripStatus === "visiting" && nextStop && (
          <Text style={styles.nextStopInfo}>
            Visit time remaining: {Math.floor(visitRemainingSeconds / 60)} min{" "}
            {(visitRemainingSeconds % 60).toString().padStart(2, "0")} sec
          </Text>
        )}
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {tripStatus === "completed"
            ? "All stops completed"
            : `Stop ${Math.min(
                currentStopIndex + 1,
                itineraryPlaces.length,
              )} of ${itineraryPlaces.length}`}
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  tripStatus === "completed"
                    ? "100%"
                    : itineraryPlaces.length > 0
                      ? `${(currentStopIndex / itineraryPlaces.length) * 100}%`
                      : "0%",
              },
            ]}
          />
        </View>
      </View>

      {/* COMPLETION CARD */}
      {tripStatus === "completed" && (
        <View style={styles.completionCard}>
          <Text style={styles.completionEmoji}>🎉</Text>

          <Text style={styles.completionTitle}>Local Hour Complete!</Text>

          <Text style={styles.completionText}>
            You made the most of your available time.
          </Text>

          <Text style={styles.completionStats}>
            {itineraryPlaces.length}{" "}
            {itineraryPlaces.length === 1 ? "stop" : "stops"} completed
          </Text>
        </View>
      )}
      {tripStatus !== "completed" && (
        <View style={styles.mapContainer}>
          {location && (
            <WebView
              originWhitelist={["*"]}
              source={{
                html: `
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
                    width: 100%;
                    height: 100%;
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
                    [${location.coords.latitude}, ${location.coords.longitude}],
                    14
                  );

                  L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                      maxZoom: 19,
                      attribution: "&copy; OpenStreetMap contributors"
                    }
                  ).addTo(map);

                  L.marker([
                    ${location.coords.latitude},
                    ${location.coords.longitude}
                  ])
                    .addTo(map)
                    .bindPopup("<b>You are here</b>");

                  ${itineraryPlaces
                    .map(
                      (place, index) => `
                        L.marker([${place.lat}, ${place.lon}])
                          .addTo(map)
                          .bindPopup(
                            "<b>${index + 1}. ${
                              place.tags?.name || "Unnamed place"
                            }</b>"
                          );
                      `,
                    )
                    .join("\n")}

                  ${
                    routeCoordinates.length > 1
                      ? `
                        L.polyline(
                          ${JSON.stringify(
                            routeCoordinates.map((point) => [
                              point.latitude,
                              point.longitude,
                            ]),
                          )},
                          {
                            color: "#173F5F",
                            weight: 5
                          }
                        ).addTo(map);
                      `
                      : ""
                  }
                </script>
              </body>
            </html>
          `,
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={styles.map}
            />
          )}
        </View>
      )}

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>
          {returnWarning ? "🚨 RETURN NOW" : "⚠️ RETURN ALERT"}
        </Text>

        <Text style={styles.warningText}>
          {returnWarning
            ? `You may not have enough time to return. Estimated return time: ${returnTime} min.`
            : `You have about ${returnTime} min to return to your starting point.`}
        </Text>
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => {
          router.back();
        }}
      >
        <Text style={styles.backButtonText}>← BACK TO ITINERARY</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF6FA",
  },
  contentContainer: {
    paddingBottom: 30,
    padding: 18,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#173F5F",
    textAlign: "center",
    marginBottom: 15,
  },

  timerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FFFFFF",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 9,
    borderColor: "#173F5F",
  },

  timerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#596773",
  },

  timer: {
    fontSize: 38,
    fontWeight: "900",
    color: "#12263A",
    marginVertical: 3,
  },

  transport: {
    fontSize: 13,
    color: "#173F5F",
    fontWeight: "600",
  },

  nextStopCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
    marginTop: 15,
  },

  nextStopLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#596773",
  },

  nextStopName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#173F5F",
    marginTop: 3,
  },

  nextStopInfo: {
    fontSize: 12,
    color: "#596773",
    marginTop: 3,
  },

  mapContainer: {
    height: 220,
    marginTop: 12,
    borderRadius: 15,
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },

  numberMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#173F5F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  numberMarkerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  warningCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 13,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#C9DDE5",
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#173F5F",
  },

  warningText: {
    fontSize: 11,
    color: "#596773",
    marginTop: 4,
    lineHeight: 16,
  },

  backButton: {
    alignItems: "center",
    paddingVertical: 9,
  },

  backButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#596773",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  progressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#173F5F",
    marginBottom: 7,
  },

  progressBar: {
    height: 7,
    backgroundColor: "#E1EDF1",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#173F5F",
    borderRadius: 10,
  },
  statusBadge: {
    alignSelf: "center",
    backgroundColor: "#E1F1F7",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 10,
  },

  statusText: {
    color: "#173F5F",
    fontSize: 14,
    fontWeight: "800",
  },

  statusDescription: {
    textAlign: "center",
    color: "#5B6B75",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 15,
  },
  visitTimer: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#173F5F",
  },
  completionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    marginTop: 15,
  },

  completionEmoji: {
    fontSize: 45,
    marginBottom: 10,
  },

  completionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#173F5F",
    textAlign: "center",
  },

  completionText: {
    fontSize: 15,
    color: "#5B6B75",
    textAlign: "center",
    marginTop: 8,
  },

  completionStats: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173F5F",
    marginTop: 15,
  },
  endTripButton: {
    marginTop: 18,
    alignItems: "center",
  },

  endTripButtonText: {
    color: "#173F5F",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
