const express = require("express");
const router = express.Router();
const habitsController = require("../controllers/habitsController");
const auth = require("../middleware/auth");

router.post("/", auth, habitsController.createHabit);
router.get("/", auth, habitsController.getHabits);
router.put("/:id", auth, habitsController.updateHabit);
router.delete("/:id", auth, habitsController.deleteHabit);

module.exports = router;
