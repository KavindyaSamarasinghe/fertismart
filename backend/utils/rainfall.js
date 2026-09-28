/**
 * Maps a rainfall figure (mm) to a discrete classification and the
 * corresponding nitrogen-leaching multiplier applied before the
 * Simplex optimizer runs.
 */
const RAINFALL_BANDS = [
  { class: "low", maxMm: 50, multiplier: 1.0 },
  { class: "moderate", maxMm: 150, multiplier: 1.1 },
  { class: "heavy", maxMm: Infinity, multiplier: 1.2 },
];

function classifyRainfall(rainfallMm) {
  if (typeof rainfallMm !== "number" || rainfallMm < 0) {
    throw new Error("rainfallMm must be a non-negative number");
  }
  const band = RAINFALL_BANDS.find((b) => rainfallMm <= b.maxMm);
  return band;
}

async function fetchRainfallMm(region, manualOverrideMm) {
  if (typeof manualOverrideMm === "number") {
    return manualOverrideMm;
  }

  const apiKey = process.env.WEATHER_API_KEY;
  const baseUrl = process.env.WEATHER_API_BASE_URL;
  if (!apiKey || !baseUrl) {
    console.warn("[rainfall] No WEATHER_API_KEY configured; defaulting to 60mm (moderate).");
    return 60;
  }

  const regionCoords = {
    "Nuwara Eliya": { lat: 6.9497, lon: 80.7891 },
    Bandarawela: { lat: 6.8319, lon: 80.9925 },
  };
  const coords = regionCoords[region] || regionCoords["Nuwara Eliya"];

  const url = `${baseUrl}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API request failed with status ${response.status}`);
  }
  const data = await response.json();
  const rainMm = data?.rain?.["1h"] ?? data?.rain?.["3h"] ?? 0;
  return rainMm;
}

module.exports = { classifyRainfall, fetchRainfallMm, RAINFALL_BANDS };
