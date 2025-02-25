const productModel = require('../models/productModel')

const userModel = require('../models/userModel')

const cartModel = require('../models/cartModel')



const axios = require('axios')

// loading cart page

  

const loadCart = async (req, res) => {
  try {

    const currentUser = res.locals.user;
    delete req.session.couponPrice
    console.log("req.session.couponPrice",req.session.couponPrice)
    if (!currentUser) {
      return res.redirect('/login'); // Redirect to login if not logged in
    }
// console.log("cartt",currentUser)
    const cartDetails = await cartModel.aggregate([
      {
        $match: { user_id: currentUser._id },
      },
      {
        $unwind: "$items", // Unwind the array of items
      },
      {
        $lookup: {
          from: "products", // Assuming your products collection name is "products"
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails", // Unwind the array of product details
      },
      {
        $match:{'productDetails.isDeleted':false}
      }
    ]);

    // console.log("cartdetaails" , cartDetails)
    

    if (!cartDetails || cartDetails.length === 0) {
      // If the cart is empty, send 0 as the totalAmount
      return res.render("users/cart", { cartDetails: { items: [], productDetails: [], totalAmount: 0 ,counponPrice:0} });
    }

    // Calculate the total amount based on the items in the cart
    // const totalAmount = cartDetails.reduce((total, item) => {
    //   return total + item.items.quantity * item.productDetails.price;
    // }, 0);


       // Calculate the total amount based on the items in the cart
       const totalAmount = cartDetails.reduce((total, item) => {
        // Check if countInStock is greater than zero before including in totalAmount calculation

        const itemPrice = item.productDetails.offerPrice || item.productDetails.price;

        if (item.productDetails.countInStock > 0) {
          // return total + item.items.quantity * item.productDetails.price;
                  return total + item.items.quantity * itemPrice;

        }
        return total;
      }, 0);

      // console.log("tottalddddd",totalAmount)

    res.render("users/cart", { cartDetails, totalAmount });

  } catch (error) {
    console.log("error in loadCart", error);
    res.status(500).render("error"); // Render an error page
  }
};



  








const addProduct = async (req, res) => {
  try {
    const currentUser = res.locals.user;

    if (!currentUser) {
      // return res.status(401).json({ message: "User not logged in" });
      return res.redirect('/login');
    }

    const productId = req.params.id;
    const productData = await productModel.findById({ _id: productId });

    let userCart = await cartModel.findOne({ user_id: currentUser._id });

    if (!userCart) {
      userCart = new cartModel({
        user_id: currentUser._id,
        items: [],
        totalPrice: 0, // Initialize the total price
        counponPrice:0
      });
    }

    const existingProductIndex = userCart.items.findIndex((item) =>
      item.product_id.equals(productId)
    );

    // choosing the price based on offer
    var carttotal
    if(productData.categoryofferPrice==0 && productData.productofferPrice==0){

      carttotal=productData.price
     }
     else if(productData.categoryofferPrice>0 && productData.productofferPrice>0){
       const price = productData.price;
       const categoryofferPrice = productData.categoryofferPrice;
       const productofferPrice = productData.productofferPrice;
   
       // Find the smallest value among the prices
       carttotal = Math.min(price, categoryofferPrice, productofferPrice);

     }
     else{

       const nonZeroPrices = [productData.price, productData.categoryofferPrice, productData.productofferPrice].filter(price => price > 0);
       carttotal = Math.min(...nonZeroPrices);
     }

     console.log("Total Amount:", carttotal);
    //  price choosing done


     if (existingProductIndex !== -1) {
      userCart.items[existingProductIndex].quantity += 1;
  
      // Check if countInStock is zero for the added product
      if (productData.countInStock > 0) {

        userCart.totalPrice +=carttotal
      
      
    
     



      }







      // if (productData.countInStock > 0) {
      //     // Check if there is an offer price
      //     if (productData.offerPrice) {
      //         // Check if offer price is less than the regular price
      //         if (productData.offerPrice < productData.price) {
      //             // Update the total price based on the offer price
      //             userCart.totalPrice += productData.offerPrice;
      //         } else {
      //             // Update the total price based on the regular price
      //             userCart.totalPrice += productData.price;
      //         }
      //     } else {
      //         // No offer price, update the total price based on the regular price
      //         userCart.totalPrice += productData.price;
      //     }
      // }
  } else {
      // Check if countInStock is zero for the new product
      if (productData.countInStock > 0) {
          // if the product is not in the cart, push that product to the cart


          userCart.items.push({
              product_id: productId,
              quantity: 1,
              // price: productData.offerPrice ? productData.offerPrice : productData.price,
              price:carttotal
          });
  
          // Update the total price for a new product based on offer price if available
          userCart.totalPrice += carttotal;
      }
  }
  




    await userCart.save();

    console.log('Product added to the cart successfully.');

    res.redirect('/cart');

  } catch (error) {
    console.log("error from addProduct", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};










const removeProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const currentUser = res.locals.user;

    const userCart = await cartModel.findOne({ user_id: currentUser._id });

    if (!userCart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }


    // It looks for the product to be removed in the user's cart based on the provided product ID.
    const removedProduct = userCart.items.find(item => item.product_id.toString() === productId);

    // Checking if Product Exists in the Cart:
    if (!removedProduct) {
      return res.status(404).json({ error: 'Product not found in the cart.' });
    }

    // Subtract the price of the removed product from the total price
    userCart.totalPrice -= removedProduct.quantity * removedProduct.price;

    // Remove the product from the cart
    userCart.items = userCart.items.filter(item => item.product_id.toString() !== productId);

    // Save the updated cart
    const updatedCart = await userCart.save();

    // Optionally, you can send the updated cart back to the client
    res.redirect('/cart');
    // res.status(200).json({ userCart: updatedCart, message: 'Product removed from the cart successfully.' });
  } catch (error) {
    console.log('Error in removeProduct:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};







const updateQuantity = async (req, res) => {

  // extracts the productId and adjustment values from the request body.
  const { productId, adjustment } = req.body;

  try {
    // Find the user's cart
    const currentUser = res.locals.user;
    let userCart = await cartModel.findOne({ user_id: currentUser._id });
    console.log("pod",productId)


    const pro = await productModel.findOne({_id:productId})
    console.log("kkk",pro)
    const totalCount = pro.countInStock
    console.log("stock",totalCount)
    // If the cart doesn't exist, create a new one and initialize the total price
    if (!userCart) {
      userCart = new cartModel({
        user_id: currentUser._id,
        items: [],
        totalPrice: 0, // Initialize the total price
        counponPrice:0
      });
    }

    // Find the item in the cart with the given productId
    const itemIndex = userCart.items.findIndex(item => String(item.product_id) === productId);


    if (itemIndex !== -1) {
      // Get the original quantity and price of the item
      const originalQuantity = userCart.items[itemIndex].quantity;
      const pricePerUnit = userCart.items[itemIndex].price;

      // Update the quantity
      // userCart.items[itemIndex].quantity += parseInt(adjustment, 10);


  // Update the quantity only if quantity + adjustment is less than or equal to totalCount
  const newQuantity = userCart.items[itemIndex].quantity + parseInt(adjustment, 10);
  userCart.items[itemIndex].quantity = Math.min(newQuantity, totalCount);
  console.log("new quant",newQuantity)


      // Ensure the quantity is not negative
      if (userCart.items[itemIndex].quantity < 1) {
        userCart.items[itemIndex].quantity = 1;
      }

      // Calculate the change in quantity
      const quantityChange = userCart.items[itemIndex].quantity - originalQuantity;
      console.log("wa",quantityChange)



      
      // Update countInStock in the productModel based on the adjustment
    




      // Update the total price based on the change in quantity
      userCart.totalPrice += quantityChange * pricePerUnit;


      

      // Save the updated cart
      const updatedCart = await userCart.save();

      // Calculate the total amount for the updated cart
      const totalAmount = userCart.items.reduce((total, item) => {
        return total + item.quantity * item.price;
      }, 0);
      console.log("torgsdds",totalAmount)

  

      // Send the updated cart and total amount back to the client
      res.status(200).json({ userCart: updatedCart, totalAmount, totalCount, message: 'Quantity updated successfully.' });
    } else {
      res.status(404).json({ error: 'Product not found in the cart.' });
    }

  } catch (error) {
    console.log("error from updateQuantity", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};










module.exports = {
    loadCart,
    addProduct,
    removeProduct,
    updateQuantity,

   
   
}