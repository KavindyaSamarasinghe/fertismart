const solver = require("javascript-lp-solver");

function solveFertilizerMix(fertilizers, requirement) {
  if (!Array.isArray(fertilizers) || fertilizers.length === 0) {
    throw new Error("At least one fertilizer must be provided to the solver");
  }
  const { n, p, k } = requirement;
  if ([n, p, k].some((v) => typeof v !== "number" || v < 0)) {
    throw new Error("requirement.n/p/k must be non-negative numbers");
  }

  const model = {
    optimize: "cost",
    opType: "min",
    constraints: {
      nitrogen: { min: n },
      phosphorus: { min: p },
      potassium: { min: k },
    },
    variables: {},
  };

  fertilizers.forEach((f) => {
    const key = String(f._id);
    model.variables[key] = {
      cost: f.costPerKgLKR,
      nitrogen: f.nutrientContentPercent.n / 100,
      phosphorus: f.nutrientContentPercent.p / 100,
      potassium: f.nutrientContentPercent.k / 100,
    };
  });

  const result = solver.Solve(model);

  if (!result.feasible) {
    return { status: "infeasible", totalCostLKR: 0, mix: [] };
  }

  const mix = fertilizers
    .map((f) => {
      const key = String(f._id);
      const quantityKg = Number(result[key] || 0);
      if (quantityKg <= 0.0001) return null;
      return {
        fertilizerId: f._id,
        fertilizerName: f.name,
        quantityKg: Math.round(quantityKg * 100) / 100,
        costLKR: Math.round(quantityKg * f.costPerKgLKR * 100) / 100,
      };
    })
    .filter(Boolean);

  return {
    status: "optimal",
    totalCostLKR: Math.round(result.result * 100) / 100,
    mix,
  };
}

module.exports = { solveFertilizerMix };
