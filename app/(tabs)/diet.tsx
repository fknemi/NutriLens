import { Text, View, ScrollView } from "react-native";
import WeekProgressCard from "@/components/week-progress-card";
import DailyOverviewCard from "@/components/daily-overview-card";
import ScanLogCard from "@/components/scan-log-card";
import {
  useScannedFoodStore,
  getNutrientValue,
} from "@/stores/useScannedFoodStore";
export default function DietScreen() {
  const foods = useScannedFoodStore((s) => s.foods) ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const todaysFoods = foods.filter((f) => f.scannedAt.startsWith(today));

  const totalCarbs = todaysFoods.reduce(
    (sum, f) =>
      sum +
      (getNutrientValue(f, "Carbohydrate") ?? 0) * (f.servingsConsumed ?? 1),
    0,
  );
  const totalFat = todaysFoods.reduce(
    (sum, f) =>
      sum +
      (getNutrientValue(f, "Total lipid") ?? 0) * (f.servingsConsumed ?? 1),
    0,
  );
  const totalProtein = todaysFoods.reduce(
    (sum, f) =>
      sum + (getNutrientValue(f, "Protein") ?? 0) * (f.servingsConsumed ?? 1),
    0,
  );

  const GOALS = { carbs: 210, fat: 65, protein: 140 };

  // ── Current week days (Mon–Sun) ───────────────────────────────────────
  const getWeekDays = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay()); // 0 = Sunday

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  };
  const weekDays = getWeekDays();

  const weekProgress = weekDays.map((day) => {
    const dayFoods = foods.filter((f) => f.scannedAt.startsWith(day));
    if (dayFoods.length === 0) return 0;

    const carbs = dayFoods.reduce(
      (sum, f) =>
        sum +
        (getNutrientValue(f, "Carbohydrate") ?? 0) * (f.servingsConsumed ?? 1),
      0,
    );
    const fat = dayFoods.reduce(
      (sum, f) =>
        sum +
        (getNutrientValue(f, "Total lipid") ?? 0) * (f.servingsConsumed ?? 1),
      0,
    );
    const protein = dayFoods.reduce(
      (sum, f) =>
        sum + (getNutrientValue(f, "Protein") ?? 0) * (f.servingsConsumed ?? 1),
      0,
    );

    const progress =
      (Math.min(carbs / GOALS.carbs, 1) +
        Math.min(fat / GOALS.fat, 1) +
        Math.min(protein / GOALS.protein, 1)) /
      3;

    return parseFloat(progress.toFixed(2));
  });

  return (
    <ScrollView className="flex-1">
      <View className="items-center justify-start gap-4 mt-12">
        <WeekProgressCard
          weekProgress={weekProgress}
          progressColor="#1A6FD4"
          fillColor="#EEF4FF"
          inactiveColor="#E8EDF2"
          circleSize={38}
          strokeWidth={3}
        />
        <DailyOverviewCard
          carb={Math.round(totalCarbs).toString()}
          carbGoal="210"
          fat={Math.round(totalFat).toString()}
          fatGoal="65"
          protein={Math.round(totalProtein).toString()}
          proteinGoal="140"
        />
        <ScanLogCard
          logs={foods.map((food) => ({
            id: food.id,
            url: food.imageUri ?? "",
            name: food.customName ?? food.labelText,
            calories: getNutrientValue(food, "Energy") ?? 0,
            proteinContent:
              getNutrientValue(food, "Protein")?.toString() ?? "0",
            fatContent:
              getNutrientValue(food, "Total lipid")?.toString() ?? "0",
            carbContent:
              getNutrientValue(food, "Carbohydrate")?.toString() ?? "0",
            scannedAt: food.scannedAt,
            servingsConsumed: food.servingsConsumed,
          }))}
        />
      </View>
    </ScrollView>
  );
}
