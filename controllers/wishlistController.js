
const wishdb = require("../models/wishListModel")
const productdb = require("../models/productModel")

const wishlist = async (req, res) => {
    try {
        const currentUser = res.locals.user;

        // Find the wishlist items for the current user
        // const wishData = await wishdb.find({ user: currentUser });
  


          const wishData = await wishdb.aggregate([
            {
              $match: { user: currentUser._id },
            },
            {
              $unwind: "$products", // Unwind the array of items
            },
            {
              $lookup: {
                from: "products", // Assuming your products collection name is "products"
                localField: "products.product_id",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails", // Unwind the array of product details
            },
          ]);
          

        console.log("dsff:",wishData);

        // Render the wishlist template with the wishlist data
        res.render('users/wishlist',{wishData});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}



const addWishlist = async (req, res) => {
    try {
        const currentUser = res.locals.user;
        const productId = req.params.productId;
    console.log("productId",productId)
        // Retrieve product data from the Product model
        const productData = await productdb.findById(productId);
      
        if (!productData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find the user's wishlist document or create a new one if it doesn't exist
        let wishlist = await wishdb.findOne({ user: currentUser });
        if (!wishlist) {
            wishlist = new wishdb({ user: currentUser, products: [] });
        }

        // Check if the product is already in the wishlist
        if (wishlist.products.some(product => product.product_id.equals(productId))) {
            console.log("Product already in wishlist")
            return res.json({ error: 'Product already in wishlist' });

            // return res.redirect('/?error=Product%20already%20in%20wishlist');
        }

        // Add the product to the wishlist and save the changes
        wishlist.products.push({
            product_id: productId
        });
        await wishlist.save();
        console.log("product added")
        res.status(200).json({ success: 'Product added to wishlist!' });
        // res.redirect('/')

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





const removeWishlistItem = async (req, res) => {
    try {
        const currentUser = res.locals.user;
        const productId = req.params.productId;

        // Find the user's wishlist document
        let wishlist = await wishdb.findOne({ user: currentUser });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found for the user' });
        }

        // Check if the product exists in the wishlist
        const index = wishlist.products.findIndex(product => product.product_id.equals(productId));
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found in wishlist' });
        }

        // Remove the product from the wishlist
        wishlist.products.splice(index, 1);

        // Save the updated wishlist
        await wishlist.save();

        // res.status(200).json({ success: true, message: 'Product removed from wishlist' });
        res.redirect('/')
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    wishlist,
    addWishlist,
    removeWishlistItem

}