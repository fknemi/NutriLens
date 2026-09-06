# NutriLens — API Endpoint Reference

NutriLens is a client-side Expo (React Native) app. There is **no first-party
backend server** in this repository, so every "endpoint" below is one of:

- A **remote HTTP API** that the app calls directly, or
- A **local data source** (bundled SQLite, on-device ML models, AsyncStorage).

> Note: file locations below are relative to the repo root.

---

## Summary

| # | Endpoint / source | Where it is used | Type |
|---|---|---|---|
| 1 | recipe-api.com REST API (`/api/v1`) | `services/recipe-api.ts` → Recipes tab, Meals search, Recipe detail | Remote HTTP |
| 2 | Ollama Cloud chat (`https://ollama.com/api/chat`) | `app/(tabs)/chat.tsx` | Remote HTTP |
| 3 | tapback.co avatar images (`/api/avatar/{key}.webp`) | `app/(onboarding)/all-set.tsx`, `app/profile.tsx`, `components/header.tsx` | Remote image CDN |
| 4 | `https://api.country.is` country-by-IP | `services/geo.ts` | Remote HTTP fallback |
| 5 | USDA food database (bundled `assets/databases/usda.db`) | `services/usda.ts` → scan nutrition lookup | Local SQLite |
| 6 | Firebase phone-OTP auth (`projectId: nutrilens-86f6e`) | `firebaseConfig.js` (helpers) | Remote auth SDK |
| 7 | Local on-device ML (YOLOv8n + MiDaS TFLite) | `components/food-detection-camera.tsx`, scan flow | On-device inference |
| 8 | Script downloads (USDA data, TFLite models) | `scripts/download-*.js` | Build/dev-time HTTPS |
| 9 | `stores/*` zustand stores | everywhere | In-memory + AsyncStorage |

---

## 1. recipe-api.com REST API

- **Docs:** https://recipe-api.com/docs/
- **Base URL:** `https://recipe-api.com/api/v1`
- **Auth:** header `X-API-Key: <key>`
- **Client module:** `services/recipe-api.ts`

> The client was **migrated from an unrelated service (`recipeapi.io`)**.
> Different base URL, auth scheme, response shapes, and pricing — do not mix
> the two.

### Key management

- Keys are held in the module-private array `RECIPE_API_KEYS` and are used for
  **automatic rotation** (see `UNIQUE_RECIPE_LIMIT_EXCEEDED` below). Keys are
  currently hardcoded and ship in the JS bundle (dev convenience; move to an
  env var such as `EXPO_PUBLIC_RECIPE_API_KEYS` or a backend proxy before
  shipping).
- Rotation only helps when each key belongs to a **separate account**: the
  unique-recipe quota is per-account, not per-key.

### GET /recipes

**Purpose:** paginated recipe list / discovery / search / filters. Free
(no detail credit).

**Query parameters** (all optional):

| Param | Type | Notes |
|---|---|---|
| `q` | string | Searches recipe **name or description** (no field scoping). |
| `category` | string | e.g. `Dinner`, `Dessert`. |
| `cuisine` | string | e.g. `italian`. |
| `difficulty` | `Easy` \| `Intermediate` \| `Advanced` | Capitalized per the API. |
| `dietary` | string | Comma-separated flags, e.g. `Vegetarian`. |
| `min_*` / `max_*` | number | For `calories`, `protein`, `carbs`, `fat`. |
| `ingredients` | string | Comma-separated ingredient UUIDs; ALL must match. |
| `page` | number | 1-based. |
| `per_page` | number | Page size. |

**Not supported:** `sort`, `order`, `meal_type`, `search_in`, `country`
(sending unknown params risks `400 BAD_REQUEST`).

**Response envelope**

```jsonc
{
  "data": [ /* Recipe summary items (see Recipe type below) */ ],
  "meta": {
    "total": 25,
    "page": 1,
    "per_page": 10,
    "total_capped": false   // true when the 500-recipe discovery cap applied
  }
  // NOTE: no `links` object and no `meta.last_page`. "Has more pages" =
  // meta.page * meta.per_page < meta.total  (see hasMorePages() in the client)
}
```

### GET /recipes/{id}

**Purpose:** full recipe detail — ingredients, full nutrition panel,
`meta.total_time`. **Cost: 1 unique-recipe credit.**

**Response envelope**

```jsonc
{
  "data": { /* full Recipe (see below) */ },
  "usage": {
    "monthly_remaining": 13,
    "monthly_limit": 25,
    "daily_remaining": 8,
    "daily_limit": 10
  }
}
```

The client logs a warning when `usage.monthly_remaining <= 5`.

### Recipe object shape

