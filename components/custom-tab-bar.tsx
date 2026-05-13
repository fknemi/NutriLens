import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { useEffect } from "react";
import { Text, Center } from "@/components/ui/text";
import { useSearchStore } from "@/stores/useSearchStore";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { useTabStore } from "@/stores/useTabStore";
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
export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isVisible, setTab } = useTabStore();
  const {
    hideHeader,
    showHeader,
    showSearchIcon,
    hideSearchIcon,
    hideNotificationIcon,
    showNotificationIcon,
    hideProfileIcon,
    showProfileIcon,
    hideBackIcon,
    showBackIcon,
  } = useHeaderStore();
  const { hideSearch, showSearch, toggleSearch } = useSearchStore();
  const activeRouteName = state.routes[state.index].name;
  useEffect(() => {
    if (activeRouteName === "scan") {
      hideHeader();
      hideSearch();
    } else if (activeRouteName === "diet") {
      hideSearch();
      showSearchIcon();
    } else if (activeRouteName === "analytics") {
      hideSearch();
      hideSearchIcon();
    } else if (activeRouteName === "analytics") {
      hideSearchIcon();
      hideProfileIcon();
      showBackIcon();
      hideNotificationIcon();
    } else {
      showSearch();
      showHeader();
      showNotificationIcon();
      hideSearchIcon();
      showProfileIcon();
    }
    setTab(activeRouteName as AppTab);
  }, [activeRouteName]);

  if (!isVisible) return null;
  return (
    <View
      style={{ paddingBottom: insets.bottom }}
      className="flex flex-row py-2 bg-[#EDEFF3]"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        if (route.name === "medidation") return null;
        return (
          <TouchableOpacity
            key={route.key}
            className="flex-1 items-center justify-center py-4"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!isFocused) navigation.navigate(route.name);
            }}
          >
            <View className="flex items-center justify-center flex-col gap-2">
              {route.name === "index" && (
                <Svg
                  width="17"
                  height="18"
                  viewBox="0 0 17 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M17 8.63965V17.28C17 17.4709 16.9254 17.6541 16.7925 17.7891C16.6597 17.9241 16.4795 18 16.2917 18H11.3333C11.1455 18 10.9653 17.9241 10.8325 17.7891C10.6996 17.6541 10.625 17.4709 10.625 17.28V12.5998C10.625 12.5043 10.5877 12.4127 10.5213 12.3452C10.4548 12.2777 10.3648 12.2398 10.2708 12.2398H6.72917C6.63524 12.2398 6.54515 12.2777 6.47873 12.3452C6.41231 12.4127 6.375 12.5043 6.375 12.5998V17.28C6.375 17.4709 6.30037 17.6541 6.16753 17.7891C6.0347 17.9241 5.85453 18 5.66667 18H0.708333C0.520472 18 0.340304 17.9241 0.207466 17.7891C0.0746279 17.6541 0 17.4709 0 17.28V8.63965C0.000174152 8.25779 0.149544 7.89164 0.41526 7.62172L7.49859 0.421448C7.76424 0.15159 8.12444 0 8.5 0C8.87556 0 9.23576 0.15159 9.50141 0.421448L16.5847 7.62172C16.8505 7.89164 16.9998 8.25779 17 8.63965Z"
                    fill="#111111"
                    fillOpacity={isFocused ? 1 : 0.5}
                  />
                </Svg>
              )}
              {route.name === "scan" && (
                <Svg
                  width={44}
                  height={44}
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Rect
                    x={1}
                    y={1}
                    width={42}
                    height={42}
                    rx={6}
                    stroke="url(#paint0_linear_23_1132)"
                    strokeWidth={2}
                  />
                  <Path
                    d="M11.8519 17.6519C12.211 17.6519 12.5024 17.3606 12.5024 17.0014V16.1342C12.5024 14.1313 14.1313 12.5009 16.1357 12.5009H17.5139C17.8731 12.5009 18.1644 12.2095 18.1644 11.8504C18.1644 11.4913 17.873 11.2 17.5139 11.2H16.1343C13.4145 11.2 11.2015 13.4129 11.2015 16.1328V17.0001C11.2015 17.3619 11.4928 17.6519 11.8519 17.6519Z"
                    fill="url(#paint1_linear_23_1132)"
                  />
                  <Path
                    d="M17.5108 31.4989H16.134C14.1311 31.4989 12.5007 29.87 12.5007 27.8656V25.9792C12.5007 25.6201 12.2093 25.3288 11.8502 25.3288C11.4911 25.3288 11.1997 25.6201 11.1997 25.9792V27.8656C11.1997 30.5854 13.4127 32.7984 16.1326 32.7984H17.5108C17.8699 32.7984 18.1613 32.5071 18.1613 32.1479C18.1613 31.7888 17.87 31.4989 17.5108 31.4989Z"
                    fill="url(#paint2_linear_23_1132)"
                  />
                  <Path
                    d="M27.8644 11.2029H26.4875C26.1284 11.2029 25.837 11.4942 25.837 11.8534C25.837 12.2125 26.1284 12.5038 26.4875 12.5038H27.8657C29.8687 12.5038 31.499 14.1327 31.499 16.1371V17.0044C31.499 17.3635 31.7904 17.6548 32.1495 17.6548C32.5087 17.6548 32.8 17.3635 32.8 17.0044V16.1371C32.7973 13.4159 30.5844 11.2029 27.8644 11.2029Z"
                    fill="url(#paint3_linear_23_1132)"
                  />
                  <Path
                    d="M32.1468 25.3289C31.7877 25.3289 31.4963 25.6203 31.4963 25.9794V27.8658C31.4963 29.8686 29.8674 31.499 27.863 31.499H26.4875C26.1284 31.499 25.837 31.7904 25.837 32.1495C25.837 32.5086 26.1284 32.8 26.4875 32.8H27.8657C30.5855 32.8 32.7986 30.587 32.7986 27.8671V25.9808C32.7973 25.6203 32.5059 25.3289 32.1468 25.3289Z"
                    fill="url(#paint4_linear_23_1132)"
                  />
                  <Path
                    d="M25.5515 15.7641C27.0313 15.7641 28.2347 16.9688 28.2347 18.4473V21.35H30.4504C30.8095 21.35 31.1009 21.6414 31.1009 22.0005C31.1008 22.3595 30.8095 22.6509 30.4504 22.6509H28.2347V25.5523C28.2347 27.0321 27.0313 28.2355 25.5515 28.2369H18.4477C16.9679 28.2369 15.7646 27.0321 15.7645 25.5537V22.6509H13.5488C13.1897 22.6509 12.8984 22.3595 12.8983 22.0005C12.8983 21.6414 13.1897 21.35 13.5488 21.35H15.7632L15.7645 18.4473C15.7645 16.9675 16.9693 15.7641 18.4477 15.7641H25.5515Z"
                    fill="url(#paint5_linear_23_1132)"
                  />
                  <Defs>
                    <LinearGradient
                      id="paint0_linear_23_1132"
                      x1={38.2054}
                      y1={34.9413}
                      x2={-10.8803}
                      y2={0.793541}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop stopColor="#B93BC4" />
                      <Stop offset={0.514423} stopColor="#3C79DF" />
                    </LinearGradient>
                    <LinearGradient
                      id="paint1_linear_23_1132"
                      x1={21.8815}
                      y1={33.6999}
                      x2={21.8815}
                      y2={21.5499}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop
                        offset={0.519231}
                        stopColor="#B93BC4"
                        stopOpacity={0.7}
                      />
                      <Stop
                        offset={0.846154}
                        stopColor="#3C79DF"
                        stopOpacity={0.6}
                      />
                      <Stop offset={1} stopColor="#D0D1CF" />
                    </LinearGradient>
                    <LinearGradient
                      id="paint2_linear_23_1132"
                      x1={21.8815}
                      y1={33.6999}
                      x2={21.8815}
                      y2={21.5499}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop
                        offset={0.519231}
                        stopColor="#B93BC4"
                        stopOpacity={0.7}
                      />
                      <Stop
                        offset={0.846154}
                        stopColor="#3C79DF"
                        stopOpacity={0.6}
                      />
                      <Stop offset={1} stopColor="#D0D1CF" />
                    </LinearGradient>
                    <LinearGradient
                      id="paint3_linear_23_1132"
                      x1={21.8815}
                      y1={33.6999}
                      x2={21.8815}
                      y2={21.5499}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop
                        offset={0.519231}
                        stopColor="#B93BC4"
                        stopOpacity={0.7}
                      />
                      <Stop
                        offset={0.846154}
                        stopColor="#3C79DF"
                        stopOpacity={0.6}
                      />
                      <Stop offset={1} stopColor="#D0D1CF" />
                    </LinearGradient>
                    <LinearGradient
                      id="paint4_linear_23_1132"
                      x1={21.8815}
                      y1={33.6999}
                      x2={21.8815}
                      y2={21.5499}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop
                        offset={0.519231}
                        stopColor="#B93BC4"
                        stopOpacity={0.7}
                      />
                      <Stop
                        offset={0.846154}
                        stopColor="#3C79DF"
                        stopOpacity={0.6}
                      />
                      <Stop offset={1} stopColor="#D0D1CF" />
                    </LinearGradient>
                    <LinearGradient
                      id="paint5_linear_23_1132"
                      x1={21.8815}
                      y1={33.6999}
                      x2={21.8815}
                      y2={21.5499}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop
                        offset={0.519231}
                        stopColor="#B93BC4"
                        stopOpacity={0.7}
                      />
                      <Stop
                        offset={0.846154}
                        stopColor="#3C79DF"
                        stopOpacity={0.6}
                      />
                      <Stop offset={1} stopColor="#D0D1CF" />
                    </LinearGradient>
                  </Defs>
                </Svg>
              )}

              {route.name === "diet" && (
                <Svg
                  width={15}
                  height={18}
                  viewBox="0 0 15 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M7.16667 3.83319C6.18009 3.01148 5.23571 1.47423 5.23571 1.47423C6.25395 1.65558 7.31242 2.52808 7.94288 3.13216C7.78461 1.99588 7.06182 -0.256914 3.80398 0.0240254C3.80398 0.0240254 2.5292 4.05016 7.16667 3.83319Z"
                    fill="#111111"
                    fillOpacity={isFocused ? 1 : 0.5}
                  />
                  <Path
                    d="M9.63713 4.64176C9.28101 4.90819 8.77189 5.06646 8.33466 5.16077C9.02579 3.46524 10.5828 3.02735 10.6758 3.00361C10.9594 2.93106 11.1315 2.64287 11.0603 2.35797C10.9897 2.07308 10.7015 1.89963 10.4147 1.9702C10.3837 1.97877 7.94424 2.63496 7.17595 5.25837C6.7209 5.20034 5.84182 5.04206 5.30764 4.6411C4.56572 4.0845 -0.350715 4.84752 0.019914 9.66041C0.391202 14.4733 3.36019 18.0912 4.75103 17.9982C6.14254 17.9059 6.82708 17.5808 7.47205 17.5808C8.11703 17.5808 8.80157 17.9059 10.1931 17.9982C11.5839 18.0919 14.5522 14.4733 14.9242 9.66041C15.2955 4.84752 10.379 4.08516 9.63713 4.64176ZM1.91131 9.17306C0.136642 8.46279 2.34854 5.27948 4.10013 6.15527C5.16453 6.68747 2.67631 9.47839 1.91131 9.17306Z"
                    fill="#111111"
                    fillOpacity={isFocused ? 1 : 0.5}
                  />
                </Svg>
              )}

              {route.name === "analytics" && (
                <Svg
                  width={18}
                  height={18}
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 3.6C9.49707 3.6 9.9 4.00295 9.9 4.5V12.6C9.9 13.0971 9.49707 13.5 9 13.5C8.50293 13.5 8.1 13.0971 8.1 12.6V4.5C8.1 4.00295 8.50293 3.6 9 3.6ZM12.6 5.4C13.0971 5.4 13.5 5.80295 13.5 6.3V12.6C13.5 13.0971 13.0971 13.5 12.6 13.5C12.1029 13.5 11.7 13.0971 11.7 12.6V6.3C11.7 5.80295 12.1029 5.4 12.6 5.4ZM6.3 8.1C6.3 7.60293 5.89706 7.2 5.4 7.2C4.90295 7.2 4.5 7.60293 4.5 8.1V12.6C4.5 13.0971 4.90295 13.5 5.4 13.5C5.89705 13.5 6.3 13.0971 6.3 12.6V8.1ZM4.72506 0.349038C5.8939 0.08928 7.31187 0 9 0C10.6881 0 12.1061 0.08928 13.2749 0.349038C14.454 0.611073 15.4339 1.0584 16.1878 1.81222C16.9416 2.56604 17.3889 3.54602 17.651 4.72506C17.9107 5.8939 18 7.31187 18 9C18 10.6881 17.9107 12.1061 17.651 13.2749C17.3889 14.454 16.9416 15.4339 16.1878 16.1878C15.4339 16.9416 14.454 17.3889 13.2749 17.651C12.1061 17.9107 10.6881 18 9 18C7.31187 18 5.8939 17.9107 4.72506 17.651C3.54602 17.3889 2.56604 16.9416 1.81222 16.1878C1.0584 15.4339 0.611073 14.454 0.349038 13.2749C0.08928 12.1061 0 10.6881 0 9C0 7.31187 0.08928 5.8939 0.349038 4.72506C0.611073 3.54602 1.0584 2.56604 1.81222 1.81222C2.56604 1.0584 3.54602 0.611073 4.72506 0.349038Z"
                    fill="#111111"
                    fillOpacity={isFocused ? 1 : 0.5}
                  />
                </Svg>
              )}

              {route.name === "recipes" && (
                <Svg
                  width="22"
                  height="18"
                  viewBox="0 0 22 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M17.0657 2.00807C16.5314 2.00807 16.005 2.09678 15.4943 2.27418C14.4336 0.862887 12.7678 0 11 0C9.23221 0 7.56649 0.862913 6.50571 2.27418C5.99501 2.09677 5.46857 2.00807 4.93429 2.00807C2.21584 2.00807 0 4.27418 0 7.07256C0 9.31449 1.40644 11.2418 3.43351 11.8953V17.1936C3.43351 17.6371 3.78707 18 4.21922 18H17.7808C18.2129 18 18.5665 17.6371 18.5665 17.1936V11.8953C20.5936 11.242 22 9.31462 22 7.07256C22 4.27412 19.7843 2.00807 17.0657 2.00807Z"
                    fill="#111111"
                    fillOpacity={isFocused ? 1 : 0.5}
                  />
                </Svg>
              )}

              {route.name !== "scan" && <Text size="md">{label}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
