const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  addresses: [
    {
      name: String,
      mobileNo: String,
      pinCode: String,
      address: String,
      localityTown: String,
      city: String,
      state: String,
      extraMobileNo: String,
      defaultAddress: {
        type: Boolean,
        default: false
      }
    }
  ]
});

const AddressModel = mongoose.model('Address', addressSchema);

module.exports = AddressModel;
