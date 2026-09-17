import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { savePlan } from "../../services/Storetheplan";

export default function HomeScreen() {
  const [time, setTime] = useState(60);

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const [selectedMood, setSelectedMood] = useState<string[]>([]);

  const [preferences, setPreferences] = useState<string[]>([]);

  const [transport, setTransport] = useState("walking");

  const [includeBuffer, setIncludeBuffer] = useState(false);

  const [showCustomVibe, setShowCustomVibe] = useState(false);

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((item) => item !== vibe));
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };
  const toggleMood = (mood: string) => {
    if (selectedMood.includes(mood)) {
      setSelectedMood(selectedMood.filter((item) => item !== mood));
    } else {
      setSelectedMood([...selectedMood, mood]);
    }
  };
  const togglePreference = (preference: string) => {
    if (preferences.includes(preference)) {
      setPreferences(preferences.filter((item) => item !== preference));
    } else {
      setPreferences([...preferences, preference]);
    }
  };
  const planTrip = async () => {
    const tripRequest = {
      timeBudget: time,
      vibes: selectedVibes,
      mood: selectedMood,
      preferences: preferences,
      transport: transport,
      includeBuffer: includeBuffer,
    };

    console.log("Trip Request:", tripRequest);

    const savedPlan = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      timeBudget: time,
      vibes: selectedVibes,
      mood: selectedMood,
      preferences: preferences,
      transport: transport,
      includeBuffer: includeBuffer,
    };

    await savePlan(savedPlan);

    router.push({
      pathname: "/results",
      params: {
        time: time.toString(),
        vibes: selectedVibes.join(","),
        mood: selectedMood.join(","),
        preferences: preferences.join(","),
        transport: transport,
        buffer: includeBuffer.toString(),
      },
    });
  };
  return (
    <ScrollView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.menuIcon}> </Text>

        <Text style={styles.headerTitle}>Home</Text>

        <Text style={styles.notificationIcon}> </Text>
      </View>

      {/* App Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.appTitle}>Your Local Hour</Text>

        <Text style={styles.tagline}>Make the most of the time you have.</Text>
      </View>

      {/* Available Time */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Time</Text>
          {/* Buffer Section */}

          <Pressable onPress={() => setIncludeBuffer(!includeBuffer)}>
            <Text style={styles.bufferText}>
              {" "}
              Buffer: {includeBuffer ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.timeText}>{time} minutes</Text>

        {/* Fake Slider - We will make it functional later 
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack} />

          <View style={styles.sliderProgress} />

          <View style={styles.sliderCircle} />
        </View>*/}

        <Slider
          style={styles.timeSlider}
          minimumValue={15}
          maximumValue={120}
          step={5}
          value={time}
          onValueChange={(value) => setTime(value)}
          minimumTrackTintColor="#173F5F"
          maximumTrackTintColor="#C9DDE5"
          thumbTintColor="#173F5F"
        />

        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>15m</Text>
          <Text style={styles.timeLabel}>60m</Text>
          <Text style={styles.timeLabel}>120m</Text>
        </View>
      </View>

      {/* Explore by Vibe */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore by Vibe</Text>

        <View style={styles.vibeGrid}>
          <VibeCard
            id="coffee"
            icon="☕"
            title="Coffee & Pastry"
            selected={selectedVibes.includes("coffee")}
            onPress={() => toggleVibe("coffee")}
          />

          <VibeCard
            id="river"
            icon="🌊"
            title="Riverfront View"
            selected={selectedVibes.includes("river")}
            onPress={() => toggleVibe("river")}
          />

          <VibeCard
            id="park"
            icon="🌳"
            title="Quick Park Walk"
            selected={selectedVibes.includes("park")}
            onPress={() => toggleVibe("park")}
          />

          <VibeCard
            id="gallery"
            icon="🖼️"
            title="Hidden Gallery"
            selected={selectedVibes.includes("gallery")}
            onPress={() => toggleVibe("gallery")}
          />
        </View>
        {/* Customise button */}

        <Pressable
          style={styles.customVibeButton}
          onPress={() => setShowCustomVibe(!showCustomVibe)}
        >
          <Text style={styles.customVibeText}>＋ CUSTOMISE MY VIBE</Text>
        </Pressable>

        {/* Custom options */}

        {showCustomVibe && (
          <View style={styles.customVibeContainer}>
            <Text style={styles.customTitle}>What mood are you in?</Text>
            {/* Mood options */}
            <View style={styles.optionRow}>
              <CustomOption
                title="Relaxing"
                selected={selectedMood.includes("relaxing")}
                onPress={() => toggleMood("relaxing")}
              />

              <CustomOption
                title="Adventurous"
                selected={selectedMood.includes("adventurous")}
                onPress={() => toggleMood("adventurous")}
              />
            </View>

            <View style={styles.optionRow}>
              <CustomOption
                title="Quiet"
                selected={selectedMood.includes("quiet")}
                onPress={() => toggleMood("quiet")}
              />

              <CustomOption
                title="Social"
                selected={selectedMood.includes("social")}
                onPress={() => toggleMood("social")}
              />
            </View>

            <Text style={styles.customTitle}> What matters to you?</Text>
            {/* Preference options */}
            <View style={styles.optionRow}>
              <CustomOption
                title="Highly Rated"
                selected={preferences.includes("high_rating")}
                onPress={() => togglePreference("high_rating")}
              />

              <CustomOption
                title="Less Crowded"
                selected={preferences.includes("less_crowded")}
                onPress={() => togglePreference("less_crowded")}
              />
            </View>
          </View>
        )}
      </View>

      {/* Transportation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transportation</Text>

        <View style={styles.transportContainer}>
          <TransportCard
            icon="🚶"
            title="Walking"
            selected={transport === "walking"}
            onPress={() => setTransport("walking")}
          />

          <TransportCard
            icon="🚲"
            title="Biking"
            selected={transport === "biking"}
            onPress={() => setTransport("biking")}
          />

          <TransportCard
            icon="🚌"
            title="Transit"
            selected={transport === "transit"}
            onPress={() => setTransport("transit")}
          />
        </View>
      </View>

      {/* Plan Trip Button */}
      <Pressable style={styles.planButton} onPress={planTrip}>
        <Text style={styles.planButtonText}>PLAN MY TRIP</Text>
      </Pressable>
      <Pressable
        style={styles.previousPlansButton}
        onPress={() => router.push("/previous-plans")}
      >
        <Text style={styles.previousPlansButtonText}>PREVIOUS PLANS</Text>
      </Pressable>

      {/* Bottom spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

/* ================================================= */
/* Vibe Card Component                               */
/* ================================================= */

type VibeCardProps = {
  id: string;
  icon: string;
  title: string;
  selected: boolean;
  onPress: () => void;
};

function VibeCard({ id, icon, title, selected, onPress }: VibeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.vibeCard, selected && styles.selectedVibeCard]}
    >
      <Text style={styles.vibeIcon}>{icon}</Text>

      <Text style={styles.vibeTitle}>{title}</Text>
    </Pressable>
  );
}

