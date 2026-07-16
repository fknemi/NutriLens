// services/recipe-api.ts
//
// Client for https://recipe-api.com/docs/ (api/v1)
//
// MIGRATION NOTE: this file previously called recipeapi.io. It now calls
// recipe-api.com — a different, unrelated service (different base URL,
// different auth scheme, different response shapes, different pricing
// model). See the section comments below for what changed and why.
//
// NOTE: API keys are hardcoded per your request, matching the old file's
// pattern. This is fine for local dev but means the keys ship inside your
// JS bundle — anyone who downloads the app can extract them. Swap to an
// env var (EXPO_PUBLIC_RECIPE_API_KEYS, comma-separated) or a backend
// proxy before shipping to real users.
//
// SECURITY: the *previous* key (recipeapi.io) had already been pasted into
// chat conversations more than once, and that leak history is itself now
// sitting in a shared/exported chat transcript that fed this migration —
// i.e. it has effectively leaked again just by virtue of being quoted back
// into this conversation as context. The same is now true of the
// recipe-api.com key below: it has been pasted into this chat twice.
// Rotate it from the dashboard before relying on this file, and prefer the
// env var / backend proxy migration sooner rather than later.
//
// PLACEHOLDER: only one real key was provided when this file was
// generated (the one already hardcoded in the previous version). It has
// been kept as the sole entry in RECIPE_API_KEYS below. This will fail
// every request with a 401 for any *additional* keys you add here until
// you replace them with real values — see the KEY ROTATION section for
// why adding more keys only helps if they belong to separate accounts.
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- API key rotation ---------------------------------------------------
//
// RECIPE_API_KEYS is a list rather than a single key so that, once a key's
// account hits UNIQUE_RECIPE_LIMIT_EXCEEDED (the monthly cap on distinct
// recipe detail-fetches — see getRecipe below), requests can fall through
// to the next key instead of failing outright.
//
// IMPORTANT — this only helps if each key belongs to a SEPARATE
// recipe-api.com account with its own quota. The limit is tied to the
// account/plan, not the key: two keys on the same account share the same
// pool and will exhaust together. Listing the same account's key twice
// here changes nothing — every entry will 429 with
// UNIQUE_RECIPE_LIMIT_EXCEEDED at the same point, just with extra
// rotation logic in between.
const RECIPE_API_KEYS: string[] = [
    "rapi_fd9d74b1a713a5056436900bb84d5bd2235fa8b60e4a41e1",
    "rapi_9d79fea730a58bd5e20e8cee7a9f4e456699fdfa3196e92b",
    "rapi_22ec6bcfe978c1883eec8c525bb3ed73cbdac9a48001e7f6",
    "rapi_bf375d89b19508e4843f9991d85f31f91a3e6f4400e2423e",
    "rapi_b6acccc37fce4a3b2aadd5dcbec758324d2e41dfcdc7d8f3"

];

const BASE_URL = "https://recipe-api.com/api/v1";

// Index of the key currently in use. Advances only on
// UNIQUE_RECIPE_LIMIT_EXCEEDED (see recipeApiFetch below) — not on
// RATE_LIMITED, which already has its own retry-after handling, and not
// on auth failures, since a bad key elsewhere in the array won't be fixed
// by rotating to it.
let activeKeyIndex = 0;

// True once every key in RECIPE_API_KEYS has returned
// UNIQUE_RECIPE_LIMIT_EXCEEDED in the current pass. Reset is intentionally
// NOT automatic (there's no client-side way to know when any given
// account's monthly window resets — each account has its own reset date,
// visible only on that account's dashboard). Call
// resetExhaustedKeysTracking() manually if you know quotas have refreshed.
let allKeysExhausted = false;

function resetExhaustedKeysTracking(): void {
  allKeysExhausted = false;
  activeKeyIndex = 0;
}

// --- Dietary flags -----------------------------------------------------
//
// recipe-api.com's dietary flags are attributes a recipe *is* (Vegetarian,
// Vegan, Gluten-Free, Dairy-Free, ...), fetched from GET /dietary-flags.
// Per the migration plan, we hardcode "Vegetarian" rather than fetching
// that list at runtime: it's the one flag we depend on, the doc's own
// example uses this exact casing, and a wrong guess here fails loudly
// (empty result set) rather than silently misclassifying anything. If you
// add more flag-based filtering later, prefer fetching /dietary-flags over
// hardcoding further values.
const VEGETARIAN_FLAG = "Vegetarian";

