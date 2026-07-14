import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useMealsStore, MealCategory } from "@/stores/useMealsStore";
import { useSavedRecipesStore } from "@/stores/useRecipesStore";
import { Recipe } from "@/services/recipe-api";

interface MealSearchModalProps {
  visible: boolean;
  category: MealCategory | null;
  onClose: () => void;
}

// Debounced the same way a search-as-you-type field generally should be:
// fire on pause, not on every keystroke, to avoid hammering the API while
// someone is still typing. 400ms split the difference between "feels
// instant" and "doesn't fire on every letter."
const SEARCH_DEBOUNCE_MS = 400;

// Stable empty-object reference for when category is null (modal closed /
// mid-transition). Must be a module-level constant, not created inline in
// the selector below — a `{}` literal inside the selector is a new
// reference on every render, which Zustand's reference-equality check
// reads as "changed," triggering a re-render, which re-runs the selector,
// which returns another new `{}` — an infinite update loop.
const EMPTY_SAVED_MEALS: Record<number, Recipe> = {};

const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

// Which non-search list is showing. Persists independently of search —
// typing a query overlays search results on top of the list area without
// changing this, so clearing the query goes back to whichever tab was
// already selected rather than resetting to a default.
type ModalView = "saved" | "favourites";

function MealResultRow({
  meal,
  isSaved,
  onToggleSave,
}: {
  meal: Recipe;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3">
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-[#111]" numberOfLines={1}>
          {meal.name}
        </Text>
        <Text className="text-sm text-gray-500">
          {meal.calories_per_serving} kcal
        </Text>
      </View>
      <Pressable
        onPress={onToggleSave}
        hitSlop={8}
        className={`px-3 py-2 rounded-full ${isSaved ? "bg-[#EDEFF3]" : "bg-black"}`}
      >
        <Text className={`text-sm font-bold ${isSaved ? "text-gray-500" : "text-white"}`}>
          {isSaved ? "Saved" : "+ Save"}
        </Text>
      </Pressable>
    </View>
  );
}

function ViewTabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className={`px-4 py-2 rounded-full ${isActive ? "bg-black" : "bg-[#EDEFF3]"}`}
    >
      <Text className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-500"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MealSearchModal({
  visible,
  category,
  onClose,
}: MealSearchModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeView, setActiveView] = useState<ModalView>("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useMealsStore((state) => state.search);
  const runSearch = useMealsStore((state) => state.runSearch);
  const loadMoreSearchResults = useMealsStore((state) => state.loadMoreSearchResults);
  const clearSearch = useMealsStore((state) => state.clearSearch);

  // Falls back to a stable empty object when category is null (modal
  // closed / mid-transition) so hook order stays stable and savedMeals
  // below is always a valid Record rather than undefined.
  const savedMealsMap = useMealsStore((state) =>
    category ? state.savedMeals[category] : EMPTY_SAVED_MEALS
  );
  const saveMeal = useMealsStore((state) => state.saveMeal);
  const unsaveMeal = useMealsStore((state) => state.unsaveMeal);
  const savedMeals = Object.values(savedMealsMap);

  // App-wide favourited recipes, separate from this modal's per-category
  // "added to today's Lunch/Dinner/etc" saves. Read-only here — favouriting
  // and unfavouriting happens wherever this store is the source of truth
  // elsewhere in the app, not from this modal.
  const favouriteRecipesMap = useSavedRecipesStore((state) => state.savedRecipes);
  const favouriteRecipes = Object.values(favouriteRecipesMap);

  // Reset local input + clear stale results each time the modal opens,
  // so reopening it doesn't show last session's leftover query/results.
  // Tab selection (activeView) intentionally is NOT reset here — it's
  // meant to persist across modal opens the same way it persists across
  // a single search-then-clear cycle.
  useEffect(() => {
    if (visible) {
      setInputValue("");
      clearSearch();
    }
  }, [visible, clearSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      runSearch(inputValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  function handleToggleSave(meal: Recipe) {
    if (!category) return;

    if (meal.id in savedMealsMap) {
      unsaveMeal(meal.id, category);
    } else {
      saveMeal(meal, category);
    }
  }

  const isSearchActive = inputValue.trim().length > 0;
  const categoryLabel = category ? CATEGORY_LABELS[category] : "";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl pt-6 px-5 pb-8"
          style={{ maxHeight: "85%", flexShrink: 1, minHeight: "60%" }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Add to {categoryLabel}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-gray-500 font-bold text-lg">✕</Text>
            </Pressable>
          </View>

          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Search meals..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            className="bg-[#EDEFF3] rounded-2xl px-4 py-3 text-base text-[#111] mb-4"
          />

          {/* Tab row stays visible and tappable even while searching —
              tapping a tab while a query is active just updates activeView
              for when the query is later cleared; it doesn't interrupt
              the in-progress search. */}
          <View className="flex-row gap-2 mb-4">
            <ViewTabButton
              label={`Saved (${savedMeals.length})`}
              isActive={activeView === "saved"}
              onPress={() => setActiveView("saved")}
            />
            <ViewTabButton
              label={`Favourites (${favouriteRecipes.length})`}
              isActive={activeView === "favourites"}
              onPress={() => setActiveView("favourites")}
            />
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {isSearchActive ? (
              <View className="gap-2">
                {search.loading && (
                  <View className="items-center py-6">
                    <ActivityIndicator />
                  </View>
                )}

                {!search.loading && search.error && (
                  <Text className="text-red-500 px-1">{search.error}</Text>
                )}

                {!search.loading && !search.error && search.results.length === 0 && (
                  <Text className="text-gray-400 px-1">No meals found.</Text>
                )}

                {!search.loading &&
                  !search.error &&
                  search.results.map((meal) => (
                    <MealResultRow
                      key={meal.id}
                      meal={meal}
                      isSaved={meal.id in savedMealsMap}
                      onToggleSave={() => handleToggleSave(meal)}
                    />
                  ))}

                {!search.loading && !search.error && search.hasMore && (
                  <Pressable
                    onPress={loadMoreSearchResults}
                    disabled={search.loadingMore}
                    className="items-center py-3"
                  >
                    {search.loadingMore ? (
                      <ActivityIndicator />
                    ) : (
                      <Text className="text-gray-500 font-semibold">Load more</Text>
                    )}
                  </Pressable>
                )}
              </View>
            ) : activeView === "saved" ? (
              <View className="gap-2">
                {savedMeals.length === 0 && (
                  <Text className="text-gray-400 px-1">
                    No saved meals yet. Search above and tap Save.
                  </Text>
                )}

                {savedMeals.map((meal) => (
                  <MealResultRow
                    key={meal.id}
                    meal={meal}
                    isSaved={true}
                    onToggleSave={() => handleToggleSave(meal)}
                  />
                ))}
              </View>
            ) : (
              <View className="gap-2">
                {favouriteRecipes.length === 0 && (
                  <Text className="text-gray-400 px-1">
                    No favourited recipes yet.
                  </Text>
                )}

                {favouriteRecipes.map((meal) => (
                  <MealResultRow
                    key={meal.id}
                    meal={meal}
                    isSaved={meal.id in savedMealsMap}
                    onToggleSave={() => handleToggleSave(meal)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
