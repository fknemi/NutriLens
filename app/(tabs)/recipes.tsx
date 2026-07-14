import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { Selectors } from "@/components/selectors";
import Svg, { Path } from "react-native-svg";
import RecipeCard from "@/components/recipe-card";
import { useAllergensStore } from "@/stores/useAllergensStore";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useDietStore } from "@/stores/useDietStore";
import { useSavedRecipesStore } from "@/stores/useRecipesStore";
import {
  listVeganRecipes,
  listNonVegRecipes,
  searchAllRecipes,
  Recipe,
  RecipeApiError,
  CountryCode,
} from "@/services/recipe-api";
import { useRouter } from "expo-router";

const TABS = ["veg", "non-veg", "saved"] as const;
type TabKey = (typeof TABS)[number];

const PER_PAGE = 40;
const ACTIVE_COUNTRY: CountryCode | undefined = "IN";
const MAX_AUTO_ADVANCE_PAGES = 10;

const DIET_OPTIONS = [
  "Anything",
  "Asian",
  "American",
  "French",
  "Greek",
  "Italian",
  "Japanese",
  "Mexican",
  "Portuguese",
  "Spanish",
  "Thai",
  "Turkish",
];

interface TabState {
  recipes: Recipe[];
  page: number; // API page
  displayPage: number; // Local UI page
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

function initialTabState(): TabState {
  return {
    recipes: [],
    page: 1,
    displayPage: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: null,
  };
}

function mergeRecipes(existing: Recipe[] = [], incoming: Recipe[] = []) {
  const safeExisting = existing || [];
  const safeIncoming = incoming || [];

  const map = new Map(safeExisting.map((r) => [r.id, r]));
  safeIncoming.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

export default function RecipesScreen() {
  const [activeSelector, setActiveSelector] = useState(0);
  const activeIndex = useSharedValue(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  const allergens = useAllergensStore((state) => state.allergens);
  const dislikedIngredients = useDislikedIngredientsStore(
    (state) => state.ingredients,
  );
  const searchValue = useSearchStore((state) => state.value);

  const savedRecipesMap = useSavedRecipesStore((state) => state.savedRecipes);
  const savedRecipes = useMemo(
    () => Object.values(savedRecipesMap),
    [savedRecipesMap],
  );

  const globalDiet = useDietStore((state) => state.diet);
  const [localCuisine, setLocalCuisine] = useState(globalDiet);

  const [tabState, setTabState] = useState<Record<TabKey, TabState>>({
    veg: initialTabState(),
    "non-veg": initialTabState(),
    saved: initialTabState(),
  });

  const [searchState, setSearchState] = useState<TabState>(initialTabState());

  const activeTab: TabKey = TABS[activeSelector];
  const isSearching = searchValue.trim().length > 0;

  const fetchInFlight = useRef<Record<TabKey, boolean>>({
    veg: false,
    "non-veg": false,
    saved: false,
  });
  const searchFetchInFlight = useRef(false);

  function handleSelect(index: number) {
    setActiveSelector(index);
    activeIndex.value = withTiming(index, { duration: 300 });
  }

  function patchTab(tab: TabKey, patch: Partial<TabState>) {
    setTabState((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }

  const filterLocally = useCallback(
    (recipes: Recipe[]) => {
      return recipes.filter((recipe) => {
        const ingredientsText =
          recipe.ingredients?.map((i) => i.name.toLowerCase()).join(" ") || "";

        const safeAllergens = allergens || [];
        const safeDislikes = dislikedIngredients || [];

        const hasAllergen = safeAllergens.some((a) =>
          ingredientsText.includes(a.toLowerCase()),
        );
        const hasDislike = safeDislikes.some((d) =>
          ingredientsText.includes(d.toLowerCase()),
        );

        return !hasAllergen && !hasDislike;
      });
    },
    [allergens, dislikedIngredients],
  );

  const loadVegPage = useCallback(
    async (
      startPage: number,
      isInitial: boolean,
      currentRecipeCount = 0,
      targetLocalCount = PER_PAGE,
    ) => {
      if (fetchInFlight.current.veg) return;
      fetchInFlight.current.veg = true;

      patchTab(
        "veg",
        isInitial ? { loading: true, error: null } : { loadingMore: true },
      );

      try {
        let page = startPage;
        let newItems: Recipe[] = [];
        let lastPage = page;
        let consecutiveEmptyPages = 0;

        const cuisineParam =
          localCuisine === "Anything" ? undefined : localCuisine.toLowerCase();

        while (true) {
          const apiPayload = {
            page,
            per_page: PER_PAGE,
            country: ACTIVE_COUNTRY,
            cuisine: cuisineParam,
          };

          const res = await listVeganRecipes(apiPayload);
          lastPage = res.meta.last_page;

          const validRecipes = filterLocally(res.data);
          newItems = [...newItems, ...validRecipes];

          console.log(
            `📄 API RETURNED: Page ${page} out of ${lastPage}. Valid locally: ${validRecipes.length}`,
          );

          const apiHasMorePages = page < res.meta.last_page;
          const projectedTotal = currentRecipeCount + newItems.length;

          if (!apiHasMorePages || projectedTotal >= targetLocalCount) break;

          if (validRecipes.length === 0) {
            consecutiveEmptyPages += 1;
          } else {
            consecutiveEmptyPages = 0;
          }

          if (consecutiveEmptyPages >= MAX_AUTO_ADVANCE_PAGES) break;
          page += 1;
        }

        setTabState((prev) => {
          const merged = mergeRecipes(prev.veg.recipes, newItems);
          return {
            ...prev,
            veg: {
              ...prev.veg,
              recipes: merged,
              page,
              hasMore: page < lastPage,
              loading: false,
              loadingMore: false,
              error: null,
            },
          };
        });
      } catch (err: any) {
        console.error("🚨 VEG FETCH CRASHED:", err);
        const message =
          err?.name === "RecipeApiError"
            ? err.message
            : `Error: ${err?.message || "Check terminal"}`;
        patchTab("veg", { loading: false, loadingMore: false, error: message });
      } finally {
        fetchInFlight.current.veg = false;
      }
    },
    [filterLocally, localCuisine],
  );

  const loadNonVegPage = useCallback(
    async (
      startPage: number,
      isInitial: boolean,
      currentRecipeCount = 0,
      targetLocalCount = PER_PAGE,
    ) => {
      if (fetchInFlight.current["non-veg"]) return;
      fetchInFlight.current["non-veg"] = true;

      patchTab(
        "non-veg",
        isInitial ? { loading: true, error: null } : { loadingMore: true },
      );

      try {
        let page = startPage;
        let newItems: Recipe[] = [];
        let lastPage = page;
        let consecutiveEmptyPages = 0;

        const cuisineParam =
          localCuisine === "Anything" ? undefined : localCuisine.toLowerCase();

        while (true) {
          const apiPayload = {
            page,
            per_page: PER_PAGE,
            country: ACTIVE_COUNTRY,
            cuisine: cuisineParam,
          };

          const res = await listNonVegRecipes(apiPayload);
          lastPage = res.meta.last_page;

          const validRecipes = filterLocally(res.data);
          newItems = [...newItems, ...validRecipes];

          console.log(
            `📄 API RETURNED: Page ${page} out of ${lastPage}. Valid locally: ${validRecipes.length}`,
          );

          const apiHasMorePages = page < res.meta.last_page;
          const projectedTotal = currentRecipeCount + newItems.length;

          if (!apiHasMorePages || projectedTotal >= targetLocalCount) break;

          if (validRecipes.length === 0) {
            consecutiveEmptyPages += 1;
          } else {
            consecutiveEmptyPages = 0;
          }

          if (consecutiveEmptyPages >= MAX_AUTO_ADVANCE_PAGES) break;
          page += 1;
        }

        setTabState((prev) => {
          const merged = mergeRecipes(prev["non-veg"].recipes, newItems);
          return {
            ...prev,
            "non-veg": {
              ...prev["non-veg"],
              recipes: merged,
              page,
              hasMore: page < lastPage,
              loading: false,
              loadingMore: false,
              error: null,
            },
          };
        });
      } catch (err: any) {
        console.error("🚨 NON-VEG FETCH CRASHED:", err);
        const message =
          err?.name === "RecipeApiError"
            ? err.message
            : `Error: ${err?.message || "Check terminal"}`;
        patchTab("non-veg", {
          loading: false,
          loadingMore: false,
          error: message,
        });
      } finally {
        fetchInFlight.current["non-veg"] = false;
      }
    },
    [filterLocally, localCuisine],
  );

  const runSearch = useCallback(
    async (query: string) => {
      if (searchFetchInFlight.current) return;
      searchFetchInFlight.current = true;

      setSearchState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const cuisineParam =
          localCuisine === "Anything" ? undefined : localCuisine.toLowerCase();

        const res = await searchAllRecipes(query, {
          per_page: PER_PAGE,
          country: ACTIVE_COUNTRY,
          cuisine: cuisineParam,
        });

        const validRecipes = filterLocally(res.data);

        setSearchState({
          recipes: validRecipes,
          page: 1,
          displayPage: 1,
          hasMore: false,
          loading: false,
          loadingMore: false,
          error: null,
        });
      } catch (err: any) {
        console.error("🚨 SEARCH FETCH CRASHED:", err);
        const message =
          err?.name === "RecipeApiError"
            ? err.message
            : `Error: ${err?.message || "Check terminal"}`;
        setSearchState((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error: message,
        }));
      } finally {
        searchFetchInFlight.current = false;
      }
    },
    [filterLocally, localCuisine],
  );

  useEffect(() => {
    if (activeTab === "saved" || isSearching) return;
    const state = tabState[activeTab];

    if (
      state.recipes.length === 0 &&
      !state.loading &&
      state.error === null &&
      state.hasMore
    ) {
      if (activeTab === "veg") loadVegPage(1, true, 0, PER_PAGE);
      else if (activeTab === "non-veg") loadNonVegPage(1, true, 0, PER_PAGE);
    }
  }, [activeTab, isSearching, loadVegPage, loadNonVegPage]);

  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    setTabState((prev) => ({
      veg: initialTabState(),
      "non-veg": initialTabState(),
      saved: prev.saved,
    }));

    if (isSearching) {
      runSearch(searchValue.trim());
      return;
    }

    if (activeTab === "veg") loadVegPage(1, true, 0, PER_PAGE);
    else if (activeTab === "non-veg") loadNonVegPage(1, true, 0, PER_PAGE);
  }, [allergens, dislikedIngredients, localCuisine]);

  const isFirstSearchRun = useRef(true);
  useEffect(() => {
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }

    const trimmed = searchValue.trim();
    if (trimmed.length > 0) {
      runSearch(trimmed);
    } else {
      setSearchState(initialTabState());
    }
  }, [searchValue, runSearch]);

