const express = require('express')

const { currentAdmin, validateAdminToken } = require('../JWT');
const { addCategory , insertCategory , upload ,unlistCategory, viewCategory , listCategory , editCat , updateCat ,categoryOffer,updateCategoryOffer,deleteCatOffer} = require('../controllers/categoryController')

const category_Route = express()

category_Route.set('view engine', 'ejs')
category_Route.set('views' , './views/admin')

category_Route.get("*",validateAdminToken)
category_Route.use(currentAdmin);

// to view add category page
category_Route.get('/addCategory' , addCategory)

category_Route.post('/addCategory' , upload.single('category_image'), insertCategory)

category_Route.get('/category' , viewCategory)

category_Route.patch('/deletecategory/:id' , unlistCategory )
category_Route.patch('/listcategory/:id' , listCategory )

category_Route.get('/editcat',  editCat )

category_Route.post('/editcat/:id' ,upload.single('images'), updateCat)


// -------------------------------------category offer management----------------------------------------
category_Route.get('/catoffer',  categoryOffer )
category_Route.post('/addcatoffer',  updateCategoryOffer )
category_Route.get('/deleteCatOffer' ,  deleteCatOffer)






module.exports= category_Route

