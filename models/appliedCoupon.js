const mongoose = require('mongoose');

const couponCart = new mongoose.Schema({

    user_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User', 
        required: true
    },

    
            coupon_id: {
                type: mongoose.Types.ObjectId,
                ref: 'Coupon', 
            },
          
        
    
  
    is_attempted: {
        type: Number,
        default: 1
    }

    
    
})

module.exports = mongoose.model("Couponcart", couponCart)