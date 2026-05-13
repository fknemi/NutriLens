/**
 * FoodDetectionCamera
 *
 * Drop-in replacement for <Camera />.
 * Sizes itself to whatever its parent gives it — flex, fixed, or otherwise.
 *
 * Usage:
 *   import FoodDetectionCamera, { type Detection } from "@/components/FoodDetectionCamera";
 *
 *   <FoodDetectionCamera
 *     style={{ flex: 1 }}
 *     onDetections={(dets) => console.log(dets)}
 *   />
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { NitroModules } from "react-native-nitro-modules";
import { File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { useSharedValue } from "react-native-reanimated";
import { Worklets } from "react-native-worklets-core";
import {
  Canvas,
  Group,
  Rect,
  RoundedRect,
  Text as SkiaText,
  matchFont,
  Line,
} from "@shopify/react-native-skia";

// ─── Constants ────────────────────────────────────────────────────────────────

const YOLO_SIZE = 640;
const MIDAS_SIZE = 256;
const CONF_THRESH = 0.6;
const IOU_THRESH = 0.4;
const MAX_DETS = 5;
const INFER_EVERY = 10;

const MODEL_DELEGATES: string[] = Platform.select({
  android: ["android-gpu"],
  ios: ["core-ml"],
  default: [],
})!;

const COCO_CLASSES = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "airplane",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "fire hydrant",
  "stop sign",
  "parking meter",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "backpack",
  "umbrella",
  "handbag",
  "tie",
  "suitcase",
  "frisbee",
  "skis",
  "snowboard",
  "sports ball",
  "kite",
  "baseball bat",
  "baseball glove",
  "skateboard",
  "surfboard",
  "tennis racket",
  "bottle",
  "wine glass",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "mouse",
  "remote",
  "keyboard",
  "cell phone",
  "microwave",
  "oven",
  "toaster",
  "sink",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "hair drier",
  "toothbrush",
];

const TARGET_CLASSES = [
  "apple",
  "banana",
  "orange",
  "broccoli",
  "carrot",
  "hot dog",
  "pizza",
  "donut",
  "cake",
];

// ─── Public types ─────────────────────────────────────────────────────────────

export interface Detection {
  x: number; // left,   normalised [0–1]
  y: number; // top,    normalised [0–1]
  w: number; // width,  normalised [0–1]
  h: number; // height, normalised [0–1]
  classId: number;
  score: number;
  label: string;
  depth?: number; // 0 = far, 1 = close
}

export interface FoodDetectionCameraProps {
  style?: StyleProp<ViewStyle>;
  /**
   * Called every inference cycle with the current set of live detections.
   * Runs on the JS thread — safe to use setState, navigation, etc.
   */
  onDetections?: (detections: Detection[]) => void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface TrackedDetection extends Detection {
  id: string;
  lastSeen: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  opacity: number;
}

// ─── Depth colour (far=blue → mid=green → close=red) ─────────────────────────

const DEPTH_STOPS: [number, number, number, number][] = [
  [0.0, 0x45, 0x75, 0xb4],
  [0.5, 0x91, 0xcf, 0x60],
  [1.0, 0xd7, 0x30, 0x27],
];

function depthToHex(t: number): string {
  "worklet";
  const clamped = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < DEPTH_STOPS.length - 2 && clamped > DEPTH_STOPS[i + 1][0]) i++;
  const [t0, r0, g0, b0] = DEPTH_STOPS[i];
  const [t1, r1, g1, b1] = DEPTH_STOPS[i + 1];
  const f = (clamped - t0) / (t1 - t0);
  const r = Math.round(r0 + f * (r1 - r0));
  const g = Math.round(g0 + f * (g1 - g0));
  const b = Math.round(b0 + f * (b1 - b0));
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// ─── Model resolution (cached to disk) ───────────────────────────────────────

async function resolveModelToLocalFile(
  moduleId: number,
  filename: string,
): Promise<string> {
  const dest = new File(Paths.cache, filename);
  if (dest.exists) return dest.uri;

  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();

  const source = new File(asset.localUri!);
  source.copy(dest);

  return dest.uri;
}

