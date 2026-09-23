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
