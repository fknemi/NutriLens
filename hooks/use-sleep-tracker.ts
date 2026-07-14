// hooks/use-sleep-tracker.ts
import { useSleepStore } from "@/stores/useSleepStore";

export function useSleepTracker() {
  const {
    sleeping,
    bedtime,
    sessions,
    startSleep,
    stopSleep,
    deleteSession,
    todaysSessions,
    totalSleepToday,
  } = useSleepStore();

  const toggle = () => (sleeping ? stopSleep() : startSleep());

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sleepingFor =
    sleeping && bedtime ? formatDuration(Date.now() - bedtime) : null;

  const GOAL_MS = 8 * 60 * 60 * 1000; // 8 hours
  const percentOfGoal = Math.round((totalSleepToday() / GOAL_MS) * 100);
  return {
    sleeping,
    bedtime,
    sleepingFor,
    sessions: todaysSessions(),
    totalToday: formatDuration(totalSleepToday()),
    toggle,
    deleteSession,
    formatDuration,
    formatTime,
    percentOfGoal,
  };
}
