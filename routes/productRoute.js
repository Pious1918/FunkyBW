const express = require('express');
const product_route = express.Router();
const { currentAdmin, validateAdminToken } = require('../JWT');

const path = require('path');
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/ProductImages');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});


const upload = multer({ storage: storage });





const productController = require('../controllers/productController')
product_route.get('/add-product',validateAdminToken,productController.viewaddProducts)

product_route.post('/add-product',upload.array('images',5),productController.addProduct)

product_route.get('/productList' ,validateAdminToken, productController.loadProductsList)

product_route.get('/deleteproduct' , validateAdminToken, productController.deleteProduct)

product_route.get('/edit', validateAdminToken, productController.editProduct )

product_route.post('/edit/:id' ,upload.array('images', 5),  productController.updateProduct)
// product_route.post('/deleteImage/:productId/:imageName' ,  productController.deleteImageee)


product_route.post('/deleteImage/:productId/:imageName', productController.deleteImageee);


// offer pageee---------------------------------------------

product_route.get('/offer', validateAdminToken, productController.loadProductOffer )
product_route.post('/addProoffer', validateAdminToken, productController.updateProductOffer )
product_route.get('/deleteproOffer' , validateAdminToken, productController.deleteProductOffer)

module.exports = product_route
