// stores/useMealsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Recipe,
  RecipeApiError,
  searchAllRecipes,
  hasMorePages,
} from "@/services/recipe-api";

const PER_PAGE = 20;

// --- Saved meals -------------------------------------------------------
//
// Keyed by Recipe.id (string), same convention as useSavedRecipesStore. 
// Stores the full Recipe object as-is (no slimmer "Meal" type) per product decision.

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

// Represents a full day's template of meals
type MealPlan = Record<MealCategory, Record<string, Recipe>>;

interface SavedMealsSlice {
  basePlan: MealPlan; // The ongoing standard template
  history: Record<string, MealPlan>; // Frozen daily snapshots keyed by "YYYY-MM-DD"
  
  saveMeal: (meal: Recipe, category: MealCategory) => void;
  unsaveMeal: (id: string, category: MealCategory) => void;
  isMealSaved: (id: string, category: MealCategory) => boolean;
  
  // Gets the meals for a specific date (uses history if available, otherwise base)
  getPlanForDate: (dateISO: string) => MealPlan;
  // Called when the app opens or loads the card to lock in today's baseline
  syncTodaySnapshot: () => void;
}

// --- Search (local to the modal) ---------------------------------------
//
// recipes.tsx drives search off a global useSearchStore because search
// there overrides whatever tab is active app-wide. The meals modal owns
// its own text input instead, so search state here is just "the current
// query + its results".

interface SearchState {
  query: string;
  results: Recipe[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

function initialSearchState(): SearchState {
  return {
    query: "",
    results: [],
    page: 1,
    hasMore: false,
    loading: false,
    loadingMore: false,
    error: null,
  };
}

function mergeById(existing: Recipe[], incoming: Recipe[]): Recipe[] {
  const map = new Map(existing.map((r) => [r.id, r]));
  incoming.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

interface SearchSlice {
  search: SearchState;
  setQuery: (query: string) => void;
  runSearch: (query: string) => Promise<void>;
  loadMoreSearchResults: () => Promise<void>;
  clearSearch: () => void;
}

type MealsStore = SavedMealsSlice & SearchSlice;

// Tracks which query is the most recent one requested. A response that
// resolves after a newer query has already started is stale and must be
// discarded rather than overwriting fresher results.
let latestRequestToken = 0;

const emptyPlan: MealPlan = { breakfast: {}, lunch: {}, dinner: {}, snack: {} };

export const useMealsStore = create<MealsStore>()(
  persist(
    (set, get) => ({
      // --- saved meals (Baseline + History) ---
      basePlan: emptyPlan,
      history: {},

      syncTodaySnapshot: () => {
        const today = new Date().toISOString().slice(0, 10);
        const state = get();
        // If today doesn't have a snapshot yet, lock in the current base plan
        if (!state.history[today]) {
          set({ history: { ...state.history, [today]: state.basePlan } });
        }
      },

      getPlanForDate: (dateISO) => {
        // Return the frozen snapshot for that day. If it doesn't exist, fall back to basePlan.
        return get().history[dateISO] || get().basePlan;
      },

      saveMeal: (meal, category) =>
        set((state) => {
          const today = new Date().toISOString().slice(0, 10);
          const nextBasePlan = {
            ...state.basePlan,
            [category]: { ...state.basePlan[category], [meal.id]: meal },
          };

          return {
            basePlan: nextBasePlan,
            history: {
              ...state.history,
              [today]: nextBasePlan, // Sync today's snapshot with the new baseline
            },
          };
        }),

      unsaveMeal: (id, category) =>
        set((state) => {
          const today = new Date().toISOString().slice(0, 10);
          const nextCategoryMeals = { ...state.basePlan[category] };
          delete nextCategoryMeals[id];

          const nextBasePlan = {
            ...state.basePlan,
            [category]: nextCategoryMeals,
          };

          return {
            basePlan: nextBasePlan,
            history: {
              ...state.history,
              [today]: nextBasePlan, // Sync today's snapshot with the new baseline
            },
          };
        }),

      // UI still checks if a meal is saved against the *current* base plan
      isMealSaved: (id, category) => id in get().basePlan[category],

      // --- search ---
      search: initialSearchState(),

      setQuery: (query) =>
        set((state) => ({ search: { ...state.search, query } })),

      runSearch: async (query) => {
        const trimmed = query.trim();
        const token = ++latestRequestToken;

        if (trimmed.length === 0) {
          if (token === latestRequestToken) {
            set({ search: initialSearchState() });
          }
          return;
        }

        set((state) => ({
          search: { ...state.search, query, loading: true, error: null },
        }));

        try {
          const res = await searchAllRecipes(trimmed, {
            per_page: PER_PAGE,
            page: 1,
          });

          if (token !== latestRequestToken) return;

          set((state) => ({
            search: {
              ...state.search,
              query,
              results: res.data,
              page: 1,
              hasMore: hasMorePages(res.meta),
              loading: false,
              loadingMore: false,
              error: null,
            },
          }));
        } catch (err: any) {
          if (token !== latestRequestToken) return;

          const message =
            err instanceof RecipeApiError
              ? err.message
              : `Error: ${err?.message ?? "search failed"}`;

          set((state) => ({
            search: {
              ...state.search,
              loading: false,
              loadingMore: false,
              error: message,
            },
          }));
        }
      },

      loadMoreSearchResults: async () => {
        const { search } = get();
        if (!search.hasMore || search.loading || search.loadingMore) {
          return;
        }

        const token = ++latestRequestToken;
        set((state) => ({
          search: { ...state.search, loadingMore: true, error: null },
        }));

        try {
          const nextPage = search.page + 1;
          const res = await searchAllRecipes(search.query, {
            per_page: PER_PAGE,
            page: nextPage,
          });

          if (token !== latestRequestToken) return;

          set((state) => ({
            search: {
              ...state.search,
              results: mergeById(state.search.results, res.data),
              page: nextPage,
              hasMore: hasMorePages(res.meta),
              loading: false,
              loadingMore: false,
              error: null,
            },
          }));
        } catch (err: any) {
          if (token !== latestRequestToken) return;

          const message =
            err instanceof RecipeApiError
              ? err.message
              : `Error: ${err?.message ?? "search failed"}`;

          set((state) => ({
            search: { ...state.search, loadingMore: false, error: message },
          }));
        }
      },

      clearSearch: () => set({ search: initialSearchState() }),
    }),
    {
      name: "saved-meals-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist BOTH the base plan and the history snapshots
      partialize: (state) => ({ basePlan: state.basePlan, history: state.history }),
    }
  )
);
