import { View, Text, Pressable } from "react-native";
import Svg, { Path, Defs, Stop, LinearGradient } from "react-native-svg";

function ActivityCard({ name, type, caloriesBurned, duration }) {
  return (
    <View className="bg-white rounded-3xl w-[90vw]  px-12 py-5 gap-12">
      <View className="flex flex-row justify-between items-center">
        <View className="flex flex-col gap-2">
          <Text className="text-xl font-semibold text-[#111]">{name}</Text>
          <Text className="text-base text-gray-500">{type}</Text>
        </View>
        <Pressable>
          <Svg
            width={36}
            height={36}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Path
              d="M18 0C14.4399 0 10.9598 1.05568 7.99974 3.03355C5.03966 5.01141 2.73255 7.82263 1.37018 11.1117C0.00779912 14.4008 -0.348661 18.02 0.345873 21.5116C1.04041 25.0033 2.75474 28.2106 5.27208 30.7279C7.78943 33.2453 10.9967 34.9596 14.4884 35.6541C17.98 36.3487 21.5992 35.9922 24.8883 34.6298C28.1774 33.2674 30.9886 30.9603 32.9665 28.0003C34.9443 25.0402 36 21.5601 36 18C35.994 13.2279 34.0957 8.65302 30.7213 5.27865C27.347 1.90429 22.7721 0.00595393 18 0ZM24.9231 19.3846H19.3846V24.9231C19.3846 25.2903 19.2387 25.6425 18.9791 25.9021C18.7194 26.1618 18.3672 26.3077 18 26.3077C17.6328 26.3077 17.2806 26.1618 17.0209 25.9021C16.7613 25.6425 16.6154 25.2903 16.6154 24.9231V19.3846H11.0769C10.7097 19.3846 10.3575 19.2387 10.0979 18.9791C9.83819 18.7194 9.69231 18.3672 9.69231 18C9.69231 17.6328 9.83819 17.2806 10.0979 17.0209C10.3575 16.7613 10.7097 16.6154 11.0769 16.6154H16.6154V11.0769C16.6154 10.7097 16.7613 10.3575 17.0209 10.0978C17.2806 9.83818 17.6328 9.69231 18 9.69231C18.3672 9.69231 18.7194 9.83818 18.9791 10.0978C19.2387 10.3575 19.3846 10.7097 19.3846 11.0769V16.6154H24.9231C25.2903 16.6154 25.6425 16.7613 25.9022 17.0209C26.1618 17.2806 26.3077 17.6328 26.3077 18C26.3077 18.3672 26.1618 18.7194 25.9022 18.9791C25.6425 19.2387 25.2903 19.3846 24.9231 19.3846Z"
              fill="black"
            />
          </Svg>
        </Pressable>
      </View>
      <View className="flex-col gap-4 items-start justify-start">
        <View className="flex flex-row gap-2 items-baseline justify-center">
          <Text className="text-3xl font-bold">{caloriesBurned}</Text>
          <Text className="text-xl text-[#818181]">Calories Burned</Text>
        </View>

        <View className="flex flex-row gap-2 items-baseline justify-center">
          <Text className="text-xl font-semibold">{duration / 60}</Text>
          <Text className="text-xl text-[#818181]">min</Text>
        </View>
      </View>
    </View>
  );
}

export default ActivityCard;
