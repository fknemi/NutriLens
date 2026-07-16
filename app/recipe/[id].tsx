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
import {
  getRecipe,
  Recipe,
  RecipeApiError,
  parseIsoDurationToMinutes,
} from "@/services/recipe-api";
import { useAllergensStore } from "@/stores/useAllergensStore";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";

interface DetailState {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
}

function initialDetailState(): DetailState {
  return { recipe: null, loading: true, error: null };
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();

  const allergens = useAllergensStore((s) => s.allergens);
  const dislikedIngredients = useDislikedIngredientsStore((s) => s.ingredients);

  const [state, setState] = useState<DetailState>(initialDetailState());

  const load = useCallback(async (recipeId: string) => {
    setState({ recipe: null, loading: true, error: null });
    try {
      const recipe = await getRecipe(recipeId);
      setState({ recipe, loading: false, error: null });
    } catch (err: any) {
      console.error("RECIPE DETAIL FETCH CRASHED:", err);
      const message =
        err?.name === "RecipeApiError"
          ? (err as RecipeApiError).message
          : `Error: ${err?.message || "Check terminal"}`;
      setState({ recipe: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    const recipeId = Array.isArray(id) ? id[0] : id;

    if (!recipeId) {
      setState({
        recipe: null,
        loading: false,
        error: "No recipe id was provided.",
      });
      return;
    }

    load(recipeId);
  }, [id, load]);

  // Calculate warnings if the recipe is loaded
  let flaggedAllergens: string[] = [];
  let flaggedDislikes: string[] = [];

  if (state.recipe) {
    const allItems = state.recipe.ingredients.flatMap((g) => g.items);

    const matchTerms = (terms: string[]) =>
      terms.filter((term) => {
        const safeTerm = term.trim().toLowerCase();
        if (!safeTerm) return false;
        // Use word boundaries so "egg" doesn't match "eggplant"
        const regex = new RegExp(
          `\\b${safeTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i"
        );
        return allItems.some((ing) => regex.test(`${ing.name} ${ing.category}`));
      });

    flaggedAllergens = matchTerms(allergens);
    flaggedDislikes = matchTerms(dislikedIngredients);
  }

  const hasWarnings = flaggedAllergens.length > 0 || flaggedDislikes.length > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white">
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
                const recipeId = Array.isArray(id) ? id[0] : id;
                if (recipeId) load(recipeId);
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
            {hasWarnings && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2">
                <Text className="text-red-800 font-bold text-base mb-2">
                  Dietary Warning
                </Text>
                <Text className="text-red-700 text-sm leading-relaxed">
                  This recipe contains ingredients on your restriction lists:
                  {flaggedAllergens.length > 0 &&
                    `\n• Allergens: ${flaggedAllergens.join(", ")}`}
                  {flaggedDislikes.length > 0 &&
                    `\n• Dislikes: ${flaggedDislikes.join(", ")}`}
                </Text>
              </View>
            )}

            <Text className="text-2xl font-bold text-[#1a1a1a]">
              {state.recipe.name}
            </Text>

            <Text className="text-[#555] text-base leading-relaxed">
              {state.recipe.description}
            </Text>

            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              <StatPill
                label="min"
                value={String(
                  parseIsoDurationToMinutes(state.recipe.meta.total_time),
                )}
              />
              <StatPill
                label="kcal"
                value={String(state.recipe.nutrition.per_serving.calories ?? 0)}
              />
              <StatPill
                label="g protein"
                value={String(
                  state.recipe.nutrition.per_serving.protein_g ?? 0,
                )}
              />
              <StatPill
                label="servings"
                value={String(state.recipe.meta.yield_count ?? "-")}
              />
            </View>

            <View className="gap-2">
              <Text className="text-lg font-semibold text-[#1a1a1a] mt-4">
                Ingredients
              </Text>
              {state.recipe.ingredients.map((group, groupIndex) => (
                <View key={groupIndex} className="mb-3 gap-1">
                  <Text className="text-sm font-bold text-[#1a1a1a]">
                    {group.group_name}
                  </Text>
                  {/* FIXED: Using both groupIndex and ingredient index to guarantee unique keys */}
                  {group.items.map((ing, index) => (
                    <Text key={`${groupIndex}-${index}`} className="text-[#333] text-sm">
                      • {ing.quantity ? `${ing.quantity} ` : ""}
                      {ing.unit ? `${ing.unit} ` : ""}
                      {ing.name}
                      {ing.optional ? " (optional)" : ""}
                    </Text>
                  ))}
                </View>
              ))}
            </View>

            <View className="gap-2">
              <Text className="text-lg font-semibold text-[#1a1a1a] mt-4">
                Instructions
              </Text>
              {state.recipe.instructions?.map((step) => (
                <Text
                  key={step.step_number}
                  className="text-[#333] text-sm leading-relaxed mb-2"
                >
                  {step.step_number}. {step.text}
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
      style={{
        backgroundColor: "#EDEFF3",
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text className="text-[#111] text-xs font-medium">
        {value} <Text className="text-[#818181]">{label}</Text>
      </Text>
    </View>
  );
}
