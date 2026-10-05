const assert = require("assert");
const { getSoilAdjustment, filterFertilizersForSoil } = require("./soilAdjustment");
const { solveFertilizerMix } = require("./lpSolver");

const fertilizers = [
  { _id: "urea", name: "Urea", type: "Nitrogen", costPerKgLKR: 145, nutrientContentPercent: { n: 46, p: 0, k: 0 } },
  { _id: "tsp", name: "Triple Super Phosphate (TSP)", type: "Phosphorus", costPerKgLKR: 210, nutrientContentPercent: { n: 0, p: 45, k: 0 } },
  { _id: "mop", name: "Muriate of Potash (MOP)", type: "Potassium", costPerKgLKR: 195, nutrientContentPercent: { n: 0, p: 0, k: 60 } },
  { _id: "ammsulph", name: "Ammonium Sulphate", type: "Nitrogen", costPerKgLKR: 110, nutrientContentPercent: { n: 21, p: 0, k: 0 } },
  { _id: "npk101020", name: "NPK 10:10:20 Compound", type: "Compound", costPerKgLKR: 160, nutrientContentPercent: { n: 10, p: 10, k: 20 } },
  { _id: "npk151515", name: "NPK 15:15:15 Compound", type: "Compound", costPerKgLKR: 155, nutrientContentPercent: { n: 15, p: 15, k: 15 } },
  { _id: "rockphos", name: "Rock Phosphate", type: "Phosphorus", costPerKgLKR: 90, nutrientContentPercent: { n: 0, p: 30, k: 0 } },
];

const round2 = (v) => Math.round(v * 100) / 100;
const carrot = { n: 80, p: 60, k: 100 }; 


assert.strictEqual(getSoilAdjustment("sandy soil").soilType, "Sandy Soil");


for (const s of ["Reddish Brown Latosolic", "", undefined, "Other"]) {
  const r = getSoilAdjustment(s);
  assert.strictEqual(r.matched, false);
  assert.deepStrictEqual(r.multipliers, { n: 1, p: 1, k: 1 });
}


const sandy = getSoilAdjustment("Sandy Soil");
const req = {
  n: round2(carrot.n * sandy.multipliers.n),
  p: round2(carrot.p * sandy.multipliers.p),
  k: round2(carrot.k * sandy.multipliers.k),
};
assert.deepStrictEqual(req, { n: 92, p: 60, k: 115 });


const usable = filterFertilizersForSoil(fertilizers, sandy);
assert.ok(!usable.some((f) => f.name === "Rock Phosphate"));
assert.strictEqual(usable.length, fertilizers.length - 1);


const onlyRock = [fertilizers[6]];
assert.strictEqual(filterFertilizersForSoil(onlyRock, sandy).length, 1);


const neutral = solveFertilizerMix(fertilizers, carrot);
const sandyResult = solveFertilizerMix(usable, req);
console.log("Neutral:", neutral.totalCostLKR, neutral.mix.map((m) => m.fertilizerName));
console.log("Sandy  :", sandyResult.totalCostLKR, sandyResult.mix.map((m) => m.fertilizerName));
assert.ok(sandyResult.totalCostLKR > neutral.totalCostLKR);
assert.ok(!sandyResult.mix.some((m) => m.fertilizerName === "Rock Phosphate"));

console.log("\nAll soil tests passed.");