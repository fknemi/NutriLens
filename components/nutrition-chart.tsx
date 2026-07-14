import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import Svg, { Rect, Line, Text as SvgText, Path } from "react-native-svg";

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
interface NutritionChartProps {
  totalCalories: number;
  dailyAverage: number;
  goalCalories: number;
  period: Period;
  data: number[];
  labels: string[];
  carbs: string;
  fat: string;
  protein: string;
}

export default function NutritionChart({
  totalCalories,
  dailyAverage,
  goalCalories,
  period,
  data,
  labels,
  carbs,
  fat,
  protein,
}: NutritionChartProps) {
  const width = Dimensions.get("window").width - 40;
  const chartH = 130;
  const barAreaW = width - 48;
  const currentData = data;
  const gap = 8;
  const barW = (barAreaW - gap * (currentData.length - 1)) / currentData.length;
  const max = Math.max(...currentData, goalCalories);
  const baselineY = chartH;
  const goalY = baselineY - (goalCalories / max) * chartH;

  return (
    <View className="bg-white rounded-3xl p-2 w-[90%] flex flex-col gap-4">
      <Text className="text-2xl font-medium">Nutrition</Text>

      <View className="flex flex-row gap-8">
        <View className="flex flex-col gap-2">
          <Text className="text-2xl font-semibold">
            {totalCalories.toLocaleString()} kcal
          </Text>
          <Text className="text-lg text-[#818181]">Total Calories</Text>
        </View>
        <View className="flex flex-col gap-2">
          <Text className="text-2xl font-semibold">
            {dailyAverage.toLocaleString()}
          </Text>
          <Text className="text-lg text-[#818181]">Daily Average</Text>
        </View>
      </View>
      <View className="flex flex-col gap-8">
        <Svg width={width} height={chartH + 24}>
          <Line
            x1={0}
            y1={goalY}
            x2={barAreaW}
            y2={goalY}
            stroke="#1A6FD4"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />

          {currentData.map((val, i) => {
            const barH = (val / max) * chartH;
            const x = i * (barW + gap);
            const y = baselineY - barH;

            return (
              <React.Fragment key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill="#1A6FD4"
                  opacity={i === currentData.length - 1 ? 1 : 0.5}
                />
                <SvgText
                  x={x + barW / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#999"
                >
                  {labels[i]}
                </SvgText>
              </React.Fragment>
            );
          })}

          <Line
            x1={0}
            y1={chartH}
            x2={barAreaW}
            y2={chartH}
            stroke="#E5E7EB"
            strokeWidth={0.5}
          />
        </Svg>

        {/* Macros */}
        <View className="flex-row gap-2 items-center justify-center w-full ">
          <View
            className="flex flex-row gap-1 items-center justify-center bg-[#EDEFF3]  rounded-full"
            style={{ padding: 10 }}
          >
            <Svg
              width={10}
              height={16}
              viewBox="0 0 10 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M5.23275 7.10469C5.22215 7.1542 5.23036 7.20578 5.25635 7.25C5.28234 7.29413 5.32417 7.32814 5.37435 7.34609L6.87419 7.87422L4.47184 10.2937L4.76888 8.89688C4.77952 8.84735 4.77125 8.7958 4.74528 8.75156C4.71934 8.70742 4.67741 8.67347 4.62728 8.65547L3.12581 8.12578L5.52979 5.70703L5.23275 7.10469Z"
                fill="#E69F5B"
              />
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.46354 0C8.94986 5.09908e-07 9.34155 0.320262 9.34163 0.71875V1.68672C9.34149 2.08516 8.94981 2.40625 8.46354 2.40625H8.17871V2.85469C9.29174 3.26733 10 3.89368 10 4.59688V13.7469C9.99976 14.9952 7.76985 16 5 16C2.23015 16 0.00023693 14.9952 0 13.7469V4.59688C0 3.89368 0.707454 3.26733 1.82048 2.85469V2.40625H1.53646C1.05018 2.40625 0.658514 2.08516 0.658366 1.68672V0.71875C0.658449 0.320261 1.05014 0 1.53646 0H8.46354ZM5.86995 4.80312C5.82164 4.81109 5.77743 4.83364 5.74381 4.86719L2.56266 8.06875C2.53683 8.09432 2.51801 8.12537 2.50814 8.15938C2.49829 8.19332 2.49731 8.229 2.5057 8.26328C2.51413 8.29761 2.53143 8.32975 2.55615 8.35625C2.58085 8.38271 2.61222 8.40327 2.6473 8.41563L4.28467 8.99219L3.86881 10.9461C3.85952 10.9913 3.86617 11.0383 3.88753 11.0797C3.90906 11.1212 3.94467 11.1555 3.98844 11.1766C4.03223 11.1976 4.08241 11.2047 4.13086 11.1969C4.17931 11.1889 4.22413 11.1665 4.25781 11.1328L7.43896 7.93125C7.46424 7.90575 7.48306 7.87506 7.49268 7.84141C7.50228 7.80764 7.50271 7.77155 7.4943 7.7375C7.48568 7.70338 7.46775 7.67159 7.44303 7.64531C7.4183 7.6191 7.38685 7.59892 7.35189 7.58672L5.71615 7.01016L6.132 5.05391C6.14134 5.00858 6.13476 4.96184 6.11328 4.92031C6.09171 4.87868 6.05627 4.84452 6.01237 4.82344C5.96853 4.80244 5.91844 4.79519 5.86995 4.80312Z"
                fill="#E69F5B"
              />
            </Svg>

            <Text className="text-[#818181] text-sm font-medium">Protein</Text>
            <Text className="text-sm font-semibold">{protein}</Text>
          </View>
          <View
            className="flex flex-row gap-1 items-center justify-center bg-[#EDEFF3]  rounded-full"
            style={{ padding: 10 }}
          >
            <Svg
              width={14}
              height={16}
              viewBox="0 0 14 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M10.5497 0.00408696C8.55043 0.0828061 6.94439 1.16306 7.29944 3.65243C7.81655 2.50515 9.42503 1.63302 10.2758 1.3868C9.32344 1.97369 7.89769 2.98068 7.44971 4.0423C8.4879 3.81003 9.32035 3.9971 10.5912 3.29252C11.3792 2.85528 12.2609 1.82882 12.6827 0.269297C11.9416 0.0682147 11.2163 -0.0214126 10.5499 0.00430636L10.5497 0.00408696ZM5.66066 1.30646C5.44143 1.31659 5.12767 1.6073 5.18566 1.77644C5.28495 2.06793 6.35729 2.58235 6.54396 4.64004C6.54396 4.64004 4.46047 3.64474 2.85423 4.17239C1.50864 4.61352 -0.0617744 5.92994 0.00187331 8.98916C0.0654193 12.0475 2.54453 15.9047 4.64551 15.9173C5.89339 15.9251 6.05148 15.4653 7.04115 15.459C7.65674 15.4551 8.69334 15.9952 9.16125 15.9999C11.3464 16.021 14.1028 12.1076 13.997 8.65555C13.8938 5.31189 11.8324 4.23165 10.371 4.18257C8.93878 4.13502 7.84823 4.64553 7.02203 4.67516C6.93863 3.64401 6.61851 1.69244 5.74794 1.32072C5.72173 1.30981 5.69234 1.30513 5.66136 1.30669L5.66066 1.30646ZM5.5153 5.2042C7.35972 5.75601 7.74338 5.29383 8.65681 5.29227C7.39781 6.20728 5.86547 5.5939 5.5153 5.2042Z"
                fill="#780B9F"
              />
            </Svg>

            <Text className="text-[#818181] text-sm font-medium">Carb</Text>
            <Text className="text-sm font-semibold">{carbs}</Text>
          </View>
          <View
            className="flex flex-row gap-1 items-center justify-center bg-[#EDEFF3]  rounded-full"
            style={{ padding: 10 }}
          >
            <Svg
              width={9}
              height={13}
              viewBox="0 0 9 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M6.10435 0.208847C5.80166 0.0418498 5.52241 0.00107483 5.34379 0.00181375C5.34198 0.00181375 5.34057 0.00194803 5.33875 0.00194803C5.32579 0.000940404 5.31276 0 5.29952 0H4.05289H2.80626C2.79302 0 2.78006 0.00100758 2.7671 0.00194803C2.76528 0.00194803 2.76387 0.00181375 2.76199 0.00181375C2.58317 0.00107483 2.30399 0.0418498 2.00123 0.208847C1.54283 0.459544 1.07079 0.973096 0.710937 1.89192C0.348796 2.81443 0.0767378 4.15793 0.000427091 6.18245C-0.0120003 6.5161 0.248303 6.79669 0.582028 6.80912C0.589753 6.80946 0.597411 6.80959 0.605002 6.80959C0.928516 6.80959 1.19654 6.55345 1.20877 6.22752C1.21609 6.02499 1.22577 5.83132 1.23719 5.64417C1.02169 5.30259 0.8956 4.85903 0.8956 4.28563C0.8956 3.37903 1.23692 2.59195 1.85647 2.00154C1.87938 1.97978 1.90665 1.95889 1.93715 1.93874C1.38578 2.47029 1.02995 3.2297 1.02995 4.15128C1.02995 4.94246 1.29267 5.62812 1.71567 6.15524C1.60759 6.07544 1.50756 5.98529 1.41748 5.88345L2.23957 11.8548C2.23957 12.226 2.61145 12.5271 3.06999 12.5271C3.52866 12.5271 3.90061 12.2261 3.90061 11.8548V7.28291C3.95119 7.28553 4.0019 7.287 4.05282 7.287C4.10374 7.287 4.15446 7.28559 4.20504 7.28291V11.8548C4.20504 12.226 4.57699 12.5271 5.03566 12.5271C5.4942 12.5271 5.86614 12.2261 5.86614 11.8548L6.68816 5.88352C6.59802 5.98536 6.49806 6.07544 6.38991 6.15538C6.81298 5.62819 7.0757 4.94246 7.0757 4.15128C7.0757 3.22977 6.71987 2.47043 6.16863 1.93887C6.19913 1.95896 6.22634 1.97971 6.24918 2.00154C6.8688 2.59208 7.21011 3.37903 7.21011 4.28563C7.21011 4.85923 7.08396 5.30293 6.86833 5.64451C6.87981 5.83132 6.88949 6.02526 6.89694 6.22745C6.90917 6.55345 7.17713 6.80953 7.50065 6.80953C7.5083 6.80953 7.51596 6.80939 7.52362 6.80905C7.85728 6.79656 8.11771 6.51604 8.10529 6.18238C8.00164 3.4845 7.55781 1.99127 7.00214 1.10295C6.72397 0.661136 6.40764 0.374567 6.10435 0.208847Z"
                fill="#50B380"
              />
            </Svg>
            <Text className="text-[#818181] text-sm font-medium">Fats</Text>
            <Text className="text-sm font-semibold">{fat}</Text>
          </View>
        </View>
      </View>
      <Pressable className="absolute top-3 right-3 border-2 border-[#EAEAEA] bg-[#EDEFF3] rounded-full w-11 h-11 items-center justify-center">
        <Svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Path
            d="M18 11.16V16.92C18 17.2064 17.8862 17.4811 17.6837 17.6837C17.4811 17.8862 17.2064 18 16.92 18H1.08C0.793566 18 0.518864 17.8862 0.316325 17.6837C0.113785 17.4811 0 17.2064 0 16.92V11.16C0 10.8736 0.113785 10.5989 0.316325 10.3963C0.518864 10.1938 0.793566 10.08 1.08 10.08C1.36643 10.08 1.64114 10.1938 1.84368 10.3963C2.04621 10.5989 2.16 10.8736 2.16 11.16V15.84H15.84V11.16C15.84 10.8736 15.9538 10.5989 16.1563 10.3963C16.3589 10.1938 16.6336 10.08 16.92 10.08C17.2064 10.08 17.4811 10.1938 17.6837 10.3963C17.8862 10.5989 18 10.8736 18 11.16ZM8.2359 11.9241C8.33624 12.0248 8.45546 12.1047 8.58674 12.1592C8.71801 12.2137 8.85876 12.2418 9.0009 12.2418C9.14304 12.2418 9.28379 12.2137 9.41506 12.1592C9.54634 12.1047 9.66556 12.0248 9.7659 11.9241L13.3659 8.3241C13.5688 8.12121 13.6828 7.84603 13.6828 7.5591C13.6828 7.27217 13.5688 6.99699 13.3659 6.7941C13.163 6.59121 12.8878 6.47723 12.6009 6.47723C12.314 6.47723 12.0388 6.59121 11.8359 6.7941L10.08 8.55V1.08C10.08 0.793566 9.96621 0.518864 9.76367 0.316325C9.56114 0.113785 9.28643 0 9 0C8.71357 0 8.43886 0.113785 8.23633 0.316325C8.03379 0.518864 7.92 0.793566 7.92 1.08V8.55L6.1641 6.7959C6.06364 6.69544 5.94437 6.61575 5.81312 6.56138C5.68186 6.50701 5.54117 6.47903 5.3991 6.47903C5.11217 6.47903 4.83699 6.59301 4.6341 6.7959C4.53364 6.89636 4.45395 7.01563 4.39958 7.14689C4.34521 7.27814 4.31723 7.41883 4.31723 7.5609C4.31723 7.84783 4.43121 8.12301 4.6341 8.3259L8.2359 11.9241Z"
            fill="#A6A6A6"
          />
        </Svg>
      </Pressable>
    </View>
  );
}
