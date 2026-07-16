import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAllergensStore } from '@/stores/useAllergensStore';

const ALLERGENS = [
  "Dairy", "Eggs", "Tree Nuts", "Peanuts", "Shellfish",
  "Wheat", "Soy", "Gluten", "Fish", "Sesame", "Mustard",
  "Celery", "Lupin", "Corn", "Coconut", "Garlic",
  "Onion", "Sulphites", "Molluscs", "Nightshades",
];

export default function EditAllergiesScreen() {
  const { allergens, toggleAllergen, addCustomAllergen } = useAllergensStore();
  const [customInput, setCustomInput] = useState('');

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) {
      addCustomAllergen(trimmed);
      setCustomInput('');
    }
  };

  const customAllergens = allergens.filter((a) => !ALLERGENS.includes(a));

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7] px-6">
      {/* Hide the default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header Row */}
      <View className="flex-row items-center justify-between mt-6 mb-8">
        <Text className="font-[Geologica-Bold] text-[28px] text-[#1A202C]">
          Allergies
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

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="flex-row flex-wrap gap-3">
          {[...ALLERGENS, ...customAllergens].map((item) => {
            const isSelected = allergens.includes(item);
            return (
              <Pressable
                key={item}
                className={`py-3 px-5 rounded-full border ${
                  isSelected
                    ? 'bg-[#8A84E2] border-[#8A84E2]'
                    : 'bg-white border-[#E2E8F0]'
                }`}
                onPress={() => toggleAllergen(item)}
              >
                <Text
                  className={`font-[Geologica-Medium] text-[15px] ${
                    isSelected ? 'text-white' : 'text-[#4A5568]'
                  }`}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Custom allergen input */}
      <View className="flex-row items-center gap-2 mt-4 mb-3">
        <TextInput
          className="flex-1 bg-white border border-[#E2E8F0] rounded-full px-5 py-3 font-[Geologica-Regular] text-[15px] text-[#1A202C]"
          placeholder="Add custom allergen..."
          placeholderTextColor="#A0AEC0"
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={handleAddCustom}
          returnKeyType="done"
        />
        <Pressable
          className="bg-[#8A84E2] rounded-full px-5 py-3"
          onPress={handleAddCustom}
        >
          <Text className="font-[Geologica-SemiBold] text-white text-[15px]">Add</Text>
        </Pressable>
      </View>

      <Pressable
        className="bg-[#2C3E50] p-4 rounded-xl items-center mb-4 mt-2"
        onPress={() => router.back()}
      >
        <Text className="font-[Geologica-SemiBold] text-white text-base">
          Save Changes
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
