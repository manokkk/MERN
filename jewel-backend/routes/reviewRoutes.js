// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Routes without middleware (authentication handled in controller)
router.post('/', reviewController.createReview);
router.get('/get', reviewController.getUserReviews);
router.get('/eligible-orders', reviewController.getReviewEligibleOrders);

module.exports = router;