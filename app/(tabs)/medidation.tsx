// app/(tabs)/meditation.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');

const TECHNIQUES = [
  { key: 'box',  label: 'Box',    sub: '4-4-4-4',   phases: [4, 4, 4, 4] },
  { key: '478',  label: '4-7-8',  sub: 'Relaxing',  phases: [4, 7, 8, 0] },
  { key: 'deep', label: 'Deep',   sub: '4-0-6-0',   phases: [4, 0, 6, 0] },
];

const PHASE_LABELS = ['Inhale', 'Hold', 'Exhale', 'Hold'];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function MeditationScreen() {
  const [active, setActive] = useState(false);
  const [techniqueIdx, setTechniqueIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const scale = useSharedValue(0.65);
  const glow = useSharedValue(0.3);
  const technique = TECHNIQUES[techniqueIdx];

  // Animate circle on phase change
  useEffect(() => {
    if (!active) return;
    const duration = technique.phases[phase] * 1000;
    if (duration === 0) return;

    if (phase === 0) {
      scale.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });
      glow.value = withTiming(1, { duration });
    } else if (phase === 1) {
      scale.value = withTiming(1, { duration: 200 });
    } else if (phase === 2) {
      scale.value = withTiming(0.65, { duration, easing: Easing.inOut(Easing.ease) });
      glow.value = withTiming(0.3, { duration });
    } else {
      scale.value = withTiming(0.65, { duration: 200 });
    }
  }, [phase, active]);

  // Phase countdown
  useEffect(() => {
    if (!active) return;
    const phaseDuration = technique.phases[phase];

    if (phaseDuration === 0) {
      setPhase((p) => (p + 1) % 4);
      return;
    }

    setCountdown(phaseDuration);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setPhase((p) => (p + 1) % 4);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, active, techniqueIdx]);

  // Session timer
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);

  function toggle() {
    if (active) {
      setActive(false);
      setPhase(0);
      setCountdown(0);
      setSessionSeconds(0);
      cancelAnimation(scale);
      cancelAnimation(glow);
      scale.value = withTiming(0.65, { duration: 600 });
      glow.value = withTiming(0.3, { duration: 600 });
    } else {
      setActive(true);
      setPhase(0);
    }
  }

  const animatedRing = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  const animatedInner = useAnimatedStyle(() => ({
    transform: [{ scale: 0.55 + scale.value * 0.1 }],
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Session timer */}
        <Text style={styles.sessionTimer}>{formatTime(sessionSeconds)}</Text>

        {/* Technique selector */}
        <View style={styles.techniqueRow}>
          {TECHNIQUES.map((t, i) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => { if (!active) setTechniqueIdx(i); }}
              style={[styles.techBtn, techniqueIdx === i && styles.techBtnActive]}
            >
              <Text style={[styles.techLabel, techniqueIdx === i && styles.techLabelActive]}>
                {t.label}
              </Text>
              <Text style={[styles.techSub, techniqueIdx === i && styles.techSubActive]}>
                {t.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Breathing circle */}
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.outerRing, animatedRing]} />
          <Animated.View style={[styles.innerCircle, animatedInner]}>
            {active ? (
              <>
                <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
                <Text style={styles.phaseCount}>{countdown}</Text>
              </>
            ) : (
              <Text style={styles.readyText}>Ready</Text>
            )}
          </Animated.View>
        </View>

        {/* Phase steps */}
        <View style={styles.stepsRow}>
          {PHASE_LABELS.map((label, i) => {
            const dur = technique.phases[i];
            if (dur === 0) return null;
            const isActive = active && phase === i;
            return (
              <View key={i} style={[styles.step, isActive && styles.stepActive]}>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
                <Text style={[styles.stepDur, isActive && styles.stepDurActive]}>{dur}s</Text>
              </View>
            );
          })}
        </View>

        {/* Begin / Stop */}
        <TouchableOpacity onPress={toggle} style={[styles.btn, active && styles.btnStop]}>
          <Text style={[styles.btnText, active && styles.btnTextStop]}>
            {active ? 'Stop' : 'Begin'}
          </Text>
        </TouchableOpacity>

      </View>
    </>
  );
}

const CIRCLE = width * 0.72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#130822',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  sessionTimer: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 15,
    letterSpacing: 2,
    fontFamily: 'Geologica-Light',
  },
  techniqueRow: {
    flexDirection: 'row',
    gap: 10,
  },
  techBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  techBtnActive: {
    backgroundColor: '#780B9F',
  },
  techLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontFamily: 'Geologica-Medium',
  },
  techLabelActive: {
    color: '#fff',
  },
  techSub: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Geologica-Light',
  },
  techSubActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  circleWrap: {
    width: CIRCLE,
    height: CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: '#780B9F',
  },
  innerCircle: {
    width: CIRCLE * 0.62,
    height: CIRCLE * 0.62,
    borderRadius: (CIRCLE * 0.62) / 2,
    backgroundColor: '#1A0A2E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  phaseLabel: {
    color: '#E6CCEE',
    fontSize: 22,
    fontFamily: 'Geologica-Light',
    letterSpacing: 1,
  },
  phaseCount: {
    color: '#fff',
    fontSize: 44,
    fontFamily: 'Geologica-Thin',
    marginTop: 4,
  },
  readyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 20,
    fontFamily: 'Geologica-Light',
    letterSpacing: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  step: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    minWidth: 68,
  },
  stepActive: {
    backgroundColor: 'rgba(120,11,159,0.35)',
    borderWidth: 1,
    borderColor: '#780B9F',
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: 'Geologica-Regular',
  },
  stepLabelActive: {
    color: '#E6CCEE',
  },
  stepDur: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 18,
    fontFamily: 'Geologica-Light',
    marginTop: 2,
  },
  stepDurActive: {
    color: '#fff',
  },
  btn: {
    backgroundColor: '#780B9F',
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 100,
  },
  btnStop: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Geologica-Medium',
    letterSpacing: 0.5,
  },
  btnTextStop: {
    color: 'rgba(255,255,255,0.5)',
  },
});
