import { Tabs } from "expo-router";
import React from "react";
import { CustomTabBar } from "@/components/custom-tab-bar";
import Header from "@/components/header";
import Search from "@/components/search";
export default function TabLayout() {
  return (
    <>
      <Header />
      <Search />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="diet" options={{ title: "Diet" }} />
        <Tabs.Screen name="scan" options={{ title: "Scan Food" }} />
        <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
        <Tabs.Screen name="recipes" options={{ title: "Recipes" }} />
      </Tabs>
    </>
  );
}
