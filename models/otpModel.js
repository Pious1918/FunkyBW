const mongoose = require('mongoose')

const otpSchema = mongoose.Schema({

    email: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: Number,
        required: true
    },
    createdAt: {
        type: Date, 
        default: Date.now
    },
    expiry: { 
        type: Date, 
        expires: '5m', // Set TTL to 5 minutes
        default: Date.now() + 300000 // Set default value to the current time + 5 minutes in milliseconds
    }
  })

  module.exports = mongoose.model('Otp', otpSchema)