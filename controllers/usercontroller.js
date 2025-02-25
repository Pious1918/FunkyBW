const userModel = require("../models/userModel");

const categoryFromDb = require("../models/categoryModel")

const productFromDb = require("../models/productModel")
const mongoose = require('mongoose');
const addressModel = require('../models/addressModel')

const { ObjectId } = mongoose.Types;
const bannerModel = require('../models/bannerModel')
const shortid = require('shortid')
const Otpmodel = require('../models/otpModel')
const walletModel = require('../models/walletModel')
const nodemailer = require("nodemailer");
const razorpay = require('razorpay')
const coupondb = require('../models/couponModel')
const couponCart = require("../models/appliedCoupon")
const mailgen = require("mailgen");
const referalmodel = require("../models/referralModel")

// const bcrypt = require("bcrypt");


const jwt = require("jsonwebtoken");
const { createTokens, validateToken } = require("../JWT");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");

const wishdb = require("../models/wishListModel")

const securePassword = async(password)=>{

  try {

    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash 

  } catch (error) {
      
      console.log(error.message)
  }
}


// loading the homepage
const homeLoad = async (req, res) => {
  try {
    const categoryDetails = await categoryFromDb.find()

    


    const productDetails = await productFromDb.find()




    const bannerdetails = await bannerModel.find()
    const wishlist = await wishdb.findOne();
    res.render("index" , {categories : categoryDetails , products : productDetails , banner:bannerdetails , wishlist:wishlist} )


  } catch (error) {
    console.log(error.message);

  }
};

// loading registration form

const registerLoad = async (req, res) => {
  try {

   
  
    res.render("register",{req});
  } catch (error) {
    console.log(error);
  }
};

let gname, gpassword, gemail, gmobile;

var otp;



const otpgenerator = () => {
  const generatedOtp = Math.random();
  const formattedOtp = parseInt(generatedOtp * 1000000);
  console.log(formattedOtp);
  return formattedOtp;
};

// user signup

const signup = async (req, res) => {

 
  try {
    
    const q = req.body.refId;
    console.log("iddd",q);

    req.session.reffId = q;

    console.log("session",req.session.reffId);


    (gname = req.body.name),
      (gemail = req.body.email),
      (gpassword = req.body.password),
      (gmobile = req.body.mobile);

    const existuser = await userModel.findOne({ email: gemail });
    if (existuser) {
      res.render("register" , {req,message:"email already existing"});
    }
    // gpassword = await securePassword(req.body.password)

    otp = otpgenerator();
    sendOtp(gemail, otp);

    const newotp = new Otpmodel({
      email: gemail,
      otp: otp,
    })
    await newotp.save()
    res.render("otp",{error:""});
  } catch (error) {
    console.log(error);
  }
};

function sendOtp(email, OTP) {
  let config = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  };

  const transport = nodemailer.createTransport(config);

  let MailGenerator = new mailgen({
    theme: "default",
    product: {
      name: "Mailgen",
      link: "http://mailgen.js/",
    },
  });

  let response = {
    body: {
      name: `${email}`,
      intro: `Yoour OTP is ${otp}`,
      outro: "Looking forward",
    },
  };
  let mail = MailGenerator.generate(response);

  let message = {
    from: process.env.EMAIL,
    to: email,
    subject: "Otp sent successfully",
    html: mail,
  };
  transport.sendMail(message);
}


const resentOtp = async (req, res) => {
  try {
   otp = otpgenerator();
    console.log(otp); 

    // Update the existing OTP record in the Otp collection with the new OTP and a new expiry time
    const updatedOtp = await Otpmodel.findOneAndUpdate(
      { email: gemail },
      { otp: otp , 
        expiry: new Date(Date.now() + 300000) }, 
      { new: true }
    );

    if (updatedOtp) {
      sendOtp(gemail, otp);
      res.render("otp",{error});
    } else {
      res.render("otp", { error: "Failed to update OTP. Please try again." });
    }
  } catch (error) {
    console.log(error);
    // res.status(500).json({ message: "Internal server error" });
  }
};


