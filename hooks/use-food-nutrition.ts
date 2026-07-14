import { useState, useEffect, useRef } from "react";
import { searchFoods } from "@/services/usda";

// map COCO labels → USDA search terms
const LABEL_TO_USDA: Record<string, string> = {
  orange:   "Oranges, raw, all commercial varieties",
  apple:    "Apples, raw, with skin",
  banana:   "Bananas, raw",
  broccoli: "Broccoli, raw",
  carrot:   "Carrots, raw",
  pizza:    "Pizza, cheese topping, regular crust",
  donut:    "Doughnuts, cake-type, plain",
  cake:     "Cake, yellow, prepared from recipe",
  "hot dog":"Frankfurter, beef",
  sandwich: "Sandwich, with cheese",
  bowl:     null,
  bottle:   null,
  cup:      null,
  fork:     null,
  knife:    null,
  spoon:    null,
  "wine glass": null,
};

export interface NutritionSummary {
  label: string;
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  vitaminC?: number;
  sugar?: number;
}

export function useFoodNutrition(detectedLabel: string | null) {
  const [nutrition, setNutrition] = useState<NutritionSummary | null>(null);
  const [loading, setLoading]     = useState(false);
  const lastLabel = useRef<string | null>(null);

  useEffect(() => {
    if (!detectedLabel) { setNutrition(null); return; }
    // don't re-fetch if same label
    if (detectedLabel === lastLabel.current) return;

    const query = LABEL_TO_USDA[detectedLabel];
    if (query === null) { setNutrition(null); return; } // non-food item
    if (!query)         { setNutrition(null); return; }

    lastLabel.current = detectedLabel;
    setLoading(true);

    searchFoods(query, 1).then((results) => {
      const food = results[0];
      if (!food) { setLoading(false); return; }

      const n = food.nutriments;
      setNutrition({
        label:       detectedLabel,
        description: food.description,
        calories:    n["Energy"]?.unit === "kcal"
                       ? n["Energy"]?.amount
                       : n["Energy (Atwater General Factors)"]?.amount,
        protein:     n["Protein"]?.amount,
        carbs:       n["Carbohydrate, by difference"]?.amount,
        fat:         n["Total lipid (fat)"]?.amount,
        fiber:       n["Fiber, total dietary"]?.amount,
        vitaminC:    n["Vitamin C, total ascorbic acid"]?.amount,
        sugar:       n["Total Sugars"]?.amount,
      });
      setLoading(false);
    });
  }, [detectedLabel]);

  return { nutrition, loading };
}
