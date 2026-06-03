const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/auth");

router.get("/streaks", auth, analyticsController.getStreaks);
router.get("/heatmap", auth, analyticsController.getHeatmap);
router.get("/completion-rate", auth, analyticsController.getCompletionRate);
router.get("/best-worst-day", auth, analyticsController.getBestWorstDay);
router.get("/readiness-score", auth, analyticsController.getReadinessScore);
router.get("/weekly-progress", auth, analyticsController.getWeeklyProgress);

module.exports = router;
