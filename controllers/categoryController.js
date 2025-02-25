const categoryModel = require('../models/categoryModel')
const categoryOfferModel = require('../models/categoryOfferModel')
const multer = require('multer')

const mongoose = require('mongoose')

const sharp = require('sharp');
const productModel = require('../models/productModel');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/categoryUploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });



const loadCategoriesMiddleware = async (req, res,next) => {
    try {
      const categoryData = await categoryModel.find({});
      res.locals.category = categoryData;
      // console.log(res.locals.category)
      next()
      
    } catch (error) {
      console.log("error from loadCategoriesMiddleware" ,error);
      next(error)
    }
  };




const addCategory = (req,res)=>{

    res.render("addCategory")
}


const insertCategory = async(req,res)=>{


    try {
        
        
        const {category_name }= req.body

        const categoryImage = req.file; 

        

        console.log("cate imfdf",categoryImage)

        const existCategory = await categoryModel.findOne({
            category_name: { $regex: new RegExp(`^${category_name}$`, 'i') },
        })

        if(existCategory){
            res.render('addCategory' , {message :"category already exists"})
        }
        else{
           

            // Use sharp to resize and crop the category image
            const croppedBuffer = await sharp(categoryImage.path)
                .resize({ width: 306, height: 408, fit: sharp.fit.cover })
                .toBuffer();

            const filename = `cropped_${categoryImage.originalname}`;

            // Save the cropped category image
            await sharp(croppedBuffer).toFile(`uploads/categoryUploads/${filename}`);

            const newCategory = new categoryModel({
                category_name: category_name,
                category_image: filename, // Save the cropped image filename
                
            });

            await newCategory.save();
            console.log("category is: ", newCategory);
            res.render('addCategory', { message: "Category Uploaded" });





        }

       

    } catch (error) {
        console.log(error)
        
    }
}



const viewCategory = async(req,res)=>{


    try {
        
    const fetchAllCategories = await categoryModel.find().sort({ createdAt: -1 , updatedAt: -1})

        
    res.render("category" , {categories:fetchAllCategories})
        
    } catch (error) {

        console.log(error);
        res.status(500).send('Internal Server Error');
        
    }

}






const unlistCategory = async (req, res) => {
    try {
      let id = req.params.id
      const categoryData = await categoryModel.findByIdAndUpdate({ _id: id }, {$set: {isDeleted: true}})

      res.json({ success: true, message: 'Category is unlisted' });

    //   res.redirect('/admin/category')
    } catch (error) {
      console.log("Error in unlisting category: ", error)
    
    }
  }
  
  const listCategory = async (req, res) => {
    try {
      let id = req.params.id
      const categoryData = await categoryModel.findByIdAndUpdate({ _id: id }, {$set: {isDeleted: false}})
      res.json({ success: true, message: 'Category is listed' });
     
    } catch (error) {
      console.log("Error in listing category: ", error)
      
    }
  }











// const deleteCategory = async(req,res)=>{

//     try {
//         const categoryId = req.query.id
//         const deletecat = await categoryModel.findByIdAndUpdate(categoryId, { isDeleted: true });

//         console.log("delteted cat details",deletecat)
//         res.redirect('/admin/category')
        
//     } catch (error) {
//         console.log("error from deleteProduct", error)
//     }
// }

const editCat = async (req, res) => {
    try {
        const id = req.query.id;
        const fetchCategories = await categoryModel.findById({ _id: id });

        if (fetchCategories) {
            res.render('editCategory', { category: fetchCategories });
        } else {
            res.status(404).send('Category not found');
        }
    } catch (error) {
        console.log("Error from editCat: ", error);
        res.status(500).send('Internal Server Error');
    }
};


// const updateCat = async (req, res) => {
//     try {
//         const categoryId = req.params.id;
        
    

//         const {category_name }= req.body

//         const categoryImage = req.file; 

//         const {categoryOffer} = req.body


        
//         console.log("offfff",categoryOffer)
//         const updateCat = {

//             ...(category_name && {category_name}),
//             ...(categoryImage && { category_image: categoryImage.filename }),
//             ...(categoryOffer && {categoryOffer}),
//         }

      