const verifyotp = async (req, res) => {
  const entereotp = req.body.otp;

  console.log("session",req.session.reffId)
  if (entereotp == otp) {
    const user = new userModel({
      name: gname,
      email: gemail,
      password: gpassword,
      mobile: gmobile,
      referralLink:shortid.generate()
    });
    // console.log(user);
    
    const userData = await user.save();

    await userModel.updateOne({ _id: userData._id }, { $set: { isOnline: true } });
    const token = createTokens(userData._id);
    console.log("accesss token is : " + token);
    res.cookie("access-token", token, {
      maxAge: 60 * 60 * 24 * 30 * 1000,
      httpOnly: true,
    });


    // adding amount in the wallet of both referredUser and one who used the link
    const referredUser = await userModel.findOne({referralLink:req.session.reffId})
    const referalOffer = await referalmodel.find()

    if (referredUser) {

      const refferdWallet = await walletModel.findOneAndUpdate(
        { user: referredUser._id },
        { $inc: { balance: +referalOffer[0].refferalBonus } }, // Assuming referalOffer is an array and you want the first element
        { new: true } // This option returns the modified document
      );
      const newTransaction = {
        amount: referalOffer[0].refferalBonus, // Negative amount indicates withdrawal
        description: 'refferalbonus', // Indicate that this is a withdrawal
        createdAt: new Date()
      };
  
      // Push the new transaction into the transactions array
      refferdWallet.transactions.push(newTransaction);

      await refferdWallet.save();

      const  userWallet = new walletModel({
        user: userData._id ,
        balance: referalOffer[0].signupBonus,
        transactions: []
        });

        const cashCredited = {
          amount: referalOffer[0].signupBonus, // Negative amount indicates withdrawal
          description: 'Sign-Up bonus', // Indicate that this is a withdrawal
          createdAt: new Date()
        };
    
        // Push the new transaction into the transactions array
        userWallet.transactions.push(cashCredited);
  
        await userWallet.save()

    }
  
    const  userWallet = new walletModel({
      user: userData._id ,
      balance: 0,
      transactions: []
      });

      await userWallet.save()
    

    if (userData) {
      res.redirect("/login");
    } else {
      res.render("register", { message: "registration failed" });
    }
  }

  else {
    // OTP is incorrect, show console log
    console.log("Incorrect OTP entered");
    res.render("otp", { error: "Incorrect OTP entered. Please try again." });
    // You can add further handling here if needed
}
};





