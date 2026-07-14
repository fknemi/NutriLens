import { create } from "zustand";
import {
  Recipe,
  RecipeApiError,
  searchAllRecipes,
} from "@/services/recipe-api";

const PER_PAGE = 20;

// --- Saved meals -------------------------------------------------------
//
// Keyed by Recipe.id, same convention as useSavedRecipesStore. Stores the
// full Recipe object as-is (no slimmer "Meal" type) per product decision.

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

interface SavedMealsSlice {
  // Now grouped by category, then by Recipe.id
  savedMeals: Record<MealCategory, Record<number, Recipe>>;
  saveMeal: (meal: Recipe, category: MealCategory) => void;
  unsaveMeal: (id: number, category: MealCategory) => void;
  isMealSaved: (id: number, category: MealCategory) => boolean;
}
// --- Search (local to the modal) ---------------------------------------
//
// recipes.tsx drives search off a global useSearchStore because search
// there overrides whatever tab is active app-wide. The meals modal owns
// its own text input instead, so search state here is just "the current
// query + its results" — no tab key, no global store, no veg/non-veg
// auto-advance loop (there's no client-side classification step to
// backfill empty pages for, unlike listVeganRecipes/listNonVegRecipes).

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
// discarded rather than overwriting fresher results — see the staleness
// check in runSearch/loadMoreSearchResults below.
//
// This replaces a simpler "in-flight boolean" guard that caused a real
// bug: with a single shared flag, a debounced keystroke arriving while
// the previous search was still in-flight would see the flag set and
// silently no-op, dropping that search entirely rather than queuing or
// superseding it. Token-based staleness checking lets every call actually
// run; only the result application is guarded.
let latestRequestToken = 0;
export const useMealsStore = create<MealsStore>((set, get) => ({
  // --- saved meals ---
  savedMeals: {
    breakfast: {},
    lunch: {},
    dinner: {},
    snack: {},
  },

  saveMeal: (meal, category) =>
    set((state) => ({
      savedMeals: {
        ...state.savedMeals,
        [category]: {
          ...state.savedMeals[category],
          [meal.id]: meal,
        },
      },
    })),

  unsaveMeal: (id, category) =>
    set((state) => {
      const nextCategoryMeals = { ...state.savedMeals[category] };
      delete nextCategoryMeals[id];

      return {
        savedMeals: {
          ...state.savedMeals,
          [category]: nextCategoryMeals,
        },
      };
    }),

  isMealSaved: (id, category) => id in get().savedMeals[category],

  // --- search ---
  search: initialSearchState(),

  setQuery: (query) => set((state) => ({ search: { ...state.search, query } })),

  runSearch: async (query) => {
    const trimmed = query.trim();
    const token = ++latestRequestToken;

    if (trimmed.length === 0) {
      // Only clear if nothing newer has already started; an empty query
      // followed immediately by a real one shouldn't let the empty-query
      // clear win the race and erase the real query's loading state.
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

      // A newer search (or a clear) started after this one — its result
      // will land separately, or already has. Applying this stale
      // response now would overwrite fresher state with older data.
      if (token !== latestRequestToken) return;

      set((state) => ({
        search: {
          ...state.search,
          query,
          results: res.data,
          page: 1,
          hasMore: res.meta.current_page < res.meta.last_page,
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
          hasMore: res.meta.current_page < res.meta.last_page,
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
}));
