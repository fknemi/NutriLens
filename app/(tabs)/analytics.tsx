import { View, ScrollView, Text, Dimensions } from "react-native";
import { useState, useMemo } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { Selectors } from "@/components/selectors";
import NutritionChart from "@/components/nutrition-chart";
import BodyFatChart from "@/components/body-fat-chart";
import MacroBreakdownChart from "@/components/macro-breakdown-chart";
import { useGoalsStore } from "@/stores/useGoalsStore";
import { useScannedFoodStore } from "@/stores/useScannedFoodStore";
import { useMealsStore } from "@/stores/useMealsStore";
import { useActivityStore } from "@/stores/useActivityStore";

type Period = "day" | "week" | "month" | "year";

const PERIOD_ORDER: Period[] = ["day", "week", "month", "year"];

const PERIOD_LABELS: Record<Period, string[]> = {
  day: ["6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: ["W1", "W2", "W3", "W4"],
  year: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
};

const BODY_FAT_DATA: Record<Period, { weeklyChange: number; goal: number; data: number[] }> = {
  day: { weeklyChange: -0.1, goal: 15.0, data: [19.1, 19.1, 19.05, 19.05, 19.0, 19.0, 19.0] },
  week: { weeklyChange: -0.4, goal: 15.0, data: [19.4, 19.3, 19.3, 19.2, 19.1, 19.1, 19.0] },
  month: { weeklyChange: -1, goal: 15.0, data: [20.5, 19.8, 19.1, 18.4] },
  year: {
    weeklyChange: -3.6, goal: 15.0,
    data: [22.0, 21.6, 21.1, 20.7, 20.3, 19.9, 19.6, 19.3, 19.0, 18.7, 18.5, 18.4],
  },
};

const MACRO_META = [
  { key: "protein", label: "Protein", unit: "g", color: "#E69F5B" },
  { key: "carbs", label: "Carbs", unit: "g", color: "#780B9F" },
  { key: "fat", label: "Fats", unit: "g", color: "#50B380" },
] as const;

function formatGrams(n: number): string {
  return `${Math.round(n)}g`;
}

export default function AnalyticsScreen() {
  const [activeSelector, setActiveSelector] = useState(0);
  const [period, setPeriod] = useState<Period>("day");
  const activeIndex = useSharedValue(0);

  function handleSelect(index: number) {
    setActiveSelector(index);
    activeIndex.value = withTiming(index, { duration: 300 });
    setPeriod(PERIOD_ORDER[index]);
  }

  const goals = useGoalsStore();
  const foods = useScannedFoodStore((s) => s.foods);
  const getBucketsForPeriod = useScannedFoodStore((s) => s.getBucketsForPeriod);
  
  // Bring in the other stores to merge their data into the charts
  const getPlanForDate = useMealsStore((s) => s.getPlanForDate);
  const mealsHistory = useMealsStore((s) => s.history);
  const basePlan = useMealsStore((s) => s.basePlan);
  const activities = useActivityStore((s) => s.activities);

  // Core merging logic: Zips Scanned Foods, Historical Meals, and Activities together
  const buckets = useMemo(() => {
    // 1. Get the base scanned food buckets
    const baseBuckets = getBucketsForPeriod(period).map(b => ({ ...b }));
    const now = new Date();

    // Helper: Gets total meal plan macros for a specific date string
    const getMealMacrosForDate = (dateISO: string) => {
      const plan = getPlanForDate(dateISO);
      let c = 0, p = 0, cb = 0, f = 0;
      Object.values(plan).forEach((cat) => Object.values(cat).forEach((m) => {
        c += m.nutrition_summary?.calories ?? m.nutrition?.per_serving?.calories ?? 0;
        p += m.nutrition_summary?.protein_g ?? m.nutrition?.per_serving?.protein_g ?? 0;
        cb += m.nutrition_summary?.carbohydrates_g ?? m.nutrition?.per_serving?.carbohydrates_g ?? 0;
        f += m.nutrition_summary?.fat_g ?? m.nutrition?.per_serving?.fat_g ?? 0;
      }));
      return { calories: c, protein: p, carbs: cb, fat: f };
    };

    // Helper: Gets total burned calories for a specific date string
    const getBurnedForDate = (dateISO: string) => {
      return activities
        .filter((a) => a.date?.startsWith(dateISO))
        .reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
    };

    // Helper: Adds macros and subtracts burned calories from a specific bucket
    const applyToBucket = (bucketIdx: number, dateISO: string) => {
      const m = getMealMacrosForDate(dateISO);
      const burned = getBurnedForDate(dateISO);
      
      baseBuckets[bucketIdx].calories = Math.max(0, baseBuckets[bucketIdx].calories + m.calories - burned);
      baseBuckets[bucketIdx].protein += m.protein;
      baseBuckets[bucketIdx].carbs += m.carbs;
      baseBuckets[bucketIdx].fat += m.fat;
      baseBuckets[bucketIdx].count += 1; // Treat the meal plan as a logged entry
    };

    if (period === "day") {
      // Day buckets are a *running total* of 7 time slots.
      // We distribute the daily meal plan and burned calories evenly across the day to match the curve.
      const iso = now.toISOString().slice(0, 10);
      const m = getMealMacrosForDate(iso);
      const burned = getBurnedForDate(iso);
      
      for (let i = 0; i < 7; i++) {
        const factor = (i + 1) / 7;
        baseBuckets[i].calories = Math.max(0, baseBuckets[i].calories + (m.calories * factor) - (burned * factor));
        baseBuckets[i].protein += m.protein * factor;
        baseBuckets[i].carbs += m.carbs * factor;
        baseBuckets[i].fat += m.fat * factor;
      }
    } 
    else if (period === "week") {
      // 7 slots (Mon-Sun)
      const startOfWeek = new Date(now);
      const getDayIdx = (d: Date) => (d.getDay() + 6) % 7;
      startOfWeek.setDate(now.getDate() - getDayIdx(now));
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        applyToBucket(i, d.toISOString().slice(0, 10));
      }
    } 
    else if (period === "month") {
      // 4 slots (Weeks 1-4)
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      while (d.getMonth() === now.getMonth()) {
        const idx = Math.min(3, Math.floor((d.getDate() - 1) / 7));
        applyToBucket(idx, d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
    } 
    else if (period === "year") {
      // 12 slots (Jan-Dec)
      const d = new Date(now.getFullYear(), 0, 1);
      while (d.getFullYear() === now.getFullYear()) {
        const idx = d.getMonth();
        applyToBucket(idx, d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
    }

    return baseBuckets;
  }, [period, foods, activities, mealsHistory, basePlan, getBucketsForPeriod, getPlanForDate]);

  // Aggregate totals across every bucket in the period
  const periodTotals =
    period === "day"
      ? buckets[buckets.length - 1] ?? { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
      : buckets.reduce(
          (sum, b) => ({
            calories: sum.calories + b.calories,
            protein: sum.protein + b.protein,
            carbs: sum.carbs + b.carbs,
            fat: sum.fat + b.fat,
            count: sum.count + b.count,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
        );

  const bucketsWithData = buckets.filter((b) => b.count > 0).length;
  
  // Averages for larger periods. For 'day' we just show the total.
  const dailyAverage = period === "day" 
    ? periodTotals.calories 
    : (bucketsWithData > 0 ? periodTotals.calories / bucketsWithData : 0);

  const nutrition = {
    totalCalories: periodTotals.calories,
    dailyAverage,
    goalCalories: goals.calories,
    carbs: formatGrams(periodTotals.carbs),
    fat: formatGrams(periodTotals.fat),
    protein: formatGrams(periodTotals.protein),
    data: buckets.map((b) => b.calories),
  };

  const bodyFat = BODY_FAT_DATA[period];

  const macroValues = {
    protein: periodTotals.protein,
    carbs: periodTotals.carbs,
    fat: periodTotals.fat,
  };
  const macros = MACRO_META.map((meta) => ({
    label: meta.label,
    value: macroValues[meta.key],
    max: period === "day" ? goals[meta.key] : goals[meta.key] * bucketsWithData, // Scale max up for weeks/months
    unit: meta.unit,
    color: meta.color,
  }));

  return (
    <View className="flex-1 items-start justify-start mt-12">
      <ScrollView className="">
        <View className="gap-4">
          <View className="flex-row pl-5">
            <Selectors
              items={[
                { key: "day", label: "Day" },
                { key: "week", label: "Week" },
                { key: "month", label: "Month" },
                { key: "year", label: "Year" },
              ]}
              activeSelector={activeSelector}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              theme="light"
            />
          </View>
          <View className="pl-5">
            <NutritionChart
              totalCalories={nutrition.totalCalories}
              dailyAverage={nutrition.dailyAverage}
              goalCalories={nutrition.goalCalories}
              carbs={nutrition.carbs}
              fat={nutrition.fat}
              protein={nutrition.protein}
              labels={PERIOD_LABELS[period]}
              data={nutrition.data}
            />
          </View>
          <View className="pl-5">
            <BodyFatChart
              weeklyChange={bodyFat.weeklyChange}
              goal={bodyFat.goal}
              data={bodyFat.data}
              labels={PERIOD_LABELS[period]}
            />
          </View>
          <View className="pl-5 mb-32">
            <MacroBreakdownChart title="Macro Breakdown" macros={macros} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