// loading of the login page
const loginload = (req, res) => {
  if (req.cookies["access-token"]) {
    console.log("authenticated");
    res.redirect("/");
  } else {
    

    res.render("login");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;

    const password = req.body.password;
    console.log("emaill iss",email)

    const userData = await userModel.findOne({ email: email });

    if (userData) {
      const passwordMatch = password == userData.password;
      if (passwordMatch) {
        // req.session.home=userData._id;
        // res.status(200)


        await userModel.findByIdAndUpdate(
          { _id: userData._id },
          { $set: { isOnline: true } }
        );

        const accesstoken = createTokens(userData);
        console.log("accesss token is : " + accesstoken);
        res.cookie("access-token", accesstoken, {
          maxAge: 60 * 60 * 24 * 30 * 1000,
          httpOnly: true,
        });
        if(userData.isblocked ===false){

          res.redirect("/");
          console.log("logged in");
        }else{
          res.render('login' ,{message:"You are blocked"})
          console.log("You are blocked")
        }

        

     
      } else {
        res.render("login", { message: "password is incorrect" });

        console.log("wrong crede");
        res.json("wrong credentials");
      }
    } else {
      res.render("login", { message: "User login is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// forget Password

const forget = async(req,res)=>{

  try {

    res.render("enterEmail")
    
  } catch (error) {
    console.log("error from forget",error)
  }
}


const typedEmail = async(req,res)=>{

  try {
    
    gemail = req.body.email
    const userData = await userModel.findOne({email:gemail})
    console.log("user",gemail)


    if(userData){
      
    otp = otpgenerator();
    sendOtp(gemail, otp);

    const newotp = new Otpmodel({
      email: gemail,
      otp: otp,
    })
    await newotp.save()
    res.render("newPassOtp");

    }else{
      
      res.render("enterEmail",{message:"wrong email"});
    }

  } catch (error) {
    console.log("error from typedEmail",error)
  }
}

// to type password

const newPass = async(req,res)=>{

  try {

    const enterotp =req.body.otp;
    if(enterotp==otp){
    
    res.render("newPass")
    }else{

      res.render("newPassOtp",{message:"wrong otp"});
    }

  } catch (error) {
    console.log("error from newPasss",error)
  }
}


const confiPass = async(req,res)=>{

  try {

    const {newpass,confpass} = req.body

    if(newpass===confpass){

      const userData = await userModel.findOne({email:gemail})

      if(userData){
        userData.password = confpass
        
        const updatedUser = await userData.save();

        console.log('updateuser:',updatedUser)

        if (updatedUser) {
          res.json({ success: true, message: 'updated' });
          
        } else {
            res.render('newPassword', { message: "Error updating password" });
        }
      }

     
    }else{
      console.log("diff pass")
    }
    
  } catch (error) {
    console.log("error from confiPass",error)
  }
}









const userdashLoad = (req, res) => {
  const currentUser = res.locals.user;
 

  const name = currentUser.name
  console.log(name)
  if (req.cookies["access-token"]) {
    res.render("dashboard",{name});
  } else {
    res.redirect("/");
  }
};

const logout = async (req, res) => {

  const currentUser = res.locals.user;

  if (currentUser) {
    // Update isOnline to false
    await userModel.findByIdAndUpdate(
      { _id: currentUser._id },
      { $set: { isOnline: false } }
    );
  }


  res.cookie("access-token", "", {
    maxAge: 1,
  });

  res.redirect("/");
  console.log("bye bye user . Meet you soon!!");
};




const productDetailsLoad = async(req,res)=>{

  try {

    const productId = req.params.productId
  
    const fetchedProduct = await productFromDb.findOne({ _id: productId });
    console.log("pro id ",productId)
    console.log("pr issss: ",fetchedProduct)

    const category = await categoryFromDb.findById(fetchedProduct.category_id)
    console.log("catt",category.categoryOffer)


    // choosing the price based on offer
    var carttotal
    if(fetchedProduct.categoryofferPrice==0 && fetchedProduct.productofferPrice==0){

      carttotal=fetchedProduct.price
     }
     else if(fetchedProduct.categoryofferPrice>0 && fetchedProduct.productofferPrice>0){
       const price = fetchedProduct.price;
       const categoryofferPrice = fetchedProduct.categoryofferPrice;
       const productofferPrice = fetchedProduct.productofferPrice;
   
       // Find the smallest value among the prices
       carttotal = Math.min(price, categoryofferPrice, productofferPrice);

     }
     else{

       const nonZeroPrices = [fetchedProduct.price, fetchedProduct.categoryofferPrice, fetchedProduct.productofferPrice].filter(price => price > 0);
       carttotal = Math.min(...nonZeroPrices);
     }

     console.log("Total Amount:", carttotal);
    //  price choosing done






    res.render("productDetails" , { productDetails: { productId, fetchedProduct, category ,carttotal}})
    
  } catch (error) {
    console.log("error form productDetailsLoad", error)
  }
}


// address page load



const addressPage = async (req, res) => {
  try {
    const currentUser = res.locals.user;

    // Fetch user's addresses from the database
    const userAddresses = await addressModel.findOne({ user_id: currentUser._id });

    // If no user addresses are found, create an empty array
    const addresses = userAddresses ? userAddresses.addresses : [];

    // Pass the addresses to the rendering of the "address" page
    res.render("address", { userAddresses: addresses });

  } catch (error) {
    console.log("error from addresspage", error);
    // Handle the error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





// loading addAddress page

const addAddress = async(req,res)=>{
  try {

    res.render('newAddress')
    
  } catch (error) {
    

    console.log("error from add address",error)
  }
}

// adding info to address



const giveAdd = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    let userAddress = await addressModel.findOne({ user_id: currentUser._id });

    // if no useraddress it will create one
    if (!userAddress) {
      userAddress = new addressModel({
        user_id: currentUser._id,
        addresses: [], // An array to store user addresses
      });
    }

    // Add a new address (assuming address details are present in the request body)
    const newAddress = {
      name: req.body.name,
      mobileNo: req.body.mobileNo,
      pinCode: req.body.pinCode,
      address: req.body.address,
      localityTown: req.body.localityTown,
      city: req.body.city,
      state: req.body.state,
      // Add any other fields you might have, like extra mobile number
      extraMobileNo: req.body.extraMobileNo,
      defaultAddress: req.body.defaultAddress === 'true',
    };

    // If the new address is set as default, update the existing default address
    if (newAddress.defaultAddress) {
      // Find the existing default address index
      const existingDefaultAddressIndex = userAddress.addresses.findIndex((addr) => addr.defaultAddress);

      if (existingDefaultAddressIndex !== -1) {
        // Remove existing default address from the array
        const [existingDefaultAddress] = userAddress.addresses.splice(existingDefaultAddressIndex, 1);
        // Update existing default address
        existingDefaultAddress.defaultAddress = false;
        // Add the updated default address to the top of the array
        userAddress.addresses.unshift(existingDefaultAddress);
      }
    }

    // Add the new address to the array
    userAddress.addresses.push(newAddress);

    // Save the updated userAddress document
    await userAddress.save();

     // Determine the redirect URL based on the referer header
     const referer = req.headers.referer;
     console.log("refff",referer)

    if (referer && referer.includes('/checkout')) {
      // If the request is coming from the checkout page, redirect to checkout
      res.redirect('/checkout');
    } else {
      // Otherwise, redirect to the address page
      res.redirect('/address');
    }

    // Handle the response or redirect as needed
    // res.redirect('/address');
    // or
    // res.status(200).json({ message: 'Address added successfully' });
  } catch (error) {
    console.log('error from giveAdd', error);
    // Handle the error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




// loading of editAddress page



const loadEditAdd = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    console.log("currentUser",currentUser)
    const addressId = req.query.addressId;

    const userAddress = await addressModel.findOne({ user_id: currentUser._id });
    const editAddress = userAddress.addresses.find((address) => address._id.toString() === addressId);

    // console.log("user id idd :::", userAddress);
    // console.log("edit add is ::", editAddress);

    res.render('editAddress', { userAddress, editAddress });

  } catch (error) {
    console.log("error from loadEditAdd", error);
  }
}


// Updation of the address


const updateAddress = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    const addressId = req.params.addressId;

    // Find the user's address document
    const userAddress = await addressModel.findOne({ user_id: currentUser._id });

    // Find the index of the address to be updated
    const addressIndex = userAddress.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    // Check if the addressId is a valid ObjectId and if the address is found
    if (!ObjectId.isValid(addressId) || addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Create the update object using $set
    const updateObject = {
      $set: {
        'addresses.$.name': req.body.name,
        'addresses.$.mobileNo': req.body.mobileNo,
        'addresses.$.pinCode': req.body.pinCode,
        'addresses.$.address': req.body.address,
        'addresses.$.localityTown': req.body.localityTown,
        'addresses.$.city': req.body.city,
        'addresses.$.state': req.body.state,
        'addresses.$.extraMobileNo': req.body.extraMobileNo,
        'addresses.$.defaultAddress': req.body.defaultAddress === 'true',
      },
    };

    // If the updated address is set as default and it was not the default before, update the existing default address
    if (req.body.defaultAddress === 'true') {
      // Find the previous default address
      const previousDefaultAddress = userAddress.addresses.find((address) => address.defaultAddress && address._id.toString() !== addressId);

      // If there was a previous default address, set it to false
      if (previousDefaultAddress) {
        previousDefaultAddress.defaultAddress = false;
      }

      // Ensure the default address is at the top of the array
      userAddress.addresses = [
        userAddress.addresses[addressIndex],
        ...userAddress.addresses.filter((addr, idx) => idx !== addressIndex && !addr.defaultAddress),
      ];

      // Save the updated userAddress document
      await userAddress.save();
    } else {
      // If the user sets the defaultAddress to false, check if it was the previous default
      const previousDefaultAddress = userAddress.addresses.find((address) => address.defaultAddress);
      if (previousDefaultAddress && previousDefaultAddress._id.toString() === addressId) {
        // If yes, set it to false
        previousDefaultAddress.defaultAddress = false;
      }
    }

    // Update the address using $set
    await addressModel.updateOne({ 'user_id': currentUser._id, 'addresses._id': addressId }, updateObject);

    // Redirect or send a response as needed
    res.redirect('/address');
    // or
    // res.status(200).json({ message: 'Address updated successfully' });
  } catch (error) {
    console.log('error from updateAddress', error);
    // Handle the error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// remove addresss
const removeAddress = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    const addressId = req.params.addressId;

    // Find the user's address document
    const userAddress = await addressModel.findOne({ user_id: currentUser._id });

    // Find the index of the address to be removed
    const addressIndex = userAddress.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    // Check if the addressId is a valid ObjectId and if the address is found
    if (!ObjectId.isValid(addressId) || addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Check if the address to be removed is the default address
    const isDefaultAddress = userAddress.addresses[addressIndex].defaultAddress;

    // Remove the address from the array
    userAddress.addresses.splice(addressIndex, 1);

    // If the removed address was the default, handle setting a new default
    if (isDefaultAddress) {
      // Check if there are remaining addresses
      if (userAddress.addresses.length > 0) {
        // Set the first address as the new default
        userAddress.addresses[0].defaultAddress = true;
      }
    }

    // Save the updated userAddress document
    await userAddress.save();

    // Redirect or send a response as needed
    res.redirect('/address');
    // or
    // res.status(200).json({ message: 'Address removed successfully' });
  } catch (error) {
    console.log('error from removeAddress', error);
    // Handle the error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
};













// profile page 

const profilePage = (req,res)=>{
  try {


    const currentUser = res.locals.user;
    
    res.render("userProfile" , {currentUser})
    
  } catch (error) {
    console.log("error from profilepage", error)
  }
}



// edit profile page load


const editProfileload = async(req,res)=>{

  try {

    const currentUser = res.locals.user;
  
    res.render("editProfile" , {currentUser})
    
  } catch (error) {
    console.log("error from editProfileload", error)
  }
}

// updating user info

const editprofile = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    console.log('Current User ID:', currentUser._id);


    const userdetails = await userModel.findOne({ _id: currentUser._id });

    if (userdetails) {
      // Update the user details
      await userModel.findOneAndUpdate(
        { _id: currentUser._id },
        {
          $set: {
            name: req.body.name,
            mobileNo: req.body.mobile,
            email: req.body.email,
            // Add other fields as needed
          },
        },
        { new: true } // Returns the updated document
      );
      console.log('Request Body:', req.body);
      res.redirect('/profile')
      // res.status(200).json({ message: 'User details updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.log('error from editprofile', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Change password

// password page load

const passPageLoad = (req,res)=>{
  try {

    res.render('editPassword')
    
  } catch (error) {
    console.log("error from passPageLoad" , error)
  }
}

// const editPass = async(req,res)=>{

//   try {
//     const currentUser = res.locals.user;
//     console.log('Current User ID:', currentUser._id);
//     const userdetails = await userModel.findOne({ _id: currentUser._id });

//     if (userdetails) {
//       // Update the user details


      
//       if (userdetails.password === req.body.old) {


//         console.log("userdetails.password",userdetails.password)
//         console.log("req.body.old",req.body.old)
//       await userModel.findOneAndUpdate(
//         { _id: currentUser._id },
//         {
//           $set: {
//             password: req.body.conew
          
//             // Add other fields as needed
//           },
//         },
//         { new: true } // Returns the updated document
//       );
//       console.log('Request Body:', req.body);
//       res.redirect('/profile')
//       // res.status(200).json({ message: 'User details updated successfully' });
//     }} else {
//       res.status(404).json({ error: 'User not found' });
//     }
    
    
//   } catch (error) {
//     console.log("error from editPass" , error)
//   }
// }
const editPass = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    console.log('Current User ID:', currentUser._id);
    const userdetails = await userModel.findOne({ _id: currentUser._id });

    if (userdetails) {
      // Check if the old password matches the password stored in the database
      if (userdetails.password !== req.body.old) {
        console.log('Typed password does not match the stored password');
        return res.status(400).json({ error: 'Old password does not match the stored password' });
      }


      if(req.body.conew==req.body.new){
  // Update the user details
  await userModel.findOneAndUpdate(
    { _id: currentUser._id },
    {
      $set: {
        password: req.body.conew,
        // Add other fields as needed
      },
    },
    { new: true } // Returns the updated document
  );

  console.log('Request Body:', req.body);
  res.redirect('/profile');
  // res.status(200).json({ message: 'User details updated successfully' });



      }else{
        console.log("mismatched passwords")
        return res.status(400).json({ error: 'Mismatch in new password and confirm password' });
      }

    
    } else {
      res.status(404).json({ error: 'User not found' });
    
      
    }
  } catch (error) {
    console.log('Error from editPass', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// user couponss

const userCoupon = async(req,res)=>{


  try {

    const currentUser = res.locals.user;
    
    const availablecoupons= await coupondb.find()

    
    res.render("coupons",{availablecoupons})
    
  } catch (error) {
    
    console.log("error from userCoupon",error)
  }
}

// user Wallet
var amount
const wallet = async(req,res)=>{

  try {

    const currentUser = res.locals.user;
   

    // Find the user's wallet
    let userWallet = await walletModel.findOne({ user: currentUser._id });

    res.render("wallet",{userWallet ,amount})
    
  } catch (error) {
    console.log("error from wallet",error)
  }
}

console.log("amount from usercontroller",amount)

const addMony = async (req, res) => {
  try {
    const currentUser = res.locals.user;
     amount = req.body.amount;
    console.log("tot",amount)
    // Find the user's wallet or create a new one if it doesn't exist
    let userWallet = await walletModel.findOne({ user: currentUser._id });

    if (!userWallet) {
      userWallet = new walletModel({
        user: currentUser._id,
        balance: 0,
        transactions: []
      });
    }

    // Create a new transaction object
    const newTransaction = {
      amount: Number(amount),
      description: 'deposit', // or 'withdrawal' depending on the scenario
      createdAt: new Date()
    };

    // Update the balance by adding the amount
    userWallet.balance += newTransaction.amount;

    // Push the new transaction into the transactions array
    userWallet.transactions.push(newTransaction);

    // Save the updated wallet
    await userWallet.save();
   
    res.redirect('/wallet');
    amount=''
  } catch (error) {
    console.log("Error from addMony", error);
    // res.status(500).send('An error occurred');
  }
};





console.log("amount from usercontroller",amount)



// razorpayy

const Razorpay = new razorpay({
  key_id: "rzp_test_KmvOErc3UVHtQq",
  key_secret: "eAr2eBNcarGQNGxcEINjmia7"
})


const razorpayPaymentwallet = async (req, res) => {
  try {
  
     amount  = req.body;
    // Fetch necessary order details and create a Razorpay order
    const options = {
      amount: amount, // Ensure the amount is rounded up to the nearest integer
      currency: 'INR',
      receipt: 'order_receipt_id_2', // Replace with your order receipt ID
    };

    const order = await Razorpay.orders.create(options);
   

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
};

// withdraw money

const withdraw = async(req,res)=>{

  try {

    const currentUser = res.locals.user;
    const withdrawAmout = req.body.withdraw;

    // Find the user's wallet or create a new one if it doesn't exist
    // let userWallet = await walletModel.findOne({ user: currentUser._id });

    let userWallet = await walletModel.findOne({ user: currentUser._id });
    // const balance = userWallet.balance
    console.log("ball",Number(withdrawAmout))
    const updatedBalance = userWallet.balance - withdrawAmout;
    console.log("updated",updatedBalance)
userWallet = await walletModel.findOneAndUpdate(
      { user: currentUser._id },
      { $set: { balance: updatedBalance } },
      { new: true }
    );


       // Create a new transaction object for withdrawal
       const newTransaction = {
        amount: -withdrawAmout, // Negative amount indicates withdrawal
        description: 'withdrawal', // Indicate that this is a withdrawal
        createdAt: new Date()
      };
  
      // Push the new transaction into the transactions array
      userWallet.transactions.push(newTransaction);
  
      // Save the updated wallet
      await userWallet.save();


        res.redirect('/wallet')
    
  } catch (error) {
    console.log("error from withdraw",error)
  }
}


// wallet history

const walletHistory = async(req,res)=>{

  try {

    const currentUser = res.locals.user;

    let userWallet = await walletModel.findOne({ user: currentUser._id });


    if (!userWallet) {
      return res.send("noUserWalletMessage");
  }

    console.log("userwallet",userWallet)
    userWallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render("walletHistory", {userWallet})
    
  } catch (error) {
    console.log("error from walletHistory", error)
  }
}

// filter products

const ourStore = async (req, res) => {
  try {
      const searchQuery = req.query.search || '';
      const selectedCategories = req.query.selected ? req.query.selected.split(',').map(id => new ObjectId(id)) : [];
      let productDetails;
    

      if (selectedCategories.length === 0) {
          productDetails = await productFromDb.find();
      } else {
          productDetails = await productFromDb.find({ category_id: { $in: selectedCategories } });
      }

      if (searchQuery) {
          productDetails = productDetails.filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      const categories = await categoryFromDb.find();
      const selectedCategoryName = req.query.selected ? categories.find(cat => cat._id.toString() === req.query.selected).category_name : "All";

      // Pagination logic
      const currentPage = parseInt(req.query.page) || 1;
      const itemsPerPage = 6; // Number of products per page
      const totalItems = productDetails.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
      const paginatedProducts = productDetails.slice(startIndex, endIndex + 1);
console.log("Haiii",productDetails)
      res.render("shop-grid", {
          categories,
          productDetails: paginatedProducts,
          selectedCategories,
          selectedCategoryName,
          totalPages,
          currentPage
      });
  } catch (error) {
      console.log("error from ourStore", error);
      res.status(500).send('An error occurred while fetching products.');
  }
};





const filter = async (req, res) => {
  try {

    const searchQuery = req.query.search || ''; // Get the search query from the request query parameters
console.log("searchQuery:::",searchQuery)




    const selectedCategories = req.query.selected ? req.query.selected.split(',').map(id => new ObjectId(id)) : [];


    console.log(" req.query.selected:::", selectedCategories)
    // console.log("dselee",selectedCategories)
let productDetails;

if (selectedCategories.length === 0) {
  // If no category is selected, fetch all products
  productDetails = await productFromDb.find();
  // console.log("prodee",productDetails)
} else {
  // Filter products by selected categories
  productDetails = await productFromDb.find({ category_id: { $in: selectedCategories } });
}
if (searchQuery) {
  // Perform search based on product name or any other relevant field
  productDetails = productDetails.filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()));
  // res.render("search",{products:productDetails})
}


const categories = await categoryFromDb.find();
const selectedCategoryName = req.query.selected ? categories.find(cat => cat._id.toString() === req.query.selected).category_name : "All";
res.json({ categories, productDetails, selectedCategories,selectedCategoryName });
// res.json({ productDetails });
  } catch (error) {
    console.log("error from filter", error);
    res.status(500).send('An error occurred while filtering products.');
  }
}












// searching products

const search = async(req,res)=>{

  try {

    const query = req.query.q;
    const selectedCategory = req.query.selected;
    console.log("selectedCategory",selectedCategory)
  const products = await productFromDb.find({ 
    $or: [
        { name: { $regex: query, $options: 'i' } }, 
        { category_name: { $regex: query, $options: 'i' } } 
    ]
}).populate('category_id');

    // console.log("populat",products)

    res.redirect("/filter")
    // res.json({products})
    // res.render("search", {products})
    
  } catch (error) {
    console.log("error from search",error)
  }
}

// load Referal page 
const referalPage = async(req,res)=>{

  try {

    const currentUser = res.locals.user;

    const refe = await userModel.findOne({ _id: currentUser});

    const link = refe.referralLink
    

    res.render("userReferal",{link})
    
  } catch (error) {
    console.log("error from referalPage",error)
  }
}



module.exports = {
  homeLoad,
  registerLoad,
  signup,
  verifyotp,
  loginload,
  verifyLogin,
  userdashLoad,
  logout,
  productDetailsLoad,
  addressPage,
  addAddress,
  giveAdd,
  loadEditAdd,
  updateAddress,
  removeAddress,
  profilePage,
  editProfileload,
  editprofile,
  passPageLoad,
  editPass,
  resentOtp,
  userCoupon,
  wallet,                                                    
  razorpayPaymentwallet,
  addMony,
  withdraw,
  walletHistory,
  ourStore,
  filter,
  // applyFilter,
  search,
  referalPage,
  forget,
  typedEmail,
  newPass,
  confiPass




  // fetchCatFromAdmin
};



