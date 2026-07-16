import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState, useRef } from "react";
import Svg, {
  Path,
  Rect,
  LinearGradient,
  Defs,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";

// --- Store Imports ---
import { useAllergensStore } from "@/stores/useAllergensStore";
import { useDietStore } from "@/stores/useDietStore";
import { useDislikedIngredientsStore } from "@/stores/useDislikedIngredientsStore";
import { useGoalsStore } from "@/stores/useGoalsStore";
import { useHydrationStore } from "@/stores/useHydrationStore";
import { useSleepStore } from "@/stores/useSleepStore";
import { useStepStore } from "@/stores/useStepStore";
import { useActivityStore } from "@/stores/useActivityStore";
import { useScannedFoodStore } from "@/stores/useScannedFoodStore";
import { useMeditationStore } from "@/stores/useMeditationStore";

// ─── Constants ───────────────────────────────────────────────────────────────
const OLLAMA_API_KEY = "3a72b06ce62d4547b41ad4a40459647b.ZMhRtMMY80YxohN2Im9wYrBb"; 


// ─── Types ───────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function AIIconButton() {
  return (
    <Svg width={42} height={42} viewBox="0 0 42 42" fill="none">
      <Rect
        width={40}
        height={40}
        rx={4}
        transform="matrix(-1 0 0 1 41 1)"
        stroke="url(#paint0_linear_7_35)"
        strokeWidth={2}
      />
      <Path
        d="M8.6489 24.1141L13.4012 25.5836C14.0901 25.7966 14.6217 26.2718 14.8371 26.8676L16.6535 31.887C16.708 32.0377 16.9587 32.0377 17.0133 31.887L18.8295 26.8676C19.0451 26.2718 19.5766 25.7966 20.2654 25.5836L25.0178 24.1141C25.2163 24.0527 25.2163 23.8139 25.0178 23.7526L20.2654 22.283C19.5766 22.0701 19.0451 21.5948 18.8295 20.9991L17.0133 15.9796C16.9587 15.829 16.708 15.829 16.6535 15.9796L14.8371 20.9991C14.6217 21.5948 14.0901 22.0701 13.4012 22.283L8.6489 23.7526C8.45037 23.8139 8.45037 24.0527 8.6489 24.1141Z"
        fill="url(#paint1_linear_7_35)"
      />
      <Path
        d="M28.5 14.4C24.5 14.4 23.5 17.3333 23.5 18.8C23.5 17.3333 22.5 14.4 18.5 14.4C20.1667 14.4 23.5 13.52 23.5 10C23.5 13.52 26.8333 14.4 28.5 14.4Z"
        fill="url(#paint2_linear_7_35)"
      />
      <Path
        d="M33.5 27.6C29.5 27.6 28.5 30.5333 28.5 32C28.5 30.5333 27.5 27.6 23.5 27.6C25.1667 27.6 28.5 26.72 28.5 23.2C28.5 26.72 31.8333 27.6 33.5 27.6Z"
        fill="url(#paint3_linear_7_35)"
      />
      <Defs>
        <LinearGradient id="paint0_linear_7_35" x1={35.4337} y1={32.325} x2={-11.3145} y2={-0.196628} gradientUnits="userSpaceOnUse">
          <Stop stopColor="#B93BC4" />
          <Stop offset={0.514423} stopColor="#3C79DF" />
        </LinearGradient>
        <LinearGradient id="paint1_linear_7_35" x1={10.4026} y1={28.9044} x2={29.4633} y2={15.206} gradientUnits="userSpaceOnUse">
          <Stop stopColor="#B93BC4" />
          <Stop offset={0.495192} stopColor="#3C79DF" />
        </LinearGradient>
        <LinearGradient id="paint2_linear_7_35" x1={19.3333} y1={17.3333} x2={27.4324} y2={8.96655} gradientUnits="userSpaceOnUse">
          <Stop offset={0.211538} stopColor="#ADA816" />
          <Stop offset={0.711538} stopColor="#F6EDB9" />
        </LinearGradient>
        <LinearGradient id="paint3_linear_7_35" x1={24.3333} y1={30.5333} x2={32.4324} y2={22.1665} gradientUnits="userSpaceOnUse">
          <Stop stopColor="#16AD27" />
          <Stop offset={0.456731} stopColor="#31DA22" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

function SendIcon({ disabled }: { disabled: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="sendGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor={disabled ? "#ccc" : "#B93BC4"} />
          <Stop offset="1" stopColor={disabled ? "#ccc" : "#3C79DF"} />
        </LinearGradient>
      </Defs>
      <Path d="M22 2L11 13" stroke="url(#sendGrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="url(#sendGrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Markdown Styles ─────────────────────────────────────────────────────────
// Matches the assistant bubble's base typography (14.5/21, #111) while adding
// sensible styling for the markdown-only elements (bold, lists, code, links).

const markdownStyles = {
  body: { fontSize: 14.5, lineHeight: 21, color: "#111" },
  paragraph: { marginTop: 0, marginBottom: 8 },
  strong: { fontWeight: "700" as const },
  em: { fontStyle: "italic" as const },
  bullet_list: { marginBottom: 4 },
  ordered_list: { marginBottom: 4 },
  list_item: { flexDirection: "row" as const, marginBottom: 4 },
  code_inline: {
    backgroundColor: "#F3F4F8",
    color: "#B93BC4",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 13.5,
  },
  code_block: {
    backgroundColor: "#F3F4F8",
    borderRadius: 10,
    padding: 10,
    fontSize: 13.5,
  },
  fence: {
    backgroundColor: "#F3F4F8",
    borderRadius: 10,
    padding: 10,
    fontSize: 13.5,
  },
  link: { color: "#3C79DF" },
  heading1: { fontSize: 19, fontWeight: "700" as const, marginTop: 4, marginBottom: 6 },
  heading2: { fontSize: 17, fontWeight: "700" as const, marginTop: 4, marginBottom: 6 },
  heading3: { fontSize: 15.5, fontWeight: "700" as const, marginTop: 4, marginBottom: 4 },
  blockquote: {
    backgroundColor: "#F7F8FA",
    borderLeftWidth: 3,
    borderLeftColor: "#EDEFF3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 4,
  },
  hr: { backgroundColor: "#EDEFF3", height: 1, marginVertical: 8 },
};

// ─── Bubble ──────────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View className={`mb-3 max-w-[80%] ${isUser ? "self-end" : "self-start"}`}>
      {!isUser && (
        <View className="flex-row items-center gap-1.5 mb-1 ml-1">
          <AIIconButton />
          <Text className="text-xs text-gray-400 font-medium">AI Assistant</Text>
        </View>
      )}
      <View
        style={
          isUser
            ? {
                backgroundColor: "#F3F4F8",
                borderRadius: 20,
                borderBottomRightRadius: 4,
                paddingHorizontal: 16,
                paddingVertical: 11,
              }
            : {
                backgroundColor: "#fff",
                borderRadius: 20,
                borderBottomLeftRadius: 4,
                paddingHorizontal: 16,
                paddingVertical: 11,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
        }
      >
        {isUser ? (
          <Text style={{ fontSize: 14.5, lineHeight: 21, color: "#111" }}>
            {message.text}
          </Text>
        ) : (
          <Markdown style={markdownStyles}>{message.text}</Markdown>
        )}
      </View>
      <Text className={`text-[10px] text-gray-400 mt-1 ${isUser ? "text-right mr-1" : "ml-1"}`}>
        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View className="self-start mb-3">
      <View className="flex-row items-center gap-1.5 mb-1 ml-1">
        <AIIconButton />
        <Text className="text-xs text-gray-400 font-medium">AI Assistant</Text>
      </View>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 16,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#C084FC", opacity: 0.6 + i * 0.2 }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4 mt-8">
      <AIIconButton />
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#111", textAlign: "center" }}>
        Ask me anything
      </Text>
      <Text style={{ fontSize: 14, color: "#848484", textAlign: "center", lineHeight: 20 }}>
        I can help you track nutrition, understand your data, suggest meal
        plans, and more.
      </Text>
      <View className="flex-row flex-wrap gap-2 justify-center mt-2">
        {[
          "How many calories have I eaten today?",
          "Suggest a high-protein dinner",
          "Am I hitting my water goals?",
        ].map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onSelectPrompt(prompt)}
            style={{ backgroundColor: "#F3F4F8", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 13, color: "#555" }}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AIChatScreen({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  function handlePresetPrompt(promptText: string) {
    setInput(promptText);
    setTimeout(() => triggerSend(promptText), 50);
  }

  async function triggerSend(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      // 1. SILENTLY FETCH STORE DATA
      const todayISO = new Date().toISOString().slice(0, 10);

      const diet = useDietStore.getState().diet;
      const allergens = useAllergensStore.getState().allergens;
      const dislikes = useDislikedIngredientsStore.getState().ingredients;
      const goals = useGoalsStore.getState();
      const hydration = useHydrationStore.getState();
      const steps = useStepStore.getState();

      const activities = useActivityStore.getState().activities.filter((a) => a.date?.startsWith(todayISO));
      const burnedKcal = activities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

      const meditations = useMeditationStore.getState().sessions.filter((s) => s.date.startsWith(todayISO));
      const medMins = Math.floor(meditations.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);

      const sleepMs = useSleepStore.getState().totalSleepToday();
      const sleepHrs = (sleepMs / (1000 * 60 * 60)).toFixed(1);

      const foods = useScannedFoodStore.getState().foods.filter((f) => f.scannedAt.startsWith(todayISO));
      const foodList = foods.length > 0 ? foods.map((f) => f.labelText).join(", ") : "None logged today";

      // 2. CONSTRUCT DYNAMIC SYSTEM PROMPT
      const dynamicSystemPrompt = `
      You are a helpful nutrition and fitness AI assistant inside the NutriLens app. 
      Keep responses concise, friendly, and conversational. Do NOT explicitly list out the user's data unless they ask. Just use it as context to give tailored advice.

      [USER PROFILE]
      Dietary Preference: ${diet || 'None'}
      Allergies: ${allergens.length ? allergens.join(', ') : 'None'}
      Dislikes: ${dislikes.length ? dislikes.join(', ') : 'None'}
      Daily Targets: ${goals.calories} kcal, ${goals.protein}g Protein, ${goals.carbs}g Carbs, ${goals.fat}g Fat.

      [TODAY'S PROGRESS (${todayISO})]
      Water: ${hydration.dailyVolume}ml / ${hydration.dailyGoal}ml
      Steps: ${steps.steps} / ${steps.goal}
      Sleep: ${sleepHrs} hours
      Meditation: ${medMins} minutes
      Workouts Logged: ${activities.length ? activities.map(a => a.name).join(', ') : 'None'} (${burnedKcal} kcal burned)
      Foods Logged: ${foodList}
      `;

      // 3. API CALL TO OLLAMA CLOUD
      const response = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OLLAMA_API_KEY}`
        },
        body: JSON.stringify({
          model: "gemma4:31b-cloud",
          stream: false,
          messages: [
            { role: "system", content: dynamicSystemPrompt },
            ...[...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.text,
            })),
          ],
        }),
      });

      const data = await response.json();
      const reply = data?.message?.content ?? "Sorry, I couldn't get a response. Please check your API connection.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Something went wrong communicating with Ollama Cloud. Please check your network or API Key.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F7F8FA" }}
      // "height" on Android avoids relying on windowSoftInputMode/native resize,
      // which is often not configured correctly (especially in Expo managed apps)
      // and otherwise leaves the input bar with no keyboard handling at all.
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // No header in this screen, so the offset should just be the safe-area
      // top inset (0 if this view sits under a navigator header — adjust if
      // you render a custom header above this component).
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 && !loading ? (
          <EmptyState onSelectPrompt={handlePresetPrompt} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
      </ScrollView>

      {/* ── Input Bar ── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          // KeyboardAvoidingView's "padding"/"height" behavior already shifts
          // this whole view up by the keyboard height, so once the keyboard
          // is open there's no safe-area bottom inset to account for anymore
          // (the keyboard itself occupies that space). Only add insets.bottom
          // when the keyboard is closed. The extra 12px above that is just
          // breathing room so the bar doesn't sit flush against the keyboard.
          paddingBottom: insets.bottom + 20,
          backgroundColor: "#F7F8FA",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#EDEFF3",
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 48,
            maxHeight: 120,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your nutrition..."
            placeholderTextColor="#848484"
            multiline
            style={{
              fontSize: 14.5,
              color: "#111",
              maxHeight: 100,
            }}
            onSubmitEditing={() => triggerSend(input)}
            returnKeyType="send"
            blurOnSubmit={false}
          />
        </View>

        <Pressable
          onPress={() => triggerSend(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: input.trim() && !loading ? "#111" : "#EDEFF3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#B93BC4" />
          ) : (
            <SendIcon disabled={!input.trim()} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
