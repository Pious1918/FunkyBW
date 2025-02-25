const mongoose = require('mongoose')

const referralSchema = new mongoose.Schema({

 refferalBonus:{

    type:Number,
    required:true
 },
 signupBonus:{
    type:Number,
    required:true
 }


})




module.exports = mongoose.model('Refferal' , referralSchema)