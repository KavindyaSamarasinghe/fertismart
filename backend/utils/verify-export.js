// backend/utils/verify-export.js  (NEW FILE)
const fs = require("fs");
const { crops, fertilizers } = require("./seedData");
const { solveFertilizerMix } = require("./lpSolver");
const { getSoilAdjustment, filterFertilizersForSoil } = require("./soilAdjustment");

const ferts = fertilizers.map((f) => ({ ...f, _id: f.name }));
const bands = [
  { label: "low", mm: 40, mult: 1.0 },
  { label: "moderate", mm: 100, mult: 1.1 },
  { label: "heavy", mm: 200, mult: 1.2 },
];
const round2 = (v) => Math.round(v * 100) / 100;

const scenarios = [];
// 10 crops x 3 rainfall bands = 30 scenarios
for (const c of crops) {
  for (const b of bands) {
    scenarios.push({ crop: c.name, rain: b.label, soil: "", area: 1,
      mult: b.mult, base: c.npkRequirementKgPerHa });
  }
}
// +1 soil scenario = 31
scenarios.push({ crop: "Carrot", rain: "low", soil: "Sandy Soil", area: 1,
  mult: 1.0, base: { n: 80, p: 60, k: 100 } });

const out = scenarios.map((s, i) => {
  const soil = getSoilAdjustment(s.soil);
  const req = {
    n: round2(s.base.n * s.mult * soil.multipliers.n * s.area),
    p: round2(s.base.p * soil.multipliers.p * s.area),
    k: round2(s.base.k * soil.multipliers.k * s.area),
  };
  const usable = filterFertilizersForSoil(ferts, soil);
  const r = solveFertilizerMix(usable, req);
  return {
    id: i + 1, crop: s.crop, rain: s.rain, soil: s.soil, req,
    fertilizers: usable.map((f) => ({
      name: f.name, cost: f.costPerKgLKR,
      n: f.nutrientContentPercent.n, p: f.nutrientContentPercent.p, k: f.nutrientContentPercent.k,
    })),
    js: { status: r.status, cost: r.totalCostLKR,
          mix: Object.fromEntries(r.mix.map((m) => [m.fertilizerName, m.quantityKg])) },
  };
});

fs.writeFileSync("scenarios.json", JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} scenarios`);