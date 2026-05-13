import { View, Pressable, TextInput } from "react-native";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
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
import { useSearchStore } from "@/stores/useSearchStore";
export default function Search() {
  const hidden = useSearchStore((s) => s.hidden);

  if (hidden) return null;

  return (
    <View className="flex flex-row justify-center gap-2 items-center self-center mt-8">
      <Input className="w-[80vw] h-14 self-center bg-[#EDEFF3] rounded-2xl border-0">
        <InputSlot className="pl-3">
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
              d="M15.7365 14.4796L12.2229 10.9646C13.2764 9.59178 13.7682 7.86967 13.5987 6.14758C13.4291 4.42548 12.6108 2.83237 11.3098 1.6914C10.0087 0.550431 8.32237 -0.0529518 6.59279 0.0036505C4.86322 0.0602528 3.21993 0.772602 1.99629 1.99619C0.772637 3.21978 0.0602556 4.86299 0.00365067 6.59249C-0.0529543 8.32198 0.550456 10.0083 1.69148 11.3092C2.8325 12.6102 4.42569 13.4285 6.14786 13.598C7.87003 13.7676 9.59223 13.2758 10.9651 12.2223L14.4817 15.7395C14.5643 15.8221 14.6623 15.8876 14.7703 15.9323C14.8782 15.977 14.9938 16 15.1106 16C15.2274 16 15.3431 15.977 15.451 15.9323C15.5589 15.8876 15.6569 15.8221 15.7395 15.7395C15.8221 15.6569 15.8876 15.5589 15.9323 15.451C15.977 15.3431 16 15.2274 16 15.1106C16 14.9939 15.977 14.8782 15.9323 14.7703C15.8876 14.6624 15.8221 14.5644 15.7395 14.4818L15.7365 14.4796ZM1.79063 6.82147C1.79063 5.82645 2.0857 4.85377 2.63853 4.02644C3.19136 3.19911 3.97712 2.55428 4.89644 2.1735C5.81577 1.79272 6.82736 1.69309 7.80331 1.88721C8.77926 2.08133 9.67573 2.56048 10.3793 3.26407C11.083 3.96766 11.5621 4.86408 11.7563 5.83998C11.9504 6.81589 11.8508 7.82744 11.47 8.74672C11.0892 9.666 10.4443 10.4517 9.61694 11.0045C8.78957 11.5573 7.81685 11.8524 6.82178 11.8524C5.48786 11.851 4.20896 11.3205 3.26573 10.3774C2.32251 9.43417 1.792 8.15533 1.79063 6.82147Z"
              fill="#848484"
            />
          </Svg>
        </InputSlot>
        <TextInput
          className="flex-1 h-full text-sm text-[#111] px-2"
          placeholder="Search..."
          placeholderTextColor="#848484"
          
        />
      </Input>
      <Pressable>
        <Svg
          width={42}
          height={42}
          viewBox="0 0 42 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
      </Pressable>
    </View>
  );
}
