import { View, ScrollView, Text, Dimensions } from "react-native";
import { useState } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { Selectors } from "@/components/selectors";
import CaloriesCard from "@/components/calories-card";
import DailyThings from "@/components/daily-things";
import NutritionChart from "@/components/nutrition-chart";
import BodyFatChart from "@/components/body-fat-chart";
import MacroBreakdownChart from "@/components/macro-breakdown-chart";
import Svg, { Path, Defs, Stop, LinearGradient } from "react-native-svg";

type Period = "day" | "week" | "month" | "year";

// Order matches the items array passed to <Selectors /> below,
// so handleSelect can map the tapped index back to a Period.
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

// Calorie data per period. "day" is cumulative through the day (rises with
// each meal then flattens overnight); the others are per-bucket totals.
const NUTRITION_DATA: Record<Period,
  {
    totalCalories: number;
    dailyAverage: number;
    goalCalories: number;
    carbs: string;
    fat: string;
    protein: string;
    data: number[];
  }>
 = {
  day: {
    totalCalories: 1840,
    dailyAverage: 1790,
    goalCalories: 2000,
    carbs: "210g",
    fat: "65g",
    protein: "140g",
    data: [0, 320, 680, 980, 1450, 1840, 1840],
  },
  week: {
    totalCalories: 11540,
    dailyAverage: 1649,
    goalCalories: 2000,
    carbs: "1470g",
    fat: "455g",
    protein: "980g",
    data: [1800, 1650, 1840, 1200, 1750, 900, 1400],
  },
  month: {
    totalCalories: 48720,
    dailyAverage: 1697,
    goalCalories: 2000,
    carbs: "6300g",
    fat: "1950g",
    protein: "4200g",
    data: [1700, 1620, 1780, 1690],
  },
  year: {
    totalCalories: 638400,
    dailyAverage: 1749,
    goalCalories: 2000,
    carbs: "76650g",
    fat: "23725g",
    protein: "51100g",
    data: [
      1750, 1680, 1720, 1690, 1810, 1840,
      1900, 1875, 1760, 1700, 1650, 1690,
    ],
  },
};

// Body fat % per period.
const BODY_FAT_DATA: Record<Period,{ weeklyChange: number; goal: number; data: number[] }> = {
  day: {
    weeklyChange: -0.1,
    goal: 15.0,
    data: [19.1, 19.1, 19.05, 19.05, 19.0, 19.0, 19.0],
  },
  week: {
    weeklyChange: -0.4,
    goal: 15.0,
    data: [19.4, 19.3, 19.3, 19.2, 19.1, 19.1, 19.0],
  },
  month: {
    weeklyChange: -1,
    goal: 15.0,
    data: [20.5, 19.8, 19.1, 18.4],
  },
  year: {
    weeklyChange: -3.6,
    goal: 15.0,
    data: [
      22.0, 21.6, 21.1, 20.7, 20.3, 19.9,
      19.6, 19.3, 19.0, 18.7, 18.5, 18.4,
    ],
  },
};

// Macro targets (max) stay fixed since they're daily goals; only the
// period's actual/average intake (value) changes.
const MACRO_META = [
  { key: "protein", label: "Protein", max: 150, unit: "g", color: "#E69F5B" },
  { key: "carbs", label: "Carbs", max: 300, unit: "g", color: "#780B9F" },
  { key: "fats", label: "Fats", max: 80, unit: "g", color: "#50B380" },
  { key: "fiber", label: "Fiber", max: 35, unit: "g", color: "#1A6FD4" },
  { key: "sugar", label: "Sugar", max: 50, unit: "g", color: "#E05C5C" },
] as const;

const MACRO_VALUES: Record<Period,Record<(typeof MACRO_META)[number]["key"], number>> = {
  day: { protein: 112, carbs: 210, fats: 55, fiber: 22, sugar: 38 },
  week: { protein: 108, carbs: 205, fats: 58, fiber: 21, sugar: 36 },
  month: { protein: 115, carbs: 198, fats: 52, fiber: 24, sugar: 33 },
  year: { protein: 120, carbs: 190, fats: 50, fiber: 26, sugar: 30 },
};

export default function AnalyticsScreen() {
  const [activeSelector, setActiveSelector] = useState(0);
  const [period, setPeriod] = useState<Period>("week");
  const activeIndex = useSharedValue(0);

  function handleSelect(index: number) {
    setActiveSelector(index);
    activeIndex.value = withTiming(index, { duration: 300 });
    setPeriod(PERIOD_ORDER[index]);
  }

  const nutrition = NUTRITION_DATA[period];
  const bodyFat = BODY_FAT_DATA[period];
  const macros = MACRO_META.map((meta) => ({
    label: meta.label,
    value: MACRO_VALUES[period][meta.key],
    max: meta.max,
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
          <View className="pl-5">
            <MacroBreakdownChart title="Macro Breakdown" macros={macros} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
