


const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL);

const categorySchema = new mongoose.Schema({
    category_name: {
        type: String,
        required: true
    },

    category_image: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // This option adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Category', categorySchema);
