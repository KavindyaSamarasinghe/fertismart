const RAINFALL_BANDS = [
  { class: "low", maxMm: 50, multiplier: 1.0 },
  { class: "moderate", maxMm: 150, multiplier: 1.1 },
  { class: "heavy", maxMm: Infinity, multiplier: 1.2 },
];

const RAINFALL_LOOKBACK_DAYS = 5;
const FETCH_TIMEOUT_MS = 5000;
const FALLBACK_MM = 60;

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const REGION_COORDS = {
  "Nuwara Eliya": { lat: 6.9497, lon: 80.7891 },
  Bandarawela: { lat: 6.8319, lon: 80.9925 },
};

const SRI_LANKA_BOUNDS = { minLat: 5.8, maxLat: 9.9, minLon: 79.5, maxLon: 82.0 };

function classifyRainfall(rainfallMm) {
  if (typeof rainfallMm !== "number" || rainfallMm < 0) {
    throw new Error("rainfallMm must be a non-negative number");
  }
  return RAINFALL_BANDS.find((b) => rainfallMm <= b.maxMm);
}

function resolveCoords(farm) {
  const lat = Number(farm?.location?.lat);
  const lon = Number(farm?.location?.lng);

  const valid =
    farm?.location?.lat != null &&
    farm?.location?.lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= SRI_LANKA_BOUNDS.minLat &&
    lat <= SRI_LANKA_BOUNDS.maxLat &&
    lon >= SRI_LANKA_BOUNDS.minLon &&
    lon <= SRI_LANKA_BOUNDS.maxLon;

  if (valid) return { lat, lon };
  return REGION_COORDS[farm?.region] || REGION_COORDS["Nuwara Eliya"];
}

async function fetchRainfallMm(farm, manualOverrideMm) {
  if (typeof manualOverrideMm === "number") {
    return { rainfallMm: manualOverrideMm, source: "manual" };
  }

  const coords = resolveCoords(farm);
  const url =
    `${OPEN_METEO_BASE_URL}?latitude=${coords.lat}&longitude=${coords.lon}` +
    `&daily=precipitation_sum&past_days=${RAINFALL_LOOKBACK_DAYS}&forecast_days=1` +
    `&timezone=Asia%2FColombo`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }
    const data = await response.json();
    const dailyValues = data?.daily?.precipitation_sum;

    if (!Array.isArray(dailyValues) || dailyValues.length === 0) {
      throw new Error("Open-Meteo response did not include daily precipitation data");
    }

    // Past days only; the last entry is today's forecast, not observed rain.
    const pastDays = dailyValues.slice(0, RAINFALL_LOOKBACK_DAYS);
    const totalMm = pastDays.reduce((sum, v) => sum + (Number(v) || 0), 0);

    return { rainfallMm: Math.round(totalMm * 100) / 100, source: "live" };
  } catch (err) {
    const reason =
      err.name === "AbortError" ? `timed out after ${FETCH_TIMEOUT_MS} ms` : err.message;
    console.warn(
      `[rainfall] Live rainfall unavailable for "${farm?.region}" (${reason}); ` +
        `using fallback of ${FALLBACK_MM} mm.`
    );
    return { rainfallMm: FALLBACK_MM, source: "fallback" };
  } finally {
    clearTimeout(timer); // always release the timer
  }
}

module.exports = {
  classifyRainfall,
  fetchRainfallMm,
  RAINFALL_BANDS,
  RAINFALL_LOOKBACK_DAYS,
  FALLBACK_MM,
};