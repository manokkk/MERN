const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// POST /api/reviews - Create a review (protected + image upload)
router.post('/', protect, upload.single('photo'), reviewController.createReview);

// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', reviewController.getProductReviews);

// DELETE /api/reviews/:id - Delete a review (protected)
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;