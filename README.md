# MicroTrip 🗺️⏱️

Have little time? Don't know where to go?

We've all had those moments like a free hour between work, before heading home, or while waiting for someone, but no clear idea what to do with it.

What if an app could simply ask: **how much time do you have, what are you in the mood for, and how do you want to travel?** and then prepare a realistic mini itinerary around it?

So, I thought of building a prototype **MicroTrip** to address this common problem.

---

## ✨ Key Features

- ⏱️ **Time-aware itinerary planning** based on your available time
- 🧭 **Nearby place discovery** using real-world map data
- 🧠 **Greedy, score-based itinerary selection algorithm** that ranks locations based on vibe match, proximity, travel time, visit duration and available time, then selects the highest-scoring feasible place
- 🚶 **Route & travel-time estimation** using OSRM for realistic planning
- 📍 **Live trip tracking** with real-time location updates
- 🔔 **Return-time notifications** to help you stay on schedule
- 💾 **Save & reuse previous trip plans**

---

## 🧠 How It Works

The application follows a simple pipeline:

\`\`\`text
User Input
    ↓
Current Location
    ↓
Nearby POI Discovery
    ↓
Distance & Travel Time Estimation
    ↓
Place Time Estimation
    ↓
Itinerary Generation
    ↓
Time-Constrained Route
    ↓
Map + Tracking + Notifications
\`\`\`

The user provides:

- Available Time
- Interests / Vibes
- Mood
- Preferences
- Transport Mode
- Buffer Preference

The app then searches for nearby places, scores them, and estimates whether they can realistically fit within the available time — aiming to maximise the experience while respecting the time constraint.

---

## 🎯 Example Trip

Suppose you have:

- **Available time:** 45 minutes
- **Vibes:** Coffee + Park
- **Mood:** Relaxing
- **Preference:** Less crowded
- **Transport:** Walking
- **Buffer:** Enabled

MicroTrip can:

1. Get your current location
2. Search for nearby coffee shops and parks
3. Calculate approximate travel times
4. Estimate time spent at each place
5. Select places that fit the 45-minute budget
6. Create an ordered itinerary
7. Display the plan on the map
8. Track your movement
9. Notify you when it's time to return

---

## 🗺️ Maps & Location Data

MicroTrip does **not** require a Google Maps API key. It uses fully open, free services instead:

- **OpenStreetMap** — map data
- **Leaflet** — interactive map rendering
- **Overpass API** — nearby OpenStreetMap POI discovery
- **OSRM** — route/travel-time information
- **Device GPS** — current location

This allows the project to demonstrate location-based functionality without requiring a paid Google Maps/Places setup.

---

## 🛠️ Built With

**Frontend**
- React Native
- Expo
- TypeScript
- Expo Router

**Location & Maps**
- OpenStreetMap
- Leaflet
- React Native WebView
- Overpass API
- OSRM

**Storage**
- AsyncStorage

**Notifications**
- Expo Notifications

**Android**
- React Native Android
- Expo SDK
- Android Gradle build system

---

## 📂 Project Structure

\`\`\`text
MICROTRIP/
│
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   │
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── map.tsx
│   ├── results.tsx
│   ├── tracking.tsx
│   └── previous-plans.tsx
│
├── assets/
│   └── images/
│       ├── logo.png
│       └── appicon.png
│
├── services/
│   ├── distance.ts
│   ├── itinerary.ts
│   ├── notifications.ts
│   ├── overpass.ts
│   ├── placeTime.ts
│   ├── routeTime.ts
│   ├── Routing.ts
│   ├── Storetheplan.ts
│   └── travelTime.ts
│
├── android/
│
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

---

## 🚀 Running the Project Locally

### Requirements

Make sure you have:

- Node.js
- npm
- Android Studio
- Android SDK
- Java
- Expo CLI / Expo development environment

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Ashrita2004/MicroTrip.git
cd MicroTrip
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Start the development server

\`\`\`bash
npx expo start
\`\`\`

You can then run the application using Expo Go during development.

---

## 📱 Building the Android APK

The project also contains the Android native project and EAS configuration.

**For an EAS build:**

\`\`\`bash
npx eas build -p android
\`\`\`

**For a local Android build:**

\`\`\`bash
npx expo run:android
\`\`\`

Android SDK and Java configuration may be required for local builds.

---

## 📱 Download the App

### Android APK

Download the latest Android release:

👉 **[Download MicroTrip APK](#)**

> Replace the link above with the GitHub Release APK link after creating a release.

The APK can be installed directly on an Android phone without requiring Android Studio or Expo Go.

---

## 🔐 Permissions

The application may request:

- **Location permission** — required for finding nearby places and tracking the trip
- **Notification permission** — required for return-time reminders

---

## ⚠️ API & Data Considerations

This project uses public services such as Overpass API and OSRM.

Because these services are public:

- Requests may occasionally be slow
- A request may temporarily fail
- Results may vary depending on OpenStreetMap data
- Availability is not guaranteed
- Heavy usage should follow the respective service's usage policies

---

## 🔮 Future Improvements

Possible future improvements include:

- More sophisticated itinerary optimisation
- Better crowd-level estimation
- Improved place ranking
- Real road-network travel times for all transport modes
- Offline support
- More detailed place information
- User accounts and cloud-saved plans
- Weather-aware recommendations
- Better route optimisation
- More personalised recommendation models

---

## 💡 Motivation

Traditional trip planners often assume that users have several hours or an entire day available.

MicroTrip focuses on a smaller problem:

> "I only have a little time. What can I realistically do nearby?"

The project combines:

- Location-based discovery
- Time-constrained planning
- Route estimation
- Personal preferences
- Real-time tracking
- Local storage
- Notifications

into a single mobile experience.

---

I'd love for you to try it out!

**Link:** [Your link here]

P.S. The current version is optimized for Android. iOS support is something I'm working on next.
