import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F5F8F7" },
      }}
    >
      <Stack.Screen name="intro" />
      <Stack.Screen name="discover" />
      <Stack.Screen name="diet-style" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="dislikes" />
      <Stack.Screen name="all-set" />
    </Stack>
  );
}
