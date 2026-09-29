/**
 * Maps a rainfall figure (mm) to a discrete classification and the
 * corresponding nitrogen-leaching multiplier applied before the
 * Simplex optimizer runs.
 *
 * Rainfall data is sourced from Open-Meteo (https://open-meteo.com), a free
 * weather API that requires no API key. Rather than a single instantaneous
 * reading, this uses the sum of daily precipitation over the past few days
 * (RAINFALL_LOOKBACK_DAYS), which is a more defensible proxy for recent
 * soil moisture / leaching conditions than a one-hour snapshot.
 */

const RAINFALL_BANDS = [
  { class: "low", maxMm: 50, multiplier: 1.0 },
  { class: "moderate", maxMm: 150, multiplier: 1.1 },
  { class: "heavy", maxMm: Infinity, multiplier: 1.2 },
];

// How many past days of rainfall to sum. 5 days is a reasonable window for
// recent leaching risk without being overly sensitive to a single storm.
const RAINFALL_LOOKBACK_DAYS = 5;

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const REGION_COORDS = {
  "Nuwara Eliya": { lat: 6.9497, lon: 80.7891 },
  Bandarawela: { lat: 6.8319, lon: 80.9925 },
};

function classifyRainfall(rainfallMm) {
  if (typeof rainfallMm !== "number" || rainfallMm < 0) {
    throw new Error("rainfallMm must be a non-negative number");
  }
  const band = RAINFALL_BANDS.find((b) => rainfallMm <= b.maxMm);
  return band;
}

/**
 * Returns the total rainfall (mm) over the past RAINFALL_LOOKBACK_DAYS days
 * for the given region. If a manual override is supplied (e.g. from a form
 * field for testing/demo purposes), that value is used directly and no API
 * call is made. On any API failure, falls back to a fixed moderate value so
 * a recommendation can still be generated, and logs a warning so the
 * fallback is visible in server logs rather than silent.
 */
async function fetchRainfallMm(region, manualOverrideMm) {
  if (typeof manualOverrideMm === "number") {
    return manualOverrideMm;
  }

  const coords = REGION_COORDS[region] || REGION_COORDS["Nuwara Eliya"];

  const url =
    `${OPEN_METEO_BASE_URL}?latitude=${coords.lat}&longitude=${coords.lon}` +
    `&daily=precipitation_sum&past_days=${RAINFALL_LOOKBACK_DAYS}&forecast_days=1` +
    `&timezone=Asia%2FColombo`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }
    const data = await response.json();
    const dailyValues = data?.daily?.precipitation_sum;

    if (!Array.isArray(dailyValues) || dailyValues.length === 0) {
      throw new Error("Open-Meteo response did not include daily precipitation data");
    }

    // Sum the past-days portion only (exclude today's forecast day, since
    // that's a prediction rather than rainfall that has actually occurred).
    const pastDaysValues = dailyValues.slice(0, RAINFALL_LOOKBACK_DAYS);
    const totalMm = pastDaysValues.reduce((sum, v) => sum + (Number(v) || 0), 0);

    return Math.round(totalMm * 100) / 100;
  } catch (err) {
    console.warn(
      `[rainfall] Failed to fetch live rainfall for "${region}" (${err.message}); ` +
        `defaulting to 60mm (moderate).`
    );
    return 60;
  }
}

module.exports = { classifyRainfall, fetchRainfallMm, RAINFALL_BANDS, RAINFALL_LOOKBACK_DAYS };