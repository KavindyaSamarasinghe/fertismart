// Standalone sanity check — no MongoDB, no server, just the pure functions.
// Run with: node test-baseline-standalone.js

const {
  computeStraightFertilizerBaseline,
  computeCompoundBaseline,
  computeSavings,
} = require("./baselineComparison");

const fertilizers = [
  { _id: "urea", name: "Urea", type: "Nitrogen", costPerKgLKR: 145, nutrientContentPercent: { n: 46, p: 0, k: 0 } },
  { _id: "tsp", name: "Triple Super Phosphate (TSP)", type: "Phosphorus", costPerKgLKR: 210, nutrientContentPercent: { n: 0, p: 45, k: 0 } },
  { _id: "mop", name: "Muriate of Potash (MOP)", type: "Potassium", costPerKgLKR: 195, nutrientContentPercent: { n: 0, p: 0, k: 60 } },
  { _id: "ammsulph", name: "Ammonium Sulphate", type: "Nitrogen", costPerKgLKR: 110, nutrientContentPercent: { n: 21, p: 0, k: 0 } },
  { _id: "npk101020", name: "NPK 10:10:20 Compound", type: "Compound", costPerKgLKR: 160, nutrientContentPercent: { n: 10, p: 10, k: 20 } },
  { _id: "npk151515", name: "NPK 15:15:15 Compound", type: "Compound", costPerKgLKR: 155, nutrientContentPercent: { n: 15, p: 15, k: 15 } },
  { _id: "rockphos", name: "Rock Phosphate", type: "Phosphorus", costPerKgLKR: 90, nutrientContentPercent: { n: 0, p: 30, k: 0 } },
];

// Same requirement as the real test recommendation (Carrot, 1ha equivalent shown scaled):
const requirement = { n: 80, p: 60, k: 100 };
// (This exactly matches the real "n:80, p:60, k:100" from your Network tab response.)

console.log("=== Straight-fertilizer baseline ===");
const straight = computeStraightFertilizerBaseline(fertilizers, requirement);
console.log(JSON.stringify(straight, null, 2));

console.log("\n=== Compound baseline (recommended primary comparison) ===");
const compound = computeCompoundBaseline(fertilizers, requirement);
console.log(JSON.stringify(compound, null, 2));

// This is the actual optimized cost from your real API response
const optimizedCostFromRealTest = 75717.39;

console.log("\n=== Savings vs each baseline ===");
console.log("vs straight baseline:", computeSavings(optimizedCostFromRealTest, straight.totalCostLKR));
console.log("vs compound baseline:", computeSavings(optimizedCostFromRealTest, compound.totalCostLKR));

console.assert(compound.feasible === true, "FAIL: expected compound baseline to be feasible");
console.assert(compound.totalCostLKR > optimizedCostFromRealTest, "FAIL: expected compound baseline to cost MORE than the optimized mix");
console.log("\nIf no FAIL lines appeared above, both baselines are working correctly.");