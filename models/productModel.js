

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    category_id: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true
    },
    size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    countInStock: {
        type: Number,
        required: true,
    },
    images: {
        type: Array,
        required: true
    },
    categoryofferPrice: {
        type: Number, // or any other type that represents the discount or offer for the category
        default: 0, // default to no offer
    },
    productofferPrice: {
        type: Number, // or any other type that represents the discount or offer for the category
        default: 0, // default to no offer
    },


    // offerPrice: {
    //     type: Number, // or any other type that represents the discount or offer for the category
    //     default: 0, // default to no offer
    // },

    isDeleted: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true // Add createdAt and updatedAt timestamps
});

module.exports = mongoose.model("Product", productSchema);
