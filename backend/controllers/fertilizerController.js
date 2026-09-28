const Fertilizer = require("../models/Fertilizer");

exports.listFertilizers = async (req, res) => {
  const fertilizers = await Fertilizer.find({ isActive: true }).sort({ name: 1 });
  res.json({ fertilizers });
};

exports.createFertilizer = async (req, res) => {
  try {
    const fertilizer = await Fertilizer.create(req.body);
    res.status(201).json({ fertilizer });
  } catch (err) {
    res.status(400).json({ message: "Failed to create fertilizer", error: err.message });
  }
};

exports.updateFertilizer = async (req, res) => {
  try {
    const fertilizer = await Fertilizer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!fertilizer) return res.status(404).json({ message: "Fertilizer not found" });
    res.json({ fertilizer });
  } catch (err) {
    res.status(400).json({ message: "Failed to update fertilizer", error: err.message });
  }
};

exports.deleteFertilizer = async (req, res) => {
  const fertilizer = await Fertilizer.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!fertilizer) return res.status(404).json({ message: "Fertilizer not found" });
  res.json({ message: "Fertilizer deactivated", fertilizer });
};
