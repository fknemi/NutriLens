import { View, Text, Pressable, Modal } from "react-native";
import Svg, { Path, Defs, Stop, LinearGradient, Rect } from "react-native-svg";
import { useState } from "react";

function formatVolume(valueInLitres) {
  if (valueInLitres >= 1) {
    const rounded = parseFloat(valueInLitres.toFixed(2));
    return {
      display: rounded % 1 === 0 ? String(rounded) : String(rounded),
      unit: "L",
    };
  } else if (valueInLitres >= 0.001) {
    return { display: String(Math.round(valueInLitres * 1000)), unit: "ml" };
  } else {
    return {
      display: String(Math.round(valueInLitres * 1_000_000)),
      unit: "µL",
    };
  }
}

const QUICK_ADD_OPTIONS = [
  { label: "250 ml", value: 0.25 },
  { label: "500 ml", value: 0.5 },
  { label: "1000 ml", value: 1 },
];
function GradientProgressBar({ progress }) {
  const [barWidth, setBarWidth] = useState(0);
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const fillWidth = (clampedProgress / 100) * barWidth;
  const BAR_HEIGHT = 10;
  const RADIUS = BAR_HEIGHT / 2;

  return (
    <View
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      style={{ width: "100%", height: BAR_HEIGHT }}
    >
      {barWidth > 0 && (
        <Svg width={barWidth} height={BAR_HEIGHT}>
          <Defs>
            <LinearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#60B8F5" stopOpacity="1" />
              <Stop offset="1" stopColor="#1A6FD4" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          {/* Track */}
          <Rect
            x={0}
            y={0}
            width={barWidth}
            height={BAR_HEIGHT}
            rx={RADIUS}
            fill="#E8EDF2"
          />
          {/* Fill */}
          {fillWidth > 0 && (
            <Rect
              x={0}
              y={0}
              width={fillWidth}
              height={BAR_HEIGHT}
              rx={RADIUS}
              fill="url(#blueGrad)"
            />
          )}
        </Svg>
      )}
    </View>
  );
}

function WaterCard({ name, waterVolumeReached, goal }) {
  const [modalVisible, setModalVisible] = useState(false);
  const progress = (waterVolumeReached / goal) * 100;
  const { display, unit } = formatVolume(waterVolumeReached);

  return (
    <>
      <View className="bg-white rounded-3xl w-[90vw] px-12 py-5 gap-12">
        <View className="flex flex-row justify-between items-center">
          <View className="flex flex-col gap-2">
            <Text className="text-xl font-semibold text-[#111]">{name}</Text>
          </View>
          <Pressable onPress={() => setModalVisible(true)}>
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
            <Text className="text-3xl font-bold">{display}</Text>
            <Text className="text-xl text-[#818181]">{unit}</Text>
          </View>
          <View className="flex flex-row gap-2 items-baseline justify-center">
            <Text className="text-xl font-semibold">
              {progress % 1 === 0 ? progress : progress.toFixed(1)}
            </Text>
            <Text className="text-xl text-[#818181]">%</Text>
          </View>

          {/* Gradient progress bar */}
          <GradientProgressBar progress={progress} />
        </View>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Backdrop */}
        <Pressable
          className="flex-1"
          onPress={() => setModalVisible(false)}
        />

        {/* Sheet */}
        <View className="bg-white w-full">
          <View className="w-full" />
          {QUICK_ADD_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              onPress={() => {
                onAdd?.(option.value);
                setModalVisible(false);
              }}
              className="flex flex-row w-full items-center justify-between border-b border-[#E8EDF2] rounded-2xl px-5 py-8"
            >
              <Svg
                width="5"
                height="8"
                viewBox="0 0 5 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <Path
                  d="M4.82993 4.36948L0.986006 7.84696C0.877687 7.94495 0.730775 8 0.577589 8C0.424403 8 0.277491 7.94495 0.169172 7.84696C0.0608528 7.74896 1.14133e-09 7.61606 0 7.47747C-1.14133e-09 7.33889 0.0608528 7.20598 0.169172 7.10799L3.60516 4.00043L0.170133 0.892008C0.116499 0.843487 0.0739538 0.785884 0.0449272 0.722488C0.0159007 0.659092 0.000960821 0.591145 0.00096082 0.522526C0.00096082 0.453907 0.0159007 0.38596 0.0449272 0.322564C0.0739538 0.259168 0.116499 0.201565 0.170133 0.153044C0.223767 0.104523 0.28744 0.0660344 0.357516 0.039775C0.427593 0.0135156 0.5027 -5.11252e-10 0.57855 0C0.6544 5.11252e-10 0.729507 0.0135156 0.799584 0.039775C0.86966 0.0660344 0.933333 0.104523 0.986967 0.153044L4.83089 3.63052C4.88458 3.67904 4.92716 3.73666 4.95618 3.8001C4.9852 3.86353 5.00009 3.93153 5 4.00018C4.99991 4.06883 4.98484 4.13679 4.95566 4.20017C4.92647 4.26354 4.88375 4.32108 4.82993 4.36948Z"
                  fill="#111111"
                />
              </Svg>

              <Text className="text-base font-semibold text-[#111]">
                {option.label}
              </Text>
              <Text className="text-sm text-[#818181]">+{option.value} L</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

export default WaterCard;
