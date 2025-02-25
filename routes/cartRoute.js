const express = require('express')

const cart_Route = express()

const cartController = require('../controllers/cartController')



cart_Route.get('/cart' , cartController.loadCart )




// Add Product to Cart
cart_Route.post('/add-to-cart/:id', cartController.addProduct);

// delete cart product 



cart_Route.post('/deleteCart/:id', cartController.removeProduct);

// udating quantity in the cart



cart_Route.post('/updateQuantity' , cartController.updateQuantity)



module.exports = cart_Route


