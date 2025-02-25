const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({

    user_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                default: 1,

            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    

    totalPrice: {
        type: Number,
        default: 0
    },

    counponPrice: {
        type: Number,
        default: 0
    }
    
    
})

module.exports = mongoose.model("Cart", cartSchema)