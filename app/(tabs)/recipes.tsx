import { View, ScrollView, Text, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { Selectors } from "@/components/selectors";
import Svg, { Path, Defs, Stop, LinearGradient } from "react-native-svg";
import RecipeCard from "@/components/recipe-card";
import { searchProducts } from "@/services/open-food-facts";
export default function RecipesScreen() {
  const [activeSelector, setActiveSelector] = useState(0);
  const activeIndex = useSharedValue(0);

  const scrollY = useSharedValue(0);
  const SCREEN_HEIGHT = Dimensions.get("window").height;

  function handleSelect(index: number) {
    setActiveSelector(index);
    activeIndex.value = withTiming(index, { duration: 300 });
  }
  useEffect(() => {
    (async () => {
      try {
        const results = await searchProducts("banana", 1, 20);
        console.log(results);
      } catch (error) {
        console.warn("Failed to fetch products:", error);
      }
    })();
  }, []);
  return (
    <View className="flex-1  items-center justify-start mt-12 gap-8 flex ">
      <View className="flex-row pl-5 pr-12 items-center justify-between  w-full">
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
        <Svg
          width="27"
          height="14"
          viewBox="0 0 27 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Path
            d="M22.3448 7C22.3448 7.3713 22.1977 7.7274 21.9358 7.98995C21.6739 8.2525 21.3187 8.4 20.9483 8.4H6.05172C5.68134 8.4 5.32612 8.2525 5.06421 7.98995C4.80231 7.7274 4.65517 7.3713 4.65517 7C4.65517 6.6287 4.80231 6.2726 5.06421 6.01005C5.32612 5.7475 5.68134 5.6 6.05172 5.6H20.9483C21.3187 5.6 21.6739 5.7475 21.9358 6.01005C22.1977 6.2726 22.3448 6.6287 22.3448 7ZM25.6034 0H1.39655C1.02616 1.10657e-08 0.670945 0.147499 0.409041 0.41005C0.147136 0.672601 0 1.0287 0 1.4C0 1.7713 0.147136 2.1274 0.409041 2.38995C0.670945 2.6525 1.02616 2.8 1.39655 2.8H25.6034C25.9738 2.8 26.3291 2.6525 26.591 2.38995C26.8529 2.1274 27 1.7713 27 1.4C27 1.0287 26.8529 0.672601 26.591 0.41005C26.3291 0.147499 25.9738 1.10657e-08 25.6034 0ZM16.2931 11.2H10.7069C10.3365 11.2 9.98129 11.3475 9.71939 11.6101C9.45748 11.8726 9.31034 12.2287 9.31034 12.6C9.31034 12.9713 9.45748 13.3274 9.71939 13.5899C9.98129 13.8525 10.3365 14 10.7069 14H16.2931C16.6635 14 17.0187 13.8525 17.2806 13.5899C17.5425 13.3274 17.6897 12.9713 17.6897 12.6C17.6897 12.2287 17.5425 11.8726 17.2806 11.6101C17.0187 11.3475 16.6635 11.2 16.2931 11.2Z"
            fill="black"
          />
        </Svg>
      </View>
      <View className="items-start justify-center gap-4 pl-5 w-full">
        <RecipeCard
          title="Grilled Salmon with Lemon Butter"
          image="https://example.com/salmon.jpg"
          rating={4.7}
          duration="25"
          calories={380}
          fats={18}
          savedInitially={false}
        />
      </View>
    </View>
  );
}