function useLocalModelPaths() {
  const [yoloPath, setYoloPath] = useState<string | null>(null);
  const [midasPath, setMidasPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [yolo, midas] = await Promise.all([
          resolveModelToLocalFile(
            require("../assets/models/yolov8n.tflite"),
            "yolov8n.tflite",
          ),
          resolveModelToLocalFile(
            require("../assets/models/midas_v2_small.tflite"),
            "midas_v2_small.tflite",
          ),
        ]);
        if (!cancelled) {
          setYoloPath(yolo);
          setMidasPath(midas);
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { yoloPath, midasPath, error };
}

// ─── Worklet helpers ──────────────────────────────────────────────────────────

function toInputBuffer(view: {
  buffer: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
}): ArrayBuffer {
  "worklet";
  if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength)
    return view.buffer;
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function iou(a: Detection, b: Detection): number {
  "worklet";
  const x1 = Math.max(a.x, b.x),
    y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w),
    y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a.w * a.h + b.w * b.h - inter);
}

function nms(dets: Detection[], threshold: number): Detection[] {
  "worklet";
  dets.sort((a, b) => b.score - a.score);
  const keep: Detection[] = [];
  const dead = new Array(dets.length).fill(false);
  for (let i = 0; i < dets.length; i++) {
    if (dead[i]) continue;
    keep.push(dets[i]);
    for (let j = i + 1; j < dets.length; j++) {
      if (!dead[j] && iou(dets[i], dets[j]) > threshold) dead[j] = true;
    }
  }
  return keep;
}

function decodeYolo(raw: Float32Array): Detection[] {
  "worklet";
  const anchors = 8400;
  const cx0 = raw[0];
  const pixelSpace = cx0 > 1.5;
  const scale = pixelSpace ? YOLO_SIZE : 1.0;
  const cy0_col = raw[anchors];
  const colMajor = pixelSpace ? cy0_col > 0 && cy0_col < YOLO_SIZE : true;
  const candidates: Detection[] = [];

  for (let i = 0; i < anchors; i++) {
    let maxScore = 0,
      classId = 0,
      cx = 0,
      cy = 0,
      bw = 0,
      bh = 0;
    if (colMajor) {
      for (let c = 0; c < 80; c++) {
        const s = raw[(4 + c) * anchors + i];
        if (s > maxScore) {
          maxScore = s;
          classId = c;
        }
      }
      if (maxScore < CONF_THRESH) continue;
      cx = raw[0 * anchors + i];
      cy = raw[1 * anchors + i];
      bw = raw[2 * anchors + i];
      bh = raw[3 * anchors + i];
    } else {
      const base = i * 84;
      for (let c = 0; c < 80; c++) {
        const s = raw[base + 4 + c];
        if (s > maxScore) {
          maxScore = s;
          classId = c;
        }
      }
      if (maxScore < CONF_THRESH) continue;
      cx = raw[base];
      cy = raw[base + 1];
      bw = raw[base + 2];
      bh = raw[base + 3];
    }
    const label = COCO_CLASSES[classId] ?? `cls${classId}`;
    if (TARGET_CLASSES.includes(label)) {
      candidates.push({
        x: (cx - bw / 2) / scale,
        y: (cy - bh / 2) / scale,
        w: bw / scale,
        h: bh / scale,
        classId,
        score: maxScore,
        label,
      });
    }
  }
  return nms(candidates, IOU_THRESH).slice(0, MAX_DETS);
}

// ─── Detection persistence + smoothing ───────────────────────────────────────

const FADE_AFTER_MS = 300;
const FADE_DURATION_MS = 100;
const MATCH_DIST = 0.2;

