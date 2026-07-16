// stores/useRecipesStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "@/services/recipe-api";

type SavedRecipesState = {
  // Keyed by id for O(1) lookups/toggles instead of scanning an array
  savedRecipes: Record<string, Recipe>;
  isSaved: (id: string) => boolean; // Change to string
  saveRecipe: (recipe: Recipe) => void;
  unsaveRecipe: (id: string) => void; // Change to string
  toggleSaved: (recipe: Recipe) => void;
  clearSaved: () => void;

  // Derives an array from the record — use this for rendering a "Saved" screen
  getSavedList: () => Recipe[];
};

export const useSavedRecipesStore = create<SavedRecipesState>()(
  persist(
    (set, get) => ({
      savedRecipes: {},

      isSaved: (id) => !!get().savedRecipes[id],

      saveRecipe: (recipe) =>
        set((state) => ({
          savedRecipes: { ...state.savedRecipes, [recipe.id]: recipe },
        })),

      unsaveRecipe: (id) =>
        set((state) => {
          // Destructure the id out, keep the rest — avoids the eslint
          // no-unused-vars warning that `delete` next to a rest spread
          // doesn't trigger in the same way.
          const { [id]: _removed, ...rest } = state.savedRecipes;
          return { savedRecipes: rest };
        }),

      toggleSaved: (recipe) => {
        const { savedRecipes } = get();
        if (savedRecipes[recipe.id]) {
          get().unsaveRecipe(recipe.id);
        } else {
          get().saveRecipe(recipe);
        }
      },

      clearSaved: () => set({ savedRecipes: {} }),

      getSavedList: () => Object.values(get().savedRecipes),
    }),
    {
      name: "saved-recipes-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the data, not the action functions
      partialize: (state) => ({ savedRecipes: state.savedRecipes }),
    },
  ),
);
