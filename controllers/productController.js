const Product = require('../models/productModel');
const categoryFromDB = require('../models/categoryModel');
const productModel = require('../models/productModel');

const { paginate } = require("../JWT");
const mongoose = require('mongoose')
const sharp = require('sharp');
const productOfferModel = require('../models/productOfferModel');
const categoryOfferModel = require("../models/categoryOfferModel")

const viewaddProducts = async(req,res)=>{

    try {

        const fetchCategories = await categoryFromDB.find()
        console.log('categories '+fetchCategories[0].category_name)

        res.render("addProduct" , {categories : fetchCategories})
        
    } catch (error) {
        console.log("error on viewAddProductys")
    }

    
    
 
}

const addProduct = async (req, res) => {
    try {
        console.log("sdaff");

        let arrImages = [];
        console.log(req.files);

        for (let i = 0; i < req.files.length; i++) {
            // Use sharp to resize and crop the image
            const croppedBuffer = await sharp(req.files[i].path)
                .resize({ width: 306, height: 408, fit: sharp.fit.cover })
                .toBuffer();

            const filename = `cropped_${req.files[i].originalname}`;
            arrImages[i] = filename;

            // Save the cropped image
            await sharp(croppedBuffer).toFile(`uploads/ProductImages/${filename}`);
        }

        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category_id: req.body.category_id,
            countInStock: req.body.stock,
            dateCreated: req.body.date,
            size: req.body.size,
            color: req.body.color,
            images: arrImages,
        });

        console.log("sdfdafsd");
        const productData = await product.save();
        console.log("oeee", productData);

        const fetchCategories = await categoryFromDB.find();
        console.log('categories ' + fetchCategories[0].category_name);

        res.render("addProduct", { categories: fetchCategories, message: "Product added successfully" });
        // res.status(200).send({ success: true, msg: "product details ", data: productData });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};






const loadProductsList = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 4;
  
      const totalCount = await productModel.countDocuments();
      const skip = (page - 1) * limit;
  
      // Modify the query to sort by the creation/update date in descending order
    const productData = await productModel.find()
    .populate("category_id")
    .sort({ updatedAt: -1, createdAt: -1 }) // Sort by update date and then by creation date in descending order
    .skip(skip)
    .limit(limit);

    
    
        // console.log("ppp",productData)
      res.render("productList", {
        product: productData,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit: limit,
      });
    } catch (error) {
      console.log("Error in loading products list: ", error)
     
    
    }
  };




const deleteProduct = async(req,res)=>{

    try {
        const productId = req.query.id
        const deletepro = await Product.findByIdAndUpdate(productId, { isDeleted: true });

        console.log("pro details",deletepro)
        res.redirect('/admin/productList')
        
    } catch (error) {
        console.log("error from deleteProduct", error)
    }
}


const editProduct = async(req,res)=>{

    try {

        const id = req.query.id

        const fetchCategories = await categoryFromDB.find()

        const productData = await productModel.findById({_id:id})
        // console.log(productData)
        if(productData){
            res.render('editProduct', {product:productData , categories : fetchCategories})
        }
        
        
    } catch (error) {
        console.log("error from editProduct ", editProduct)
    }
}