function usePersistedDetections(live: Detection[]): TrackedDetection[] {
  const store = useRef<Map<string, TrackedDetection>>(new Map());
  const [, tick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const used = new Set<string>();
    for (const det of live) {
      const cx = det.x + det.w / 2,
        cy = det.y + det.h / 2;
      let bestKey: string | null = null,
        bestDist = MATCH_DIST;
      for (const [key, td] of store.current) {
        if (used.has(key) || td.label !== det.label) continue;
        const dist = Math.hypot(
          cx - (td.sx + td.sw / 2),
          cy - (td.sy + td.sh / 2),
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestKey = key;
        }
      }
      if (bestKey) {
        const td = store.current.get(bestKey)!;
        const A = 0.5;
        td.sx += A * (det.x - td.sx);
        td.sy += A * (det.y - td.sy);
        td.sw += A * (det.w - td.sw);
        td.sh += A * (det.h - td.sh);
        td.score = det.score;
        td.depth = det.depth;
        td.lastSeen = now;
        used.add(bestKey);
      } else {
        const id = `${det.label}-${now}-${Math.random().toString(36).slice(2, 6)}`;
        store.current.set(id, {
          ...det,
          id,
          lastSeen: now,
          sx: det.x,
          sy: det.y,
          sw: det.w,
          sh: det.h,
          opacity: 1,
        });
        used.add(id);
      }
    }
    tick((n) => n + 1);
  }, [live]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, td] of store.current) {
        if (now - td.lastSeen > FADE_AFTER_MS + FADE_DURATION_MS)
          store.current.delete(key);
      }
      tick((n) => n + 1);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  return Array.from(store.current.values()).map((td) => {
    const age = now - td.lastSeen;
    const opacity =
      age > FADE_AFTER_MS
        ? Math.max(0, 1 - (age - FADE_AFTER_MS) / FADE_DURATION_MS)
        : 1;
    return { ...td, x: td.sx, y: td.sy, w: td.sw, h: td.sh, opacity };
  });
}

// ─── AR overlay (Skia) ────────────────────────────────────────────────────────

const CARD_W = 148,
  CARD_H = 62;

interface SkiaOverlayProps {
  detections: TrackedDetection[];
  frameSize: { width: number; height: number };
  viewSize: { width: number; height: number };
}

