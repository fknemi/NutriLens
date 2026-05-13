import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, {
  Path,
  Polyline,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  Text as SvgText,
} from "react-native-svg";

const H = 130;
const PAD_L = 28;
const PAD_R = 40;
const PAD_T = 12;
const PAD_B = 24;

const data = [20.5, 19.8, 19.1, 18.4];
const labels = ["W1", "W2", "W3", "W4"];
const GOAL = 15.0;

const minV = Math.min(...data, GOAL) - 1.5;
const maxV = Math.max(...data, GOAL) + 1;
const toY = (v: number, cH: number) =>
  PAD_T + (1 - (v - minV) / (maxV - minV)) * cH;

const BLUE = "#1A6FD4";

export default function BodyFatChart() {
  const [chartWidth, setChartWidth] = useState(0);

  const cW = chartWidth - PAD_L - PAD_R;
  const cH = H - PAD_T - PAD_B;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * cW;

  const points = data.map((v, i) => ({ x: toX(i), y: toY(v, cH) }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPt = points[points.length - 1];
  const goalY = toY(GOAL, cH);

  const areaD = [
    `M ${points[0]?.x},${PAD_T + cH}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${lastPt?.x},${PAD_T + cH}`,
    "Z",
  ].join(" ");

  return (
    <View
      className="bg-white rounded-3xl p-2 w-[90%]"
      style={{ gap: 16 }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-medium text-[#1a1a1a]">Body Fat</Text>
        <Pressable className="w-10 h-10 rounded-full bg-[#EDEFF3] border-2 border-[#EAEAEA] items-center justify-center">
          <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <Path
              d="M18 11.16V16.92C18 17.2064 17.8862 17.4811 17.6837 17.6837C17.4811 17.8862 17.2064 18 16.92 18H1.08C0.793566 18 0.518864 17.8862 0.316325 17.6837C0.113785 17.4811 0 17.2064 0 16.92V11.16C0 10.8736 0.113785 10.5989 0.316325 10.3963C0.518864 10.1938 0.793566 10.08 1.08 10.08C1.36643 10.08 1.64114 10.1938 1.84368 10.3963C2.04621 10.5989 2.16 10.8736 2.16 11.16V15.84H15.84V11.16C15.84 10.8736 15.9538 10.5989 16.1563 10.3963C16.3589 10.1938 16.6336 10.08 16.92 10.08C17.2064 10.08 17.4811 10.1938 17.6837 10.3963C17.8862 10.5989 18 10.8736 18 11.16ZM8.2359 11.9241C8.33624 12.0248 8.45546 12.1047 8.58674 12.1592C8.71801 12.2137 8.85876 12.2418 9.0009 12.2418C9.14304 12.2418 9.28379 12.2137 9.41506 12.1592C9.54634 12.1047 9.66556 12.0248 9.7659 11.9241L13.3659 8.3241C13.5688 8.12121 13.6828 7.84603 13.6828 7.5591C13.6828 7.27217 13.5688 6.99699 13.3659 6.7941C13.163 6.59121 12.8878 6.47723 12.6009 6.47723C12.314 6.47723 12.0388 6.59121 11.8359 6.7941L10.08 8.55V1.08C10.08 0.793566 9.96621 0.518864 9.76367 0.316325C9.56114 0.113785 9.28643 0 9 0C8.71357 0 8.43886 0.113785 8.23633 0.316325C8.03379 0.518864 7.92 0.793566 7.92 1.08V8.55L6.1641 6.7959C6.06364 6.69544 5.94437 6.61575 5.81312 6.56138C5.68186 6.50701 5.54117 6.47903 5.3991 6.47903C5.11217 6.47903 4.83699 6.59301 4.6341 6.7959C4.53364 6.89636 4.45395 7.01563 4.39958 7.14689C4.34521 7.27814 4.31723 7.41883 4.31723 7.5609C4.31723 7.84783 4.43121 8.12301 4.6341 8.3259L8.2359 11.9241Z"
              fill="#A6A6A6"
            />
          </Svg>
        </Pressable>
      </View>

      {/* Stat */}
      <View>
        <Text className="text-2xl font-semibold">-1 kg</Text>
        <Text className="text-base text-[#818181]">in this week</Text>
      </View>

      {/* Chart */}
      {chartWidth > 0 && (
        <Svg width={chartWidth} height={H + PAD_B}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={BLUE} stopOpacity={0} />
            </LinearGradient>
            <ClipPath id="areaClip">
              <Rect x={PAD_L} y={PAD_T} width={cW} height={cH} />
            </ClipPath>
          </Defs>

          {/* Y-axis grid */}
          {[minV + 1, (minV + maxV) / 2, maxV - 1].map((v, i) => {
            const y = toY(v, cH);
            return (
              <React.Fragment key={i}>
                <Line
                  x1={PAD_L}
                  y1={y}
                  x2={chartWidth - PAD_R}
                  y2={y}
                  stroke="#F0F0F0"
                  strokeWidth={1}
                />
                <SvgText
                  x={PAD_L - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="#ccc"
                >
                  {Math.round(v)}%
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Goal line */}
          <Line
            x1={PAD_L}
            y1={goalY}
            x2={chartWidth - PAD_R}
            y2={goalY}
            stroke={BLUE}
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.45}
          />
          <SvgText
            x={chartWidth - PAD_R + 2}
            y={goalY + 4}
            fontSize={8}
            fill={BLUE}
            opacity={0.6}
          >
            Goal
          </SvgText>

          {/* Area fill */}
          <Path d={areaD} fill="url(#areaGrad)" clipPath="url(#areaClip)" />

          {/* Line */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={BLUE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isLast ? 5 : 3}
                fill={isLast ? BLUE : "#fff"}
                stroke={BLUE}
                strokeWidth={2}
              />
            );
          })}

          {/* Tooltip on last point */}
          <Rect
            x={lastPt.x - 20}
            y={lastPt.y - 24}
            width={45}
            height={17}
            rx={8}
            fill={BLUE}
          />
          <SvgText
            x={lastPt.x}
            y={lastPt.y - 12}
            textAnchor="middle"
            fontSize={9}
            fontWeight="600"
            fill="#fff"
          >
            {data[data.length - 1]}%
          </SvgText>

          {/* X-axis baseline */}
          <Line
            x1={PAD_L}
            y1={PAD_T + cH}
            x2={chartWidth - PAD_R}
            y2={PAD_T + cH}
            stroke="#EBEBEB"
            strokeWidth={0.5}
          />

          {/* X labels */}
          {labels.map((l, i) => (
            <SvgText
              key={i}
              x={toX(i)}
              y={PAD_T + cH + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#bbb"
            >
              {l}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}