```ts
interface Recipe {
  id: string;                 // UUID, stable across list + detail
  name: string;
  description: string;
  category: string;           // e.g. "Dinner" — there is NO meal_type field
  difficulty: "Easy" | "Intermediate" | "Advanced";
  cuisine: string;
  tags: string[];
  dietary: {
    flags: string[];                  // e.g. ["Vegetarian", "Gluten-Free"]
    not_suitable_for: string[];
  };
  meta: {
    active_time?: string;     // ISO 8601 duration, e.g. "PT20M"
    passive_time?: string;    // ISO 8601 duration
    total_time: string;       // ISO 8601 duration, e.g. "PT2H"
    yields?: string;          // e.g. "4 servings"
    yield_count?: number;
    serving_size_g?: number;
  };
  nutrition: {                // PRESENT ON DETAIL responses
    per_serving: {
      calories: number | null;
      protein_g: number | null;
      // ~30 more nutrients in the full panel; all nullable
      [key: string]: number | null | undefined;
    };
    sources?: string[];
  };
  nutrition_summary?: {       // LIST responses ONLY (4 macros, free)
    calories: number | null;
    protein_g: number | null;
    carbohydrates_g: number | null;
    fat_g: number | null;
  };
  instructions?: Array<{      // DETAIL responses
    step_number: number;
    phase: "prep" | "cook" | "assemble" | "finish";
    text: string;
    tips?: string[];
  }>;
  ingredients: IngredientGroup[];  // GROUPED, see below
}
```

- `nutrition_summary` (list) and `nutrition.per_serving` (detail) share the
  same macro field names — read via `nutrition_summary ?? nutrition.per_serving`.
- Ingredients are **grouped**, not a flat array:

```ts
interface IngredientGroup {
  group_name: string;          // e.g. "For the chili"
  items: RecipeIngredientItem[];
}
interface RecipeIngredientItem {
  id: string;                  // ingredient UUID
  name: string;
  category: string;            // one of 23 canonical categories
  quantity?: number;
  unit?: string;
  optional?: boolean;
  source?: string;             // "USDA" or "Aggregated Public Sources"
}
```

> ⚠️ Reading `recipe.ingredients.items` directly throws — you must iterate
> `recipe.ingredients` (each entry is an `IngredientGroup`).

### Error handling (in the client)

Errors are thrown as `RecipeApiError` with `{ status, code, message }`. Codes
handled internally:

| HTTP | `error.code` | Client behavior |
|---|---|---|
| `429` | `RATE_LIMITED` | Retried **once** on the same key after honoring `Retry-After` (default 6 s). No key rotation. |
| `429` | `UNIQUE_RECIPE_LIMIT_EXCEEDED` | Monthly unique-recipe quota exhausted. Rotates to the next key and retries; once all keys have failed, `allKeysExhausted` is set and the error is thrown. |
| `429` | `GENERATE_LIMIT_EXCEEDED` | For `/generate` endpoints only; not used/retried. |
| `401` | `NO_API_KEY_CONFIGURED` | Thrown when `RECIPE_API_KEYS` is empty. |

### Functions exported by the client (`services/recipe-api.ts`)

| Function | HTTP | Cost | Notes |
|---|---|---|---|
| `listRecipes(params)` | `GET /recipes` | Free | Applies `country`/`allergens`/`dislikedIngredients` **client-side**; permanently cached by query string. |
| `getRecipe(id)` | `GET /recipes/{id}` | 1 credit | Cache-first, in-flight de-duped. |
| `listVeganRecipes(params)` | `GET /recipes?dietary=Vegetarian` | Free | Ignores country/allergen/dislike params (no ingredient data on list items). |
| `listNonVegRecipes(params)` | `GET /recipes` + local filter | Free | Filters out items with the `Vegetarian` flag locally. |
| `searchAllRecipes(q, params)` | `GET /recipes?q=` | Free | Global search across veg + non-veg. |
| `getRandomRecipe()` | — | — | **Always throws** — no `/recipes/random` endpoint exists. |
| `isVegRecipe` / `isNonVegRecipe` | — | — | Pure helpers on `dietary.flags`. |
| `parseIsoDurationToMinutes(d)` | — | — | ISO 8601 duration → minutes. |
| `hasMorePages(meta)` | — | — | Next-page test incl. `total_capped`. |
| `getActiveKeyIndex()` / `areAllKeysExhausted()` / `resetExhaustedKeysTracking()` | — | — | Key-rotation status helpers. |

### Caching (module-private)

Two permanent AsyncStorage caches + in-memory mirrors (no eviction):

- `recipe-api:detail-cache:v1` — `Recipe` by recipe id.
- `recipe-api:list-cache:v1` — raw list response by exact query string.

Only **raw, unfiltered** API responses are cached (never the filtered output),
so allergen-list edits re-filter on the next call with no invalidation step.

### Rate limiting / pacing