function SkiaOverlay({ detections, frameSize, viewSize }: SkiaOverlayProps) {
  const VW = viewSize.width;
  const VH = viewSize.height;

  const boldFont = useMemo(() => {
    try {
      return matchFont({
        fontFamily: Platform.select({
          ios: "Helvetica Neue",
          android: "sans-serif",
        })!,
        fontSize: 13,
        fontWeight: "bold",
      });
    } catch {
      return null;
    }
  }, []);

  const smallFont = useMemo(() => {
    try {
      return matchFont({
        fontFamily: Platform.select({
          ios: "Helvetica Neue",
          android: "sans-serif",
        })!,
        fontSize: 10,
        fontWeight: "normal",
      });
    } catch {
      return null;
    }
  }, []);

  // Aspect-fill mapping: normalised detection coords → rendered pixels
  const frameAspect = frameSize.width / frameSize.height;
  const screenAspect = VW / VH;
  let scale = 1,
    offsetX = 0,
    offsetY = 0;
  if (frameAspect > screenAspect) {
    scale = VH / frameSize.height;
    offsetX = (frameSize.width * scale - VW) / 2;
  } else {
    scale = VW / frameSize.width;
    offsetY = (frameSize.height * scale - VH) / 2;
  }

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group>
        {detections.map((d) => {
          const bx = d.x * frameSize.width * scale - offsetX;
          const by = d.y * frameSize.height * scale - offsetY;
          const bw = d.w * frameSize.width * scale;
          const bh = d.h * frameSize.height * scale;
          const bcx = bx + bw / 2;

          const color = depthToHex(d.depth ?? 0.5);
          const accent = Math.min(16, Math.min(bw, bh) / 4);

          const cardLeft = Math.max(
            4,
            Math.min(VW - CARD_W - 4, bcx - CARD_W / 2),
          );
          const cardTop = Math.max(8, by - CARD_H - 60);
          const cardCX = cardLeft + CARD_W / 2;

          const depthLabel =
            d.depth !== undefined
              ? d.depth > 0.66
                ? "CLOSE"
                : d.depth > 0.33
                  ? "MID"
                  : "FAR"
              : "---";
          const depthLabelX = cardLeft + CARD_W - 10 - depthLabel.length * 6.4;
          const barFill =
            Math.max(0, Math.min(1, d.depth ?? 0.5)) * (CARD_W - 20);

          return (
            <Group key={d.id} opacity={d.opacity}>
              {/* ── Corner brackets ── */}
              <Rect x={bx} y={by} width={accent} height={2} color={color} />
              <Rect x={bx} y={by} width={2} height={accent} color={color} />
              <Rect
                x={bx + bw - accent}
                y={by}
                width={accent}
                height={2}
                color={color}
              />
              <Rect
                x={bx + bw - 2}
                y={by}
                width={2}
                height={accent}
                color={color}
              />
              <Rect
                x={bx}
                y={by + bh - 2}
                width={accent}
                height={2}
                color={color}
              />
              <Rect
                x={bx}
                y={by + bh - accent}
                width={2}
                height={accent}
                color={color}
              />
              <Rect
                x={bx + bw - accent}
                y={by + bh - 2}
                width={accent}
                height={2}
                color={color}
              />
              <Rect
                x={bx + bw - 2}
                y={by + bh - accent}
                width={2}
                height={accent}
                color={color}
              />

              {/* Centre crosshair dot */}
              <Rect
                x={bcx - 3}
                y={by + bh / 2 - 3}
                width={6}
                height={6}
                color={color}
              />

              {/* ── Connector line box → card ── */}
              <Line
                p1={{ x: bcx, y: by }}
                p2={{ x: cardCX, y: cardTop + CARD_H }}
                color={color}
                strokeWidth={1.5}
              />
              <Rect
                x={cardCX - 3}
                y={cardTop + CARD_H - 3}
                width={6}
                height={6}
                color={color}
              />

              {/* ── Info card ── */}
              <RoundedRect
                x={cardLeft}
                y={cardTop}
                width={CARD_W}
                height={CARD_H}
                r={8}
                color="rgba(0,0,0,0.82)"
              />
              {/* Left accent bar */}
              <Rect
                x={cardLeft}
                y={cardTop + 8}
                width={3}
                height={CARD_H - 16}
                color={color}
              />

              {boldFont && (
                <SkiaText
                  x={cardLeft + 14}
                  y={cardTop + 19}
                  text={d.label.toUpperCase()}
                  font={boldFont}
                  color="white"
                />
              )}
              {smallFont && (
                <SkiaText
                  x={cardLeft + 14}
                  y={cardTop + 32}
                  text={`${(d.score * 100).toFixed(0)}% conf`}
                  font={smallFont}
                  color="rgba(255,255,255,0.55)"
                />
              )}
              {smallFont && (
                <SkiaText
                  x={depthLabelX}
                  y={cardTop + 32}
                  text={depthLabel}
                  font={smallFont}
                  color={color}
                />
              )}

              {/* Depth bar */}
              <RoundedRect
                x={cardLeft + 14}
                y={cardTop + 47}
                width={CARD_W - 20}
                height={3}
                r={2}
                color="rgba(255,255,255,0.12)"
              />
              {barFill > 0 && (
                <RoundedRect
                  x={cardLeft + 14}
                  y={cardTop + 47}
                  width={barFill}
                  height={3}
                  r={2}
                  color={color}
                />
              )}
            </Group>
          );
        })}
      </Group>
    </Canvas>
  );
}

// ─── Inner camera (paths already resolved) ────────────────────────────────────

interface InnerCameraProps {
  yoloPath: string;
  midasPath: string;
  viewSize: { width: number; height: number };
  onDetections: ((dets: Detection[]) => void) | undefined;
}