//         const fetchCategories = await categoryModel.findByIdAndUpdate(

//             categoryId,
//             {$set:updateCat},
//             {new:true}
//         )
       
       
//         if (fetchCategories) {
//             res.redirect('/admin/category')

    
//         } else {
//             // Handle case where product with given ID is not found
//             return res.status(404).send('category not found');
//         }
//     } catch (error) {
//         console.log("Error from updateProduct ", error);
//         // Handle other errors as needed
//         return res.status(500).send('Internal Server Error');
//     }
// };


const updateCat = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { category_name } = req.body;
        const categoryImage = req.file;
        

        const updateCat = {
            ...(category_name && { category_name }),
            ...(categoryImage && { category_image: categoryImage.filename })
            
        };

        // Fetch the category before update
        const oldCategory = await categoryModel.findById(categoryId);

        // Update the category
        const fetchCategories = await categoryModel.findByIdAndUpdate(
            categoryId,
            { $set: updateCat },
            { new: true }
        );

        // If the update is successful
        if (fetchCategories) {
           
           

            // Redirect to the category page
            res.redirect('/admin/category');
        } else {
            // Handle case where the category with the given ID is not found
            return res.status(404).send('Category not found');
        }
    } catch (error) {
        console.log('Error from updateCategory', error);
        // Handle other errors as needed
        // return res.status(500).send('Internal Server Error');
    }
};





// ----------------------------category offer---------------------


// load offerPage
const categoryOffer = async(req,res)=>{

    try {

        const category = await categoryModel.find()

        const offerCategorylist = await categoryOfferModel.aggregate([
            {
                $lookup:{
                    from:"categories",
                    foreignField:"_id",
                    localField:"category",
                    as:"categoryDetails"
                }
            } ,
           {
            $unwind:"$categoryDetails"
           }
        ])
        // console.log("categories are",offerCategorylist)



        res.render("loadCategoryOffer",{category , offerCategorylist})
        
    } catch (error) {
        console.log("error from categoryOffer",error)
    }
}



const updateCategoryOffer = async(req,res)=>{
    try {

        const {cat_id,discount}=req.body
        
        // console.log("discount",discount)
        const catId =new mongoose.Types.ObjectId(cat_id);
        console.log("cat",catId)

        const existingCatOffer = await categoryOfferModel.findOne({category:cat_id})

        const products = await productModel.find({category_id:cat_id})
        for(let i=0 ; i<products.length;i++){
            console.log("products",products[i].price)
        }
        
        if(!existingCatOffer){

          // If there is no existing offer, create a new one
            const newOffer = new categoryOfferModel({
                category: cat_id,
                categoryOffer: discount // You can set the default value here, change it accordingly
        });

            // Save the new offer to the database
             await newOffer.save();
        } else {
            // If there is an existing offer, update it with the provided discount
            existingCatOffer.categoryOffer = discount;
            await existingCatOffer.save();
        }


        // discount price

        for(let i=0 ; i<products.length;i++){
            console.log("products",products[i].price)


            const disP =products[i].price-(discount/100*products[i].price)
            console.log("discounted price",disP)
    
            products[i].categoryofferPrice=disP
            await products[i].save();
        }


    res.redirect("/admin/catoffer")

    } catch (error) {
        console.log("error from updateCategoryOffer",error)
    }
}



const deleteCatOffer = async(req,res)=>{

    try {

        const catoffer = req.query.id
        const catOffeeer = await categoryOfferModel.findByIdAndDelete({_id:catoffer})
        
        // updating the "productofferPrice" in the product collection
        const category = catOffeeer.category
        
        const productmo = await productModel.findOneAndUpdate({category_id:category}, { $set: { categoryofferPrice: 0 } })
        
      

        res.redirect('/admin/catoffer')
        
    } catch (error) {
        console.log("error from deleteCatoffer",error)
        
    }
}




module.exports={
    addCategory,
    insertCategory,
    upload,
    viewCategory,
  
    editCat,
    updateCat,
    loadCategoriesMiddleware,
    categoryOffer,
    updateCategoryOffer,
    deleteCatOffer,
    listCategory,
    unlistCategory

}