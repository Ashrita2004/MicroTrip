import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { calculateDistance } from "../services/distance";
import { buildItinerary } from "../services/itinerary";
import { getNearbyPlaces, Place } from "../services/overpass";
import { getVisitTime } from "../services/placeTime";
import { getRoadRoute, RouteCoordinate } from "../services/Routing";
import { calculateTravelTime } from "../services/travelTime";

export default function ResultsScreen() {
  console.log("RESULTS SCREEN IS RUNNING");
  const { time, vibes, mood, preferences, transport, buffer } =
    useLocalSearchParams<{
      time?: string;
      vibes?: string;
      mood?: string;
      preferences?: string;
      transport?: string;
      buffer?: string;
    }>();

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const [places, setPlaces] = useState<Place[]>([]);
  const [itinerary, setItinerary] = useState<any>(null);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [tripConfirmed, setTripConfirmed] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(
    [],
  );

  const screenHeight = 800;

  const collapsedPosition = screenHeight * 0.6;
  const expandedPosition = screenHeight * 0.1;

  const sheetY = useRef(new Animated.Value(collapsedPosition)).current;

  const startY = useRef(collapsedPosition);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },

      onPanResponderGrant: () => {
        // for remembering where the sheet was when the finger touched it
        startY.current = (sheetY as any).__getValue();
      },

      onPanResponderMove: (_, gestureState) => {
        let newY = startY.current + gestureState.dy;

        // Upper limit
        if (newY < expandedPosition) {
          newY = expandedPosition;
        }

        // Lower limit
        if (newY > collapsedPosition) {
          newY = collapsedPosition;
        }

        sheetY.setValue(newY);
      },

      onPanResponderRelease: (_, gestureState) => {
        const currentY = (sheetY as any).__getValue();

        const midpoint = (expandedPosition + collapsedPosition) / 2;

        let finalPosition;

        if (gestureState.vy < -0.5) {
          // Fast swipe towards up
          finalPosition = expandedPosition;
        } else if (gestureState.vy > 0.5) {
          // Fast swipe towards down
          finalPosition = collapsedPosition;
        } else {
          // else snap to whichever position is closer
          finalPosition =
            currentY < midpoint ? expandedPosition : collapsedPosition;
        }

        startY.current = finalPosition;

        Animated.spring(sheetY, {
          toValue: finalPosition,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

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
    const itinerary = buildItinerary(
      placesWithDistance,
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      Number(time) || 30,
      transport || "walking",
      typeof vibes === "string" ? vibes.split(",") : [],
      buffer === "true",
    );
    setItinerary(itinerary);
    console.log("GENERATED ITINERARY:", itinerary);

    console.log("Trip places:", placesWithDistance);
  };
  const replaceStop = (newPlace: any) => {
    if (!itinerary || replaceIndex === null || !location) {
      return;
    }

    const index = replaceIndex;

    // Creates a copy of the current itinerary
    const updatedPlaces = [...itinerary.places];

    // it replaces the selected stop
    updatedPlaces[index] = {
      ...newPlace,
      visitTime: getVisitTime(
        newPlace.tags?.amenity === "cafe"
          ? "cafe"
          : newPlace.tags?.leisure === "park"
            ? "park"
            : newPlace.tags?.tourism === "museum"
              ? "museum"
              : "attraction",
      ),
    };

    // for route recalculation

    let currentLat = location.coords.latitude;

    let currentLon = location.coords.longitude;

    let totalTravelTime = 0;
    let totalVisitTime = 0;

    const recalculatedPlaces = updatedPlaces.map((place: any) => {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        place.lat,
        place.lon,
      );

      const travelTime = calculateTravelTime(
        distance,
        (transport as "walking" | "biking" | "transit") || "walking",
      );

      totalTravelTime += travelTime;
      totalVisitTime += place.visitTime;

      currentLat = place.lat;
      currentLon = place.lon;

      return {
        ...place,
        distance,
        travelTime,
      };
    });

    const availableTime = Number(time);

    // calculates extra time
    const currentTotalTime = totalTravelTime + totalVisitTime;

    let extraTime = availableTime - currentTotalTime;

    extraTime = Math.max(0, extraTime);

    // redistributes extra time

    let remainingExtraTime = extraTime;

    const finalPlaces = [...recalculatedPlaces];

    while (remainingExtraTime > 0) {
      let timeAdded = false;

      for (let i = 0; i < finalPlaces.length; i++) {
        if (remainingExtraTime <= 0) {
          break;
        }

        const place = finalPlaces[i];

        // Maximum visit time
        let maxVisitTime = 30;

        if (place.tags?.amenity === "cafe") {
          maxVisitTime = 30;
        } else if (place.tags?.leisure === "park") {
          maxVisitTime = 30;
        } else if (place.tags?.tourism === "museum") {
          maxVisitTime = 45;
        } else if (place.tags?.tourism === "attraction") {
          maxVisitTime = 30;
        }

        const availableForPlace = maxVisitTime - place.visitTime;

        if (availableForPlace > 0) {
          const addition = Math.min(5, availableForPlace, remainingExtraTime);

          finalPlaces[i] = {
            ...place,
            visitTime: place.visitTime + addition,
          };

          remainingExtraTime -= addition;

          timeAdded = true;
        }
      }

      // Safety purpose
      if (!timeAdded) {
        break;
      }
    }

    const finalTotalTime = finalPlaces.reduce(
      (total: number, place: any) => total + place.travelTime + place.visitTime,
      0,
    );

    const finalRemainingTime = availableTime - finalTotalTime;

    setItinerary({
      ...itinerary,
      places: finalPlaces,
      totalTime: finalTotalTime,
      remainingTime: Math.max(0, finalRemainingTime),
    });

    console.log("Replaced stop:", newPlace.tags?.name);

    console.log("Recalculated itinerary:", finalPlaces);

    console.log("New total time:", finalTotalTime, "minutes");

    console.log("Remaining time:", finalRemainingTime, "minutes");

    // for closing replacement panel
    setReplaceIndex(null);
  };

  const removeStop = (index: number) => {
    if (!itinerary || !location) return;

    // Removes selected stop
    const updatedPlaces = itinerary.places.filter(
      (_place: any, placeIndex: number) => placeIndex !== index,
    );

    // If no stops remain
    if (updatedPlaces.length === 0) {
      setItinerary({
        ...itinerary,
        places: [],
        totalTime: 0,
        remainingTime: Number(time),
        missingVibes: itinerary.missingVibes || [],
      });

      return;
    }

    // Start from my location
    let currentLat = location.coords.latitude;
    let currentLon = location.coords.longitude;

    let totalTravelTime = 0;
    let totalVisitTime = 0;

    // Recalculate travel times
    const recalculatedPlaces = updatedPlaces.map((place: any) => {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        place.lat,
        place.lon,
      );

      const travelTime = calculateTravelTime(
        distance,
        (transport as "walking" | "biking" | "transit") || "walking",
      );

      totalTravelTime += travelTime;
      totalVisitTime += place.visitTime;

      currentLat = place.lat;
      currentLon = place.lon;

      return {
        ...place,
        distance,
        travelTime,
      };
    });

    const availableTime = Number(time);

    // Time currently being used
    const currentTotalTime = totalTravelTime + totalVisitTime;

    // Extra time created by removing the stop
    let extraTime = availableTime - currentTotalTime;

    extraTime = Math.max(0, extraTime);

    let remainingExtraTime = extraTime;

    const finalPlaces = [...recalculatedPlaces];

    // Give extra time in small chunks instead of giving everything to the first stop
    while (remainingExtraTime > 0) {
      let timeAdded = false;

      for (let i = 0; i < finalPlaces.length; i++) {
        if (remainingExtraTime <= 0) {
          break;
        }

        const place = finalPlaces[i];

        let maxVisitTime = 30;

        if (place.tags?.amenity === "cafe") {
          maxVisitTime = 30;
        } else if (place.tags?.leisure === "park") {
          maxVisitTime = 30;
        } else if (place.tags?.tourism === "museum") {
          maxVisitTime = 45;
        } else if (place.tags?.tourism === "attraction") {
          maxVisitTime = 30;
        }

        const availableForPlace = maxVisitTime - place.visitTime;

        if (availableForPlace > 0) {
          const addition = Math.min(5, availableForPlace, remainingExtraTime);

          finalPlaces[i] = {
            ...place,
            visitTime: place.visitTime + addition,
          };

          remainingExtraTime -= addition;
          timeAdded = true;
        }
      }

      // for preventing infinite loop
      if (!timeAdded) {
        break;
      }
    }

    // Calculates final total
    const finalTotalTime = finalPlaces.reduce(
      (total: number, place: any) => total + place.travelTime + place.visitTime,
      0,
    );

    const finalRemainingTime = availableTime - finalTotalTime;

    setItinerary({
      ...itinerary,
      places: finalPlaces,
      totalTime: finalTotalTime,
      remainingTime: Math.max(0, finalRemainingTime),
    });

    console.log("Removed stop:", itinerary.places[index]?.tags?.name);

    console.log("Updated itinerary:", finalPlaces);

    console.log("New total time:", finalTotalTime, "minutes");

    console.log("Remaining time:", finalRemainingTime, "minutes");
  };
  const confirmTrip = async () => {
    if (!itinerary || !location) {
      return;
    }

    try {
      console.log("Confirming trip...");

      // Start with the user's current location
      const routePoints: RouteCoordinate[] = [
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      ];

      // Add every itinerary stop
      itinerary.places.forEach((place: any) => {
        routePoints.push({
          latitude: place.lat,
          longitude: place.lon,
        });
      });

      console.log("Route points:", routePoints);

      // Ask OSRM for the actual road route
      const route = await getRoadRoute(routePoints);

      setRouteCoordinates(route);

      setTripConfirmed(true);

      console.log("Route received:", route.length, "points");
    } catch (error) {
      console.log("Route error:", error);

      Alert.alert(
        "Couldn't create route",
        "We couldn't create the route right now. Please try again.",
      );
    }
  };
  const mapPlaces = tripConfirmed ? itinerary?.places || [] : places;

  const mapMarkers = mapPlaces
    .map((place: any, index: number) => {
      const name = escapeHtml(place.tags?.name || "Unnamed place");

      if (tripConfirmed) {
        return `
        L.marker([${place.lat}, ${place.lon}])
          .addTo(map)
          .bindPopup("<b>${index + 1}. ${name}</b>");
      `;
      }

      const type = escapeHtml(
        place.tags?.amenity ||
          place.tags?.tourism ||
          place.tags?.leisure ||
          "Place",
      );

      return `
      L.marker([${place.lat}, ${place.lon}])
        .addTo(map)
        .bindPopup("<b>${name}</b><br/>${type}");
    `;
    })
    .join("\n");

  const routeLine =
    tripConfirmed && routeCoordinates.length > 1
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

  const mapLatitude = location?.coords.latitude;
  const mapLongitude = location?.coords.longitude;

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
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {location ? (
          <WebView
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={styles.map}
          />
        ) : (
          <View style={styles.mapLoading}>
            <Text>Getting your location...</Text>
          </View>
        )}
      </View>
      <Animated.View
        style={[
          styles.detailsContainer,
          {
            transform: [{ translateY: sheetY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandle} />

        <ScrollView
          style={styles.detailsContent}
          contentContainerStyle={styles.detailsContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Your Personalized Local Planner</Text>

          <Text style={styles.subtitle}>
            {time} min · {transport}
          </Text>

          {itinerary?.missingVibes?.length > 0 && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                We couldn't fit all your vibes
              </Text>

              <Text style={styles.warningText}>
                We couldn't fit {itinerary.missingVibes.join(" & ")} within your
                available time.
              </Text>

              <Text style={styles.warningHint}>
                💡 Try different transport or increase your available time.
              </Text>
            </View>
          )}

          {itinerary?.places.map((place: any, index: number) => (
            <View style={styles.tripCard} key={place.id}>
              <Text style={styles.placeTitle}>
                {index + 1}. {place.tags?.name || "Unnamed place"}
              </Text>

              <Text style={styles.placeInfo}>
                {transport === "walking"
                  ? "🚶"
                  : transport === "biking"
                    ? "🚲"
                    : "🚌"}{" "}
                {place.travelTime} min travel · {place.visitTime} min visit
              </Text>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.saveButton}
                  onPress={() => {
                    const placeName = place.tags?.name || "";

                    setSavedPlaces((current) =>
                      current.includes(placeName)
                        ? current.filter((name) => name !== placeName)
                        : [...current, placeName],
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      savedPlaces.includes(place.tags?.name || "") &&
                        styles.savedButtonText,
                    ]}
                  >
                    {savedPlaces.includes(place.tags?.name || "")
                      ? "♥ Saved"
                      : "♡ Save"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.replaceButton}
                  onPress={() => setReplaceIndex(index)}
                >
                  <Text style={styles.replaceButtonText}>✕ Replace</Text>
                </Pressable>

                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeStop(index)}
                >
                  <Text style={styles.removeButtonText}> Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {replaceIndex !== null && (
            <View style={styles.replacePanel}>
              <Text style={styles.replaceTitle}>Replace this stop</Text>

              <Text style={styles.replaceSubtitle}>
                Choose another nearby place
              </Text>

              <ScrollView
                style={styles.replacementScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {places
                  .filter(
                    (candidate) =>
                      !itinerary.places.some(
                        (item: any) => item.id === candidate.id,
                      ),
                  )
                  .slice(0, 10)
                  .map((candidate) => (
                    <Pressable
                      key={candidate.id}
                      style={styles.replacementOption}
                      onPress={() => {
                        replaceStop(candidate);
                      }}
                    >
                      <Text style={styles.replacementName}>
                        {candidate.tags?.name || "Unnamed place"}
                      </Text>

                      <Text style={styles.replacementInfo}>
                        {location
                          ? calculateDistance(
                              location.coords.latitude,
                              location.coords.longitude,
                              candidate.lat,
                              candidate.lon,
                            ).toFixed(1)
                          : "?"}{" "}
                        km away
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>

              <Pressable
                style={styles.cancelReplaceButton}
                onPress={() => setReplaceIndex(null)}
              >
                <Text style={styles.cancelReplaceText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          {tripConfirmed ? (
            <View style={styles.confirmedTripContainer}>
              <View style={styles.localHourHeader}>
                <Text style={styles.localHourTitle}>LesssGo</Text>

                <Text style={styles.localHourSubtitle}>
                  {itinerary?.totalTime ?? 0} mins ·{" "}
                  {transport === "biking"
                    ? "Biking"
                    : transport === "transit"
                      ? "Transit"
                      : "Walking"}
                </Text>

                <Text style={styles.localHourVibes}>
                  {vibes ? vibes.replace(/,/g, " + ") : "Your selected vibes"}
                </Text>
              </View>

              {itinerary?.places.map((place: any, index: number) => (
                <View key={place.id} style={styles.itineraryStop}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.stopDetails}>
                    <Text style={styles.stopName}>
                      {place.tags?.name || "Unnamed place"}
                    </Text>

                    <Text style={styles.stopInfo}>
                      {place.travelTime} min · {place.visitTime} min visit
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.tripSummary}>
                <Text style={styles.summaryText}>
                  Total time: {itinerary?.totalTime ?? 0} minutes
                </Text>

                <Text style={styles.summaryText}>
                  Remaining: {itinerary?.remainingTime ?? 0} minutes
                </Text>
              </View>

              <Pressable
                style={styles.startTripButton}
                onPress={() => {
                  console.log("Starting trip...");

                  router.push({
                    pathname: "/tracking",
                    params: {
                      totalTime: itinerary?.totalTime?.toString() || "30",
                      transport: transport || "walking",
                      places: JSON.stringify(itinerary?.places || []),
                    },
                  });
                }}
              >
                <Text style={styles.startTripText}>▶ START TRIP</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.total}>
                Total trip: {itinerary?.totalTime ?? 0} minutes
              </Text>

              <Pressable style={styles.confirmTripButton} onPress={confirmTrip}>
                <Text style={styles.confirmTripText}>✓ CONFIRM MY TRIP</Text>
              </Pressable>

              <Pressable
                style={styles.changePlanButton}
                onPress={() => {
                  setTripConfirmed(false);
                  router.back();
                }}
              >
                <Text style={styles.changePlanText}>↻ CHANGE MY PLAN</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF6FA",
  },

  mapContainer: {
    flex: 1,
  },

  map: {
    width: "100%",
    height: "100%",
  },

  detailsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "90%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  detailsContent: {
    flex: 1,
  },

  detailsContentContainer: {
    padding: 18,
    paddingBottom: 60,
  },

  dragHandle: {
    width: 45,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#C9DDE5",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#173F5F",
  },

  subtitle: {
    fontSize: 14,
    color: "#596773",
    marginTop: 4,
    marginBottom: 12,
  },

  tripCard: {
    backgroundColor: "#EAF6FA",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  placeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#173F5F",
  },

  placeInfo: {
    fontSize: 12,
    color: "#596773",
    marginTop: 3,
  },

  total: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173F5F",
    marginTop: 3,
  },
  warningCard: {
    backgroundColor: "#FFF7E6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8A5A00",
    marginBottom: 4,
  },

  warningText: {
    fontSize: 12,
    color: "#6B5A3A",
    lineHeight: 18,
  },

  warningHint: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A5A00",
    marginTop: 5,
  },
  changePlanButton: {
    backgroundColor: "#173F5F",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },

  changePlanText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginTop: 10,
    gap: 18,
  },

  saveButton: {
    paddingVertical: 5,
  },

  saveButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#596773",
  },

  replaceButton: {
    paddingVertical: 5,
  },

  replaceButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B04A4A",
  },
  replacePanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#C9DDE5",
  },

  replaceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#173F5F",
  },

  replaceSubtitle: {
    fontSize: 12,
    color: "#596773",
    marginTop: 3,
    marginBottom: 10,
  },

  replacementOption: {
    backgroundColor: "#EAF6FA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
  },

  replacementName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173F5F",
  },

  replacementInfo: {
    fontSize: 11,
    color: "#596773",
    marginTop: 2,
  },
  replacementScroll: {
    maxHeight: 220,
  },
  cancelReplaceButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 3,
  },

  cancelReplaceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#596773",
  },
  removeButton: {
    flex: 0.4,
    borderColor: "#D9A6A6",
    borderRadius: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  removeButtonText: {
    color: "#9B3D3D",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmTripButton: {
    backgroundColor: "#173F5F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },

  confirmTripText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
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
  confirmedTripContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginTop: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D5E6ED",
  },

  localHourHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EEF2",
  },
  savedButtonText: {
    color: "red",
  },
  localHourTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#173F5F",
  },

  localHourSubtitle: {
    fontSize: 13,
    color: "#596773",
    marginTop: 5,
  },

  localHourVibes: {
    fontSize: 13,
    fontWeight: "600",
    color: "#173F5F",
    marginTop: 3,
  },

  itineraryStop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EFF2",
  },

  stopNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#173F5F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  stopNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  stopDetails: {
    flex: 1,
  },

  stopName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#12263A",
  },

  stopInfo: {
    fontSize: 12,
    color: "#596773",
    marginTop: 3,
  },

  tripSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EAF6FA",
    padding: 12,
    margin: 12,
    borderRadius: 12,
  },

  summaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#173F5F",
  },

  startTripButton: {
    backgroundColor: "#173F5F",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },

  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF4F8",
  },
  startTripText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
