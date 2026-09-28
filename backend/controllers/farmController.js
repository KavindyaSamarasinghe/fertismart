const Farm = require("../models/Farm");

exports.createFarm = async (req, res) => {
  try {
    const farm = await Farm.create({ ...req.body, farmer: req.user._id });
    res.status(201).json({ farm });
  } catch (err) {
    res.status(400).json({ message: "Failed to create farm", error: err.message });
  }
};

exports.myFarms = async (req, res) => {
  const farms = await Farm.find({ farmer: req.user._id }).sort({ createdAt: -1 });
  res.json({ farms });
};

exports.listFarms = async (req, res) => {
  const filter = {};
  if (req.query.region) filter.region = req.query.region;
  const farms = await Farm.find(filter).populate("farmer", "name email region");
  res.json({ farms });
};
