const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("db", "tflite");
config.watchFolders = [__dirname];
module.exports = withNativeWind(config, { input: "./app/global.css" });