function InnerCamera({
  yoloPath,
  midasPath,
  viewSize,
  onDetections,
}: InnerCameraProps) {
  const device = useCameraDevice("back");
  const { resize } = useResizePlugin();

  const yoloModel = useTensorflowModel(
    useMemo(() => ({ url: yoloPath }), [yoloPath]),
    MODEL_DELEGATES,
  );
  const midasModel = useTensorflowModel(
    useMemo(() => ({ url: midasPath }), [midasPath]),
    MODEL_DELEGATES,
  );

  const yolo = yoloModel.state === "loaded" ? yoloModel.model : null;
  const midas = midasModel.state === "loaded" ? midasModel.model : null;

  const boxedYolo = useMemo(
    () => (yolo ? NitroModules.box(yolo) : null),
    [yolo],
  );
  const boxedMidas = useMemo(
    () => (midas ? NitroModules.box(midas) : null),
    [midas],
  );

  const [detections, setDetections] = useState<Detection[]>([]);
  const [frameSize, setFrameSize] = useState({ width: 1, height: 1 });
  const persisted = usePersistedDetections(detections);

  const frameCounter = useSharedValue(0);
  const isProcessing = useSharedValue(false);

  // Stable ref so the worklet closure always sees the latest callback
  const onDetectionsRef = useRef(onDetections);
  useEffect(() => {
    onDetectionsRef.current = onDetections;
  }, [onDetections]);

  const onResults = useMemo(
    () =>
      Worklets.createRunOnJS((dets: Detection[], fw: number, fh: number) => {
        setDetections(dets);
        setFrameSize({ width: fw, height: fh });

        // ── Log every inference result ──────────────────────────────────────
        if (dets.length > 0) {
          console.log(
            "[FoodDetectionCamera]",
            dets
              .map(
                (d) =>
                  `${d.label} ${(d.score * 100).toFixed(0)}% depth=${(d.depth ?? 0).toFixed(2)}`,
              )
              .join(" | "),
          );
        }

        // ── Fire the optional callback ──────────────────────────────────────
        onDetectionsRef.current?.(dets);
      }),
    [],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (!boxedYolo || !boxedMidas) return;

      frameCounter.value++;
      if (frameCounter.value % INFER_EVERY !== 0) return;
      if (isProcessing.value) return;
      isProcessing.value = true;

      try {
        const yoloM = boxedYolo.unbox();
        const midasM = boxedMidas.unbox();

        const yoloRaw = resize(frame, {
          scale: { width: YOLO_SIZE, height: YOLO_SIZE },
          pixelFormat: "rgb",
          dataType: "float32",
        });
        const yoloOut = new Float32Array(
          yoloM.runSync([yoloRaw.buffer])[0] as ArrayBuffer,
        );
        (yoloRaw as any).buffer = null;

        const dets = decodeYolo(yoloOut);
        const fw = Math.min(frame.width, frame.height);
        const fh = Math.max(frame.width, frame.height);

        if (dets.length === 0) {
          onResults([], fw, fh);
          return;
        }

        // ── MiDaS depth pass ────────────────────────────────────────────────
        const midasRaw = resize(frame, {
          scale: { width: MIDAS_SIZE, height: MIDAS_SIZE },
          pixelFormat: "rgb",
          dataType: "float32",
        });
        const midasOut = new Float32Array(
          midasM.runSync([toInputBuffer(midasRaw)])[0] as ArrayBuffer,
        );

        let sceneMin = Infinity,
          sceneMax = -Infinity;
        for (let i = 0; i < midasOut.length; i += 16) {
          const v = midasOut[i];
          if (v < sceneMin) sceneMin = v;
          if (v > sceneMax) sceneMax = v;
        }
        const sceneRange = sceneMax - sceneMin || 1;

        for (const d of dets) {
          const px = Math.min(
            MIDAS_SIZE - 1,
            Math.max(0, Math.floor((d.x + d.w / 2) * MIDAS_SIZE)),
          );
          const py = Math.min(
            MIDAS_SIZE - 1,
            Math.max(0, Math.floor((d.y + d.h / 2) * MIDAS_SIZE)),
          );
          d.depth = (midasOut[py * MIDAS_SIZE + px] - sceneMin) / sceneRange;
        }

        onResults(dets, fw, fh);
      } catch (e: any) {
        console.error("[FoodDetectionCamera FrameProcessor]", e?.message ?? e);
      } finally {
        isProcessing.value = false;
      }
    },
    [boxedYolo, boxedMidas, onResults],
  );

  if (!device) return null;

  return (
    <>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
      <SkiaOverlay
        detections={persisted}
        frameSize={frameSize}
        viewSize={viewSize}
      />
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function FoodDetectionCamera({
  style,
  onDetections,
}: FoodDetectionCameraProps) {
  const { yoloPath, midasPath, error } = useLocalModelPaths();
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });

  const onLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent) => {
    setViewSize({ width, height });
  };

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {!yoloPath && !midasPath && !error && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>⏳ Loading models…</Text>
        </View>
      )}
      {error && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>❌ {error}</Text>
        </View>
      )}
      {yoloPath && midasPath && viewSize.width > 1 && (
        <InnerCamera
          yoloPath={yoloPath}
          midasPath={midasPath}
          viewSize={viewSize}
          onDetections={onDetections}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "#FFEAA7",
    fontSize: 13,
    fontWeight: "600",
  },
});
