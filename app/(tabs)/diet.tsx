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
  return (
    <ScrollView className="flex-1">
      <View className="items-center justify-start gap-4 mt-12">
        <WeekProgressCard
          weekProgress={[1, 0.8, 0.5, 0.3, 0, 0, 0]}
          progressColor="#1A6FD4"
          fillColor="#EEF4FF"
          inactiveColor="#E8EDF2"
          circleSize={38}
          strokeWidth={3}
        />
        <DailyOverviewCard
          carb="210g"
          fat="65g"
          protein="140g"
          title="Daily Overview"
        />
        <ScanLogCard
          logs={foods.map((food) => ({
            url: food.imageUri ?? "",
            name: food.customName ?? food.labelText,
            calories: getNutrientValue(food, "Energy") ?? 0,
            proteinContent:
              getNutrientValue(food, "Protein")?.toString() ?? "0",
            fatContent:
              getNutrientValue(food, "Total lipid")?.toString() ?? "0",
            carbContent:
              getNutrientValue(food, "Carbohydrate")?.toString() ?? "0",
          }))}
        />
      </View>
    </ScrollView>
  );
}
