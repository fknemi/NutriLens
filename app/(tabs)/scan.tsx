import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  ScrollView,
  Animated as RNAnimated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import Svg, { Path, Circle } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import FoodDetectionCamera, {
  type Detection,
} from "@/components/food-detection-camera";
import { useDetectionStore } from "@/stores/useDetectionStore";
import { useFoodNutrition } from "@/hooks/use-food-nutrition";

// ─── Constants ────────────────────────────────────────────────────────────────
const MODES = [
  { key: "ai", label: "AI Camera" },
  { key: "barcode", label: "Barcode" },
  { key: "image", label: "From Image" },
];
const SPRING_CONFIG = { damping: 20, stiffness: 220, mass: 0.8 };

// ─── NutrientTag ─────────────────────────────────────────────────────────────
const NUTRIENT_COLORS: Record<string, string> = {
  Calories: "#f59e0b",
  Protein: "#34d399",
  Carbs: "#60a5fa",
  Fat: "#f472b6",
  Fiber: "#a78bfa",
  Sugar: "#fb923c",
};
function NutrientTag({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  if (value === undefined) return null;
  const color = NUTRIENT_COLORS[label] ?? "#fff";
  return (
    <View
      className="items-center rounded-lg px-2 py-1 min-w-[58px]"
      style={{
        borderWidth: 1,
        borderColor: color + "44",
        backgroundColor: color + "18",
      }}
    >
      <Text className="text-sm font-bold leading-4" style={{ color }}>
        {value}
        <Text className="text-[10px] font-normal">{unit}</Text>
      </Text>
      <Text className="text-white/40 text-[9px] mt-0.5 uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}

// ─── FoodCard ─────────────────────────────────────────────────────────────────
const FOOD_EMOJIS: Record<string, string> = {
  apple: "🍎",
  banana: "🍌",
  orange: "🍊",
  broccoli: "🥦",
  carrot: "🥕",
  "hot dog": "🌭",
  pizza: "🍕",
  donut: "🍩",
  cake: "🎂",
  bottle: "🍼",
  "wine glass": "🍷",
  cup: "☕",
  fork: "🍴",
  knife: "🔪",
  spoon: "🥄",
  bowl: "🥣",
};

function FoodCard({
  label,
  onSave,
  onExpire,
}: {
  label: string;
  onSave: (label: string) => void;
  onExpire: (label: string) => void; // ← new
}) {
  const [expanded, setExpanded] = useState(false);
  // Keep null until the card is first opened — that's what triggers the fetch
  const [fetchLabel, setFetchLabel] = useState<string | null>(null);
  const { nutrition, loading } = useFoodNutrition(fetchLabel);

  const anim = useRef(new RNAnimated.Value(0)).current;

  const expand = () => {
    setFetchLabel(label); // arm the hook on first open; no-op on re-opens
    setExpanded(true);
    RNAnimated.spring(anim, {
      toValue: 1,
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start();
  };

  const collapse = () => {
    RNAnimated.spring(anim, {
      toValue: 0,
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start(() => setExpanded(false));
  };

  const emoji = FOOD_EMOJIS[label] ?? "🍽️";

  const cardWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [128, 264],
  });
  const cardHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 224],
  });
  const cardRadius = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 20],
  });
  const collapsedOpacity = anim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
  });
  const expandedOpacity = anim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    const timer = setTimeout(() => onExpire(label), 30_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <RNAnimated.View
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: cardRadius,
        backgroundColor: "rgba(15,15,20,0.90)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* ── Collapsed pill ─────────────────────────────────────────────── */}
      {!expanded && (
        <RNAnimated.View
          style={[StyleSheet.absoluteFill, { opacity: collapsedOpacity }]}
          className="flex-row items-center px-3"
        >
          <Pressable
            className="flex-1 flex-row items-center gap-1.5"
            onPress={expand}
          >
            <Text className="text-lg">{emoji}</Text>
            <Text
              className="text-white text-xs font-semibold flex-1"
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
          <Pressable
            className="bg-white/15 rounded-full px-2.5 py-1 ml-1"
            onPress={() => onSave(label)}
          >
            <Text className="text-white text-[11px] font-bold">Save</Text>
          </Pressable>
        </RNAnimated.View>
      )}

      {/* ── Expanded card ──────────────────────────────────────────────── */}
      <RNAnimated.View
        style={{ opacity: expandedOpacity, flex: 1 }}
        className="p-3.5"
        pointerEvents={expanded ? "auto" : "none"}
      >
        {/* Close */}
        <Pressable
          className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-white/10 items-center justify-center z-10"
          onPress={collapse}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6l12 12"
              stroke="#fff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>

        {/* Header */}
        <View className="flex-row items-center gap-2 mt-1.5 ml-7">
          <Text className="text-2xl">{emoji}</Text>
          <View className="flex-1">
            <Text className="text-white text-sm font-bold tracking-wide">
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Text>
            <Text className="text-white/40 text-[10px] mt-0.5">per 100 g</Text>
          </View>
          <Pressable
            className="bg-white rounded-full px-3 py-1.5"
            onPress={() => onSave(label)}
          >
            <Text className="text-black text-[11px] font-bold">Save</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-white/10 my-2.5" />

        {/* Nutrition grid */}
        {loading ? (
          <Text className="text-white/35 text-xs text-center mt-2">
            Loading nutrition…
          </Text>
        ) : !nutrition ? (
          <Text className="text-white/35 text-xs text-center mt-2">
            No data found
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-1.5">
            <NutrientTag
              label="Calories"
              value={nutrition.calories}
              unit=" kcal"
            />
            <NutrientTag label="Protein" value={nutrition.protein} unit="g" />
            <NutrientTag label="Carbs" value={nutrition.carbs} unit="g" />
            <NutrientTag label="Fat" value={nutrition.fat} unit="g" />
            <NutrientTag label="Fiber" value={nutrition.fiber} unit="g" />
            <NutrientTag label="Sugar" value={nutrition.sugar} unit="g" />
          </View>
        )}
      </RNAnimated.View>
    </RNAnimated.View>
  );
}

