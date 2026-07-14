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
  Circle,
} from "react-native-svg";

// ─── Types ───────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 42 42" fill="none">
      <Path
        d="M21 0C16.8466 0 12.7865 1.23163 9.33303 3.53914C5.8796 5.84665 3.18798 9.1264 1.59854 12.9636C0.00909901 16.8009 -0.406771 21.0233 0.403518 25.0969C1.21381 29.1705 3.21386 32.9123 6.15077 35.8492C9.08767 38.7861 12.8295 40.7862 16.9031 41.5965C20.9767 42.4068 25.1991 41.9909 29.0364 40.4015C32.8736 38.812 36.1534 36.1204 38.4609 32.667C40.7684 29.2135 42 25.1534 42 21C41.9941 15.4323 39.7797 10.0942 35.8427 6.15725C31.9058 2.22026 26.5677 0.00587963 21 0ZM29.0769 22.6154H16.8222L20.5275 26.3187C20.6776 26.4687 20.7966 26.6469 20.8779 26.843C20.9591 27.0391 21.0009 27.2493 21.0009 27.4615C21.0009 27.6738 20.9591 27.884 20.8779 28.0801C20.7966 28.2762 20.6776 28.4543 20.5275 28.6044C20.3774 28.7545 20.1992 28.8736 20.0031 28.9548C19.807 29.036 19.5969 29.0778 19.3846 29.0778C19.1724 29.0778 18.9622 29.036 18.7661 28.9548C18.57 28.8736 18.3918 28.7545 18.2417 28.6044L11.7802 22.1429C11.63 21.9929 11.5109 21.8147 11.4296 21.6186C11.3483 21.4225 11.3064 21.2123 11.3064 21C11.3064 20.7877 11.3483 20.5775 11.4296 20.3814C11.5109 20.1853 11.63 20.0071 11.7802 19.8571L18.2417 13.3956C18.5448 13.0925 18.956 12.9222 19.3846 12.9222C19.8133 12.9222 20.2244 13.0925 20.5275 13.3956C20.8306 13.6987 21.0009 14.1098 21.0009 14.5385C21.0009 14.9671 20.8306 15.3782 20.5275 15.6813L16.8222 19.3846H29.0769C29.5054 19.3846 29.9162 19.5548 30.2192 19.8577C30.5221 20.1607 30.6923 20.5716 30.6923 21C30.6923 21.4284 30.5221 21.8393 30.2192 22.1422C29.9162 22.4452 29.5054 22.6154 29.0769 22.6154Z"
        fill="black"
      />
    </Svg>
  );
}

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
        <LinearGradient
          id="paint0_linear_7_35"
          x1={35.4337}
          y1={32.325}
          x2={-11.3145}
          y2={-0.196628}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#B93BC4" />
          <Stop offset={0.514423} stopColor="#3C79DF" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_7_35"
          x1={10.4026}
          y1={28.9044}
          x2={29.4633}
          y2={15.206}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#B93BC4" />
          <Stop offset={0.495192} stopColor="#3C79DF" />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear_7_35"
          x1={19.3333}
          y1={17.3333}
          x2={27.4324}
          y2={8.96655}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.211538} stopColor="#ADA816" />
          <Stop offset={0.711538} stopColor="#F6EDB9" />
        </LinearGradient>
        <LinearGradient
          id="paint3_linear_7_35"
          x1={24.3333}
          y1={30.5333}
          x2={32.4324}
          y2={22.1665}
          gradientUnits="userSpaceOnUse"
        >
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
      <Path
        d="M22 2L11 13"
        stroke="url(#sendGrad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="url(#sendGrad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Bubble ──────────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`mb-3 max-w-[80%] ${isUser ? "self-end" : "self-start"}`}
    >
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
        <Text
          style={{
            fontSize: 14.5,
            lineHeight: 21,
            color: "#111",
          }}
        >
          {message.text}
        </Text>
      </View>
      <Text
        className={`text-[10px] text-gray-400 mt-1 ${
          isUser ? "text-right mr-1" : "ml-1"
        }`}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
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
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: "#C084FC",
              opacity: 0.6 + i * 0.2,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <AIIconButton />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#111",
          textAlign: "center",
        }}
      >
        Ask me anything
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#848484",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        I can help you track nutrition, understand your data, suggest meal
        plans, and more.
      </Text>
      <View className="flex-row flex-wrap gap-2 justify-center mt-2">
        {[
          "How many calories today?",
          "Suggest a high-protein meal",
          "Am I hitting my macros?",
        ].map((prompt) => (
          <View
            key={prompt}
            style={{
              backgroundColor: "#F3F4F8",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: "#555" }}>{prompt}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AIChatScreen({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function handleSend() {
    const trimmed = input.trim();
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
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system:
            "You are a helpful nutrition and fitness AI assistant. Help users track calories, understand their macro data, plan meals, and reach their health goals. Keep responses concise and friendly.",
          messages: [
            ...[...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.text,
            })),
          ],
        }),
      });

      const data = await response.json();
      const reply =
        data?.content?.[0]?.text ?? "Sorry, I couldn't get a response.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Something went wrong. Please try again.",
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
      className="flex-1 bg-[#F7F8FA]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 && !loading ? (
          <EmptyState />
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
          paddingBottom: Platform.OS === "ios" ? 34 : 16,
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
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || loading}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor:
              input.trim() && !loading ? "#111" : "#EDEFF3",
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
