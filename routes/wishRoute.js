const express = require('express')
const wish_route = express()
const wishController = require('../controllers/wishlistController');







wish_route.get("/wishlist",wishController.wishlist)

wish_route.post('/addwish/:productId', wishController.addWishlist); // Corrected route definition

wish_route.get('/remove-wishlist/:productId', wishController.removeWishlistItem);






module.exports = wish_route