  const current =
    isSearching && activeTab !== "saved"
      ? searchState
      : activeTab === "saved"
        ? { ...tabState.saved, recipes: savedRecipes, hasMore: false }
        : tabState[activeTab];

  function handlePageChange(newPage: number) {
    if (isSearching) {
      setSearchState((prev) => ({ ...prev, displayPage: newPage }));
      return;
    }

    if (activeTab === "saved") {
      patchTab("saved", { displayPage: newPage });
      return;
    }

    const state = tabState[activeTab];
    patchTab(activeTab, { displayPage: newPage });

    const neededItems = newPage * PER_PAGE;

    if (
      state.recipes.length < neededItems &&
      state.hasMore &&
      !state.loading &&
      !state.loadingMore
    ) {
      if (activeTab === "veg") {
        loadVegPage(state.page + 1, false, state.recipes.length, neededItems);
      } else if (activeTab === "non-veg") {
        loadNonVegPage(
          state.page + 1,
          false,
          state.recipes.length,
          neededItems,
        );
      }
    }
  }

  // Unified loading state: Only stops being true when ALL loops in the API call are completely done.
  const isLoading = current.loading || current.loadingMore;

  const totalItems = current.recipes.length;
  const totalDisplayPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
  const maxClickablePage = current.hasMore
    ? totalDisplayPages + 1
    : totalDisplayPages;
  const { displayPage } = current;