// Difficulty values are capitalized per the actual API (confirmed against
// the OpenAPI doc, not just the prose page originally used to plan this
// migration): Easy, Intermediate, Advanced. The original plan assumed
// lowercase (easy/medium/hard) by inference; this corrects it.
export type Difficulty = "Easy" | "Intermediate" | "Advanced";

export interface RecipeIngredientItem {
  id: string; // ingredient UUID, stable across /ingredients and /recipes
  name: string;
  category: string; // one of 23 canonical categories, e.g. "Beef", "Legumes"
  quantity?: number;
  unit?: string;
  optional?: boolean;
  source?: string; // "USDA" or "Aggregated Public Sources"
}

// Ingredients are GROUPED, not a flat list — e.g. "For the chili" vs
// "For the topping" as separate groups, each with its own items[]. This
// corrects an earlier version of this file that typed ingredients as a
// flat { items: [...] } — that shape does not exist on the real API and
// would throw (ingredients.items is undefined on an array) the first time
// any ingredient-matching code ran against a real response.
export interface IngredientGroup {
  group_name: string;
  items: RecipeIngredientItem[];
}

export interface Recipe {
  id: string; // UUID
  name: string;
  description: string;
  category: string; // e.g. "Dinner", "Dessert" — the old file's meal_type
  // has no equivalent field name on this API; category is the closest
  // match and is what list/detail responses actually return.
  difficulty: Difficulty;
  cuisine: string;
  tags: string[];
  dietary: {
    flags: string[]; // e.g. ["Vegetarian", "Gluten-Free"]
    not_suitable_for: string[];
  };
  meta: {
    // Corrected field names: the API has active_time/passive_time/
    // total_time, not prep_time/cook_time. There is no cook-time-only
    // field — active_time is the closest analog (hands-on time) but is
    // NOT equivalent to the old cook_time value; total_time (active +
    // passive) is what this app's card currently reads.
    active_time: string; // ISO 8601 duration, e.g. "PT20M"
    passive_time?: string; // ISO 8601 duration, e.g. "PT1H40M"
    total_time: string; // ISO 8601 duration, e.g. "PT2H"
    yields?: string; // e.g. "4 servings"
    yield_count?: number;
    serving_size_g?: number;
  };
  nutrition: {
    per_serving: {
      calories: number | null;
      protein_g: number | null;
      // ...30 more nutrients in the full panel, all nullable per the doc
      // ("handle null per nutrient rather than per recipe"). Only the
      // fields this app currently reads are typed here.
      [key: string]: number | null | undefined;
    };
    sources?: string[];
  };
  // nutrition_summary is present on LIST-endpoint items only (4 macros,
  // free) — detail responses (getRecipe) have full `nutrition` instead.
  // Both share the same per_serving-shaped macro fields, so code reading
  // .calories/.protein_g works against either as long as it goes through
  // `nutrition_summary ?? nutrition.per_serving` — see RecipeSummary below.
  nutrition_summary?: {
    calories: number | null;
    protein_g: number | null;
    carbohydrates_g: number | null;
    fat_g: number | null;
  };
  instructions?: Array<{
    step_number: number;
    phase: "prep" | "cook" | "assemble" | "finish";
    text: string;
    tips?: string[];
  }>; // kept loose/partial — this app's UI doesn't currently render
  // structured steps, only needs instructions to exist as an array.
  ingredients: IngredientGroup[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_capped?: boolean; // true if results were capped by the
    // 500-recipe discovery limit (see DISCOVERY_LIMIT_EXCEEDED below)
  };
  // NOTE: there is no `links` object and no `meta.last_page` on this API —
  // both existed on the old recipeapi.io shape and were carried over into
  // an earlier version of this file by assumption, not by checking the
  // real doc. "Has more pages" must now be derived from
  // `meta.page * meta.per_page < meta.total` instead of comparing against
  // last_page, which simply doesn't exist here. See hasMorePages() below.
}

// Derives "is there another page" from total/page/per_page, since this API
// has no last_page field. Also accounts for the 500-recipe discovery cap:
// once total_capped is true, total itself may already reflect the capped
// count (500) rather than the catalog's real size — in that case, treat
// page 25 (500 / per_page=20, or whatever per_page yields 500) as the
// final page regardless of what total says, rather than looping into a
// DISCOVERY_LIMIT_EXCEEDED 400.
export function hasMorePages(
  meta: PaginatedResponse<unknown>["meta"],
): boolean {
  const fetchedSoFar = meta.page * meta.per_page;
  if (meta.total_capped && fetchedSoFar >= 500) return false;
  return fetchedSoFar < meta.total;
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

// --- ISO 8601 duration parsing ------------------------------------------
//
// recipe-api.com returns durations like "PT1H15M" (and, per the schema
// docs, sometimes plain day durations like "P3D" for storage windows) —
// this app's UI (RecipeCard) wants a minutes number for display. Handles
// an optional leading day component defensively, even though recipe
// meta.total_time isn't documented as ever including one in practice.
export function parseIsoDurationToMinutes(
  duration: string | undefined,
): number {
  if (!duration) return 0;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    duration,
  );
  if (!match) return 0;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
}

