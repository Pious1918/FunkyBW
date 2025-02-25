const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({


    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    productOffer: {
        type: Number, // or any other type that represents the discount or offer for the category
        default: 0, // default to no offer
    },


   
    
    
})

module.exports = mongoose.model("ProductOffer", productOfferSchema)