// controllers/reviewController.js
const Review = require('../models/review');
const Order = require('../models/order');

// Create review for an order
exports.createReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;
        
        // Verify order exists, belongs to the user, and has status "Accepted"
        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
            orderStatus: 'Accepted' // Changed from 'Delivered' to 'Accepted'
        });

        if (!order) {
            return res.status(400).json({ 
                success: false,
                message: 'Order not found, not yours, or not yet accepted' 
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ order: orderId });
        if (existingReview) {
            return res.status(400).json({ 
                success: false,
                message: 'This order already has a review' 
            });
        }

        const review = new Review({
            order: orderId,
            rating,
            comment,
            user: req.user._id
        });

        await review.save();
        
        res.status(201).json({
            success: true,
            review
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get user's reviews with order details
exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate({
                path: 'order',
                match: { orderStatus: 'Accepted' } // Only populate if order is accepted
            })
            .sort({ createdAt: -1 });

        // Filter out reviews where the order might not exist or isn't accepted
        const validReviews = reviews.filter(review => review.order !== null);

        res.status(200).json({
            success: true,
            reviews: validReviews
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// controllers/reviewController.js
exports.getReviewEligibleOrders = async (req, res) => {
    try {
        // Find orders that are accepted and belong to the user
        const orders = await Order.find({
            user: req.user._id,
            orderStatus: 'Accepted'
        }).populate({
            path: 'orderItems.product',
            select: 'name images price' // Only include necessary product fields
        });

        // Find which of these orders already have reviews
        const reviewedOrderIds = (await Review.find({
            user: req.user._id,
            order: { $in: orders.map(o => o._id) }
        })).map(r => r.order.toString());

        // Filter to only orders without reviews and include product details
        const eligibleOrders = orders
            .filter(order => !reviewedOrderIds.includes(order._id.toString()))
            .map(order => ({
                _id: order._id,
                createdAt: order.createdAt,
                orderItems: order.orderItems.map(item => ({
                    product: {
                        _id: item.product._id,
                        name: item.product.name,
                        image: item.product.images[0]?.url || null,
                        price: item.product.price
                    },
                    quantity: item.quantity
                }))
            }));

        res.status(200).json({
            success: true,
            orders: eligibleOrders
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};