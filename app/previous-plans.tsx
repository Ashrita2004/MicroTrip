import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { deletePlan, getSavedPlans, SavedPlan } from "../services/Storetheplan";

export default function PreviousPlans() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);

  const loadPlans = async () => {
    const savedPlans = await getSavedPlans();
    setPlans(savedPlans);
  };

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, []),
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete Plan", "Are you sure you want to delete this plan?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePlan(id);
          loadPlans();
        },
      },
    ]);
  };

  const handleReuse = (plan: SavedPlan) => {
    router.push({
      pathname: "/results",
      params: {
        time: plan.timeBudget.toString(),
        vibes: plan.vibes.join(","),
        mood: plan.mood.join(","),
        preferences: plan.preferences.join(","),
        transport: plan.transport,
        buffer: plan.includeBuffer.toString(),
      },
    });
  };

  const getPlanTitle = (plan: SavedPlan) => {
    if (plan.vibes.length === 0) {
      return "Custom Trip";
    }

    return plan.vibes
      .map((vibe) => {
        if (vibe === "coffee") return "Coffee";
        if (vibe === "park") return "Park";
        if (vibe === "river") return "River";
        if (vibe === "gallery") return "Gallery";
        if (vibe === "attraction") return "Attraction";

        return vibe;
      })
      .join(" + ");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Previous Plans</Text>

        <View style={{ width: 30 }} />
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🕘</Text>

          <Text style={styles.emptyTitle}>No previous plans yet</Text>

          <Text style={styles.emptyText}>
            Your saved trip plans will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>Reuse a plan you enjoyed before.</Text>

          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planTopRow}>
                <Text style={styles.planTitle}>{getPlanTitle(plan)}</Text>

                <Pressable onPress={() => handleDelete(plan.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>

              <Text style={styles.planDate}>
                Saved {formatDate(plan.createdAt)}
              </Text>

              <View style={styles.detailsRow}>
                <Text style={styles.detail}>⏱ {plan.timeBudget} min</Text>

                <Text style={styles.detail}>
                  {plan.transport === "walking"
                    ? "🚶 Walking"
                    : plan.transport === "biking"
                      ? "🚲 Biking"
                      : "🚌 Transit"}
                </Text>
              </View>

              {plan.mood.length > 0 && (
                <Text style={styles.extraInfo}>
                  Mood: {plan.mood.join(", ")}
                </Text>
              )}

              {plan.preferences.length > 0 && (
                <Text style={styles.extraInfo}>
                  Preferences: {plan.preferences.join(", ")}
                </Text>
              )}

              <Pressable
                style={styles.reuseButton}
                onPress={() => handleReuse(plan)}
              >
                <Text style={styles.reuseButtonText}>REUSE THIS PLAN</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF6FA",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
  },

  backButton: {
    fontSize: 38,
    color: "#173F5F",
    lineHeight: 38,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#173F5F",
  },

  subtitle: {
    fontSize: 14,
    color: "#5B6B75",
    marginBottom: 15,
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
  },

  planTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  planTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#173F5F",
    flex: 1,
  },

  deleteText: {
    fontSize: 13,
    color: "#B04A4A",
    fontWeight: "600",
  },

  planDate: {
    fontSize: 12,
    color: "#7A8991",
    marginTop: 5,
  },

  detailsRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 15,
  },

  detail: {
    fontSize: 13,
    color: "#394B59",
    fontWeight: "600",
  },

  extraInfo: {
    fontSize: 13,
    color: "#5B6B75",
    marginTop: 8,
  },

  reuseButton: {
    backgroundColor: "#173F5F",
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },

  reuseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 45,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#173F5F",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#5B6B75",
    textAlign: "center",
    marginTop: 8,
  },
});
