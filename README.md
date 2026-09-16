# NutriLens

A food scanning app that overlays live AR nutritional labels on your camera feed using on-device ML.

<br>

<p align="center">
  <img width="200" height="400" alt="AR Scanner" src="" />
  <img width="200" height="400" alt="Meal Log" src="" />
  <img width="200" height="400" alt="Analytics" src="" />
  <img width="200" height="400" alt="Profile" src="" />
</p>

<br>

## Overview

NutriLens uses your phone's camera to identify food in real time and overlays nutritional information directly onto the live image — no barcode or manual search required. The ML pipeline runs entirely on-device, so scanning works offline. Nutrition data is sourced from Open Food Facts, with full country datasets available for download.

Beyond scanning, NutriLens tracks meals, sleep, hydration, steps, and activity, giving a complete daily health picture in one place.

<br>

## How it works

Each camera frame passes through a four-stage pipeline running on background threads so the UI never drops a frame.

| Step | Library | Role |
|------|---------|------|
| Capture | react-native-vision-camera | Delivers raw frames at 60fps on a dedicated thread |
| Detect | react-native-fast-tflite | Runs YOLOv8n to identify food and output bounding-box coordinates |
| Fetch | expo-sqlite / Open Food Facts | Looks up nutrition data from the local USDA database or live API |
| Render | react-native-skia | Draws GPU-accelerated AR labels anchored to each bounding box |

<br>

## Tech Stack

| Package | Type | Role |
|---------|------|------|
| Expo | framework | Cross-platform React Native framework managing the build pipeline for Android and iOS |
| react-native-vision-camera | library | 60fps video engine that delivers raw image frames to the ML pipeline |
| react-native-fast-tflite | library | On-device ML engine running YOLOv8n to identify food and output screen coordinates |
| react-native-skia | library | GPU-accelerated graphics layer that draws the AR nutritional labels |
| react-native-worklets-core | library | Threading library that keeps ML inference and graphics off the JS thread |
| Open Food Facts | API / database | Open-source nutrition database for live lookups and offline country datasets |
| Firebase | platform | Authentication and cloud sync for user profiles and meal history |
| Zustand | library | Lightweight state management across 17 domain stores |
| expo-sqlite | library | Hosts the bundled USDA nutrition database for fully offline lookups |
| NativeWind + Tailwind CSS | library | Utility-first styling with a shared Tailwind config for all platforms |

<br>

## Features

- Live AR food detection via camera
- On-device ML — works fully offline
- Barcode scanning with Open Food Facts lookup
- Meal logging and history
- Macro and calorie breakdown charts
- Daily nutrition and hydration tracking
- Step counter and activity logging
- Sleep tracking
- Onboarding: diet style, allergies, dislikes
- Recipe discovery and saving
- AI nutrition chat assistant
- Body-fat and analytics dashboard

<br>

## Getting Started

### Prerequisites

- Node.js v20 or higher
- Bun (used as the package manager)
- Xcode for iOS development
- Android Studio for Android development

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/fknemi/nutrilens.git
cd nutrilens
bun install
```

Download the ML models and USDA nutrition database:

```bash
node scripts/download-models.js
node scripts/download-nutrition-data.js
```

Configure Firebase by adding the following to your project:

- `google-services.json` inside the `android/` directory
- `GoogleService-Info.plist` inside the `ios/` directory
- A `.env` file at the root with your Firebase credentials

### Running the App

```bash
# Start the Expo dev server
bun start

# Run on iOS
bun run ios

# Run on Android
bun run android
```

<br>

## Project Structure

```
nutrilens/
├── app/                        # Expo Router file-based routes
│   ├── (auth)/                 # Login and auth screens
│   ├── (onboarding)/           # Diet, allergies, dislikes setup
│   ├── (tabs)/                 # Main tab screens
│   │   ├── scan.tsx            # AR camera + food detection
│   │   ├── meals.tsx           # Meal log
│   │   ├── analytics.tsx       # Charts and trends
│   │   ├── chat.tsx            # AI nutrition assistant
│   │   ├── activity.tsx        # Steps and workouts
│   │   ├── diet.tsx            # Diet preferences
│   │   ├── recipes.tsx         # Recipe discovery
│   │   └── medidation.tsx      # Meditation tracker
│   └── recipe/[id].tsx         # Dynamic recipe detail
├── assets/
│   ├── databases/              # Bundled USDA SQLite database
│   ├── fonts/                  # Geologica typeface (9 weights)
│   └── models/                 # YOLOv8n + MiDaS TFLite weights
├── components/                 # Reusable UI components
│   └── ui/                     # Gluestack + platform-split primitives
├── services/                   # External data sources
│   ├── open-food-facts.ts      # Live API + offline dataset
│   ├── usda.ts                 # Local SQLite nutrition lookup
│   ├── recipe-api.ts           # Recipe search
│   └── geo.ts                  # Location helpers
├── stores/                     # 17 Zustand domain stores
├── hooks/                      # Step counter, sleep, nutrition hooks
├── constants/
│   └── theme.ts                # Design tokens
├── scripts/                    # Model + data download scripts
└── firebaseConfig.js           # Firebase initialisation
```