type CustomOptionProps = {
  title: string;
  selected: boolean;
  onPress: () => void;
};

function CustomOption({ title, selected, onPress }: CustomOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.customOption, selected && styles.selectedCustomOption]}
    >
      <Text
        style={[
          styles.customOptionText,
          selected && styles.selectedCustomOptionText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* ================================================= */
/* Transportation Card Component                    */
/* ================================================= */

type TransportCardProps = {
  icon: string;
  title: string;
  selected: boolean;
  onPress: () => void;
};

function TransportCard({ icon, title, selected, onPress }: TransportCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.transportCard, selected && styles.selectedTransportCard]}
    >
      <Text style={styles.transportIcon}>{icon}</Text>

      <Text style={styles.transportTitle}>{title}</Text>
    </Pressable>
  );
}

/* ================================================= */
/* Styles                                            */
/* ================================================= */

const styles = StyleSheet.create({
  /* ---------- Screen ---------- */

  screen: {
    flex: 1,
    backgroundColor: "#EAF6FB",
  },

  /* ---------- Header ---------- */

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  menuIcon: {
    fontSize: 22,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  notificationIcon: {
    fontSize: 22,
  },

  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bufferText: {
    fontSize: 13,
    color: "#173F5F",
    fontWeight: "700",
  },
  /* ---------- App Title ---------- */

  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#12263A",
  },

  tagline: {
    fontSize: 14,
    color: "#607080",
    marginTop: 5,
  },

  /* ---------- Sections ---------- */

  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#12263A",
    marginBottom: 12,
  },

  timeText: {
    fontSize: 15,
    color: "#394B59",
  },

  /* ---------- Slider ---------- */

  sliderContainer: {
    height: 5,
    justifyContent: "center",
    position: "relative",
  },

  /*sliderTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "#C9DDE5",
    width: "100%",
  },*/

  /* sliderProgress: {
    position: "absolute",
    left: 0,
    height: 5,
    width: "75%",
    borderRadius: 5,
    backgroundColor: "#173F5F",
  },

  sliderCircle: {
    position: "absolute",
    left: "72%",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#173F5F",
  },*/

  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },

  /* ---------- Vibe Cards ---------- */

  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  vibeCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 12,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 2,
  },

  vibeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  vibeTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#243746",
  },

  selectedVibeCard: {
    borderWidth: 2,
    borderColor: "#173F5F",
    backgroundColor: "#E1F1F7",
  },

  /* ---------- Transportation ---------- */

  transportContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  transportCard: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,

    elevation: 2,
  },

  transportIcon: {
    fontSize: 25,
    marginBottom: 5,
  },

  transportTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#243746",
  },

  /* ---------- Plan Button ---------- */

  planButton: {
    marginHorizontal: 20,
    backgroundColor: "#173F5F",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,

    elevation: 3,
  },

  planButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  customVibeButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
  },

  customVibeText: {
    color: "#173F5F",
    fontWeight: "700",
    fontSize: 14,
  },

  customVibeContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginTop: 12,
  },

  customTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12263A",
    marginBottom: 10,
  },

  optionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  customOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C9DDE5",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  selectedCustomOption: {
    backgroundColor: "#E1F1F7",
    borderColor: "#173F5F",
  },

  customOptionText: {
    fontSize: 13,
    color: "#394B59",
  },

  selectedCustomOptionText: {
    color: "#173F5F",
    fontWeight: "700",
  },

  timeLabel: {
    fontSize: 13,
    color: "#394B59",
  },
  selectedTransportCard: {
    borderWidth: 2,
    borderColor: "#173F5F",
    backgroundColor: "#E1F1F7",
  },
  previousPlansButton: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#173F5F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 30,
  },

  previousPlansButtonText: {
    color: "#173F5F",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timeSlider: {
    width: "100%",
    height: 40,
    marginTop: 5,
  },
});
