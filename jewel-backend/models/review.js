// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order", 
        required: true,
        unique: true
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    comment: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Middleware to set user from order
ReviewSchema.pre('save', async function(next) {
    if (!this.user) {
        const Order = mongoose.model('Order');
        const order = await Order.findById(this.order);
        if (order) {
            this.user = order.user;
        }
    }
    next();
});

module.exports = mongoose.model('Review', ReviewSchema);