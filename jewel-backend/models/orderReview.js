const mongoose = require('mongoose');

const OrderReviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: true,
    unique: true // Prevent duplicate reviews
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  },
  photo: {
    type: String, // URL for the review photo
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OrderReview', OrderReviewSchema);