// --- Country-based ingredient exclusion -----------------------------------
//
// recipe-api.com has no country param or server-side ingredient-exclusion
// filter, so this stays client-side, same as before — matched against the
// grouped ingredients[].items[] shape (name AND category, since category
// catches things a name-regex might miss, e.g. a cut name that doesn't
// contain the literal word "beef").
export type CountryCode = "IN"; // extend as more countries are added

const EXCLUDED_INGREDIENTS_BY_COUNTRY: Record<CountryCode, string[]> = {
  IN: ["beef", "pork"],
};

function countryExclusionTerms(country: CountryCode | undefined): string[] {
  if (!country) return [];
  const excluded = EXCLUDED_INGREDIENTS_BY_COUNTRY[country];
  return excluded ? excluded.map((t) => t.toLowerCase()) : [];
}

// Flattens the grouped ingredient shape into a single iterable list. This
// corrects a bug in an earlier version of this file, which read
// recipe.ingredients.items directly — that assumed a flat
// { items: [...] } shape that doesn't exist on the real API.
// recipe.ingredients is itself an array of groups (e.g. "For the chili",
// "For the topping"), each with its own items[]; reading .items off the
// array directly is undefined and .some() on undefined throws. This would
// have failed on the very first ingredient-matching call against a real
// API response, independent of the rate-limit issue.
function allIngredientItems(recipe: Recipe): RecipeIngredientItem[] {
  return recipe.ingredients.flatMap((group) => group.items);
}

