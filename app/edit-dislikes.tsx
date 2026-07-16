import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";

export default function EditDislikesScreen() {
  const { ingredients, setIngredients } = useDislikedIngredientsStore();
  
  // Initialize the local input with any existing ingredients from the store
  const [inputText, setInputText] = useState(() => ingredients.join(", "));

  const handleSave = () => {
    // Parse the comma-separated string into a clean array
    const parsedIngredients = inputText
      .split(",")
      .map((item) => item.trim())          
      .filter((item) => item.length > 0);  

    // Save the clean array to Zustand
    setIngredients(parsedIngredients);
    
    // Redirect back to Settings
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7] px-6">
      {/* Hide the default Expo Router header so we can use our custom one */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header Row */}
      <View className="flex-row items-center justify-between mt-6 mb-8">
        <Text className="font-[Geologica-Bold] text-[28px] text-[#1A202C]">
          Dislikes
        </Text>
        
        {/* Top Right Back/Close Button */}
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center bg-[#EAEAEA]"
          hitSlop={8}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
             <Path 
               d="M18 6L6 18M6 6l12 12" 
               stroke="#111111" 
               strokeWidth={2.5} 
               strokeLinecap="round" 
               strokeLinejoin="round" 
             />
          </Svg>
        </Pressable>
      </View>

      <View className="flex-1">
        <TextInput
          className="bg-white p-4 rounded-2xl font-[Geologica-Regular] text-base border border-[#E2E8F0] h-[150px]"
          placeholder="e.g. Cilantro, Olives, Mushrooms..."
          placeholderTextColor="#A0AEC0"
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
        />
        <Text className="font-[Geologica-Regular] text-sm text-[#718096] mt-3 ml-2">
          Separate ingredients with commas.
        </Text>
      </View>

      <Pressable
        className="bg-[#2C3E50] p-4 rounded-xl items-center mb-4"
        onPress={handleSave}
      >
        <Text className="font-[Geologica-SemiBold] text-white text-base">
          Save Changes
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
