const Farm = require("../models/Farm");

exports.createFarm = async (req, res) => {
  try {
    const {
      farmName,
      region,
      areaHectares,
      soilType,
      location,
    } = req.body;

    const farm = await Farm.create({
      farmer: req.user._id,
      farmName,
      region,
      areaHectares: Number(areaHectares),
      soilType: typeof soilType === "string"
        ? soilType.trim()
        : "",
      location,
    });

    res.status(201).json({ farm });
  } catch (err) {
    res.status(400).json({
      message: "Failed to create farm",
      error: err.message,
    });
  }
};

exports.myFarms = async (req, res) => {
  try {
    const farms = await Farm.find({
      farmer: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ farms });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve farms",
    });
  }
};

exports.listFarms = async (req, res) => {
  try {
    const filter = {};

    if (req.query.region) {
      filter.region = req.query.region;
    }

    const farms = await Farm.find(filter).populate(
      "farmer",
      "name email region"
    );

    res.json({ farms });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve farms",
    });
  }
};