#!/usr/bin/env node
const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.resolve(__dirname, "../assets/models");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ─── YOLOv8n: export via Python (no pre-built TFLite hosted by Ultralytics) ──
function exportYolo() {
  const dest = path.join(OUT, "yolov8n.tflite");
  if (fs.existsSync(dest)) { console.log("✓ yolov8n.tflite (already exists)"); return; }

  console.log("↓ yolov8n.tflite (exporting via ultralytics…)");
  try {
    execSync(
      `python3 -c "
from ultralytics import YOLO
import shutil, os
m = YOLO('yolov8n.pt')
m.export(format='tflite', imgsz=640)
# ultralytics writes to yolov8n_saved_model/yolov8n_float32.tflite
src = 'yolov8n_saved_model/yolov8n_float32.tflite'
shutil.copy(src, '${dest}')
shutil.rmtree('yolov8n_saved_model', ignore_errors=True)
os.remove('yolov8n.pt')
print('exported')
"`,
      { stdio: "inherit" }
    );
    console.log("✓ yolov8n.tflite");
  } catch {
    console.error("✗ yolov8n.tflite: export failed — is `pip install ultralytics` done?");
    process.exit(1);
  }
}

// ─── Depth model: MiDaS v2.1 small from TF Hub ───────────────────────────────
function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error("Too many redirects"));
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.headers.location)
        return download(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
      if (res.statusCode !== 200)
        return reject(new Error(`HTTP ${res.statusCode}`));

      const total = parseInt(res.headers["content-length"] || "0", 10);
      let received = 0;
      const tmp = dest + ".tmp";
      const file = fs.createWriteStream(tmp);

      res.on("data", (chunk) => {
        received += chunk.length;
        const pct = total ? `${((received / total) * 100).toFixed(1)}%` : `${(received / 1e6).toFixed(1)} MB`;
        process.stdout.write(`\r  ${pct}`);
        file.write(chunk);
      });
      res.on("end", () => file.end(() => { fs.renameSync(tmp, dest); resolve(); }));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function downloadDepth() {
  const dest = path.join(OUT, "midas_v2_small.tflite");
  if (fs.existsSync(dest)) { console.log("✓ midas_v2_small.tflite (already exists)"); return; }

  process.stdout.write("↓ midas_v2_small.tflite");
  try {
    await download(
      "https://tfhub.dev/intel/lite-model/midas/v2_1_small/1/lite/1?lite-format=tflite",
      dest
    );
    process.stdout.write(`\r✓ midas_v2_small.tflite\n`);
  } catch (e) {
    process.stdout.write(`\r✗ midas_v2_small.tflite: ${e.message}\n`);
    process.exit(1);
  }
}

(async () => {
  exportYolo();
  await downloadDepth();
  console.log("\nDone.");
})();
