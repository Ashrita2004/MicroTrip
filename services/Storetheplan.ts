import AsyncStorage from "@react-native-async-storage/async-storage";

const PLANS_KEY = "your_local_hour_plans";

export type SavedPlan = {
  id: string;
  createdAt: string;
  timeBudget: number;
  vibes: string[];
  mood: string[];
  preferences: string[];
  transport: string;
  includeBuffer: boolean;
};

export async function savePlan(plan: SavedPlan) {
  try {
    const existingPlans = await AsyncStorage.getItem(PLANS_KEY);

    const plans: SavedPlan[] = existingPlans ? JSON.parse(existingPlans) : [];

    plans.unshift(plan);

    await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans));

    console.log("Plan saved:", plan);
  } catch (error) {
    console.log("Error saving plan:", error);
  }
}

export async function getSavedPlans(): Promise<SavedPlan[]> {
  try {
    const existingPlans = await AsyncStorage.getItem(PLANS_KEY);

    if (!existingPlans) {
      return [];
    }

    return JSON.parse(existingPlans);
  } catch (error) {
    console.log("Error getting saved plans:", error);
    return [];
  }
}

export async function deletePlan(id: string) {
  try {
    const existingPlans = await AsyncStorage.getItem(PLANS_KEY);

    if (!existingPlans) {
      return;
    }

    const plans: SavedPlan[] = JSON.parse(existingPlans);

    const updatedPlans = plans.filter((plan) => plan.id !== id);

    await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(updatedPlans));

    console.log("Plan deleted:", id);
  } catch (error) {
    console.log("Error deleting plan:", error);
  }
}
