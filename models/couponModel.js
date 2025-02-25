const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    attempt: {
        type: Number,
        default:1
    },
    startingDate: {
        type: Date,
        required: true,
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    minTotal: {
        type: Number,
        required: true,
    },
    maxTotal: {
        type: Number,
        required: true,
    },
    // Add other fields as needed (e.g., minimum purchase amount, usage limits, etc.)
});

// Add TTL index to automatically delete documents after expirationDate
couponSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });


const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
