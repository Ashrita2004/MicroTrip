# MicroTrip

**Have little time? Don't know where to go?**

We've all had those moments like a free hour between work, before heading home, or while waiting for someone, but no clear idea what to do with it.

What if an app could simply ask **how much time you have, what you're in the mood for, and how you want to travel**, and then create a realistic mini-itinerary around it?

**MicroTrip** is a prototype built to address this problem by creating time-aware local itineraries based on the user's available time, preferences, location and transportation mode.

---

## Key Features

- **Time-aware itinerary planning** based on available time
- **Nearby place discovery** using real-world map data
- **Greedy, score-based itinerary selection algorithm** that ranks locations based on vibe match, proximity, travel time, visit duration and available time, then selects the highest-scoring feasible place
- **Route and travel-time estimation** using OSRM
- **Live trip tracking** with real-time location updates
- **Return-time notifications** to help users stay on schedule
- **Save and reuse previous trip plans**

---

## How It Works

MicroTrip follows a time-constrained itinerary generation pipeline:

```text
User Input
    ↓
Current Location
    ↓
Nearby POI Discovery
    ↓
Distance & Travel Time Estimation
    ↓
Visit Time Estimation
    ↓
Location Scoring
    ↓
Greedy Itinerary Selection
    ↓
Time Constrained Itinerary
    ↓
Map, Tracking & Notifications

## How It Works

The user provides:

- Available time
- Interests / vibes
- Mood
- Preferences
- Transport mode
- Buffer preference

The application discovers nearby places, calculates travel and estimated visit times, scores feasible locations, and iteratively selects the highest-scoring option while respecting the available time.

## Example

A user has:

```text
Available time: 45 minutes
Vibes: Coffee + Park
Mood: Relaxing
Preference: Less crowded
Transport: Walking
Buffer: Enabled
```

MicroTrip then:

1. Gets the user's current location
2. Discovers nearby relevant places
3. Calculates approximate travel times
4. Estimates visit duration
5. Filters locations that do not fit the time constraint
6. Scores the feasible locations
7. Builds an ordered itinerary
8. Displays the itinerary on the map
9. Tracks the user's trip
10. Sends return-time notifications

## Maps and Location Services

MicroTrip does not require a Google Maps API key. It uses open and publicly available services:

| Service | Purpose |
|---------|---------|
| [OpenStreetMap](https://www.openstreetmap.org/) | Map and geographic data |
| [Leaflet](https://leafletjs.com/) | Interactive map rendering |
| [Overpass API](https://overpass-api.de/) | Nearby POI discovery |
| [OSRM](https://project-osrm.org/) | Route and travel-time information |
| Device GPS | Current location |

## Tech Stack

### Frontend

- React Native
- Expo
- TypeScript
- Expo Router

### Maps and Location

- OpenStreetMap
- Leaflet
- React Native WebView
- Overpass API
- OSRM

### Storage and Notifications

- AsyncStorage
- Expo Notifications

### Android

- React Native Android
- Expo SDK
- Android Gradle build system
