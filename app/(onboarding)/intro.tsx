import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, G } from "react-native-svg";
import { useUserStore } from "@/stores/useUserStore";

export default function IntroScreen() {
  const { hasCompletedOnboarding } = useUserStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasCompletedOnboarding) {
        router.replace("/(tabs)");
      } else {
        router.push("/discover");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView>
      <View className="align-center justify-between pb-24 pt-56 flex h-full items-center">
        <View>
          <Svg
            width="260px"
            height="260px"
            viewBox="0 0 42 70"
            xmlns="http://www.w3.org/2000/svg"
          >
            <G id="Page-1" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
              <G id="bolddesign_logo" fill="#F9D6AE" fillRule="nonzero">
                <G transform="translate(21.000000, 35.000000) scale(-1, 1) translate(-21.000000, -35.000000)">
                  <Path d="M40,0 L40,20.9136308 C40,22.2306554 39.8726985,23.5179472 39.629729,24.7638725 L20.4568154,24.7635134 C13.7443237,24.7635134 7.78693894,27.9965102 4.05685383,32.990311 C1.51085273,29.6351574 0,25.4508334 0,20.9136308 L0,20.4568154 C0,9.15882823 9.15882823,0 20.4568154,0 L40,0 Z" />
                  <Path
                    fill="#ED8757"
                    d="M22,30 L42,30 L42,30 L42,50 C42,61.045695 33.045695,70 22,70 C10.954305,70 2,61.045695 2,50 C2,38.954305 10.954305,30 22,30 Z"
                  />
                </G>
              </G>
            </G>
          </Svg>
        </View>
        <Text className="text-6xl font-[Geologica-SemiBold]">NutriLens</Text>
      </View>
    </SafeAreaView>
  );
}
