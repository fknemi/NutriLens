// utils/sample-data.ts
import { useAllergensStore } from "@/stores/useAllergensStore";
import { useDietStore } from "@/stores/useDietStore";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";
import { useGoalsStore } from "@/stores/useGoalsStore";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useSleepStore, SleepSession } from "@/stores/useSleepStore";
import { useStepStore } from "@/stores/useStepStore";
import { useUserStore } from "@/stores/useUserStore";
import { useSavedRecipesStore } from "@/stores/useRecipesStore";
import { useActivityStore, ActivityLog } from "@/stores/useActivityStore";
import { useMealsStore } from "@/stores/useMealsStore";
import { useScannedFoodStore, ScannedFood } from "@/stores/useScannedFoodStore";
import { useMeditationStore, MeditationSession } from "@/stores/useMeditationStore";
import { Recipe } from "@/services/recipe-api";

// --- Mock Recipe Generator ---
const createMockRecipe = (id: string, name: string, cals: number, p: number, c: number, f: number): Recipe => ({
  id,
  name,
  description: "A delicious and healthy sample meal.",
  category: "Main Course",
  difficulty: "Easy",
  cuisine: "Global",
  tags: ["healthy"],
  dietary: { flags: ["Vegetarian"], not_suitable_for: [] },
  meta: { active_time: "PT15M", total_time: "PT20M" },
  nutrition: {
    per_serving: { calories: cals, protein_g: p, carbohydrates_g: c, fat_g: f },
  },
  ingredients: [],
});

// --- Mock Scanned Food Generator ---
const createMockScannedFood = (id: string, dateIso: string, name: string, cals: number, p: number, c: number, f: number): ScannedFood => ({
  id,
  scannedAt: dateIso,
  labelText: name,
  servingsConsumed: 1,
  usdaDetails: {
    fdcId: Math.floor(Math.random() * 10000),
    description: name,
    nutrients: [
      { nutrientId: 1, nutrientName: "Energy", unitName: "kcal", value: cals },
      { nutrientId: 2, nutrientName: "Protein", unitName: "g", value: p },
      { nutrientId: 3, nutrientName: "Carbohydrate, by difference", unitName: "g", value: c },
      { nutrientId: 4, nutrientName: "Total lipid (fat)", unitName: "g", value: f },
    ],
  },
});

export const fillWithSampleData = () => {
  const now = new Date();
  const todayISO = now.toISOString();
  const todayYMD = todayISO.slice(0, 10);

  // 1. Basic User Preferences & Goals
  useAllergensStore.setState({ allergens: ["Peanuts", "Shellfish"] });
  useDietStore.setState({ diet: "Anything" });
  useDislikedIngredientsStore.setState({ ingredients: ["Cilantro", "Mushrooms"] });
  useGoalsStore.setState({ calories: 2400, protein: 160, carbs: 280, fat: 70 });
  useUserStore.setState({ hasCompletedOnboarding: true });
  useStepStore.setState({ steps: 8432, goal: 10000, lastResetDate: todayYMD });

  // Arrays/Objects to hold historical data
  const scannedFoods: ScannedFood[] = [];
  const activities: ActivityLog[] = [];
  const meditations: MeditationSession[] = [];
  const sleepSessions: SleepSession[] = [];
  const hydrationHistory: Record<string, { volume: number; goal: number }> = {};
  const mealHistory: Record<string, any> = {};

  // Generate a mock recipe to use in meals/favorites
  const avocadoToast = createMockRecipe("mock-avocado-toast", "Avocado Toast", 350, 12, 30, 20);
  const chickenSalad = createMockRecipe("mock-chicken-salad", "Grilled Chicken Salad", 450, 40, 15, 25);
  
  useSavedRecipesStore.setState({
    savedRecipes: {
      [avocadoToast.id]: avocadoToast,
      [chickenSalad.id]: chickenSalad,
    },
  });

  // 2. Loop backwards to create 14 days of history for the charts
  for (let i = 0; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Vary the hour to make the "Day" chart look realistic
    d.setHours(Math.floor(Math.random() * 12) + 8, 0, 0, 0); 
    
    const iso = d.toISOString();
    const ymd = iso.slice(0, 10);

    // Hydration History (random amounts between 1500 and 2500ml)
    hydrationHistory[ymd] = {
      volume: Math.floor(Math.random() * 1000) + 1500,
      goal: 2000,
    };

    // Scanned Foods (e.g. tracking a snack every day)
    scannedFoods.push(
      createMockScannedFood(`snack-${i}`, iso, "Greek Yogurt", 150, 15, 6, 5),
      createMockScannedFood(`drink-${i}`, iso, "Protein Shake", 200, 30, 4, 2)
    );

    // Meal Plan History (Base plan logged for every day)
    mealHistory[ymd] = {
      breakfast: { [avocadoToast.id]: avocadoToast },
      lunch: { [chickenSalad.id]: chickenSalad },
      dinner: {},
      snack: {},
    };

    // Activity Logs (Burn ~300-500 kcal per day)
    activities.push({
      id: `act-${i}`,
      name: "Morning Run",
      type: "Cardio",
      duration: 30 * 60, // 30 mins
      caloriesBurned: Math.floor(Math.random() * 200) + 300,
      date: iso,
    });

    // Meditation (10 to 15 mins daily)
    meditations.push({
      id: `med-${i}`,
      durationSeconds: Math.floor(Math.random() * 300) + 600,
      date: iso,
    });

    // Sleep Sessions (Randomize between 6 to 8.5 hours)
    const sleepDurationHours = 6 + Math.random() * 2.5;
    const wakeTime = d.getTime();
    const bedTime = wakeTime - sleepDurationHours * 60 * 60 * 1000;
    sleepSessions.push({
      id: `sleep-${i}`,
      bedtime: bedTime,
      wakeTime: wakeTime,
      durationMs: wakeTime - bedTime,
    });
  }

  // 3. Inject the generated history into the stores using Zustand's setState
  useScannedFoodStore.setState({ foods: scannedFoods });
  useActivityStore.setState({ activities });
  useMeditationStore.setState({ sessions: meditations, dailyGoalMinutes: 15 });
  useSleepStore.setState({ sessions: sleepSessions });
  
  useHydrationStore.setState({
    currentDate: todayYMD,
    dailyVolume: 1200, // Today's current progress
    dailyGoal: 2000,
    history: hydrationHistory,
  });

  useMealsStore.setState({
    basePlan: mealHistory[todayYMD],
    history: mealHistory,
  });

  console.log("✅ Sample data successfully injected into all stores!");
};
