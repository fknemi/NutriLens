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
const PERIOD_LABELS: Record<Period, string[]> = {
  day: ["6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: ["W1", "W2", "W3", "W4"],
  year: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};
export default function AnalyticsScreen() {
  const [activeSelector, setActiveSelector] = useState(0);
  const [period, setPeriod] = useState<Period>("week");
  const activeIndex = useSharedValue(0);
  function handleSelect(index: number) {
    setActiveSelector(index);
    activeIndex.value = withTiming(index, { duration: 300 });
  }

  return (
    <View className="flex-1 items-start justify-start mt-12">
      <ScrollView className="">
        <View className="gap-4">
          <View className="flex-row pl-5">
            <Selectors
              items={[
                { key: "day", label: "Day" },
                { key: "week", label: "Week" },
                { key: "Month", label: "Month" },
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
              totalCalories={1840}
              dailyAverage={1650}
              goalCalories={2000}
              carbs="210g"
              fat="65g"
              protein="140g"
              labels={PERIOD_LABELS[period]}
              data={[1800, 1650, 1840, 1200, 1750, 900, 1400]}
            />
          </View>
          <View className="pl-5">
            <BodyFatChart
              weeklyChange={-1}
              goal={15.0}
              data={[20.5, 19.8, 19.1, 18.4]}
              labels={["W1", "W2", "W3", "W4"]}
            />
          </View>
          <View className="pl-5">
            <MacroBreakdownChart
              title="Macro Breakdown"
              macros={[
                {
                  label: "Protein",
                  value: 112,
                  max: 150,
                  unit: "g",
                  color: "#E69F5B",
                },
                {
                  label: "Carbs",
                  value: 210,
                  max: 300,
                  unit: "g",
                  color: "#780B9F",
                },
                {
                  label: "Fats",
                  value: 55,
                  max: 80,
                  unit: "g",
                  color: "#50B380",
                },
                {
                  label: "Fiber",
                  value: 22,
                  max: 35,
                  unit: "g",
                  color: "#1A6FD4",
                },
                {
                  label: "Sugar",
                  value: 38,
                  max: 50,
                  unit: "g",
                  color: "#E05C5C",
                },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
