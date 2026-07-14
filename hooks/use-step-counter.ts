// hooks/use-step-counter.ts
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useStepStore } from '@/stores/useStepStore';

export function useStepCounter() {
  const { setSteps, checkAndResetForNewDay } = useStepStore();
  const baselineRef = useRef<number>(useStepStore.getState().steps);
  const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function start() {
      checkAndResetForNewDay();
      baselineRef.current = useStepStore.getState().steps;
      console.log('🦶 Step counter starting, baseline:', baselineRef.current);

      if (Platform.OS === 'ios') {
        const { status } = await Pedometer.requestPermissionsAsync();
        console.log('🔐 iOS permission:', status);
        if (status !== 'granted') return;
      }

      if (Platform.OS === 'android') {
        const { status } = await Pedometer.requestPermissionsAsync();
        console.log('🔐 Android permission:', status);
        if (status !== 'granted') {
          console.warn('❌ Activity recognition permission denied');
          return;
        }
      }

      const isAvailable = await Pedometer.isAvailableAsync();
      console.log('📱 Pedometer available:', isAvailable);
      if (!isAvailable) return;

      if (Platform.OS === 'ios') {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);
        try {
          const { steps: todaySteps } = await Pedometer.getStepCountAsync(midnight, now);
          console.log('📊 iOS steps from midnight:', todaySteps);
          if (mounted) setSteps(todaySteps);
        } catch (e) {
          console.warn('iOS step query failed:', e);
        }

        subscriptionRef.current = Pedometer.watchStepCount(async () => {
          const now2 = new Date();
          const midnight2 = new Date(now2);
          midnight2.setHours(0, 0, 0, 0);
          try {
            const { steps: todaySteps } = await Pedometer.getStepCountAsync(midnight2, now2);
            console.log('👟 iOS live steps:', todaySteps);
            if (mounted) setSteps(todaySteps);
          } catch (e) {
            console.warn('iOS step update failed:', e);
          }
        });
      } else {
        subscriptionRef.current = Pedometer.watchStepCount(({ steps: delta }) => {
          const total = baselineRef.current + delta;
          console.log('👟 Android delta:', delta, '→ total:', total);
          if (mounted) setSteps(total);
        });
      }

      console.log('✅ Pedometer subscription active:', !!subscriptionRef.current);
    }

    start();

    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
    };
  }, []);
}
