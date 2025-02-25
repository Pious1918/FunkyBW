const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Unique identifier for the order
 

    // User who placed the order
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Array of products in the order


    // Billing information
    billingAddress: {

        // name:{
        //     type:String,
        //     required:true
        // }
        // Add billing address fields (e.g., street, city, state, zip code)
    },

    // Shipping information
    shippingAddress: {
        // Add shipping address fields (e.g., street, city, state, zip code)
    },

    // Total order amount
    totalAmount: {
        type: Number,
        required: true,
    },

    discountAmount: {
        type: Number,
        
    },

    items: [
        {
            product_id: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                enum: ['pending', 'shipped', 'delivered', 'cancelled','returned'],
                default: 'pending',
                required: true
            },
            returnreason: {
                type: String
               
            },
            
        }
    ],

    payment: {
        type: String,
        required: true
    },
    // Timestamps for order creation and last update
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: null,
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
