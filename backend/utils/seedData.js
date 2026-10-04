module.exports = {
  crops: [
    { name: "Cabbage", scientificName: "Brassica oleracea var. capitata", npkRequirementKgPerHa: { n: 120, p: 60, k: 60 }, growingDurationDays: 90 },
    { name: "Carrot", scientificName: "Daucus carota", npkRequirementKgPerHa: { n: 80, p: 60, k: 100 }, growingDurationDays: 100 },
    { name: "Leeks", scientificName: "Allium ampeloprasum", npkRequirementKgPerHa: { n: 100, p: 50, k: 80 }, growingDurationDays: 120 },
    { name: "Beetroot", scientificName: "Beta vulgaris", npkRequirementKgPerHa: { n: 90, p: 50, k: 90 }, growingDurationDays: 80 },
    { name: "Tomato", scientificName: "Solanum lycopersicum", npkRequirementKgPerHa: { n: 150, p: 80, k: 120 }, growingDurationDays: 100 },
    { name: "Potato", scientificName: "Solanum tuberosum", npkRequirementKgPerHa: { n: 130, p: 90, k: 140 }, growingDurationDays: 105 },
    { name: "Beans", scientificName: "Phaseolus vulgaris", npkRequirementKgPerHa: { n: 60, p: 60, k: 60 }, growingDurationDays: 65 },
    { name: "Cauliflower", scientificName: "Brassica oleracea var. botrytis", npkRequirementKgPerHa: { n: 130, p: 70, k: 70 }, growingDurationDays: 95 },
    { name: "Radish", scientificName: "Raphanus sativus", npkRequirementKgPerHa: { n: 60, p: 40, k: 60 }, growingDurationDays: 40 },
    { name: "Capsicum", scientificName: "Capsicum annuum", npkRequirementKgPerHa: { n: 110, p: 70, k: 100 }, growingDurationDays: 110 },
  ],
  fertilizers: [
    { name: "Urea", type: "Nitrogen", nutrientContentPercent: { n: 46, p: 0, k: 0 }, costPerKgLKR: 145 },
    { name: "Triple Super Phosphate (TSP)", type: "Phosphorus", nutrientContentPercent: { n: 0, p: 45, k: 0 }, costPerKgLKR: 210 },
    { name: "Muriate of Potash (MOP)", type: "Potassium", nutrientContentPercent: { n: 0, p: 0, k: 60 }, costPerKgLKR: 195 },
    { name: "Ammonium Sulphate", type: "Nitrogen", nutrientContentPercent: { n: 21, p: 0, k: 0 }, costPerKgLKR: 110 },
    { name: "NPK 10:10:20 Compound", type: "Compound", nutrientContentPercent: { n: 10, p: 10, k: 20 }, costPerKgLKR: 160 },
    { name: "NPK 15:15:15 Compound", type: "Compound", nutrientContentPercent: { n: 15, p: 15, k: 15 }, costPerKgLKR: 155 },
    { name: "Rock Phosphate", type: "Phosphorus", nutrientContentPercent: { n: 0, p: 30, k: 0 }, costPerKgLKR: 90 },
  ],
};