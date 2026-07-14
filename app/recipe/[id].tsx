import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { getRecipe, Recipe, RecipeApiError } from "@/services/recipe-api";

interface DetailState {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
}

function initialDetailState(): DetailState {
  return { recipe: null, loading: true, error: null };
}

export default function RecipeDetailScreen() {
  // expo-router's [id].tsx convention: the segment name in the filename
  // ("id") is the key this comes back under. Route params always arrive
  // as string | string[] | undefined, never a number, regardless of what
  // looks like a number in the URL — so this still needs parsing below.
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [state, setState] = useState<DetailState>(initialDetailState());

  const load = useCallback(async (recipeId: number) => {
    setState({ recipe: null, loading: true, error: null });
    try {
      const recipe = await getRecipe(recipeId);
      setState({ recipe, loading: false, error: null });
    } catch (err: any) {
      console.error("🚨 RECIPE DETAIL FETCH CRASHED:", err);
      const message =
        err?.name === "RecipeApiError"
          ? (err as RecipeApiError).message
          : `Error: ${err?.message || "Check terminal"}`;
      setState({ recipe: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    const numericId = Number(id);

    // Number("") is 0, Number(undefined) is NaN, Number("abc") is NaN —
    // all three are invalid recipe ids, so this one check covers a missing
    // param, a non-numeric param, and an empty string param at once.
    if (!id || Number.isNaN(numericId)) {
      setState({
        recipe: null,
        loading: false,
        error: "No recipe id was provided.",
      });
      return;
    }

    load(numericId);
  }, [id, load]);

  return (
    <>
      {/* Hides the default expo-router header so the custom back button
          below is the only one shown — remove this Stack.Screen call if
          your _layout.tsx already configures headers globally and this
          would end up fighting that configuration. */}
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white">
        {/* Back button row */}
        <View className="flex-row items-center pt-14 pb-2 px-5">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#F5F5F5" }}
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

        {state.loading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        )}

        {!state.loading && state.error && (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <Text className="text-red-500 text-center">{state.error}</Text>
            <Pressable
              onPress={() => {
                const numericId = Number(id);
                if (!Number.isNaN(numericId)) load(numericId);
              }}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: "#111111" }}
            >
              <Text className="text-white font-medium">Try again</Text>
            </Pressable>
          </View>
        )}

        {!state.loading && !state.error && state.recipe && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
          >
            <Text className="text-2xl font-bold text-[#1a1a1a]">
              {state.recipe.name}
            </Text>

            <Text className="text-[#555] text-base leading-relaxed">
              {state.recipe.description}
            </Text>

            {/* Quick stats row, same visual language as RecipeCard's
                duration/calories/fats pills */}
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              <StatPill label="min" value={String(state.recipe.cook_time)} />
              <StatPill
                label="kcal"
                value={String(state.recipe.calories_per_serving)}
              />
              <StatPill label="g protein" value={String(state.recipe.protein)} />
              <StatPill
                label="servings"
                value={String(state.recipe.servings)}
              />
            </View>

            <View className="gap-2">
              <Text className="text-lg font-semibold text-[#1a1a1a]">
                Ingredients
              </Text>
              {state.recipe.ingredients.map((ing) => (
                <Text key={ing.id} className="text-[#333] text-sm">
                  • {ing.quantity} {ing.unit ?? ""} {ing.name}
                  {ing.optional ? " (optional)" : ""}
                </Text>
              ))}
            </View>

            <View className="gap-2">
              <Text className="text-lg font-semibold text-[#1a1a1a]">
                Instructions
              </Text>
              {state.recipe.instructions.map((step, i) => (
                <Text key={i} className="text-[#333] text-sm leading-relaxed">
                  {i + 1}. {step}
                </Text>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="rounded-lg"
      style={{ backgroundColor: "#EDEFF3", paddingHorizontal: 10, paddingVertical: 6 }}
    >
      <Text className="text-[#111] text-xs font-medium">
        {value} <Text className="text-[#818181]">{label}</Text>
      </Text>
    </View>
  );
}
