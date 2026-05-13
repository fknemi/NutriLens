// components/sleep-modal.tsx
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSleepTracker } from "@/hooks/use-sleep-tracker";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SleepModal({ visible, onClose }: Props) {
  const {
    sleeping,
    sleepingFor,
    sessions,
    totalToday,
    toggle,
    deleteSession,
    formatDuration,
    formatTime,
  } = useSleepTracker();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <Pressable>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-12 gap-6">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="bg-[#E6CCEE] w-10 h-10 rounded-full items-center justify-center">
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M23.9524 15.3116C23.1922 17.7939 21.6685 19.9732 19.5983 21.5393C17.7807 22.9076 15.6178 23.7421 13.3524 23.9492C11.087 24.1563 8.80871 23.7277 6.77329 22.7116C4.73786 21.6955 3.02585 20.1321 1.82942 18.1968C0.632997 16.2616 -0.000493328 14.0311 5.75939e-05 11.7557C-0.00812152 9.09987 0.855065 6.5147 2.45719 4.39678C4.02296 2.32611 6.20177 0.802124 8.68359 0.0416969C8.84716 -0.00868051 9.02137 -0.0135045 9.18747 0.0277437C9.35358 0.068992 9.5053 0.154752 9.62632 0.2758C9.74735 0.396848 9.83309 0.548605 9.87433 0.71475C9.91557 0.880894 9.91074 1.05514 9.86038 1.21875C9.31769 3.01425 9.27219 4.92339 9.72872 6.74272C10.1853 8.56205 11.1267 10.2234 12.4528 11.5498C13.7789 12.8761 15.4398 13.8178 17.2588 14.2744C19.0777 14.7311 20.9864 14.6856 22.7815 14.1428C22.9451 14.0924 23.1193 14.0876 23.2854 14.1288C23.4515 14.1701 23.6032 14.2558 23.7243 14.3769C23.8453 14.4979 23.931 14.6497 23.9723 14.8158C24.0135 14.982 24.0087 15.1562 23.9583 15.3198L23.9524 15.3116Z"
                      fill="#780B9F"
                    />
                  </Svg>
                </View>
                <Text className="text-xl font-medium">Sleep</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-400 text-base">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Total today */}
            <View className="bg-[#F5F0FA] rounded-2xl px-5 py-4 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-500 text-sm">Total today</Text>
                <Text className="text-3xl font-semibold text-[#111] mt-1">
                  {totalToday}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 text-sm">Goal</Text>
                <Text className="text-lg font-medium text-[#780B9F]">
                  8h 0m
                </Text>
              </View>
            </View>

            {/* Sleep / Wake button */}
            <TouchableOpacity
              onPress={toggle}
              className={`rounded-2xl py-4 items-center ${
                sleeping ? "bg-[#F5F0FA]" : "bg-[#780B9F]"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  sleeping ? "text-[#780B9F]" : "text-white"
                }`}
              >
                {sleeping ? "☀️  Wake up" : "🌙  Go to sleep"}
              </Text>
              {sleeping && sleepingFor && (
                <Text className="text-[#780B9F] text-sm mt-1 opacity-70">
                  Sleeping for {sleepingFor}
                </Text>
              )}
            </TouchableOpacity>

            {/* Sessions */}
            {sessions.length > 0 && (
              <View className="gap-2">
                <Text className="text-gray-500 text-sm font-medium">
                  Today's sessions
                </Text>
                {sessions.map((s) => (
                  <View
                    key={s.id}
                    className="flex-row items-center justify-between bg-[#FAFAFA] rounded-xl px-4 py-3"
                  >
                    <Text className="text-[#111]">
                      {formatTime(s.bedtime)} → {formatTime(s.wakeTime)}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-[#780B9F] font-medium">
                        {formatDuration(s.durationMs)}
                      </Text>
                      <TouchableOpacity onPress={() => deleteSession(s.id)}>
                        <Text className="text-gray-300 text-lg">✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
