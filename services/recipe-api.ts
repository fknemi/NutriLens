// services/recipe-api.ts
//
// Thin client for https://recipeapi.io/docs/
//
// NOTE: API key is hardcoded per your request. This is fine for local dev
// but means the key ships inside your JS bundle — anyone who downloads the
// app can extract it. Swap to an env var (EXPO_PUBLIC_RECIPE_API_KEY) or a
// backend proxy before shipping to real users.
//
// SECURITY: this key has now been pasted into chat conversations in
// plaintext on more than one occasion. Treat it as compromised — rotate it
// in the recipeapi.io dashboard before relying on this file for anything
// beyond local dev, independent of the env var migration above. Do this
// now, not after the rest of this change ships.
const RECIPE_API_KEY = "sk_live_lmGzCe993rGXeqJ1Z0z9BFpefkDjn33IquNpyy0z3c8f5763";

const BASE_URL = "https://recipeapi.io/api/v1";

export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "halal"
  | "kosher";

export type Difficulty = "easy" | "medium" | "hard";

export interface RecipeIngredient {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  optional: boolean;
}

export interface Recipe {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  meal_type: string;
  cuisine: string;
  dietary_tags: DietaryTag[];
  servings: number;
  prep_time: number;
  cook_time: number;
  calories_per_serving: number;
  protein: number;
  instructions: string[];
  ingredients: RecipeIngredient[];
}

interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    path: string;
    per_page: number;
    total: number;
    language: string;
  };
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export class RecipeApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "RecipeApiError";
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, RecipeApiError.prototype);
  }
}

// --- Country-based ingredient exclusion -----------------------------------
export type CountryCode = "IN"; // extend as more countries are added

const EXCLUDED_INGREDIENTS_BY_COUNTRY: Record<CountryCode, string[]> = {
  IN: ["beef", "pork"],
};

function countryExclusionTerms(country: CountryCode | undefined): string[] {
  if (!country) return [];
  const excluded = EXCLUDED_INGREDIENTS_BY_COUNTRY[country];
  return excluded ? excluded.map((t) => t.toLowerCase()) : [];
}

// --- Veg / non-veg classification ------------------------------------------
//
// IMPORTANT: the API's `dietary_tags` field is a set of *attributes*
// (vegetarian, vegan, gluten_free, dairy_free, nut_free, halal, kosher) —
// it is NOT a meat/no-meat classification. `halal` and `kosher` mean
// "certified halal/kosher", not "contains meat". The API documents that a
// recipe called "Beef Tostadas" can carry dietary_tags: ["nut_free"] with
// no halal/kosher tag at all:
// https://recipeapi.io/docs/resources/recipes/
//
// So "non-veg" cannot be derived from dietary_tags. We derive it from
// ingredient names instead, the same way country-based exclusion already
// works below. This list is intentionally broad-but-conservative; tune it
// as you see misclassifications in real data.
const MEAT_INGREDIENT_TERMS = [
  "chicken",
  "beef",
  "pork",
  "bacon",
  "ham",
  "sausage",
  "lamb",
  "mutton",
  "goat",
  "veal",
  "turkey",
  "duck",
  "rabbit",
  "venison",
  "fish",
  "salmon",
  "tuna",
  "shrimp",
  "prawn",
  "crab",
  "lobster",
  "squid",
  "octopus",
  "anchovy",
  "anchovies",
  "mussel",
  "oyster",
  "clam",
  "scallop",
  "gelatin",
  "lard",
  "tallow",
  "meat",
];

