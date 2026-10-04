/**
 * Soil-type adjustment for the fertilizer optimizer.
 *
 * IMPORTANT: every number below is a PLACEHOLDER that shows the structure.
 * Replace them with figures from DOA/HORDI recommendations or Natural
 * Resources Management Centre soil publications, and cite the source in
 * your thesis.
 */
const SOIL_PROFILES = {
  "Red-Yellow Podzolic": {
    multipliers: { n: 1.0, p: 1.15, k: 1.05 },
    excludeFertilizers: [],
    note: "Acidic, high P fixation",
  },
  "Reddish Brown Earth": {
    multipliers: { n: 1.0, p: 1.0, k: 1.0 },
    excludeFertilizers: ["Rock Phosphate"],
    note: "Generally well-drained, near-neutral",
  },
  "Immature Brown Loam": {
    multipliers: { n: 1.0, p: 1.05, k: 1.0 },
    excludeFertilizers: [],
    note: "",
  },
  "Alluvial Soil": {
    multipliers: { n: 1.0, p: 1.0, k: 0.95 },
    excludeFertilizers: ["Rock Phosphate"],
    note: "",
  },
  "Sandy Soil": {
    multipliers: { n: 1.15, p: 1.0, k: 1.15 },
    excludeFertilizers: ["Rock Phosphate"],
    note: "Low nutrient retention: higher N and K leaching",
  },
  "Clay Soil": {
    multipliers: { n: 1.0, p: 1.1, k: 1.0 },
    excludeFertilizers: [],
    note: "P fixation",
  },
  "Loamy Soil": {
    multipliers: { n: 1.0, p: 1.0, k: 1.0 },
    excludeFertilizers: [],
    note: "",
  },
};

const NEUTRAL = {
  multipliers: { n: 1, p: 1, k: 1 },
  excludeFertilizers: [],
  note: "No soil-specific adjustment applied",
  matched: false,
  soilType: "",
};

function getSoilAdjustment(soilType) {
  const wanted = String(soilType || "").trim().toLowerCase();
  const key = Object.keys(SOIL_PROFILES).find((k) => k.toLowerCase() === wanted);
  // Blank, "Other" or custom soil types stay neutral instead of guessing
  return key ? { ...SOIL_PROFILES[key], matched: true, soilType: key } : { ...NEUTRAL };
}

function filterFertilizersForSoil(fertilizers, soil) {
  if (!soil.excludeFertilizers.length) return fertilizers;
  const filtered = fertilizers.filter((f) => !soil.excludeFertilizers.includes(f.name));
  return filtered.length ? filtered : fertilizers; // never leave the solver empty
}

module.exports = { getSoilAdjustment, filterFertilizersForSoil, SOIL_PROFILES };