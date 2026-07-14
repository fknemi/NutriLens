import { View, Text, Pressable } from "react-native";
import Svg, { Path, Defs, Stop, LinearGradient } from "react-native-svg";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useState } from "react";
import { Selectors } from "@/components/selectors";
import MealCard from "@/components/meal-card";
import ActivityCard from "@/components/activity-card";
import WaterCard from "@/components/water-card";
import MealSearchModal from "@/components/meal-search-modal";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useActivityStore } from "@/stores/useActivityStore";
import { useMealsStore, MealCategory } from "@/stores/useMealsStore";
export type Gender = "male" | "female";

import ActivityModal from "@/components/activity-modal";
function useMealMacros(category: MealCategory, gender: Gender) {
  const savedMeals = useMealsStore((state) => state.savedMeals[category]);
  const meals = Object.values(savedMeals);

  let totalCalories = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatsGrams = 0;

  meals.forEach((meal) => {
    totalCalories += meal.calories_per_serving || 0;
    proteinGrams += meal.protein || 0;
    carbsGrams += (meal as any).carbs || 0;
    fatsGrams += (meal as any).fats || 0;
  });

  // 1. Define your daily targets dynamically based on gender
  const GOALS = {
    male: {
      protein: 150,
      carbs: 300,
      fats: 80,
    },
    female: {
      protein: 120,
      carbs: 220,
      fats: 60,
    },
  };

  const dailyGoals = GOALS[gender] || GOALS.male; // Default fallback just in case

  // 2. Calculate percentage of the GOAL completed, capped at 100%
  const calcProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    const percent = Math.round((current / goal) * 100);
    return percent > 100 ? 100 : percent;
  };

  return {
    calories: totalCalories,
    proteinPercent: calcProgress(proteinGrams, dailyGoals.protein),
    carbPercent: calcProgress(carbsGrams, dailyGoals.carbs),
    fatsPercent: calcProgress(fatsGrams, dailyGoals.fats),
  };
}
function DailyThings() {
  const [activeSelector, setActiveSelector] = useState(0);
  const activeIndex = useSharedValue(0);
  const [activeMealCategory, setActiveMealCategory] =
    useState<MealCategory | null>(null);
  const { dailyVolume, dailyGoal, checkAndResetDay } = useHydrationStore();
  const breakfastMacros = useMealMacros("breakfast");
  const lunchMacros = useMealMacros("lunch");
  const dinnerMacros = useMealMacros("dinner");
  function handleSelect(index: number) {
    setActiveSelector(index);
    activeIndex.value = withTiming(index, { duration: 300 });
  }
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const activities = useActivityStore((state) => state.activities);

  // Calculate total daily stats from your store
  const totalDuration = activities.reduce(
    (sum, item) => sum + item.duration,
    0,
  );
  const totalCalories = activities.reduce(
    (sum, item) => sum + item.caloriesBurned,
    0,
  );

  // Determine a dynamic label based on if you have logged anything today
  const activityName = activities.length > 0 ? "Daily Total" : "No Activity";
  const activityType =
    activities.length > 0
      ? `${activities.length} sessions logged`
      : "Log a workout";

  return (
    <View className="flex flex-col gap-4 pl-5">
      <View className="flex flex-row gap-4">
        <Text className="text-2xl font-medium">Daily Meals</Text>
        <Pressable>
          <Svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Path
              d="M8 0C6.41775 0 4.87103 0.469192 3.55544 1.34824C2.23985 2.22729 1.21447 3.47672 0.608967 4.93853C0.00346628 6.40034 -0.15496 8.00887 0.153721 9.56072C0.462403 11.1126 1.22433 12.538 2.34315 13.6569C3.46197 14.7757 4.88743 15.5376 6.43928 15.8463C7.99113 16.155 9.59966 15.9965 11.0615 15.391C12.5233 14.7855 13.7727 13.7602 14.6518 12.4446C15.5308 11.129 16 9.58225 16 8C15.9978 5.87895 15.1542 3.84542 13.6544 2.34562C12.1546 0.845814 10.121 0.00223986 8 0ZM7.69231 3.69231C7.87488 3.69231 8.05334 3.74644 8.20514 3.84787C8.35694 3.9493 8.47526 4.09347 8.54512 4.26214C8.61499 4.43081 8.63327 4.61641 8.59765 4.79547C8.56203 4.97453 8.47412 5.139 8.34502 5.2681C8.21593 5.39719 8.05145 5.48511 7.87239 5.52072C7.69333 5.55634 7.50773 5.53806 7.33906 5.46819C7.17039 5.39833 7.02623 5.28002 6.9248 5.12822C6.82337 4.97642 6.76923 4.79795 6.76923 4.61538C6.76923 4.37057 6.86649 4.13578 7.0396 3.96267C7.21271 3.78956 7.44749 3.69231 7.69231 3.69231ZM8.61539 12.3077C8.28897 12.3077 7.97591 12.178 7.7451 11.9472C7.51429 11.7164 7.38462 11.4033 7.38462 11.0769V8C7.22141 8 7.06488 7.93516 6.94947 7.81976C6.83407 7.70435 6.76923 7.54782 6.76923 7.38461C6.76923 7.2214 6.83407 7.06488 6.94947 6.94947C7.06488 6.83406 7.22141 6.76923 7.38462 6.76923C7.71104 6.76923 8.02409 6.8989 8.2549 7.12971C8.48572 7.36053 8.61539 7.67358 8.61539 8V11.0769C8.7786 11.0769 8.93512 11.1418 9.05053 11.2572C9.16594 11.3726 9.23077 11.5291 9.23077 11.6923C9.23077 11.8555 9.16594 12.012 9.05053 12.1274C8.93512 12.2429 8.7786 12.3077 8.61539 12.3077Z"
              fill="#C9C9C9"
            />
          </Svg>
        </Pressable>
      </View>
      <View className="flex-row">
        <Selectors
          items={[
            { key: "meals", label: "Meals" },
            { key: "activity", label: "Activity" },
            { key: "water", label: "Water" },
          ]}
          activeSelector={activeSelector}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          theme="light"
        />
      </View>

      {activeSelector === 0 && (
        <MealCard
          name="Breakfast"
          calories={breakfastMacros.calories}
          proteinPercent={breakfastMacros.proteinPercent}
          carbPercent={breakfastMacros.carbPercent}
          fatsPercent={breakfastMacros.fatsPercent}
          onAddPress={() => setActiveMealCategory("breakfast")}
        />
      )}

      {activeSelector === 0 && (
        <MealCard
          name="Lunch"
          calories={lunchMacros.calories}
          proteinPercent={lunchMacros.proteinPercent}
          carbPercent={lunchMacros.carbPercent}
          fatsPercent={lunchMacros.fatsPercent}
          onAddPress={() => setActiveMealCategory("lunch")}
        />
      )}

      {activeSelector === 0 && (
        <MealCard
          name="Dinner"
          calories={dinnerMacros.calories}
          proteinPercent={dinnerMacros.proteinPercent}
          carbPercent={dinnerMacros.carbPercent}
          fatsPercent={dinnerMacros.fatsPercent}
          onAddPress={() => setActiveMealCategory("dinner")}
        />
      )}

      {activeSelector === 1 && (
        <ActivityCard
          name={activityName}
          type={activityType}
          duration={totalDuration}
          caloriesBurned={totalCalories}
          onAddPress={() => setActivityModalOpen(true)}
        />
      )}
      {activeSelector === 2 && (
        <WaterCard
          name="Daily Intake"
          waterVolumeReached={dailyVolume}
          goal={dailyGoal}
        />
      )}

      <MealSearchModal
        visible={activeMealCategory !== null}
        category={activeMealCategory}
        onClose={() => setActiveMealCategory(null)}
      />
      <ActivityModal
        visible={isActivityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      />
    </View>
  );
}

export default DailyThings;
