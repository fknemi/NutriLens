import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  cancelAnimation,
  Easing,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useMeditationStore } from "@/stores/useMeditationStore";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.75;

const TECHNIQUES = [
  {
    key: "box",
    label: "Box Breathing",
    sub: "4-4-4-4",
    phases: [4, 4, 4, 4],
    color: "#D8F06C",
  },
  {
    key: "478",
    label: "Deep Relax",
    sub: "4-7-8",
    phases: [4, 7, 8, 0],
    color: "#E6CCEE",
  },
  {
    key: "calm",
    label: "Calm Mind",
    sub: "4-0-6-0",
    phases: [4, 0, 6, 0],
    color: "#FFB0B0",
  },
];

const PHASE_LABELS = ["Inhale", "Hold", "Exhale", "Hold"];
const PHASE_INSTRUCTIONS = [
  "Breathe in slowly through your nose",
  "Hold your breath",
  "Release slowly through your mouth",
  "Rest and wait",
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MeditationScreen() {
  const router = useRouter();
  const addSession = useMeditationStore((s) => s.addSession);

  const [active, setActive] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [techniqueIdx, setTechniqueIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.4);
  const pulse = useSharedValue(1);

  const technique = TECHNIQUES[techniqueIdx];

  useEffect(() => {
    if (!active && !showOptionsModal) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
  }, [active, showOptionsModal]);

  useEffect(() => {
    if (!active) return;
    const duration = technique.phases[phase] * 1000;
    if (duration === 0) return;

    if (phase === 0) {
      scale.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration });
    } else if (phase === 1) {
      scale.value = withTiming(1, { duration: 200 });
    } else if (phase === 2) {
      scale.value = withTiming(0.7, {
        duration,
        easing: Easing.inOut(Easing.quad),
      });
      opacity.value = withTiming(0.4, { duration });
    } else {
      scale.value = withTiming(0.7, { duration: 200 });
    }
  }, [phase, active, techniqueIdx]);

  useEffect(() => {
    if (!active || showOptionsModal) return;
    const phaseDuration = technique.phases[phase];

    if (phaseDuration === 0) {
      setPhase((p) => (p + 1) % 4);
      return;
    }

    setCountdown(phaseDuration);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setPhase((p) => (p + 1) % 4);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, active, techniqueIdx, showOptionsModal]);

  useEffect(() => {
    if (!active || showOptionsModal) return;
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [active, showOptionsModal]);

  function toggle() {
    if (active) {
      setShowOptionsModal(true);
    } else {
      setActive(true);
      setPhase(0);
    }
  }

  function quitSession() {
    if (sessionSeconds > 0) addSession(sessionSeconds);

    setShowOptionsModal(false);
    setActive(false);
    setPhase(0);
    setCountdown(0);
    setSessionSeconds(0);

    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(0.7, { duration: 600 });
    opacity.value = withTiming(0.4, { duration: 600 });

    router.back();
  }

  const animatedRing = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
    opacity: opacity.value,
  }));

  const animatedInner = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + scale.value * 0.1 }],
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <View className="flex-1 bg-[#130822] items-center justify-between px-6 pt-16 pb-12">
        <View className="w-full flex-row justify-between items-center px-2">
          <Pressable
            onPress={() => (active ? setShowOptionsModal(true) : router.back())}
            className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
          >
            <Text className="text-white/60 text-xl font-bold">✕</Text>
          </Pressable>
          <View className="bg-white/10 px-4 py-2 rounded-full">
            <Text className="text-white/80 font-medium tracking-widest text-base">
              {formatTime(sessionSeconds)}
            </Text>
          </View>
          <View className="w-12" />
        </View>

        <View
          className="items-center justify-center relative my-8"
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
        >
          <Animated.View
            style={[
              animatedRing,
              { position: "absolute", width: CIRCLE_SIZE, height: CIRCLE_SIZE },
            ]}
          >
            <Svg height="100%" width="100%" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="glow" cx="50" cy="50" r="50">
                  <Stop
                    offset="0%"
                    stopColor={technique.color}
                    stopOpacity="0.4"
                  />
                  <Stop
                    offset="100%"
                    stopColor={technique.color}
                    stopOpacity="0"
                  />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="50" fill="url(#glow)" />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              animatedRing,
              {
                position: "absolute",
                width: CIRCLE_SIZE * 0.9,
                height: CIRCLE_SIZE * 0.9,
                borderRadius: CIRCLE_SIZE,
                borderWidth: 2,
                borderColor: technique.color,
                opacity: 0.8,
              },
            ]}
          />

          <Animated.View
            style={[
              animatedInner,
              {
                width: CIRCLE_SIZE * 0.55,
                height: CIRCLE_SIZE * 0.55,
                borderRadius: CIRCLE_SIZE,
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            ]}
            className="items-center justify-center absolute"
          >
            {active ? (
              <>
                <Text className="text-white/80 text-xl font-medium tracking-widest mb-1">
                  {PHASE_LABELS[phase]}
                </Text>
                <Text className="text-white text-6xl font-light tabular-nums">
                  {countdown}
                </Text>
              </>
            ) : (
              <Text className="text-white/50 text-xl tracking-widest font-light">
                Ready
              </Text>
            )}
          </Animated.View>
        </View>

        <View className="h-12 items-center justify-center mb-4">
          <Text className="text-white/60 text-base text-center px-8">
            {active
              ? PHASE_INSTRUCTIONS[phase]
              : "Find a comfortable position and relax your shoulders."}
          </Text>
        </View>

        <View className="w-full mb-8">
          <View className="flex-row justify-between gap-3">
            {TECHNIQUES.map((t, i) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => {
                  if (!active) setTechniqueIdx(i);
                }}
                activeOpacity={0.7}
                className={`flex-1 rounded-2xl p-4 items-center justify-center border ${
                  techniqueIdx === i
                    ? "bg-white/10 border-white/20"
                    : "bg-transparent border-transparent"
                }`}
              >
                <Text
                  className={`font-medium mb-1 ${techniqueIdx === i ? "text-white" : "text-white/40"}`}
                >
                  {t.label}
                </Text>
                <Text
                  className={`text-xs ${techniqueIdx === i ? "text-white/60" : "text-white/20"}`}
                >
                  {t.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.8}
          className={`w-full h-16 rounded-full items-center justify-center ${active ? "bg-white/10" : "bg-white"}`}
        >
          <Text
            className={`text-xl font-semibold tracking-wide ${active ? "text-white" : "text-[#130822]"}`}
          >
            {active ? "Pause Session" : "Begin Journey"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showOptionsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-8">
          <Text className="text-white text-3xl font-light tracking-wide mb-12">
            Session Paused
          </Text>

          <View className="w-full max-w-sm gap-4">
            <TouchableOpacity
              className="bg-white py-4 rounded-full items-center"
              onPress={() => setShowOptionsModal(false)}
            >
              <Text className="text-[#130822] text-lg font-semibold tracking-wide">
                Resume Breathing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white/10 py-4 rounded-full items-center border border-white/10"
              onPress={quitSession}
            >
              <Text className="text-white/80 text-lg font-medium tracking-wide">
                End & Save Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