function ingredientsMatchAnyTerm(recipe: Recipe, terms: string[]): boolean {
  if (terms.length === 0) return false;

  return recipe.ingredients.some((ingredient) => {
    const name = ingredient.name;

    return terms.some((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${safeTerm}\\b`, "i");
      return regex.test(name);
    });
  });
}

function recipeContainsExcludedIngredient(
  recipe: Recipe,
  excludedTerms: string[]
): boolean {
  return ingredientsMatchAnyTerm(recipe, excludedTerms);
}

export function isNonVegRecipe(recipe: Recipe): boolean {
  return ingredientsMatchAnyTerm(recipe, MEAT_INGREDIENT_TERMS);
}

export function isVegRecipe(recipe: Recipe): boolean {
  return !isNonVegRecipe(recipe);
}

// --- Allergen / disliked-ingredient exclusion ------------------------------
function userExclusionTerms(
  allergens: string[] | undefined,
  dislikedIngredientsRaw: string | undefined
): string[] {
  const fromAllergens = (allergens ?? []).map((a) => a.toLowerCase().trim());

  const fromDislikes = (dislikedIngredientsRaw ?? "")
    .split(",")
    .map((s) => s.toLowerCase().trim())
    .filter((s) => s.length > 0);

  return Array.from(new Set([...fromAllergens, ...fromDislikes])).filter(
    (s) => s.length > 0
  );
}

function filterRecipes(
  recipes: Recipe[],
  country: CountryCode | undefined,
  allergens: string[] | undefined,
  dislikedIngredientsRaw: string | undefined
): { data: Recipe[]; wasFiltered: boolean } {
  const terms = [
    ...countryExclusionTerms(country),
    ...userExclusionTerms(allergens, dislikedIngredientsRaw),
  ];

  if (terms.length === 0) {
    return { data: recipes, wasFiltered: false };
  }

  return {
    data: recipes.filter((r) => !recipeContainsExcludedIngredient(r, terms)),
    wasFiltered: true,
  };
}

export interface CountryFilteredResponse<T> extends PaginatedResponse<T> {
  metaIsPreFilterCount: boolean;
}

// `dietary_tags` is intentionally omitted here: the live API only accepts a
// single dietary_tags value per request (documented limitation), and as of
// this fix we no longer use dietary_tags to derive veg/non-veg at all — see
// the "Veg / non-veg classification" section above. If you need to filter
// by an actual API dietary_tags value (e.g. "gluten_free"), pass it via the
// lower-level `dietaryTag` param below instead.
export interface ListRecipesParams {
  search?: string;
  search_in?: "name" | "description" | "both";
  ingredients?: string;
  cuisine?: string;
  meal_type?: string;
  difficulty?: Difficulty;
  dietaryTag?: DietaryTag;
  prep_time_min?: number;
  prep_time_max?: number;
  cook_time_min?: number;
  cook_time_max?: number;
  calories_per_serving_min?: number;
  calories_per_serving_max?: number;
  protein_min?: number;
  protein_max?: number;
  sort?: "name" | "prep_time" | "cook_time" | "calories_per_serving" | "protein";
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
  country?: CountryCode;
  allergens?: string[];
  dislikedIngredients?: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function recipeApiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${RECIPE_API_KEY}`,
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await res.json();
    } catch {
      // response wasn't JSON; fall through to generic error below
    }
    throw new RecipeApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? `Request failed with status ${res.status}`
    );
  }

  return res.json();
}

export async function listRecipes(
  params: ListRecipesParams = {}
): Promise<CountryFilteredResponse<Recipe>> {
  const { country, allergens, dislikedIngredients, dietaryTag, ...apiParams } =
    params;
  const qs = buildQuery({
    ...apiParams,
    dietary_tags: dietaryTag,
  });

  console.log(`\n🌐 HITTING API: /recipes${qs}`);
  const res = await recipeApiFetch<PaginatedResponse<Recipe>>(`/recipes${qs}`);

  console.log(`📦 API RETURNED: ${res.data.length} items in the data array.`);

  const { data, wasFiltered } = filterRecipes(
    res.data,
    country,
    allergens,
    dislikedIngredients
  );

  if (wasFiltered && res.data.length !== data.length) {
    console.log(
      `✂️ CLIENT FILTER: Removed ${res.data.length - data.length} items based on disliked/allergen terms.`
    );
  }

  return { ...res, data, metaIsPreFilterCount: wasFiltered };
}

// Veg results: fetch broadly (no server-side dietary_tags restriction,
// since dietary_tags is an attribute set, not a veg/non-veg switch) and
// classify locally via isVegRecipe. Country/allergen/dislike exclusion
// still applies via listRecipes.
export async function listVeganRecipes(
  extra: ListRecipesParams = {}
): Promise<CountryFilteredResponse<Recipe>> {
  const res = await listRecipes(extra);
  const data = res.data.filter(isVegRecipe);
  return { ...res, data };
}

// Non-veg results: same broad fetch, classify locally via isNonVegRecipe.
// Previously this tried to use dietary_tags=halal / dietary_tags=kosher,
// which filters for certification status, not meat content, and returned
// near-empty results because most recipes in the dataset simply aren't
// tagged halal or kosher even when they contain meat. See the
// "Veg / non-veg classification" comment block above for the full
// explanation.
export async function listNonVegRecipes(
  extra: ListRecipesParams = {}
): Promise<CountryFilteredResponse<Recipe>> {
  const res = await listRecipes(extra);
  const data = res.data.filter(isNonVegRecipe);
  return { ...res, data };
}

export async function getRecipe(id: number): Promise<Recipe> {
  const res = await recipeApiFetch<{ data: Recipe; meta: { language: string } }>(
    `/recipes/${id}`
  );
  return res.data;
}

export async function getRandomRecipe(
  params: Omit<ListRecipesParams, "page" | "per_page" | "sort" | "order"> = {}
): Promise<Recipe> {
  const { country, allergens, dislikedIngredients, dietaryTag, ...apiParams } =
    params;
  const qs = buildQuery({
    ...apiParams,
    dietary_tags: dietaryTag,
  });
  const res = await recipeApiFetch<{ data: Recipe; meta: { language: string } }>(
    `/recipes/random${qs}`
  );

  const terms = [
    ...countryExclusionTerms(country),
    ...userExclusionTerms(allergens, dislikedIngredients),
  ];
  if (terms.length > 0 && recipeContainsExcludedIngredient(res.data, terms)) {
    console.warn(
      `getRandomRecipe: result excluded under active filters (country=${country ?? "none"}) but no fallback exists; returning it anyway.`
    );
  }
  return res.data;
}

// Global search across both veg and non-veg, ignoring the active tab.
// Used when the user has typed a search term: per product decision, search
// results should override whatever tab is currently selected rather than
// being scoped to it.
export async function searchAllRecipes(
  query: string,
  extra: Omit<ListRecipesParams, "search"> = {}
): Promise<CountryFilteredResponse<Recipe>> {
  return listRecipes({ ...extra, search: query, search_in: "both" });
}
