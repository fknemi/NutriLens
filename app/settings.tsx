import React from "react";
import { View, Text, Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header Row */}
      <View className="flex-row items-center justify-between mt-6 mb-8 px-6">
        <Text className="font-[Geologica-Bold] text-[28px] text-[#1A202C]">
          Settings
        </Text>
        
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center bg-[#EAEAEA]"
          hitSlop={8}
        >
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke="#111111"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>

      <View className="px-6 flex-1">
        <Text className="font-[Geologica-SemiBold] text-sm text-[#718096] uppercase tracking-wider mb-3 ml-2">
          Dietary Preferences
        </Text>

        <Pressable
          onPress={() => router.push("/edit-allergies")}
          className="bg-white px-5 py-4 rounded-t-2xl border border-b-0 border-[#E2E8F0] flex-row justify-between items-center"
        >
          <Text className="font-[Geologica-Medium] text-[16px] text-[#1A202C]">
            Manage Allergies
          </Text>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18L15 12L9 6"
              stroke="#A0AEC0"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <Pressable
          onPress={() => router.push("/edit-dislikes")}
          className="bg-white px-5 py-4 rounded-b-2xl border border-[#E2E8F0] flex-row justify-between items-center mb-8"
        >
          <Text className="font-[Geologica-Medium] text-[16px] text-[#1A202C]">
            Disliked Ingredients
          </Text>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18L15 12L9 6"
              stroke="#A0AEC0"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
