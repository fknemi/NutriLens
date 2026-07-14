import { View, Text, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";

export default function Dislikes() {
  const { ingredients, setIngredients } = useDislikedIngredientsStore();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7] px-6">
      <View className="flex-1">
        <Text className="font-[Geologica-Bold] text-[28px] text-[#1A202C] mt-6 mb-2">
          Ingredients you dislike
        </Text>
        <Text className="font-[Geologica-Regular] text-base text-[#718096] mb-8">
          We'll keep these out of your recipe recommendations.
        </Text>

        <TextInput
          className="bg-white p-4 rounded-2xl font-[Geologica-Regular] text-base border border-[#E2E8F0] h-[150px]"
          placeholder="e.g. Cilantro, Olives, Mushrooms..."
          placeholderTextColor="#A0AEC0"
          value={ingredients}
          onChangeText={setIngredients}
          multiline
          textAlignVertical="top"
        />
      </View>

      <Pressable
        className="bg-[#2C3E50] p-4 rounded-xl items-center mb-2"
        onPress={() => router.push("/all-set")}
      >
        <Text className="font-[Geologica-SemiBold] text-white text-base">
          Continue
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