// ─── ModeButton ───────────────────────────────────────────────────────────────
function ModeButton({
  modeKey,
  label,
  progress,
  isActive,
  onPress,
}: {
  modeKey: string;
  label: string;
  progress: Animated.DerivedValue<number>;
  isActive: boolean;
  onPress: () => void;
}) {
  const pillStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(progress.value, [0, 1], [14, 20]),
    backgroundColor: `rgba(255,255,255,${interpolate(progress.value, [0, 1], [0.15, 1])})`,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    width: interpolate(progress.value, [0, 1], [0, 76]),
    overflow: "hidden",
  }));
  const iconColor = isActive ? "#000" : "#fff";
  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            borderRadius: 999,
            gap: 6,
          },
          pillStyle,
        ]}
      >
        {modeKey === "ai" && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
              stroke={iconColor}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={12}
              cy={13}
              r={4}
              stroke={iconColor}
              strokeWidth={1.8}
            />
          </Svg>
        )}
        {modeKey === "barcode" && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4"
              stroke={iconColor}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <Path
              d="M7 8v8M10 8v8M14 8v8M17 8v8"
              stroke={iconColor}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        )}
        {modeKey === "image" && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z"
              stroke={iconColor}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          </Svg>
        )}
        <Animated.View style={labelStyle}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isActive ? "#000" : "rgba(255,255,255,0.7)",
            }}
          >
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── PermissionScreen ─────────────────────────────────────────────────────────
function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-10 gap-6">
      <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center">
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={13} r={4} stroke="#fff" strokeWidth={1.8} />
        </Svg>
      </View>
      <Text className="text-white text-2xl font-bold text-center">
        Camera Access Needed
      </Text>
      <Text className="text-white/60 text-sm text-center leading-relaxed">
        NutriLens needs camera access to scan food, barcodes, and analyse meals.
      </Text>
      <Pressable
        onPress={onRequest}
        className="bg-white rounded-2xl px-8 py-4 mt-2"
      >
        <Text className="text-black font-bold text-base">Allow Camera</Text>
      </Pressable>
    </View>
  );
}

// ─── ScanScreen ───────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const { foods } = useDetectionStore();
  const [activeMode, setActiveMode] = useState(0);
  const activeIndex = useSharedValue(0);
  const addDetections = useDetectionStore((s) => s.addDetections);
  const removeFood = useDetectionStore((s) => s.removeFood);
  const activeLabels = Array.from(foods.keys());

  const handleSelect = (index: number) => {
    setActiveMode(index);
    activeIndex.value = withSpring(index, SPRING_CONFIG);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) Linking.openSettings();
  };

  const handleSave = (label: string) => {
    console.log("[Save]", label);
  };

  const isAiMode = activeMode === 0;

  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-black">
      {/* ── Camera layer ──────────────────────────────────────────────────── */}
      {hasPermission && device && (
        <>
          {isAiMode && (
            <FoodDetectionCamera
              style={StyleSheet.absoluteFillObject}
              onDetections={addDetections}
            />
          )}
          {!isAiMode && (
            <Camera
              style={StyleSheet.absoluteFillObject}
              device={device}
              isActive
            />
          )}
        </>
      )}
      {!hasPermission && (
        <View style={StyleSheet.absoluteFillObject} className="bg-zinc-900" />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View
        style={{ paddingTop: insets.top }}
        className="absolute top-0 left-0 right-0 z-10"
      >
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable className="w-10 h-10 rounded-full bg-black/30 items-center justify-center">
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
          <Text className="text-white text-base font-semibold tracking-wide">
            Food Scan
          </Text>
          <Pressable className="w-10 h-10 rounded-full bg-black/30 items-center justify-center">
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={5} cy={12} r={1.5} fill="#fff" />
              <Circle cx={12} cy={12} r={1.5} fill="#fff" />
              <Circle cx={19} cy={12} r={1.5} fill="#fff" />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* ── Permission gate ────────────────────────────────────────────────── */}
      {!hasPermission && (
        <PermissionScreen onRequest={handleRequestPermission} />
      )}

      {/* ── Food cards row ─────────────────────────────────────────────────── */}
      {activeLabels.length > 0 && (
        <View
          className="absolute left-0 right-0 z-20"
          style={{ bottom: insets.bottom + 140 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex-row items-end gap-2.5 px-4"
          >
            {activeLabels.map((label) => (
              <FoodCard
                key={label}
                label={label}
                onSave={handleSave}
                onExpire={removeFood}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Bottom mode selector ───────────────────────────────────────────── */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 z-10"
      >
        {hasPermission && (
          <Text className="text-white/50 text-xs text-center mb-6 tracking-widest uppercase">
            {isAiMode ? "Point at food to scan" : "Point at a barcode"}
          </Text>
        )}
        <View className="flex-row justify-center items-center gap-2 px-6">
          {MODES.map(({ key, label }, index) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const progress = useDerivedValue(() =>
              interpolate(
                activeIndex.value,
                [index - 1, index, index + 1],
                [0, 1, 0],
                "clamp",
              ),
            );
            return (
              <ModeButton
                key={key}
                modeKey={key}
                label={label}
                progress={progress}
                isActive={activeMode === index}
                onPress={() => handleSelect(index)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
