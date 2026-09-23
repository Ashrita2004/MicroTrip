import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.createdBy}>Made with ♡ by Ashrita</Text>

      <Text style={styles.copyright}>© 2026 AshritaLahon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  createdBy: {
    marginTop: -78,
    fontSize: 13,
    color: "#8A969C",
    textAlign: "center",
  },

  copyright: {
    marginTop: 5,
    fontSize: 11,
    color: "#A5AFB4",
    textAlign: "center",
  },
});