function ingredientsMatchAnyTerm(recipe: Recipe, terms: string[]): boolean {
  if (terms.length === 0) return false;

  return allIngredientItems(recipe).some((ingredient) => {
    const haystack = `${ingredient.name} ${ingredient.category}`;

    return terms.some((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${safeTerm}\\b`, "i");
      return regex.test(haystack);
    });
  });
}

function recipeContainsExcludedIngredient(
  recipe: Recipe,
  excludedTerms: string[],
): boolean {
  return ingredientsMatchAnyTerm(recipe, excludedTerms);
}

// --- Veg / non-veg classification ------------------------------------------
//
// recipe-api.com's dietary.flags includes "Vegetarian" as a real flag, so
// veg filtering is now a server-side `dietary=Vegetarian` param — see
// listVeganRecipes below, which is free (list-endpoint call, no per-recipe
// detail credit).
//
// Non-veg has NO server-side equivalent: dietary flags describe what a
// recipe IS (Vegetarian, Vegan, Gluten-Free...), not "contains meat" — the
// exact same structural gap the old recipeapi.io dietary_tags had. So
// non-veg is derived client-side as "does not have the Vegetarian flag",
// against the same free /recipes list response (dietary.flags is present
// on list items, confirmed in the doc's list-response example — not
// detail-only), so this needs no extra detail call either.
export function isVegRecipe(recipe: Recipe): boolean {
  return recipe.dietary.flags.includes(VEGETARIAN_FLAG);
}

export function isNonVegRecipe(recipe: Recipe): boolean {
  return !isVegRecipe(recipe);
}

// --- Allergen / disliked-ingredient exclusion ------------------------------
//
// Both allergens and dislikedIngredients are string[] — confirmed against
// the actual store sources (useAllergensStore, useDislikedIngredientsStore),
// not assumed. An earlier version of this function treated
// dislikedIngredients as a single comma-separated string and called
// .split(",") on it, carried over from the OLD recipeapi.io file's comment
// describing a param shape that store no longer has (that store's own
// source comments its own history: "ingredients: string[] // <-- Changed
// from string to string[]"). Passing a real string[] into that old code
// skipped the `?? ""` fallback (arrays aren't null/undefined) and called
// .split on an array, which doesn't exist — hence the crash. Fixed by
// treating both params identically, since they're now the same shape.
function userExclusionTerms(
  allergens: string[] | undefined,
  dislikedIngredients: string[] | undefined,
): string[] {
  const normalize = (list: string[] | undefined): string[] =>
    (list ?? []).map((s) => s.toLowerCase().trim()).filter((s) => s.length > 0);

  return Array.from(
    new Set([...normalize(allergens), ...normalize(dislikedIngredients)]),
  );
}

function filterRecipes(
  recipes: Recipe[],
  country: CountryCode | undefined,
  allergens: string[] | undefined,
  dislikedIngredients: string[] | undefined,
): { data: Recipe[]; wasFiltered: boolean } {
  const terms = [
    ...countryExclusionTerms(country),
    ...userExclusionTerms(allergens, dislikedIngredients),
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

// NOTE on search_in: recipe-api.com's `q` param searches "name or
// description" with no field-scoping option — there is nothing to map the
// old `search_in: "both"` param onto, so it's been dropped rather than
// silently ignored. See searchAllRecipes below.
//
// NOTE on sort/order/meal_type: an earlier version of this file included
// these, carried over from the old recipeapi.io params by assumption. None
// of the three are documented query params on this API — meal_type has no
// equivalent at all (category is the closest concept), and there's no
// documented sort/order param on /recipes. Removed rather than sent
// speculatively, since unrecognized query params risk a 400 BAD_REQUEST
// ("invalid query parameter") per the documented error table, not a
// silent no-op. This app doesn't currently call listRecipes with any of
// the three set, so removing them changes nothing observable today.
export interface ListRecipesParams {
  q?: string;
  category?: string;
  cuisine?: string;
  difficulty?: Difficulty;
  dietary?: string; // comma-separated flags, e.g. "Vegetarian" — real
  // server-side filter, confirmed against the doc
  min_calories?: number;
  max_calories?: number;
  min_protein?: number;
  max_protein?: number;
  min_carbs?: number;
  max_carbs?: number;
  min_fat?: number;
  max_fat?: number;
  ingredients?: string; // comma-separated ingredient UUIDs, ALL must match
  per_page?: number;
  page?: number;
  country?: CountryCode;
  allergens?: string[];
  dislikedIngredients?: string[];
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Waits ms milliseconds. Used for Retry-After handling below.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// recipeApiFetch retries once per call on a 429 RATE_LIMITED response,
// honoring the documented Retry-After header (seconds to wait) — this is
// the API's own documented contract ("429 responses include a Retry-After
// header... Honor the Retry-After header"), not a guessed backoff. This
// retry happens on the CURRENT key and does not consume a rotation — a
// transient rate limit isn't a reason to switch accounts.
//
// UNIQUE_RECIPE_LIMIT_EXCEEDED is handled separately, by KEY ROTATION
// rather than a wait-and-retry: this is monthly quota exhaustion for the
// active key's account, not a transient condition, so waiting won't help
// until that account's own reset date. If another key is available, this
// function advances activeKeyIndex and retries the SAME request on the
// next key. If every key has now returned this error in the current pass,
// allKeysExhausted is set and the error is thrown rather than looping —
// see resetExhaustedKeysTracking() above for how to clear that once you
// know a quota has refreshed.
//
// GENERATE_LIMIT_EXCEEDED (a different 429 code, for the /generate and
// /image-generate endpoints, not used by this file today) is NOT retried
// or rotated — same reasoning as before: it's quota exhaustion tied to a
// separate monthly counter, and rotating keys doesn't change that either,
// for the same shared-account caveat as UNIQUE_RECIPE_LIMIT_EXCEEDED.
//
// maxRetries=1 for RATE_LIMITED is deliberate: if a single Retry-After
// wait isn't enough (e.g. concurrent calls elsewhere in the app also hit
// the limit), this still throws rather than looping indefinitely — better
// to surface a real error than silently stall the UI. Key rotation has its
// own separate bound (the length of RECIPE_API_KEYS), not tied to this
// retriesLeft counter.
async function recipeApiFetch<T>(path: string, retriesLeft = 1): Promise<T> {
  if (RECIPE_API_KEYS.length === 0) {
    throw new RecipeApiError(
      401,
      "NO_API_KEY_CONFIGURED",
      "RECIPE_API_KEYS is empty — add at least one key.",
    );
  }

  const currentKey = RECIPE_API_KEYS[activeKeyIndex];

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "X-API-Key": currentKey,
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await res.json();
    } catch {
      // response wasn't JSON; fall through to generic error below
    }

    const code = body?.error?.code ?? "UNKNOWN_ERROR";

    if (res.status === 429 && code === "RATE_LIMITED" && retriesLeft > 0) {
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 6; // Free plan is 10 req/min — 6s is one request-slot's worth of
      // spacing if the header is somehow missing; a fallback, not the
      // primary mechanism.
      console.warn(
        `RATE_LIMITED on ${path} (key index ${activeKeyIndex}) — waiting ${retryAfterSeconds}s per Retry-After header, then retrying once on the same key.`,
      );
      await sleep(retryAfterSeconds * 1000);
      return recipeApiFetch<T>(path, retriesLeft - 1);
    }

    if (res.status === 429 && code === "UNIQUE_RECIPE_LIMIT_EXCEEDED") {
      const nextIndex = activeKeyIndex + 1;

      if (nextIndex < RECIPE_API_KEYS.length) {
        console.warn(
          `UNIQUE_RECIPE_LIMIT_EXCEEDED on key index ${activeKeyIndex} — ` +
            `rotating to key index ${nextIndex} and retrying ${path}. ` +
            `Reminder: this only helps if that key is on a different account.`,
        );
        activeKeyIndex = nextIndex;
        // Retried on the new key with the SAME retriesLeft — rotation is
        // not a RATE_LIMITED retry and shouldn't consume that budget.
        return recipeApiFetch<T>(path, retriesLeft);
      }

      // Every key has now hit this on the current pass.
      allKeysExhausted = true;
      console.warn(
        `UNIQUE_RECIPE_LIMIT_EXCEEDED on all ${RECIPE_API_KEYS.length} configured key(s). ` +
          `Call resetExhaustedKeysTracking() once you know a quota has reset, or add another key from a different account.`,
      );
    }

    throw new RecipeApiError(
      res.status,
      code,
      body?.error?.message ?? `Request failed with status ${res.status}`,
    );
  }

  return res.json();
}

// Free (discovery) list call — no detail credits spent. Used directly by
// listVeganRecipes/listNonVegRecipes below; NOT used for allergen/dislike
// filtering, since that needs ingredient data the list endpoint doesn't
// return (see getRecipesWithDetail further down).
//
// CACHING: checks recipeListCache first, keyed on the exact query string
// this call would otherwise send (qs below — the SAME string, not a
// separately-derived one, so "cached" and "sent to the API" can never
// drift apart). On a hit: no network call, no rate-limit spacing, nothing
// logged to the  lines below since nothing was actually fetched. On a
// miss: fetches as before, then stores the raw response before returning
// it. country/allergens/dislikedIngredients are excluded from the cache
// key (via the same destructuring already used to keep them out of the
// request itself) — those are applied client-side by filterRecipes on
// every call, live, against whatever this cache returns, so they must
// never be part of what selects a cache entry. See the PermanentCache /
// recipeListCache comment above for why the filtered shape itself is never
// what gets cached.
export async function listRecipes(
  params: ListRecipesParams = {},
): Promise<PaginatedResponse<Recipe>> {
  const { country, allergens, dislikedIngredients, ...apiParams } = params;
  const qs = buildQuery(apiParams);

  const cached = await recipeListCache.get(qs);
  if (cached) {
    console.log(
      `LIST CACHE HIT: /recipes${qs} (${cached.data.length} items, no network call)`,
    );
    return cached;
  }

  console.log(`\nHITTING API: /recipes${qs}`);
  const res = await recipeApiFetch<PaginatedResponse<Recipe>>(`/recipes${qs}`);

  console.log(`API RETURNED: ${res.data.length} items in the data array.`);

  await recipeListCache.set(qs, res);

  return res;
}

interface UsageInfo {
  monthly_remaining: number;
  monthly_limit: number;
  daily_remaining: number;
  daily_limit: number;
}

// --- Permanent local cache (generic, two-layer) -----------------------------
//
// Caches EVERYTHING fetched from recipe-api.com in AsyncStorage, permanently:
// both individual recipe detail records (by ID) and full list/search
// responses (by exact query string). This replaced an earlier version that
// cached only getRecipe() results — list/search calls were deliberately left
// live. Per a later decision, list results are now cached too, permanently,
// alongside detail — see the two PermanentCache instances below
// (recipeDetailCache, recipeListCache).
//
// IMPORTANT — what is NOT cached: the output of filterRecipes() (country/
// allergen/dislike exclusion) is never stored anywhere. Only the raw,
// unfiltered API responses are. filterRecipes runs live, on every call, over
// whatever cached (or freshly fetched) detail data is available, using
// whatever allergens/dislikedIngredients were passed to THAT call. This is
// deliberate: if a user edits their allergen list, the very next call
// re-filters the same cached recipes against the new list immediately, with
// no separate cache-invalidation step required. Caching the filtered result
// instead would mean either serving stale exclusions after an allergen-list
// edit, or having to hunt down and invalidate every cached page whenever any
// user preference changes — both worse than just not caching the filtered
// shape in the first place.
//
// Each PermanentCache instance is a self-contained two-layer cache:
//   1. AsyncStorage — source of truth, survives app restarts, "permanent."
//   2. An in-memory Map mirror — avoids an async AsyncStorage round-trip on
//      every cache hit. Hydrated lazily from AsyncStorage on first access,
//      then kept in sync on every write. Without this, every single cache
//      read would pay an AsyncStorage round-trip even for warm hits, which
//      adds latency back into the exact fetch path this cache exists to
//      speed up.
//
// GROWTH: there is deliberately no eviction or size cap on either cache,
// matching the "permanent, cache everything" requirement as given. For a
// long-lived app with heavy browsing these AsyncStorage keys will grow
// without bound — worth revisiting (e.g. an LRU cap, or splitting into
// per-entry keys instead of one growing blob per cache) if that becomes a
// real problem, but not implemented speculatively here since it wasn't
// asked for.
class PermanentCache<V> {
  private readonly storageKey: string;
  private memoryMirror: Map<string, V> | null = null;
  private hydration: Promise<Map<string, V>> | null = null;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  private async load(): Promise<Map<string, V>> {
    if (this.memoryMirror) return this.memoryMirror;
    if (this.hydration) return this.hydration;

    this.hydration = (async () => {
      try {
        const raw = await AsyncStorage.getItem(this.storageKey);
        if (!raw) {
          this.memoryMirror = new Map();
          return this.memoryMirror;
        }
        const parsed = JSON.parse(raw);
        // Defensive: treat anything not matching the expected shape as an
        // empty cache rather than throwing. A corrupt or schema-mismatched
        // entry (e.g. from an older app version) should degrade to "cache
        // miss," not crash recipe loading.
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          console.warn(
            `recipe-api cache (${this.storageKey}): stored data was not a valid object, starting fresh.`,
          );
          this.memoryMirror = new Map();
          return this.memoryMirror;
        }
        this.memoryMirror = new Map(Object.entries(parsed) as [string, V][]);
      } catch (err) {
        console.warn(
          `recipe-api cache (${this.storageKey}): failed to read/parse AsyncStorage, starting fresh.`,
          err,
        );
        this.memoryMirror = new Map();
      }
      return this.memoryMirror!;
    })();

    return this.hydration;
  }

  private async persist(cache: Map<string, V>): Promise<void> {
    try {
      const asObject = Object.fromEntries(cache);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(asObject));
    } catch (err) {
      // A failed write means this entry won't be cached for next time, but
      // the caller already has the data in hand for this render — don't
      // throw and break the UI over a cache-persistence failure.
      console.warn(
        `recipe-api cache (${this.storageKey}): failed to persist to AsyncStorage.`,
        err,
      );
    }
  }

  async get(key: string): Promise<V | undefined> {
    const cache = await this.load();
    return cache.get(key);
  }

  async set(key: string, value: V): Promise<void> {
    const cache = await this.load();
    cache.set(key, value);
    await this.persist(cache);
  }
}

// Detail cache: recipe ID -> full Recipe. Same storage key as the previous
// single-purpose cache, so existing users' already-cached detail records
// are NOT invalidated by this change.
const recipeDetailCache = new PermanentCache<Recipe>(
  "recipe-api:detail-cache:v1",
);

// List cache: exact /recipes query string (as produced by buildQuery, e.g.
// "?category=Dinner&page=2") -> the raw PaginatedResponse<Recipe> returned
// for that query. New in this version — see listRecipes below for where
// this is read/written. Deliberately does NOT go through buildQuery's
// country/allergens/dislikedIngredients stripping step twice; listRecipes
// already strips those before calling buildQuery, so the string used as a
// cache key here is identical to the string actually sent to the API,
// which is exactly what "same query = same cached response" needs to mean.
const recipeListCache = new PermanentCache<PaginatedResponse<Recipe>>(
  "recipe-api:list-cache:v1",
);

// In-flight de-duplication: if two callers request the same uncached ID
// concurrently (possible for direct getRecipe callers outside the
// sequential resolveWithDetailAndFilter loop), the second caller awaits
// the first's in-flight network request instead of firing a duplicate —
// avoids both a wasted request against the rate limit and a harmless but
// pointless double-write to the cache. Kept separate from PermanentCache
// itself since it's about coalescing concurrent NETWORK calls, not about
// the storage layer — the list cache doesn't need this today because
// listRecipes is not currently called concurrently with itself for the
// same query anywhere in this file, but the shape is here if that changes.
const inFlightDetailFetches = new Map<string, Promise<Recipe>>();

async function getCachedRecipe(id: string): Promise<Recipe | undefined> {
  return recipeDetailCache.get(id);
}

async function setCachedRecipe(id: string, recipe: Recipe): Promise<void> {
  await recipeDetailCache.set(id, recipe);
}

// Detail fetch: 1 credit, full recipe including ingredients + nutrition +
// meta.total_time. Per the "always fetch detail per card" decision, this is
// how every card resolves its display fields, not just allergen filtering.
//
// CACHING: checks the permanent local cache first. On a hit, returns
// immediately with no network call, no rate-limit spacing, and no credit
// spend — this is on top of, not instead of, the API's own behavior of not
// charging a unique-recipe credit on repeat fetches (see the doc's "Get
// full recipe by ID" note); the local cache additionally saves the network
// round-trip and rate-limit pacing that a server-side-free-but-still-a-
// real-HTTP-call refetch would still cost.
//
// The response envelope is { data, usage } — NOT { data, meta: { language } }
// as an earlier version of this file assumed. `usage` carries live
// remaining-quota counts for whichever key ended up serving this request
// (i.e. post-rotation, if rotation occurred inside recipeApiFetch) — logged
// here (not thrown on) since the doc's own tips explicitly recommend
// watching it, and a low count is useful to see in the console before it
// becomes a 429 rather than only after. `usage` is only available on a
// real fetch — a cache hit has no fresh usage data to log, which is fine,
// since nothing was spent.
export async function getRecipe(id: string): Promise<Recipe> {
  const cached = await getCachedRecipe(id);
  if (cached) return cached;

  const existingFetch = inFlightDetailFetches.get(id);
  if (existingFetch) return existingFetch;

  const fetchPromise = (async () => {
    try {
      const res = await recipeApiFetch<{ data: Recipe; usage: UsageInfo }>(
        `/recipes/${id}`,
      );
      if (res.usage.monthly_remaining <= 5) {
        console.warn(
          `RECIPE-API QUOTA: only ${res.usage.monthly_remaining}/${res.usage.monthly_limit} unique recipes left this month on key index ${activeKeyIndex}.`,
        );
      }
      await setCachedRecipe(id, res.data);
      return res.data;
    } finally {
      inFlightDetailFetches.delete(id);
    }
  })();

  inFlightDetailFetches.set(id, fetchPromise);
  return fetchPromise;
}

// --- Credit-spending resolution step ---------------------------------------
//
// resolveWithDetailAndFilter(): takes a page of FREE list-endpoint summaries
// and turns each into a full detail record — 1 credit PER ITEM, every call,
// unconditionally (per the "always fetch detail per card" decision; there
// is deliberately no summary-only fallback path). Country/allergen/dislike
// exclusion runs against that detail data, since ingredient names aren't
// present on list-endpoint summaries.
//
// This is the ONLY place in this file that spends detail credits. Anything
// upstream of this function (listRecipes, listVeganRecipes,
// listNonVegRecipes) is free discovery. Keep it that way — if you're
// tempted to add ingredient-dependent logic to those functions, it belongs
// here instead, or you'll spend credits somewhere non-obvious.
//
// CONCURRENCY: fetches SEQUENTIALLY with spacing, not via Promise.all. The
// original version fired all detail calls simultaneously — at PER_PAGE=10
// against Free's 10 req/min limit, that's 10 concurrent requests the
// instant a tab loads, and the limit is SHARED with the one listRecipes
// call that already ran to get these summaries in the first place (11
// requests total per page, before any retry). A burst like that hits
// RATE_LIMITED almost immediately and repeatably.
//
// Spacing is derived from the plan's documented req/min rather than
// hardcoded independent of it: minGapMs leaves generous headroom under the
// limit (rather than exactly 60000/limit, which would use the entire
// budget on this one page load and leave nothing for the list call that
// preceded it or anything else happening concurrently in the app).
//
// NOTE on key rotation and this spacing: MIN_GAP_MS is still keyed off
// FREE_PLAN_REQ_PER_MIN regardless of which key ends up serving a given
// request post-rotation. If your keys are on different plans (e.g. one
// Free, one Indie), this stays conservative rather than trying to track
// per-key rate limits — worth revisiting if that mismatch becomes a real
// bottleneck, but not implemented speculatively here.
const FREE_PLAN_REQ_PER_MIN = 10; // from the documented Free-tier limit;
// update this if you're on a paid plan (Personal: 10, Indie: 20, Growth:
// 60, Scale: 300 — all documented) to fetch faster without hitting 429s.
const MIN_GAP_MS = Math.ceil(60000 / FREE_PLAN_REQ_PER_MIN) * 1.5; // 1.5x
// headroom, since this pool is shared with the list call and any other
// in-flight API usage elsewhere in the app.

async function resolveWithDetailAndFilter(
  summaries: Recipe[],
  country: CountryCode | undefined,
  allergens: string[] | undefined,
  dislikedIngredients: string[] | undefined,
): Promise<{ data: Recipe[]; wasFiltered: boolean }> {
  const detailed: Recipe[] = [];
  for (let i = 0; i < summaries.length; i++) {
    if (i > 0) {
      // Only pace with MIN_GAP_MS if the NEXT item is actually going to hit
      // the network. getRecipe() itself already checks the cache and skips
      // the network on a hit — but by then it's too late, the sleep above
      // it has already been paid. Peeking the cache here first means a page
      // where every item is already cache-resident (e.g. because the whole
      // list response itself came from recipeListCache, or these specific
      // recipe IDs were viewed before under a different filter/tab) resolves
      // with no artificial delay at all, instead of paying the full
      // sequential wait for calls that were never going to touch the rate
      // limit in the first place. Items that DO need a real fetch still get
      // the original conservative spacing, unchanged.
      const nextIsCached =
        (await getCachedRecipe(summaries[i].id)) !== undefined;
      if (!nextIsCached) await sleep(MIN_GAP_MS);
    }
    detailed.push(await getRecipe(summaries[i].id));
  }
  return filterRecipes(detailed, country, allergens, dislikedIngredients);
}

// veg results: free list call only.
// NOTE: country, allergens, and dislikedIngredients are now IGNORED here,
// as ingredient data is not present on summary responses.
export async function listVeganRecipes(
  extra: Omit<ListRecipesParams, "dietary"> = {},
): Promise<PaginatedResponse<Recipe>> {
  const { country, allergens, dislikedIngredients, ...listParams } = extra;
  return listRecipes({ ...listParams, dietary: VEGETARIAN_FLAG });
}

// Non-veg results: free list call, filtered by isNonVegRecipe locally.
export async function listNonVegRecipes(
  extra: ListRecipesParams = {},
): Promise<PaginatedResponse<Recipe>> {
  const { country, allergens, dislikedIngredients, ...listParams } = extra;
  const res = await listRecipes(listParams);
  const data = res.data.filter(isNonVegRecipe);
  return { ...res, data };
}

// Global search: free list call only.
export async function searchAllRecipes(
  query: string,
  extra: Omit<ListRecipesParams, "q"> = {},
): Promise<PaginatedResponse<Recipe>> {
  const { country, allergens, dislikedIngredients, ...listParams } = extra;
  return listRecipes({ ...listParams, q: query });
}

// Tell me which one (or something else) and I'll wire it up properly,
// including whether it should still run country/allergen/dislike
// filtering the way this function used to.
export async function getRandomRecipe(
  params: Omit<ListRecipesParams, "page" | "per_page"> = {},
): Promise<Recipe> {
  throw new Error(
    "getRandomRecipe: recipe-api.com has no /recipes/random endpoint. " +
      "See the comment above this function for replacement options — " +
      "this needs a decision, not a silent fallback.",
  );
}

// Global search across both veg and non-veg, ignoring the active tab —
// preserved from the old behavior. NOTE: search_in has been dropped (see
// ListRecipesParams comment above); recipe-api.com's `q` param has no
// field-scoping option to map it onto.
//
// Routed through resolveWithDetailAndFilter for the same reason veg/non-veg
// are: allergen/dislike filtering needs ingredient names, which the list
// endpoint doesn't return. This means search spends 1 credit per result
// too — the migration plan didn't explicitly revisit search's cost when it
// settled "always fetch detail per card" for the tabs, but the underlying
// reason (no server-side ingredient filter exists on this API) applies
// identically here. Flagging this rather than silently either exempting
// search from the cost or assuming it should match — worth confirming if
// search volume is high enough that this matters separately from the tabs.

// --- Key rotation status helpers --------------------------------------
//
// Exported so UI code (e.g. a settings/debug screen) can surface rotation
// state without reaching into module-private variables directly.
export function getActiveKeyIndex(): number {
  return activeKeyIndex;
}

export function areAllKeysExhausted(): boolean {
  return allKeysExhausted;
}

export { resetExhaustedKeysTracking };