List/detail resolution fetches **sequentially with spacing** (~1.5× headroom
under the Free plan's 10 req/min), never `Promise.all`. Cache-resident items
skip the pacing sleep.

### Consumers

- Recipes tab — `app/(tabs)/recipes.tsx` (veg / non-veg tabs call
  `listVeganRecipes` / `listNonVegRecipes` and page with `PER_PAGE = 10`).
- Meals search modal — `stores/useMealsStore.ts` calls `searchAllRecipes`.
- Recipe detail — `app/recipe/[id].tsx` calls `getRecipe`.

---

## 2. Ollama Cloud chat

- **Endpoint:** `POST https://ollama.com/api/chat`
- **Auth:** `Authorization: Bearer <key>` (the key is currently hardcoded in
  `app/(tabs)/chat.tsx` as `OLLAMA_API_KEY`).
- **Content-Type:** `application/json`

**Request body**

```jsonc
{
  "model": "gemma4:31b-cloud",
  "stream": false,
  "messages": [
    { "role": "system", "content": "<dynamic system prompt>" },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

- The system prompt is built dynamically from the user's zustand stores: diet,
  allergens, dislikes, daily goals, plus today's water / steps / sleep /
  meditation / workouts / logged foods.

**Response:** the client reads `data.message.content` for the assistant reply.

```jsonc
{
  "message": { "content": "..." }
}
```

**Consumers:** `app/(tabs)/chat.tsx` (AI assistant tab).

---

## 3. tapback.co avatar images

- **Endpoint:** `GET https://tapback.co/api/avatar/{key}.webp`
- **Purpose:** deterministic avatar image keyed by a UUID. A new UUID is
  generated (via `expo-crypto` `Crypto.randomUUID()`) to "shuffle" the avatar.
- **Usage:** rendered through React Native `<Image source={{ uri }}>`.

```text
https://tapback.co/api/avatar/0f8fad5b-d9cb-469f-a165-70867728950e.webp
```

**Consumers:**
- `app/(onboarding)/all-set.tsx` (avatar picker)
- `app/profile.tsx` (profile picture)
- `components/header.tsx` (home header avatar)

---

## 4. api.country.is (IP → country fallback)

- **Endpoint:** `GET https://api.country.is`
- **Purpose:** determine the user's country for ingredient exclusion when
  device location is unavailable/denied.
- **Response (JSON):** `{ "country": "IN", ... }`

**Consumers:** `services/geo.ts` → `getCountry()`, resolution order:

1. `expo-location` foreground permission → coarse position →
   `reverseGeocodeAsync` → `isoCountryCode`.
2. IP fallback via the endpoint above (5 s abort timeout via
   `AbortController`).
3. Final fallback: `"IN"`.

The country code drives client-side beef/pork exclusion in
`services/recipe-api.ts`.

---

## 5. USDA food database (bundled SQLite)

- **Data source:** local file `assets/databases/usda.db` (SQLite).
- **Client module:** `services/usda.ts`
- **DB schema:** one table:

```sql
CREATE TABLE foods (
  fdc_id INTEGER PRIMARY KEY,
  description TEXT,
  category TEXT,
  data TEXT  -- full JSON blob
);
```

- On first use the bundled asset is copied to `<document>/SQLite/usda.db` and
  opened with `expo-sqlite`. **No network calls after the initial seed.**

The `data` JSON blob is a normalized USDA food record:

```jsonc
{
  "fdcId": 167512,
  "description": "…",
  "foodCategory": "Baked Products",
  "foodPortions": [ { "amount": 1.0, "unit": null, "modifier": "serving", "gramWeight": 34.0 } ],
  "nutrientConversionFactors": [ { "type": ".ProteinConversionFactor", "value": 6.25 } ],
  "nutriments": {
    "Protein":          { "amount": 5.88, "unit": "g",   "derivation": "MA" },
    "Energy":           { "amount": 307,  "unit": "kcal", "derivation": "NC" },
    "Fiber, total dietary": { "amount": 1.2, "unit": "g", "derivation": "MA" },
    "Iron, Fe":         { "amount": 2.12, "unit": "mg", "derivation": "MA" },
    "Sodium, Na":       { "amount": 1060.0, "unit": "mg", "derivation": "MA" },
    "Cholesterol":      { "amount": 0.0 },
    // …
  }
}
```

### Exported functions (`services/usda.ts`)

| Function | Behavior |
|---|---|
| `searchFoods(query, limit = 20)` | `LIKE %query%` on `description`, ordered by description. Returns parsed `data` JSON objects. |
| `getFoodById(fdcId)` | Exact `fdc_id` lookup; returns parsed object or `null`. |
| `getFoodsByCategory(category, limit = 50)` | Exact `category` match; returns parsed objects. |

**Consumers:**
- `hooks/use-food-nutrition.ts` — maps a detected COCO food label (e.g.
  `orange`, `pizza`) to a USDA search term and returns a nutrition summary for
  the scan flow.
- `app/_layout.tsx` — seeds / warms the DB on launch (`searchFoods("", 1)`).

> Related shape note: `stores/useScannedFoodStore.ts` types a *saved scan* as
> `ScannedFood` with a `usdaDetails` block whose `nutrients` array is
> `{ nutrientId, nutrientName, unitName, value }[]` (the FoodData Central
> nutrients-list format) — distinct from the `nutriments` map above.

---

## 6. Firebase phone-OTP auth

- **Project:** `nutrilens-86f6e` (`firebaseConfig.js`)
- **Client module:** `firebaseConfig.js` (initializes the Firebase app and
  exports helpers around the official `firebase/auth` web SDK):

| Export | Signature / purpose |
|---|---|
| `auth` | `firebase/auth` instance (`getAuth(app)`). |
| `sendOTP(phoneNumber, recaptchaVerifier)` | `PhoneAuthProvider.verifyPhoneNumber(...)` — returns a verification promise. Wire an Expo reCAPTCHA verifier as `recaptchaVerifier`. |
| `verifyOTP(verificationId, otp)` | `PhoneAuthProvider.credential(...)` then `signInWithCredential(...)`. |
| `onAuthChange(callback)` | `onAuthStateChanged(auth, callback)`; returns the unsubscribe function. |

> The Firebase config (including the API key) is hardcoded client-side, which
> is expected for Firebase web SDK usage.

> ⚠️ Note: the in-app login screen `app/(auth)/login.tsx` is currently a
> **mock** — it simulates OTP send/verify with `setTimeout` and does not yet
> call these Firebase helpers.

---

## 7. On-device ML models (scan flow)

No remote endpoint. Local inference via bundled TFLite models:

- **Model assets**
  - `assets/models/yolov8n.tflite` — YOLOv8n object detection (food detection).
  - `assets/models/midas_v2_small.tflite` — MiDaS v2.1 small depth estimation.
- **Runtime:** `react-native-fast-tflite` (with CoreML / Android GPU delegates
  enabled in `app.json`), `react-native-vision-camera` frame processors.
- **Detection flow:** `components/food-detection-camera.tsx` runs on-device
  detection (COCO-class food labels) and tracking; a detected food label is
  then enriched with USDA nutrition via `hooks/use-food-nutrition.ts`.
- **Model export/download scripts (dev-time):**
  - `scripts/download-models.js` — downloads MiDaS from TensorFlow Hub
    (`https://tfhub.dev/intel/lite-model/midas/v2_1_small/1/lite/1?lite-format=tflite`)
    and exports YOLOv8n via `ultralytics`.
  - `scripts/download-nutrition-data.js` — placeholder (empty).

---

## 8. Dev/build-time script downloads

| Script | Purpose |
|---|---|
| `scripts/download-models.js` | Fetches/export TFLite models (YOLOv8n, MiDaS) for the scan feature. Network needed at setup time only. |
| `scripts/download-nutrition-data.js` | Empty placeholder (0 lines) — intended for regenerating `assets/databases/usda.db`. |

---

## 9. Client-side stores (`stores/*`)

The zustand stores are **not remote APIs** — they are in-memory state, mostly
persisted to AsyncStorage. They are listed here because many screens treat them
as the data API.

| Store | Purpose |
|---|---|
| `useAllergensStore` | User's allergen list. |
| `useDietStore` | Dietary preference (e.g. cuisine/diet). |
| `useDislikedIngredientsStore` | Disliked ingredient list. |
| `useGoalsStore` | Daily calorie/macro goals. |
| `useUserStore` | User / onboarding-completed flag. |
| `useHydrationStore` | Water volume, goal, history. |
| `useSleepStore` | Sleep sessions; `totalSleepToday()`. |
| `useStepStore` | Step count + daily goal (fed by `useStepCounter`). |
| `useActivityStore` | Workout/activity logs. |
| `useMeditationStore` | Meditation sessions. |
| `useScannedFoodStore` | Saved scanned foods (label + USDA details). |
| `useMealsStore` | Base meal plan + daily snapshots + recipe search. |
| `useRecipesStore` (`useSavedRecipesStore`) | Saved recipes. |
| `useSearchStore` | Global recipe-search text state. |
| `useDetectionStore` | Scan/camera detection state. |
| `useHeaderStore` / `useTabStore` | UI state (header title, active tab). |

---

## Security notes (applies repo-wide)

- API keys are currently hardcoded and ship inside the JS bundle:
  - recipe-api.com keys (`services/recipe-api.ts`).
  - Ollama Cloud key (`app/(tabs)/chat.tsx`).
  - Firebase API key (`firebaseConfig.js`).
- Prefer env vars (`EXPO_PUBLIC_*`) or a backend proxy before shipping to real
  users, and rotate any key that has been committed or pasted into chat logs.
