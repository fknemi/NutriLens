// components/Selectors.tsx
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

export type Item = {
  key: string;
  label: string;
  icon: string;
};

const ICONS: Record<string, (props: { color: string }) => React.ReactNode> = {};

function SelectorButton({
  label,
  icon,
  index,
  activeIndex,
  isActive,
  onPress,
  theme,
}: {
  itemKey: string;
  label: string;
  icon: string;
  index: number;
  activeIndex: Animated.SharedValue<number>;
  isActive: boolean;
  onPress: () => void;
  theme: "dark" | "light";
}) {
  const isDark = theme === "dark";
  const pillRGB = isDark ? "255,255,255" : "1,1,1";
  const [activeText] = isDark ? [1] : [255];

  const progress = useDerivedValue(() =>
    interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [0, 1, 0],
      "clamp",
    ),
  );

  const pillStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(progress.value, [0, 1], [14, 20]),
    backgroundColor:
      progress.value < 0.5
        ? `rgba(120,120,120,0)`
        : `rgba(${pillRGB},1)`,
  }));

  const labelStyle = useAnimatedStyle(() => {
    const ch = Math.round(interpolate(progress.value, [0, 1], [150, activeText]));
    return { color: `rgb(${ch},${ch},${ch})` };
  });

  const iconColor = isActive
    ? isDark ? "#000" : "#fff"
    : isDark ? "#fff" : "#000";

  const renderIcon = ICONS[icon];

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        className="flex-row items-center justify-center py-3.5 rounded-full gap-1.5"
        style={pillStyle}
      >
        {renderIcon?.({ color: iconColor })}
        <Animated.Text
          numberOfLines={1}
          className="text-md font-semibold"
          style={labelStyle}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function Selectors({
  items,
  activeMode,
  activeIndex,
  onSelect,
  theme,
}: {
  items: Item[];
  activeMode: number;
  activeIndex: Animated.SharedValue<number>;
  onSelect: (index: number) => void;
  theme: "dark" | "light";
}) {
  return (
    <>
      {items.map(({ key, label, icon }, index) => (
        <SelectorButton
          key={key}
          itemKey={key}
          label={label}
          icon={icon}
          index={index}
          theme={theme}
          activeIndex={activeIndex}
          isActive={activeMode === index}
          onPress={() => onSelect(index)}
        />
      ))}
    </>
  );
}
