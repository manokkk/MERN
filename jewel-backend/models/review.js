const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
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
        required: true,
        trim: true
    },
    photos: [{
        type: String
    }],
    verifiedPurchase: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index to ensure one review per product per order by a user
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);