import "./global.css";
import "react-native-reanimated";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { File, Directory, Paths } from "expo-file-system";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useStepCounter } from "@/hooks/use-step-counter";
import { getCountry } from "@/services/geo";
import { searchFoods } from "@/services/usda";
import { downloadCountryDatabase } from "@/services/open-food-facts";
import { useActivityStore } from "@/stores/useActivityStore";
import { useAllergensStore } from "@/stores/useAllergensStore";
import { useDetectionStore } from "@/stores/useDetectionStore";
import { useDietStore } from "@/stores/useDietStore";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";
import { useGoalsStore } from "@/stores/useGoalsStore";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useMealsStore } from "@/stores/useMealsStore";
import { useRecipesStore } from "@/stores/useRecipesStore";
import { useScannedFoodStore } from "@/stores/useScannedFoodStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSleepStore } from "@/stores/useSleepStore";
import { useStepStore } from "@/stores/useStepStore";
import { useTabStore } from "@/stores/useTabStore";
import { useUserStore } from "@/stores/useUserStore";
SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  root: {
    flex: 1,
    fontFamily: "Geologica-Regular",
    backgroundColor: "#F5F8F7",
  },
});


const allStores = {
  useActivityStore,
  useAllergensStore,
  useDetectionStore,
  useDietStore,
  useDislikedIngredientsStore,
  useGoalsStore,
  useHeaderStore,
  useHydrationStore,
  useMealsStore,
  useRecipesStore,
  useScannedFoodStore,
  useSearchStore,
  useSleepStore,
  useStepStore,
  useTabStore,
  useUserStore,
} as const;

function logAllStores() {
  const snapshot: Record<string, unknown> = {};
  for (const [name, useStoreHook] of Object.entries(allStores)) {
    try {
      snapshot[name] = (useStoreHook as any).getState();
    } catch (err) {
      snapshot[name] = { __error: String(err) };
    }
  }
  console.log(
    `[store-snapshot @ ${new Date().toLocaleTimeString()}]`,
    JSON.stringify(snapshot, null, 2),
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useStepCounter();

  const [loaded] = useFonts({
    "Geologica-Thin": require("@/assets/fonts/geologica-v5-latin-100.ttf"),
    "Geologica-ExtraLight": require("@/assets/fonts/geologica-v5-latin-200.ttf"),
    "Geologica-Light": require("@/assets/fonts/geologica-v5-latin-300.ttf"),
    "Geologica-Regular": require("@/assets/fonts/geologica-v5-latin-regular.ttf"),
    "Geologica-Medium": require("@/assets/fonts/geologica-v5-latin-500.ttf"),
    "Geologica-SemiBold": require("@/assets/fonts/geologica-v5-latin-600.ttf"),
    "Geologica-Bold": require("@/assets/fonts/geologica-v5-latin-700.ttf"),
    "Geologica-ExtraBold": require("@/assets/fonts/geologica-v5-latin-800.ttf"),
    "Geologica-Black": require("@/assets/fonts/geologica-v5-latin-900.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    (async () => {
      try {
        const country = await getCountry();
        console.log(country);
      } catch (error) {
        console.warn("Failed to get country:", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await searchFoods("", 1);
        console.log("USDA DB ready");
        const oranges = await searchFoods("oranges, raw, all");
        console.log(oranges.length);
      } catch (e) {
        console.warn("USDA DB init failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const docDir = Paths.document;
      console.log("Document path:", docDir.uri);

      if (docDir.exists) {
        const docItems = docDir.list();
        console.log("Files:", docItems.map((item) => item.name));
      }

      const sqliteDir = new Directory(Paths.document, "SQLite");

      if (sqliteDir.exists) {
        for (const item of sqliteDir.list()) {
          if (item instanceof File) {
            console.log(`  ${item.name}: ${item.size} bytes`);
          } else if (item instanceof Directory) {
            console.log(`  ${item.name}/`);
          }
        }
      } else {
        console.log("SQLite directory does not exist yet.");
      }
    } catch (err) {
      console.error(err);
    }
  }, []);
 useEffect(() => {
    logAllStores(); // fire once immediately on mount
    const interval = setInterval(logAllStores, 10_000);
    return () => clearInterval(interval);
  }, []);
  if (!loaded) return null;

  return (
    <View style={styles.root}>
      <GluestackUIProvider mode="light">
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </GluestackUIProvider>
    </View>
  );
}
