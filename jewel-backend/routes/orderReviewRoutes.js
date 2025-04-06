const express = require('express');
const router = express.Router();
const OrderReview = require('../models/orderReview');
const Order = require('../models/order');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/order-reviews
// @desc    Create an order review
// @access  Private
router.post('/', [auth, upload.single('photo')], async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate order exists and is approved
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      orderStatus: 'Approved'
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or not approved for review'
      });
    }

    // Check for existing review
    const existingReview = await OrderReview.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this order'
      });
    }

    // Handle photo upload if exists
    let photoUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        { folder: 'order-reviews' }
      );
      photoUrl = result.secure_url;
    }

    // Create review
    const review = await OrderReview.create({
      user: userId,
      order: orderId,
      rating,
      comment,
      photo: photoUrl
    });

    res.status(201).json({
      success: true,
      review
    });

  } catch (error) {
    console.error('Error creating order review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/order-reviews/:orderId
// @desc    Get review for a specific order
// @access  Private
router.get('/:orderId', auth, async (req, res) => {
  try {
    const review = await OrderReview.findOne({ 
      order: req.params.orderId 
    }).populate('user', 'username');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Error fetching order review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;