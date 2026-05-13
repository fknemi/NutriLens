import { View, Text, Pressable, Image, Dimensions } from "react-native";
import Svg, {
  Path,
  Defs,
  Stop,
  Rect,
  LinearGradient,
  RadialGradient,
} from "react-native-svg";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useState } from "react";
const SCREEN_HEIGHT = Dimensions.get("window").height;

const avatars = [
  require("@/assets/images/friend-avatar-1.png"),
  require("@/assets/images/friend-avatar-2.png"),
  require("@/assets/images/friend-avatar-3.png"),
];
function BubbleAvatar({ source, triggered, delay = 0 }) {
  const scale = useSharedValue(0);

  useAnimatedReaction(
    () => triggered.value,
    (t) => {
      if (t) {
        scale.value = withDelay(
          delay,
          withSpring(1, { damping: 5, stiffness: 300 }),
        );
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Image
          source={source}
          style={{ width: 56, height: 56, borderRadius: 28 }}
        />
      </Animated.View>
    </Pressable>
  );
}

function FriendBubbles({ scrollY }) {
  const containerY = useSharedValue(0);
  const triggered = useSharedValue(false);

  useAnimatedReaction(
    () => scrollY.value,
    (currentScroll) => {
      if (!triggered.value && containerY.value > 0) {
        if (currentScroll + SCREEN_HEIGHT > containerY.value) {
          triggered.value = true;
        }
      }
    },
  );

  return (
    <View
      style={{ flexDirection: "row", gap: 12 }}
      onLayout={(e) => {
        containerY.value = e.nativeEvent.layout.y;
      }}
    >
      {avatars.map((src, i) => (
        <BubbleAvatar
          key={i}
          source={src}
          triggered={triggered}
          delay={i * 120}
        />
      ))}
    </View>
  );
}
function GradientBackground({ width, height }) {
  return (
    <Svg width={width} height={height} style={{ position: "absolute" }}>
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="0%" rx="156%" ry="156%">
          <Stop offset="11%" stopColor="#EAD6EF" stopOpacity={0.8} />
          <Stop offset="50%" stopColor="#EDD0F4" stopOpacity={0.868} />
          <Stop offset="65%" stopColor="#F2CCFD" stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#grad)" rx={10} />
    </Svg>
  );
}


function InviteFriendsCard({ scrollY }) {
  const [cardWidth, setCardWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);

  return (
    <View
      onLayout={(e) => {
        setCardWidth(e.nativeEvent.layout.width);
        setCardHeight(e.nativeEvent.layout.height);
      }}
      style={{ width: "100%",paddingHorizontal: 55, borderRadius: 10, overflow: "hidden" }}
    >
      {cardWidth > 0 && (
        <GradientBackground width={cardWidth} height={cardHeight} />
      )}
      <View
        style={{
          padding: 20,
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ gap: 8, alignItems: "center" }}>
          <Text className="text-2xl font-semibold">Together is better!</Text>
          <View className="flex gap-2 flex-col items-center justify-center">
          <Text className="text-xl text-[#818181]">Invite your crew to</Text>
          <Text className="text-xl text-[#818181]">become healthier together</Text>
          </View>
        </View>
        <FriendBubbles scrollY={scrollY} />
        <Pressable
          style={{
            backgroundColor: "#111",
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}
          className="items-center justify-center rounded-full"
        >
          <Text className="text-white">Invite Friends</Text>
        </Pressable>
      </View>
    </View>
  );
}







export default InviteFriendsCard;
