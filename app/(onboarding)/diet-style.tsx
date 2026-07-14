import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDietStore } from "@/stores/useDietStore";

const DIETS = [
  "Anything",
  "american",
  "french",
  "greek",
  "italian",
  "japanese",
  "mexican",
  "portuguese",
  "spanish",
  "thai",
  "turkish",
];

export default function DietStyleScreen() {
  const { diet, setDiet } = useDietStore();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7] px-6">
      <Text className="font-[Geologica-Bold] text-[28px] text-[#1A202C] mt-6 mb-8">
        What's your diet style?
      </Text>

      <ScrollView className="flex-1" contentContainerStyle={{ gap: 12 }}>
        {DIETS.map((item) => {
          const isSelected = diet === item;
          return (
            <Pressable
              key={item}
              className={`p-5 rounded-2xl border-2 ${
                isSelected
                  ? "border-[#8A84E2] bg-[#F0EFFF]"
                  : "border-[#E2E8F0] bg-white"
              }`}
              onPress={() => setDiet(item)}
            >
              <Text
                className={`text-base ${
                  isSelected
                    ? "font-[Geologica-SemiBold] text-[#2C3E50]"
                    : "font-[Geologica-Medium] text-[#4A5568]"
                }`}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        className="bg-[#2C3E50] p-4 rounded-xl items-center mb-2 mt-4"
        onPress={() => router.push("/allergies")}
      >
        <Text className="font-[Geologica-SemiBold] text-white text-base">
          Continue
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
