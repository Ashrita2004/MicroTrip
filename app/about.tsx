import { router } from "expo-router";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AboutScreen() {
  return (
    <ImageBackground
      source={require("../assets/images/about1.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.introQuestion}>
          I only have a little time. What can I realistically do nearby?
        </Text>

        <Text style={styles.description}>
          Hi! I'm Ashrita, and this is{" "}
          <Text style={styles.boldText}>MicroTrip</Text> a prototype designed
          for those moments when you have limited free time, don't know where to
          go but still want to make the most of it.
        </Text>

        <Text style={styles.description}>
          All you need to do is choose the time you have, add some buffer time
          if needed, select your vibe, and choose your mode of transportation.
          MicroTrip then creates a realistic single or multi stop plan that fits
          within your available time.
        </Text>

        <Text style={styles.description}>
          <Text style={styles.boldText}>
            Worried about losing track of time while enjoying your free time?
          </Text>{" "}
          MicroTrip has you covered. It sends a reminder before your planned
          time ends, helping you know when it's time to start heading back.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version</Text>
          <Text style={styles.info}>1.0.0</Text>
        </View>

        <Text style={styles.copyright}>© 2026 Ashrita Lahon</Text>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#173F5F",
  },

  backgroundImage: {
    opacity: 0.2,
    resizeMode: "center",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },

  backButton: {
    marginBottom: 30,
  },

  backText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 18,
  },

  introQuestion: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 32,
    marginBottom: 18,
  },

  description: {
    fontSize: 16,
    color: "#dfe0e0",
    lineHeight: 23,
    marginBottom: 20,
  },

  section: {
    marginTop: 64,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    color: "#bfccd3",
    marginBottom: 6,
  },

  author: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  info: {
    fontSize: 14,
    lineHeight: 24,
    color: "#a3adb3",
  },

  copyright: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 12,
    color: "#A5AFB4",
  },
  boldText: {
    fontWeight: "700",
  },
});
