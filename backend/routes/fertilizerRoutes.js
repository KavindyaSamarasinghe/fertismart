const express = require("express");
const router = express.Router();
const {
  listFertilizers,
  createFertilizer,
  updateFertilizer,
  deleteFertilizer,
} = require("../controllers/fertilizerController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, listFertilizers);
router.post("/", protect, authorize("admin"), createFertilizer);
router.put("/:id", protect, authorize("admin"), updateFertilizer);
router.delete("/:id", protect, authorize("admin"), deleteFertilizer);

module.exports = router;
