const mongoose = require("mongoose");

const FarmSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    farmName: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      enum: ["Nuwara Eliya", "Bandarawela"],
      required: true,
    },

    areaHectares: {
      type: Number,
      required: true,
      min: 0.01,
    },

   
    soilType: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farm", FarmSchema);