  const visibleRecipes = current.recipes.slice(
    (displayPage - 1) * PER_PAGE,
    displayPage * PER_PAGE,
  );

  return (
    <View className="flex-1 items-center justify-start mt-12 gap-8 flex">
      {/* Top Header Row */}
      <View className="flex-row pl-5 pr-12 items-center justify-between w-full">
        <View className="flex flex-row">
          <Selectors
            items={[
              { key: "veg", label: "Veg" },
              { key: "non-veg", label: "Non-Veg" },
              { key: "saved", label: "Saved" },
            ]}
            activeSelector={activeSelector}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            theme="light"
          />
        </View>

        {/* Filter Trigger */}
        <Pressable onPress={() => setIsFilterOpen(true)} className="p-2 -mr-2">
          <Svg width="27" height="14" viewBox="0 0 27 14" fill="none">
            <Path
              d="M22.3448 7C22.3448 7.3713 22.1977 7.7274 21.9358 7.98995C21.6739 8.2525 21.3187 8.4 20.9483 8.4H6.05172C5.68134 8.4 5.32612 8.2525 5.06421 7.98995C4.80231 7.7274 4.65517 7.3713 4.65517 7C4.65517 6.6287 4.80231 6.2726 5.06421 6.01005C5.32612 5.7475 5.68134 5.6 6.05172 5.6H20.9483C21.3187 5.6 21.6739 5.7475 21.9358 6.01005C22.1977 6.2726 22.3448 6.6287 22.3448 7ZM25.6034 0H1.39655C1.02616 1.10657e-08 0.670945 0.147499 0.409041 0.41005C0.147136 0.672601 0 1.0287 0 1.4C0 1.7713 0.147136 2.1274 0.409041 2.38995C0.670945 2.6525 1.02616 2.8 1.39655 2.8H25.6034C25.9738 2.8 26.3291 2.6525 26.591 2.38995C26.8529 2.1274 27 1.7713 27 1.4C27 1.0287 26.8529 0.672601 26.591 0.41005C26.3291 0.147499 25.9738 1.10657e-08 25.6034 0ZM16.2931 11.2H10.7069C10.3365 11.2 9.98129 11.3475 9.71939 11.6101C9.45748 11.8726 9.31034 12.2287 9.31034 12.6C9.31034 12.9713 9.45748 13.3274 9.71939 13.5899C9.98129 13.8525 10.3365 14 10.7069 14H16.2931C16.6635 14 17.0187 13.8525 17.2806 13.5899C17.5425 13.3274 17.6897 12.9713 17.6897 12.6C17.6897 12.2287 17.5425 11.8726 17.2806 11.6101C17.0187 11.3475 16.6635 11.2 16.2931 11.2Z"
              fill="black"
            />
          </Svg>
        </Pressable>
      </View>

      {/* Lists & States */}
      {isLoading && (
        <View className="items-center justify-center w-full py-16 flex-1">
          <ActivityIndicator size="large" />
          <Text className="text-gray-500 mt-4 font-medium">
            Fetching recipes...
          </Text>
        </View>
      )}

      {!isLoading && current.error && (
        <View className="items-center justify-center w-full px-5 py-8">
          <Text className="text-red-500 text-center">{current.error}</Text>
        </View>
      )}

      {!isLoading &&
        !current.error &&
        activeTab === "saved" &&
        !isSearching &&
        current.recipes.length === 0 && (
          <View className="items-center justify-center w-full px-5 py-8">
            <Text className="text-gray-400 text-center">
              No saved recipes yet. Tap the heart on any recipe to save it here.
            </Text>
          </View>
        )}

      {!isLoading &&
        !current.error &&
        (activeTab !== "saved" || isSearching) &&
        current.recipes.length === 0 && (
          <View className="items-center justify-center w-full px-5 py-8">
            <Text className="text-gray-400 text-center">
              No recipes found matching your criteria.
            </Text>
          </View>
        )}

      {!isLoading && !current.error && totalItems > 0 && (
        <ScrollView
          className="w-full"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
            gap: 16,
          }}
          scrollEventThrottle={16}
        >
          {Array.from(
            { length: Math.ceil(visibleRecipes.length / 2) },
            (_, rowIndex) => {
              const left = visibleRecipes[rowIndex * 2];
              const right = visibleRecipes[rowIndex * 2 + 1];
              return (
                <View key={left.id} style={{ flexDirection: "row", gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <RecipeCard
                      title={left.name}
                      duration={String(left.cook_time)}
                      calories={left.calories_per_serving}
                      fats={left.protein}
                      recipe={left}
                      onPress={(id) => router.push(`/recipe/${left.id}`)}
                    />
                  </View>
                  {right ? (
                    <View style={{ flex: 1 }}>
                      <RecipeCard
                        title={right.name}
                        duration={String(right.cook_time)}
                        calories={right.calories_per_serving}
                        fats={right.protein}
                        recipe={right}
                        onPress={(id) => router.push(`/recipe/${right.id}`)}
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                </View>
              );
            },
          )}

          {/* Pagination Controls */}
          {!(activeTab === "saved" && totalItems <= PER_PAGE) && (
            <View className="flex-row items-center justify-center gap-4 py-8 mt-4 w-full border-t border-gray-100">
              <Pressable
                disabled={displayPage === 1}
                onPress={() => handlePageChange(displayPage - 1)}
                className={`px-4 py-2 rounded-lg ${displayPage === 1 ? "bg-gray-200" : "bg-black"}`}
              >
                <Text
                  className={`${displayPage === 1 ? "text-gray-400" : "text-white"} font-bold`}
                >
                  Prev
                </Text>
              </Pressable>

              <Text className="text-gray-600 font-medium">
                Page {displayPage}{" "}
                {maxClickablePage > 1
                  ? `of ${Math.max(displayPage, totalDisplayPages)}`
                  : ""}
              </Text>

              <Pressable
                disabled={displayPage >= maxClickablePage && !current.hasMore}
                onPress={() => handlePageChange(displayPage + 1)}
                className={`px-4 py-2 rounded-lg ${displayPage >= maxClickablePage && !current.hasMore ? "bg-gray-200" : "bg-black"}`}
              >
                <Text
                  className={`${displayPage >= maxClickablePage && !current.hasMore ? "text-gray-400" : "text-white"} font-bold`}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Filter Menu Modal */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-start items-end"
          onPress={() => setIsFilterOpen(false)}
        >
          <Pressable
            className="w-2/3 h-full bg-white shadow-xl pt-16 px-6 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Dietary Filter
              </Text>
              <Pressable onPress={() => setIsFilterOpen(false)}>
                <Text className="text-gray-500 font-bold text-lg">✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {DIET_OPTIONS.map((option) => {
                const isSelected = localCuisine === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setLocalCuisine(option);
                      setIsFilterOpen(false);
                    }}
                    className={`flex-row justify-between items-center py-4 border-b border-gray-100 ${
                      isSelected ? "bg-gray-50 -mx-6 px-6" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${isSelected ? "font-bold text-black" : "text-gray-600"}`}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <Text className="text-green-600 font-bold text-lg">
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
