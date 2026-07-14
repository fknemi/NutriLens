import * as Location from "expo-location";

export async function getCountry(): Promise<string> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low, // coarse is enough
      });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (place?.isoCountryCode) return place.isoCountryCode;
    }
  } catch {}

  // fallback to IP
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://api.country.is", { signal: controller.signal });
    clearTimeout(timeout);
    const data = JSON.parse(await res.text());
    return data.country ?? "IN";
  } catch {
    return "IN";
  }
}
