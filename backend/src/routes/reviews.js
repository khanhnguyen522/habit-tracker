const express = require("express");
const router = express.Router();
const reviewsController = require("../controllers/reviewsController");
const auth = require("../middleware/auth");

router.post("/generate", auth, reviewsController.generateReview);
router.get("/", auth, reviewsController.getReviews);

module.exports = router;
