function computeStraightFertilizerBaseline(fertilizers, requirement) {
  const nutrients = ["n", "p", "k"];
  const breakdown = [];
  const notes = [];
  let totalCostLKR = 0;
  let feasible = true;

  nutrients.forEach((nutrient) => {
    const requiredAmount = requirement[nutrient];
    if (!requiredAmount || requiredAmount <= 0) return;

    const candidates = fertilizers
      .filter((f) => f.nutrientContentPercent[nutrient] > 0)
      .map((f) => ({
        fertilizer: f,
        costPerKgNutrient: f.costPerKgLKR / (f.nutrientContentPercent[nutrient] / 100),
      }))
      .sort((a, b) => a.costPerKgNutrient - b.costPerKgNutrient);

    if (candidates.length === 0) {
      feasible = false;
      notes.push(`No available fertilizer supplies ${nutrient.toUpperCase()}.`);
      return;
    }

    const chosen = candidates[0].fertilizer;
    const quantityKg = requiredAmount / (chosen.nutrientContentPercent[nutrient] / 100);
    const costLKR = quantityKg * chosen.costPerKgLKR;

    totalCostLKR += costLKR;
    breakdown.push({
      nutrient: nutrient.toUpperCase(),
      fertilizerId: chosen._id,
      fertilizerName: chosen.name,
      quantityKg: Math.round(quantityKg * 100) / 100,
      costLKR: Math.round(costLKR * 100) / 100,
    });
  });

  return {
    feasible,
    totalCostLKR: Math.round(totalCostLKR * 100) / 100,
    breakdown,
    notes,
    method:
      "Cheapest single-nutrient (\"straight\") fertilizer applied independently for each of N, P and K, " +
      "with no cross-nutrient blending or cost optimization.",
  };
}

function computeCompoundBaseline(fertilizers, requirement) {
  const nutrients = ["n", "p", "k"];
  const compounds = fertilizers.filter(
    (f) => f.type === "Compound" || nutrients.filter((n) => f.nutrientContentPercent[n] > 0).length > 1
  );

  if (compounds.length === 0) {
    return {
      feasible: false,
      totalCostLKR: 0,
      breakdown: [],
      notes: ["No compound (multi-nutrient) fertilizer is available in the catalogue."],
      method: null,
    };
  }

  const options = compounds.map((f) => {
    let quantityKg = 0;
    let bindingNutrient = null;

    nutrients.forEach((nutrient) => {
      const required = requirement[nutrient];
      const content = f.nutrientContentPercent[nutrient] / 100;
      if (!required || required <= 0 || content <= 0) return;
      const neededForThis = required / content;
      if (neededForThis > quantityKg) {
        quantityKg = neededForThis;
        bindingNutrient = nutrient.toUpperCase();
      }
    });

    const costLKR = quantityKg * f.costPerKgLKR;

    const supplied = {};
    nutrients.forEach((nutrient) => {
      supplied[nutrient] = Math.round(quantityKg * (f.nutrientContentPercent[nutrient] / 100) * 100) / 100;
    });

    return {
      fertilizer: f,
      quantityKg: Math.round(quantityKg * 100) / 100,
      costLKR: Math.round(costLKR * 100) / 100,
      bindingNutrient,
      suppliedKgPerHa: supplied,
    };
  });

  options.sort((a, b) => a.costLKR - b.costLKR);
  const chosen = options[0];

  return {
    feasible: true,
    totalCostLKR: chosen.costLKR,
    breakdown: [
      {
        fertilizerId: chosen.fertilizer._id,
        fertilizerName: chosen.fertilizer.name,
        quantityKg: chosen.quantityKg,
        costLKR: chosen.costLKR,
        bindingNutrient: chosen.bindingNutrient,
        suppliedKgPerHa: chosen.suppliedKgPerHa,
        requiredKgPerHa: requirement,
      },
    ],
    notes: [
      `Applied at a rate to fully cover the binding nutrient (${chosen.bindingNutrient}); ` +
        `other nutrients were over-supplied as a result, which is typical of unoptimized flat-rate application.`,
    ],
    method:
      "A single general-purpose compound fertilizer applied at a flat rate sufficient to cover the most " +
      "nutrient-deficient requirement, over-supplying the other two nutrients — representing typical " +
      "unoptimized farming practice without a decision-support tool.",
  };
}

function computeSavings(optimizedTotalCostLKR, baselineTotalCostLKR) {
  if (!baselineTotalCostLKR || baselineTotalCostLKR <= 0) {
    return { savingsLKR: 0, savingsPercent: 0 };
  }
  const savingsLKR = baselineTotalCostLKR - optimizedTotalCostLKR;
  const savingsPercent = (savingsLKR / baselineTotalCostLKR) * 100;
  return {
    savingsLKR: Math.round(savingsLKR * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 100) / 100,
  };
}

module.exports = {
  computeStraightFertilizerBaseline,
  computeCompoundBaseline,
  computeSavings,
};