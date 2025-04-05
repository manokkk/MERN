// // controllers/reviewController.js
// const Review = require('../models/review');
// const Order = require('../models/order');

// // Create review for an order
// exports.createReview = async (req, res) => {
//     try {
//         const { orderId, rating, comment } = req.body;
        
//         // Verify order exists, belongs to the user, and has status "Accepted"
//         const order = await Order.findOne({
//             _id: orderId,
//             user: req.user._id,
//             orderStatus: 'Accepted' // Changed from 'Delivered' to 'Accepted'
//         });

//         if (!order) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Order not found, not yours, or not yet accepted' 
//             });
//         }

//         // Check if review already exists
//         const existingReview = await Review.findOne({ order: orderId });
//         if (existingReview) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'This order already has a review' 
//             });
//         }

//         const review = new Review({
//             order: orderId,
//             rating,
//             comment,
//             user: req.user._id
//         });

//         await review.save();
        
//         res.status(201).json({
//             success: true,
//             review
//         });

//     } catch (error) {
//         res.status(500).json({ 
//             success: false,
//             message: error.message 
//         });
//     }
// };

// // Get user's reviews with order details
// exports.getUserReviews = async (req, res) => {
//     try {
//         const reviews = await Review.find({ user: req.user._id })
//             .populate({
//                 path: 'order',
//                 match: { orderStatus: 'Accepted' } // Only populate if order is accepted
//             })
//             .sort({ createdAt: -1 });

//         // Filter out reviews where the order might not exist or isn't accepted
//         const validReviews = reviews.filter(review => review.order !== null);

//         res.status(200).json({
//             success: true,
//             reviews: validReviews
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             success: false,
//             message: error.message 
//         });
//     }
// };

// // controllers/reviewController.js
// exports.getReviewEligibleOrders = async (req, res) => {
//     try {
//         // Find orders that are accepted and belong to the user
//         const orders = await Order.find({
//             user: req.user._id,
//             orderStatus: 'Accepted'
//         }).populate({
//             path: 'orderItems.product',
//             select: 'name images price' // Only include necessary product fields
//         });

//         // Find which of these orders already have reviews
//         const reviewedOrderIds = (await Review.find({
//             user: req.user._id,
//             order: { $in: orders.map(o => o._id) }
//         })).map(r => r.order.toString());

//         // Filter to only orders without reviews and include product details
//         const eligibleOrders = orders
//             .filter(order => !reviewedOrderIds.includes(order._id.toString()))
//             .map(order => ({
//                 _id: order._id,
//                 createdAt: order.createdAt,
//                 orderItems: order.orderItems.map(item => ({
//                     product: {
//                         _id: item.product._id,
//                         name: item.product.name,
//                         image: item.product.images[0]?.url || null,
//                         price: item.product.price
//                     },
//                     quantity: item.quantity
//                 }))
//             }));

//         res.status(200).json({
//             success: true,
//             orders: eligibleOrders
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             success: false,
//             message: error.message 
//         });
//     }
// };
const Review = require('../models/review');
const Order = require('../models/order');
const Product = require('../models/product');
const cloudinary = require('cloudinary').v2;

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", req.file);

        const { rating, comment, orderId, productId } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!rating || !orderId || !productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating, order ID, and product ID are required' 
            });
        }

        // Check order validity
        const order = await Order.findOne({
            _id: orderId,
            user: userId,
            orderStatus: 'Approved'
        });

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found or not approved' 
            });
        }

        // Check product exists in order
        const productInOrder = order.orderItems.some(item => 
            item.product.toString() === productId
        );
        
        if (!productInOrder) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product not found in this order' 
            });
        }

        // Check for existing review
        const existingReview = await Review.findOne({
            user: userId,
            product: productId,
            order: orderId
        });

        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reviewed this product from this order' 
            });
        }

        let photoData = null;
        
        // Handle photo upload
        if (req.file) {
            try {
                const uploadImage = (fileBuffer) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: "product-reviews" },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve({
                                    public_id: result.public_id,
                                    url: result.secure_url,
                                });
                            }
                        );
                        uploadStream.end(fileBuffer);
                    });
                };

                const uploadedImage = await uploadImage(req.file.buffer);
                photoData = {
                    url: uploadedImage.url,
                    publicId: uploadedImage.public_id
                };
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload review image' 
                });
            }
        }

        // Create review
        const review = await Review.create({
            user: userId,
            product: productId,
            order: orderId,
            rating: parseInt(rating),
            comment,
            photo: photoData?.url || null,
            photoPublicId: photoData?.publicId || null
        });

        // Update product ratings
        await updateProductRating(productId);

        return res.status(201).json({ 
            success: true, 
            review 
        });

    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name avatar');
            
        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (admin or review owner)
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user is owner or admin
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        // Delete image from Cloudinary if exists
        if (review.photoPublicId) {
            await cloudinary.uploader.destroy(review.photoPublicId);
        }

        await review.remove();

        // Update product ratings
        await updateProductRating(review.product);

        return res.status(200).json({
            success: true,
            message: 'Review deleted'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to update product ratings
async function updateProductRating(productId) {
    const reviews = await Review.find({ product: productId });
    
    if (reviews.length > 0) {
        const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRatings / reviews.length;
        
        await Product.findByIdAndUpdate(productId, { 
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviews.length
        });
    } else {
        await Product.findByIdAndUpdate(productId, { 
            averageRating: 0,
            reviewCount: 0
        });
    }
}