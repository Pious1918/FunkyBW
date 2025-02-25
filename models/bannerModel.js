const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL)

const bannerSchema = new mongoose.Schema({

banner_image: String,
  
bname: String

// starting:Date,

// ending: {
//   type: Date,
//   expires: 0 // Automatically delete documents based on this field
// }


})


// bannerSchema.index({ ending: 1 }, { expireAfterSeconds: 0 }); // Create TTL index on 'ending' field

module.exports = mongoose.model('Banner' , bannerSchema)