const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const {name,countInStock,color,size,description,price,category_id} = req.body;
        const productImage = await req.files.map(image => image.filename)

  

       

        // constructs an object called updateProduct that will be used to update the product information in a database.
        const updateProduct = {

            ...(name && {name}),
            ...(countInStock && {countInStock}),
            ...(color && {color}),
            ...(size && {size}),
            ...(description && {description}),
            ...(price && {price}),
            ...(productImage.length  > 0 && {images:productImage}),
            ...(category_id && {category_id}),


        }

       
        




      

             


       
        const productData = await productModel.findByIdAndUpdate(
            productId,
            {$set:updateProduct},
            {new:true}
        );


        const productOfferr = await productOfferModel.find({product:productId})
        console.log("prooffer",productOfferr)

        if(productOfferr.length>0){

            const productDis = productOfferr[0].productOffer
      
        
            const disP =price-(productDis/100*price)
            console.log("discounted price",disP)
            productData.productofferPrice=disP
            await productData.save()

        }
        

        


        const categoryOffer = await categoryOfferModel.find({category:category_id})

        if(categoryOffer>0){
            const catDis = categoryOffer[0].categoryOffer
            console.log("category",catDis)
     
     
            const discat =price-(catDis/100*price)
            console.log("discounted price",discat)
            productData.categoryofferPrice=discat
    
            await productData.save()
    

        }
        
      




       
        if (productData) {

            res.redirect('/admin/productList')

            // return res.render('editProduct', { product: productData, categories: fetchCategories, message: 'Product updated successfully' });
        } else {
            // Handle case where product with given ID is not found
            return res.status(404).send('Product not found');
        }
    } catch (error) {
        console.log("Error from updateProduct ", error);
        // Handle other errors as needed
        // return res.status(500).send('Internal Server Error');
    }
};


// deleteimage

const deleteImageee = async(req,res)=>{

    try {

        const productId = req.params.productId;
        const imageName = req.params.imageName;

        console.log("dddd",productId)
        console.log("ima",imageName)
        // res.send("kkk")
        const product = await productModel.findById(productId);
        product.images = product.images.filter(image => image !== imageName);
        await product.save();

        // After deletion, you might want to send a success response
        res.json({ success: true });
        
    } catch (error) {
        
        console.log("error from deleteimage", error)
    }
}



// ---------------------------------------Product offer--------------------------------------------------------


// loading product offer 

const loadProductOffer = async(req,res)=>{

    try {

        const products = await productModel.find()
        


        const offerProductlist = await productOfferModel.aggregate([
            {
                $lookup:{
                    from:"products",
                    foreignField:"_id",
                    localField:"product",
                    as:"productDetails"
                }
            } ,
           {
            $unwind:"$productDetails"
           }
        ])
        // console.log("products are",offerProductlist)
        res.render("loadProductOffer",{products , offerProductlist})
        
    } catch (error) {
        console.log("errror from loadProductOffer",error)
    }
}

const updateProductOffer = async(req,res)=>{
    try {

        const {pro_id,discount}=req.body
        
        console.log("discount",discount)
        const productId =new mongoose.Types.ObjectId(pro_id);
        console.log("pro",productId)

        const existingProOffer = await productOfferModel.findOne({product:pro_id})

        const existingPro= await productModel.findOne({_id:pro_id})
       
        if(!existingProOffer){

          // If there is no existing offer, create a new one
            const newOffer = new productOfferModel({
            product: pro_id,
            productOffer: discount // You can set the default value here, change it accordingly
        });

            // Save the new offer to the database
             await newOffer.save();
        } else {
            // If there is an existing offer, update it with the provided discount
            existingProOffer.productOffer = discount;
            await existingProOffer.save();
           
        }


        const acutalPrice = existingPro.price
        console.log("existingPro price",acutalPrice)

        // discount Price
       
        const disP =acutalPrice-(discount/100*acutalPrice)
        console.log("discounted price",disP)

        existingPro.productofferPrice=disP
        await existingPro.save();
    res.redirect("/admin/offer")

    } catch (error) {
        console.log("error from updateProductOffer",error)
    }
}



const deleteProductOffer = async(req,res)=>{

    try {

        const prooffer = req.query.id
        const proOffeeer = await productOfferModel.findByIdAndDelete({_id:prooffer})

        // updating the "productofferPrice" in the product collection
        const product = proOffeeer.product
        
        const productmo = await productModel.findOneAndUpdate({_id:product}, { $set: { productofferPrice: 0 } })
    
    

        res.redirect('/admin/offer')
        
    } catch (error) {
        console.log("error from updateProductOffer",error)
        
    }
}




module.exports = {
    viewaddProducts,
    addProduct,
    deleteProduct,
    editProduct,
    updateProduct,
    deleteImageee,
    loadProductsList,
    loadProductOffer,
    updateProductOffer,
    deleteProductOffer
    
    
    
}