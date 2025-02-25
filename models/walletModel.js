const mongoose = require('mongoose');

// Define Wallet Schema
const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [{
    amount: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        // enum: ['deposit', 'withdrawal'], // Transaction type
        // required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
   
  }]
});



// Define Wallet model
const WalletModel = mongoose.model('Wallet', walletSchema);

module.exports = WalletModel
