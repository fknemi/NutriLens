import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Image, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const [username, setUsername] = useState("");
  const [avatarKey, setAvatarKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load existing profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [savedAvatar, savedUsername] = await Promise.all([
          AsyncStorage.getItem("user-avatar"),
          AsyncStorage.getItem("user-username")
        ]);
        
        if (savedAvatar) {
          setAvatarKey(savedAvatar);
        } else {
          setAvatarKey(Crypto.randomUUID());
        }
        
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
        setAvatarKey(Crypto.randomUUID());
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  const refreshAvatar = () => {
    setAvatarKey(Crypto.randomUUID());
  };

  const isUsernameValid = username.trim().length > 0;

  const saveProfile = async () => {
    if (!isUsernameValid) return;

    await AsyncStorage.multiSet([
      ["user-avatar", avatarKey],
      ["user-username", username.trim()],
    ]);

    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F8F7] justify-center items-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const avatarUrl = `https://tapback.co/api/avatar/${avatarKey}.webp`;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7] px-6 justify-between items-center py-6">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="w-full flex-1 items-center">
        {/* Back Button Row */}
        <View className="w-full flex-row justify-start mb-10">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#EAEAEA" }}
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

        <Pressable onPress={refreshAvatar} className="items-center mb-8">
          <Image
            source={{ uri: avatarUrl }}
            className="w-32 h-32 rounded-full bg-gray-200"
            resizeMode="cover"
          />

          <Text className="font-[Geologica-Regular] text-sm text-[#8A84E2] mt-3">
            Tap to shuffle avatar
          </Text>
        </Pressable>

        <TextInput
          className="w-full bg-white px-4 py-4 rounded-xl border border-gray-200 font-[Geologica-Regular] text-[#1A202C]"
          placeholder="Enter your username"
          placeholderTextColor="#A0AEC0"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={20}
        />

        {!isUsernameValid && (
          <Text className="self-start mt-2 text-red-500 font-[Geologica-Regular] text-sm">
            Username is required.
          </Text>
        )}
      </View>

      <Pressable
        onPress={saveProfile}
        disabled={!isUsernameValid}
        className={`w-[80vw] flex-row p-6 rounded-full items-center justify-center mb-4 ${
          isUsernameValid ? "bg-[#FF8762]" : "bg-[#FF876280]"
        }`}
      >
        <Text className="text-2xl font-[Geologica-Medium]">
          Save
        </Text>

        <View className="absolute right-4">
          <Svg
            width={42}
            height={42}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <Path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" />
            <Path d="M12 11H8v2h4v3l4-4-4-4z" />
          </Svg>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
