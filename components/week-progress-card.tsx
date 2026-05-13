import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function DayCircle({
  dayLetter,
  dayNumber,
  isToday,
  isPast,
  progress = 0,
  progressColor = "#1A6FD4",
  fillColor = "#EEF4FF",
  inactiveColor = "#F0F0F0",
  size = 36,
  strokeWidth = 3,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * Math.min(Math.max(progress, 0), 1);
  const center = size / 2;
  const gradId = `grad-${dayNumber}`;

  const circleFill = isToday || isPast ? fillColor : "transparent";
  const trackColor = isToday || isPast ? inactiveColor : "transparent";

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: isToday ? progressColor : "#B0B0B0",
        }}
      >
        {dayLetter}
      </Text>

      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={progressColor} stopOpacity="0.7" />
              <Stop offset="1" stopColor={progressColor} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Track ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill={circleFill}
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          {(isToday || isPast) && progress > 0 && (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              rotation="-90"
              origin={`${center}, ${center}`}
            />
          )}
        </Svg>

        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: isToday ? "700" : "400",
              color: isToday ? progressColor : isPast ? "#555" : "#C0C0C0",
            }}
          >
            {dayNumber}
          </Text>
        </View>
      </View>
    </View>
  );
}

function WeekProgressCard({
  // Array of 7 progress values (0–1) for each day, starting Sunday
  weekProgress = [1, 1, 0.6, 0, 0, 0, 0],
  progressColor = "#1A6FD4",
  fillColor = "#EEF4FF",
  inactiveColor = "#E8EDF2",
  circleSize = 38,
  strokeWidth = 3,
  title,
}) {
  const today = new Date();
  const todayDow = today.getDate(); // day-of-week index (0=Sun)

  // Build the 7 dates of the current week (Sun–Sat)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  const todayIndex = today.getDay();

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 16,
        width: "90%",
        alignSelf: "center",
      }}
    >
      {title ? (
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#111" }}>
          {title}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        {weekDates.map((date, i) => {
          const isToday = i === todayIndex;
          const isPast = i < todayIndex;
          return (
            <DayCircle
              key={i}
              dayLetter={DAYS[i]}
              dayNumber={date.getDate()}
              isToday={isToday}
              isPast={isPast}
              progress={weekProgress[i] ?? 0}
              progressColor={progressColor}
              fillColor={fillColor}
              inactiveColor={inactiveColor}
              size={circleSize}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </View>
    </View>
  );
}

export default WeekProgressCard;
