import "./global.css";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import { searchFoods } from "@/services/usda";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View } from "react-native";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { getCountry } from "@/services/geo";
import { File, Directory, Paths } from "expo-file-system";
import { downloadCountryDatabase } from "@/services/open-food-facts";
export const unstable_settings = {
  anchor: "(tabs)",
};
SplashScreen.preventAutoHideAsync();
const styles = StyleSheet.create({
  root: {
    flex: 1,
    fontFamily: "Geologica-Regular",
    backgroundColor: "#F5F8F7",
  },
});
export default function RootLayout() {
  const colorScheme = useColorScheme();
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
        const results = await searchFoods("", 1);
        console.log("USDA DB ready");
        const oranges = await searchFoods("oranges, raw, all");
        console.log(oranges.length);
      } catch (e) {
        console.warn("USDA DB init failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    function logAppStorage() {
      try {
        console.log("\n=== 🔍 CHECKING APP STORAGE ===");

        // 1. Check the root Document Directory
        const docDir = Paths.document;
        console.log("📂 Main Document Path:", docDir.uri);

        if (docDir.exists) {
          // .list() returns an array of File and Directory instances
          const docItems = docDir.list();
          console.log(
            "📄 Files in Main Dir:",
            docItems.map((item) => item.name),
          );
        }

        // 2. Check the nested SQLite Directory
        // The constructor accepts a base directory and path segments
        const sqliteDir = new Directory(Paths.document, "SQLite");

        if (sqliteDir.exists) {
          const sqliteItems = sqliteDir.list();
          console.log("\n📂 SQLite Directory Path:", sqliteDir.uri);
          console.log("📄 Contents of SQLite Dir:");

          // Loop through and log exact sizes to spot the corrupted stubs
          for (const item of sqliteItems) {
            if (item instanceof File) {
              // If this size is ~100 bytes, you know it's a corrupted stub!
              console.log(`   ↳ 📄 ${item.name}: ${item.size} bytes`);
            } else if (item instanceof Directory) {
              console.log(`   ↳ 📁 ${item.name} (Directory)`);
            }
          }
        } else {
          console.log("\n⚠️ SQLite Directory does not exist yet.");
        }

        console.log("=================================\n");
      } catch (error) {
        console.error("❌ Error reading directories:", error);
      }
    }

    logAppStorage();
  }, []);

  if (!loaded) return null;
  return (
    <View style={styles.root}>
      <GluestackUIProvider mode="light">
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </View>
  );
}
