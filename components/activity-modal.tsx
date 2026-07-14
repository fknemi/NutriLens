import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { useActivityStore } from "@/stores/useActivityStore";

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

// 1. Predefined Data for the Dropdowns
const ACTIVITIES = [
  { id: "run", label: "Morning Run", type: "Cardio", calsPerMin: 11.4 },
  { id: "cycle", label: "Cycling", type: "Cardio", calsPerMin: 8.5 },
  { id: "weights", label: "Weightlifting", type: "Strength", calsPerMin: 5.0 },
  { id: "yoga", label: "Yoga", type: "Flexibility", calsPerMin: 3.2 },
  { id: "swim", label: "Swimming", type: "Cardio", calsPerMin: 9.8 },
  { id: "walk", label: "Walking", type: "Cardio", calsPerMin: 4.3 },
];

const DURATIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
];

// 2. Custom Reusable Dropdown Component
function CustomDropdown({
  placeholder,
  options,
  selectedValue,
  onSelect,
}: {
  placeholder: string;
  options: { value: string | number; label: string }[];
  selectedValue: string | number;
  onSelect: (value: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="bg-[#EDEFF3] rounded-2xl px-4 py-3 flex-row justify-between items-center"
      >
        <Text className={`text-base ${selectedOption ? "text-[#111]" : "text-[#9CA3AF]"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</Text>
      </Pressable>

      {isOpen && (
        <View className="bg-[#f8f9fb] rounded-2xl mt-1 overflow-hidden border border-gray-100">
          {options.map((opt, index) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                onSelect(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 ${
                index !== options.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <Text className="text-base text-[#111]">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ActivityModal({ visible, onClose }: ActivityModalProps) {
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<number | "">("");

  const addActivity = useActivityStore((state) => state.addActivity);

  const handleSave = () => {
    const activity = ACTIVITIES.find((a) => a.id === selectedActivityId);
    
    if (!activity || !selectedDuration) return;

    // Calculate calories invisibly behind the scenes!
    const estimatedCalories = Math.round(activity.calsPerMin * (selectedDuration as number));

    addActivity({
      name: activity.label,
      type: activity.type,
      duration: (selectedDuration as number) * 60, // Convert minutes to seconds
      caloriesBurned: estimatedCalories,
    });

    // Reset fields and close
    setSelectedActivityId("");
    setSelectedDuration("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl w-full p-6"
          style={{ maxHeight: "80%" }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header simplified to just the text! */}
          <Text className="text-xl font-bold text-gray-900 mb-6">Log Activity</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            
            <CustomDropdown
              placeholder="Select Activity"
              options={ACTIVITIES.map((a) => ({ value: a.id, label: a.label }))}
              selectedValue={selectedActivityId}
              onSelect={setSelectedActivityId}
            />

            <CustomDropdown
              placeholder="Select Duration"
              options={DURATIONS}
              selectedValue={selectedDuration}
              onSelect={setSelectedDuration}
            />

            <Pressable
              onPress={handleSave}
              className="bg-black rounded-full py-4 items-center mt-2 mb-8"
            >
              <Text className="text-white font-bold text-base">Save Activity</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
