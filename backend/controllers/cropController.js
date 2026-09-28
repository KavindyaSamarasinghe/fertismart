const Crop = require("../models/Crop");

exports.listCrops = async (req, res) => {
  const crops = await Crop.find({ isActive: true }).sort({ name: 1 });
  res.json({ crops });
};

exports.getCrop = async (req, res) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) return res.status(404).json({ message: "Crop not found" });
  res.json({ crop });
};

exports.createCrop = async (req, res) => {
  try {
    const crop = await Crop.create(req.body);
    res.status(201).json({ crop });
  } catch (err) {
    res.status(400).json({ message: "Failed to create crop", error: err.message });
  }
};

exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    res.json({ crop });
  } catch (err) {
    res.status(400).json({ message: "Failed to update crop", error: err.message });
  }
};

exports.deleteCrop = async (req, res) => {
  const crop = await Crop.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!crop) return res.status(404).json({ message: "Crop not found" });
  res.json({ message: "Crop deactivated", crop });
};
