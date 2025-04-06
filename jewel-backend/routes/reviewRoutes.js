const express = require('express');
const router = express.Router();
const multer = require('multer');
const Review = require('../models/review');
const Order = require('../models/order');
const User = require('../models/user');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit per file
    }
});

// Helper function to get user from token
const getUserFromToken = async (req) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return null;
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id);
    } catch (error) {
        return null;
    }
};

// Create new review with multiple photo uploads
router.post('/', upload.array('photos', 5), async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to create a review'
            });
        }

        const { orderId, productId, rating, comment } = req.body;

        // Basic validation
        if (!orderId || !productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Validate the user has purchased the product in an approved order
        const order = await Order.findOne({
            _id: orderId,
            user: user._id,
            orderStatus: 'Approved',
            'orderItems.product': productId
        });

        if (!order) {
            return res.status(400).json({
                success: false,
                message: 'You can only review products from your approved orders'
            });
        }

        // Check for existing review
        const existingReview = await Review.findOne({
            user: user._id,
            product: productId,
            order: orderId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product from this order'
            });
        }

        // Handle multiple photo uploads
        let photoUrls = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    { folder: 'product-reviews' }
                );
            });
            
            const results = await Promise.all(uploadPromises);
            photoUrls = results.map(result => result.secure_url);
        }

        const review = await Review.create({
            user: user._id,
            product: productId,
            order: orderId,
            rating: parseInt(rating),
            comment,
            photos: photoUrls,
            verifiedPurchase: true
        });

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review
        });

    } catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Fetch user's reviewed products
router.get('/reviewed-products', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view your reviewed products'
            });
        }

        // Get optional query parameters
        const { sortBy, limit } = req.query;
        
        // Build sort object
        let sort = { createdAt: -1 }; // Default: newest reviews first
        if (sortBy === 'oldest') {
            sort = { createdAt: 1 };
        } else if (sortBy === 'highest-rating') {
            sort = { rating: -1 };
        } else if (sortBy === 'lowest-rating') {
            sort = { rating: 1 };
        }

        // Build query
        const query = { user: user._id };

        // Get reviews with optional limit
        let reviewsQuery = Review.find(query)
            .sort(sort)
            .populate('product', 'name images price'); // Populate product details

        if (limit) {
            reviewsQuery = reviewsQuery.limit(parseInt(limit));
        }

        const reviews = await reviewsQuery.exec();

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error('Error fetching reviewed products:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Update existing review
router.put('/:reviewId', upload.array('photos', 5), async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to update a review'
            });
        }

        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        // Basic validation
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Rating and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Find the review
        const review = await Review.findOne({
            _id: reviewId,
            user: user._id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or you are not authorized to update it'
            });
        }

        // Handle photo updates
        let photoUrls = [...review.photos];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    { folder: 'product-reviews' }
                );
            });
            
            const results = await Promise.all(uploadPromises);
            photoUrls = [...photoUrls, ...results.map(result => result.secure_url)];
        }

        // Handle photo deletions if needed (you can pass photo IDs to delete in req.body)
        if (req.body.photosToDelete) {
            try {
                const photosToDelete = JSON.parse(req.body.photosToDelete);
                photoUrls = photoUrls.filter(photo => !photosToDelete.includes(photo));
                
                // Delete from Cloudinary if needed
                await Promise.all(photosToDelete.map(photoUrl => {
                    const publicId = photoUrl.split('/').pop().split('.')[0];
                    return cloudinary.uploader.destroy(`product-reviews/${publicId}`);
                }));
            } catch (error) {
                console.error('Error deleting photos:', error);
            }
        }

        // Update the review
        review.rating = parseInt(rating);
        review.comment = comment;
        review.photos = photoUrls;
        await review.save();

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review
        });

    } catch (error) {
        console.error('Review update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;