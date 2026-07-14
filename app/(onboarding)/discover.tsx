import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
  Polyline,
  Polygon,
  LinearGradient,
  Defs,
  Stop,
} from "react-native-svg";
export default function DiscoverScreen() {
  return (
    <SafeAreaView>
      <View className="flex flex-col gap-12 items-center justify-between">
        <Image
          source={require("../../assets/images/egg-pan.jpg")}
          style={{ width: "90%", height: "55%", borderRadius: 20 }}
          resizeMode="cover"
        />
        <View className="flex flex-col items-center justify-center w-full">
          <Text className="text-center text-5xl font-[Geologica-SemiBold] ">
            Discover New Recipes
          </Text>
          <Text className="text-2xl p-4 text-center color-[#A2A19D]  font-[Geologica-Regular]">
            Your journey to effortless cooking starts here. Discover, save, and
            enjoy recipes made for you.
          </Text>
        </View>
        <View>
          <Pressable
            className="w-[80vw] flex flex-row p-6 rounded-full items-center justify-center bg-[#FF8762]"
            onPress={() => router.push("/diet-style")}
          >
            <Text className="text-2xl font-[Geologica-Medium]">Continue</Text>
            <View className="absolute right-4">
            <Svg
              xmlns="http://www.w3.org/2000/svg"
              width={42}
              height={42}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <Path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" />
              <Path d="M12 11H8v2h4v3l4-4-4-4z" />
            </Svg>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
