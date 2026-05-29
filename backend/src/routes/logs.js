const express = require("express");
const router = express.Router();
const logsController = require("../controllers/logsController");
const auth = require("../middleware/auth");

router.post("/", auth, logsController.logHabit);
router.get("/today", auth, logsController.getTodayLogs);
router.delete("/:habitId/:date", auth, logsController.unlogHabit);

module.exports = router;
