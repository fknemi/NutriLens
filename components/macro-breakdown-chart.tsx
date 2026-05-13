import React from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import Svg, {
  Path,
  Polygon,
  Line,
  Circle,
  Text as SvgText,
} from "react-native-svg";

interface Macro {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}

interface MacroBreakdownChartProps {
  macros: Macro[];
  title?: string;
}

const WIDTH = Dimensions.get("window").width - 40;
const CX = WIDTH / 2;
const CY = 130;
const RADIUS = 90;
const RINGS = 4;

function polarToCart(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function getAngle(index: number, total: number) {
  return (Math.PI * 2 * index) / total - Math.PI / 2;
}

export default function MacroBreakdownChart({
  macros,
  title = "Macro Breakdown",
}: MacroBreakdownChartProps) {
  const n = macros.length;

  const ringPoints = Array.from({ length: RINGS }, (_, ring) => {
    const r = (RADIUS * (ring + 1)) / RINGS;
    return macros
      .map((_, i) => {
        const { x, y } = polarToCart(CX, CY, r, getAngle(i, n));
        return `${x},${y}`;
      })
      .join(" ");
  });

  const dataPoints = macros
    .map((m, i) => {
      const ratio = Math.min(m.value / m.max, 1);
      const { x, y } = polarToCart(CX, CY, RADIUS * ratio, getAngle(i, n));
      return `${x},${y}`;
    })
    .join(" ");

  const dataCoords = macros.map((m, i) => {
    const ratio = Math.min(m.value / m.max, 1);
    return polarToCart(CX, CY, RADIUS * ratio, getAngle(i, n));
  });

  const LABEL_OFFSET = 18;
  const labelCoords = macros.map((_, i) =>
    polarToCart(CX, CY, RADIUS + LABEL_OFFSET, getAngle(i, n))
  );
  const axisEnds = macros.map((_, i) =>
    polarToCart(CX, CY, RADIUS, getAngle(i, n))
  );

  return (
    <View className="bg-white rounded-3xl p-2 w-[90%]" style={{ gap: 16 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-medium text-[#1a1a1a]">{title}</Text>
        <Pressable className="w-10 h-10 rounded-full bg-[#EDEFF3] border-2 border-[#EAEAEA] items-center justify-center">
          <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <Path
              d="M18 11.16V16.92C18 17.2064 17.8862 17.4811 17.6837 17.6837C17.4811 17.8862 17.2064 18 16.92 18H1.08C0.793566 18 0.518864 17.8862 0.316325 17.6837C0.113785 17.4811 0 17.2064 0 16.92V11.16C0 10.8736 0.113785 10.5989 0.316325 10.3963C0.518864 10.1938 0.793566 10.08 1.08 10.08C1.36643 10.08 1.64114 10.1938 1.84368 10.3963C2.04621 10.5989 2.16 10.8736 2.16 11.16V15.84H15.84V11.16C15.84 10.8736 15.9538 10.5989 16.1563 10.3963C16.3589 10.1938 16.6336 10.08 16.92 10.08C17.2064 10.08 17.4811 10.1938 17.6837 10.3963C17.8862 10.5989 18 10.8736 18 11.16ZM8.2359 11.9241C8.33624 12.0248 8.45546 12.1047 8.58674 12.1592C8.71801 12.2137 8.85876 12.2418 9.0009 12.2418C9.14304 12.2418 9.28379 12.2137 9.41506 12.1592C9.54634 12.1047 9.66556 12.0248 9.7659 11.9241L13.3659 8.3241C13.5688 8.12121 13.6828 7.84603 13.6828 7.5591C13.6828 7.27217 13.5688 6.99699 13.3659 6.7941C13.163 6.59121 12.8878 6.47723 12.6009 6.47723C12.314 6.47723 12.0388 6.59121 11.8359 6.7941L10.08 8.55V1.08C10.08 0.793566 9.96621 0.518864 9.76367 0.316325C9.56114 0.113785 9.28643 0 9 0C8.71357 0 8.43886 0.113785 8.23633 0.316325C8.03379 0.518864 7.92 0.793566 7.92 1.08V8.55L6.1641 6.7959C6.06364 6.69544 5.94437 6.61575 5.81312 6.56138C5.68186 6.50701 5.54117 6.47903 5.3991 6.47903C5.11217 6.47903 4.83699 6.59301 4.6341 6.7959C4.53364 6.89636 4.45395 7.01563 4.39958 7.14689C4.34521 7.27814 4.31723 7.41883 4.31723 7.5609C4.31723 7.84783 4.43121 8.12301 4.6341 8.3259L8.2359 11.9241Z"
              fill="#A6A6A6"
            />
          </Svg>
        </Pressable>
      </View>

      {/* Spider Chart */}
      <Svg width={WIDTH} height={CY * 2 + LABEL_OFFSET + 16}>
        {/* Ring polygons */}
        {ringPoints.map((pts, ring) => (
          <Polygon
            key={ring}
            points={pts}
            fill="none"
            stroke="#EBEBEB"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axisEnds.map((end, i) => (
          <Line
            key={i}
            x1={CX}
            y1={CY}
            x2={end.x}
            y2={end.y}
            stroke="#EBEBEB"
            strokeWidth={1}
          />
        ))}

        {/* Data polygon fill */}
        <Polygon
          points={dataPoints}
          fill="#1A6FD4"
          fillOpacity={0.12}
          stroke="#1A6FD4"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {dataCoords.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill="#1A6FD4"
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {macros.map((m, i) => {
          const lp = labelCoords[i];
          const angle = getAngle(i, n);
          const anchor =
            Math.abs(Math.cos(angle)) < 0.1
              ? "middle"
              : Math.cos(angle) > 0
              ? "start"
              : "end";
          return (
            <React.Fragment key={i}>
              <SvgText
                x={lp.x}
                y={lp.y - 4}
                textAnchor={anchor}
                fontSize={10}
                fontWeight="600"
                fill="#1a1a1a"
              >
                {m.label}
              </SvgText>
              <SvgText
                x={lp.x}
                y={lp.y + 10}
                textAnchor={anchor}
                fontSize={9}
                fill="#818181"
              >
                {m.value}
                {m.unit}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend pills */}
      <View className="flex-row flex-wrap gap-2 items-center justify-center">
        {macros.map((m, i) => {
          const pct = Math.round((m.value / m.max) * 100);
          return (
            <View
              key={i}
              className="flex-row items-center gap-1 bg-[#EDEFF3] rounded-full"
              style={{ paddingHorizontal: 10, paddingVertical: 7 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: m.color,
                }}
              />
              <Text className="text-[#818181] text-xs font-medium">
                {m.label}
              </Text>
              <Text className="text-xs font-semibold text-[#1a1a1a]">
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
