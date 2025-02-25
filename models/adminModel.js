const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL)

const adminSchema = new mongoose.Schema({

    name: {
        type: String,
        required:true
    },

    email:{
        type:String,
        required: true,
        unique:true


    },


    password:{
        type:String,
        required:true

    },
    isAdmin:{
        type:Boolean,
        default:true
    }

   

})




module.exports = mongoose.model('Admin' , adminSchema)