const orderModel = require("../models/orderModel");

const addressDB = require("../models/addressModel");
const User = require("../models/userModel");

const cartDb = require("../models/cartModel");

const productModel = require("../models/productModel");
const fs = require("fs");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer-core");

const razorpay = require("razorpay");

const couponModel = require("../models/couponModel");

const couponCartModel = require("../models/appliedCoupon");
const WalletModel = require("../models/walletModel");

// apply coupon
let couponused;
let couponId;
console.log("cuuuuuuuuuuuuu", couponId);

// Get the current date and time
const currentDate = new Date();

// Output the current date
console.log("Current Date:", currentDate);

// const couponApply = async(req,res)=>{

//   try {

//     const {couponCode}= req.body

//     res.status(200).json({ success: true, couponCode });
//     // console.log("coupon",couponCode)

//   } catch (error) {
//     console.log("error from couponApply",error)
//   }
// }

let totalAmount;
const removeCoupon = async (req, res) => {
  try {
    console.log("deleted");

    const currentUser = res.locals.user;
    console.log("current user", currentUser._id);
    // console.log("cart total",userCart)
    const couuponId = req.query.counponId;
    console.log("ddd", couuponId);
    const userCart = await cartDb.findOneAndUpdate(
      { user_id: currentUser },
      { $set: { counponPrice: 0 } },
      { new: true }
    );

    const newPrice = userCart.counponPrice;
    console.log("newPrice", userCart.totalPrice);
    delete req.session.couponPrice;
    totalAmount = userCart.totalPrice;
    console.log("req.session.couponPrice", req.session.couponPrice);
    res.status(200).json({ success: true, newPrice });
    // res.redirect('/checkout')
    // couponused=''
  } catch (error) {
    console.log("error from removeCoupon", error);
  }
};

const couponApply = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const currentUser = res.locals.user;
    console.log("current user", currentUser._id);

    const userCart = await cartDb.findOne({ user_id: currentUser });
    const cartTotal = userCart.totalPrice;

    const coupon = await couponModel.findOne({ code: couponCode });
    console.log("coupon ", coupon);

    if (!coupon) {
      return res.json({ success: false, error: "no such coupon" });
    }
    // console.log("coupon discount", coupon._id);
    // console.log("coupon discount", coupon.discountPercentage);
    const couponDiscount = coupon.discountPercentage;

    const coupnkart = await couponCartModel.aggregate([
      {
        $match: { user_id: currentUser._id, coupon_id: coupon._id },
      },
    ]);

    const totalattempt = coupon.attempt;

    console.log("totalattempt", totalattempt);

    if (coupnkart.length === 0) {
      if (
        coupon.startingDate <= currentDate &&
        currentDate <= coupon.expirationDate
      ) {
        if (cartTotal >= coupon.minTotal && cartTotal <= coupon.maxTotal) {
          const newPrice = cartTotal * (1 - couponDiscount / 100);

          console.log("new price", newPrice);

          const updatedCart = await cartDb.findOneAndUpdate(
            { user_id: currentUser },
            { $set: { counponPrice: newPrice } },
            { new: true }
          );

          req.session.couponPrice = newPrice;
          totalAmount = req.session.couponPrice;
          console.log(" req.session.couponPrice", req.session.couponPrice);
          // Assign the coupon values here if needed
          couponused = coupon.code;
          couponId = coupon._id;

          // Redirect with success message
          // return res.redirect('/checkout?couponused=' + couponused + '&couponId=' + couponId);
          res.status(200).json({ success: true, couponCode, newPrice });
        } else {
          // Redirect with a message if cart total is not greater than coupon minTotal
          // return res.redirect('/checkout?message=Coupon conditions are not met.');
          console.log("cannot apply");
          return res.json({
            success: false,
            error: "Coupon conditions are not met.",
          });
        }
      } else {
        // Redirect with a message if coupon validity dates are not met
        console.log("cannot apply");
        return res.json({
          success: false,
          error: "Coupon is not valid at this time.",
        });
      }
    } else {
      // Redirect with a message if the coupon is already used
      console.log("The coupon is already used.");
      return res.json({ success: false, error: "The coupon is already used." });
    }
  } catch (error) {
    console.log("error from couponApply", error);
    // Handle the error appropriately, e.g., sending an error response to the client
    res.status(500).send("Internal Server Error");
  }
};

// checkout Page

const loadCheckout = async (req, res) => {
  try {
    const insufficient = req.session.insufficient;
    // Clear the message from the session
    // req.session.insufficient = null;
    const currentUser = res.locals.user;
    // console.log("Current User ID:", currentUser._id);

    const userAddress = await addressDB.findOne({ user_id: currentUser._id });

    // console.log(userAddress);

    const userCart = await cartDb.aggregate([
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
    ]);

    const coupons = await couponModel.find()

    totalAmount =
      userCart[0].counponPrice > 0
        ? userCart[0].counponPrice
        : userCart[0].totalPrice;
    // console.log("amout", totalAmount)
    res.render("users/check", {
      req,
      userAddress,
      userCart,
      totalAmount,
      couponused,
      couponId,
      coupons,
      insufficient,
      razorpaykey: "rzp_test_KmvOErc3UVHtQq",
    });
  } catch (error) {
    console.log("error from loadCheckout", error);
  }
};

// remove coupon

// placing the order

const placeOrder = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    // console.log('Current User ID:', currentUser._id);

    // Assuming userCart is defined globally or in a scope accessible here
    const userCart = await cartDb.aggregate([
      {
        $match: { user_id: currentUser._id },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
    ]);

    // console.log("user carrrrr",userCart)
    totalAmount =
      userCart[0].counponPrice > 0
        ? userCart[0].counponPrice
        : userCart[0].totalPrice;

    // const newCountinStock= userCart[0].productDetails.countInStock - userCart[0].items.quantity
    // console.log("new count",newCountinStock)

    let userOrder = await orderModel.findOne({ userId: currentUser._id });

    if (!userOrder) {
      userOrder = new orderModel({
        userId: currentUser._id,
        items: [], // Change from 'products' to 'items' to match your schema
        payment: req.body.paymentOption, // Add payment option
      });
    }

    const selectedPaymentOption = req.body.paymentOption;

    if (selectedPaymentOption === "wallet") {
      // Wallet payment option selected
      console.log("Wallet payment option selected");
      // Handle the wallet payment option

      const userWallet = await WalletModel.findOne({ user: currentUser._id });
      console.log("lhhhhhhh", userWallet);

      if (!userWallet || userWallet.balance < totalAmount) {
        // User's wallet doesn't exist or balance is insufficient
        // return res.status(400).json({ message: "Insufficient wallet balance" });
        req.session.insufficient = "Insufficient wallet balance";
        console.log(" req.session.insufficient", req.session.insufficient);
        // return res.json({ success: false, error: 'insufficient.' });
        return res.redirect("/checkout");
      }

      // Deduct the total amount from the user's wallet balance
      userWallet.balance -= totalAmount;

      userWallet.transactions.push({
        createdAt: new Date(),
        amount: totalAmount,
        description: "Debited",
      });

      await userWallet.save();
    }

    const selectedAddressId = req.body.selectedAddress;
    // console.log("add",selectedAddressId)
    const paymentOption = req.body.paymentOption;
    // console.log("payy", paymentOption);

    const selectedAddress = await addressDB.findOne(
      { user_id: currentUser._id },
      { addresses: { $elemMatch: { _id: selectedAddressId } } }
    );

    if (!selectedAddress) {
      // Handle the case where the address is not found
      console.log("Selected address not found");
      return res.status(404).json({ error: "Selected address not found" });
    }
    // console.log("cart", userCart)
    const order = new orderModel({
      userId: currentUser._id,
      billingAddress: selectedAddressId,
      // billingAddress:{
      //   name:req.body.name,
      // },
      // totalAmount: userCart[0].totalPrice,
      totalAmount:
        userCart[0].counponPrice > 0
          ? userCart[0].counponPrice
          : userCart[0].totalPrice,

      createdAt: new Date().toISOString(),
      // status: 'Pending',
      payment: paymentOption,
      items: userCart.map((item) => ({
        product_id: item.items.product_id,
        quantity: item.items.quantity,
        price: item.items.price,
      })),
    });
    console.log("oooothis muchhh");
    // console.log("couponIddd",couponId)

    await order.save();

    console.log("couponIds", couponId);

    if (couponId) {
      const couponnCart = new couponCartModel({
        user_id: currentUser._id,
        coupon_id: couponId,
      });
      await couponnCart.save();
    }

    console.log("kkkkkkkkkk");

    // Optionally, clear the user's cart after the order is placed
    await cartDb.updateOne(
      { user_id: currentUser._id },
      { $set: { items: [], totalPrice: 0, counponPrice: 0 } }
    );

    // Update countInStock in the productModel after placing the order
    for (const item of userCart) {
      const productId = item.items.product_id;
      const quantity = item.items.quantity;

      await productModel.updateOne(
        { _id: productId },
        { $inc: { countInStock: -quantity } }
      );
    }
    // Clear the user's cart after placing the order
    // await cartDb.updateOne({ user_id: currentUser._id }, { $set: { items: [] } });

    res.redirect("/thanku"); // Redirect to the home page or a success page after placing the order
    couponId = "";
    couponused = "";
  } catch (error) {
    console.log("error from placeOrder", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

console.log("totalAmount", totalAmount);
// -------------------------------------------Payment -----------------------------

const Razorpay = new razorpay({
  key_id: "rzp_test_KmvOErc3UVHtQq",
  key_secret: "eAr2eBNcarGQNGxcEINjmia7",
});

const razorpayPayment = async (req, res) => {
  try {
    // Fetch necessary order details and create a Razorpay order
    const options = {
      amount: Math.ceil(totalAmount * 100), // Ensure the amount is rounded up to the nearest integer
      currency: "INR",
      receipt: "order_receipt_id_2", // Replace with your order receipt ID
    };

    const order = await Razorpay.orders.create(options);
    console.log("kk");

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating Razorpay order" });
  }
};

const walletPayment = async (req, res) => {
  try {
    const currentUser = res.locals.user;
  } catch (error) {
    console.log("error from walletPayment", error);
  }
};

const thanku = (req, res) => {
  try {
    res.render("users/thanku");
  } catch (error) { }
};

// loading order page

const loadOrders = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    // console.log("Current User ID loadOrders:", currentUser);

    const orders = await orderModel.aggregate([
      {
        $match: { userId: currentUser._id },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "ordereditems",
        },
      },
      {
        $unwind: "$ordereditems",
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
    ]);

    res.render("users/orders", { orders });
  } catch (error) {
    console.log("error from loadOrders", error);
  }
};

// load view order details

const viewDetails = async (req, res) => {
  try {
    const productId = req.query.prodId;
    const orderId = req.query.orderId;
    console.log("Current ordrer id ", orderId);
    console.log("Current product00 id ", productId);

    const orderdetails = await orderModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(orderId) },
      },

      {
        $unwind: "$items",
      },

      {
        $match: { "items.product_id": new mongoose.Types.ObjectId(productId) },
      },

      {
        $lookup: {
          from: "products", // Assuming your Product model is named 'products'
          localField: "items.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
    ]);

    console.log("afdsfaff", orderdetails);

    const userid = orderdetails[0].userId;
    console.log("userid", userid);

    const billingaddress = orderdetails[0].billingAddress;
    console.log("ddibilll", billingaddress);

    const address = await addressDB.findOne(
      { user_id: userid },
      { addresses: { $elemMatch: { _id: billingaddress } } }
    );
    console.log("bill address", address);
    res.render("users/orderDetails", {
      orderdetails: orderdetails[0],
      address: address,
    });
  } catch (error) {
    console.log("error from viewDetails", error);
  }
};

// cancel order

const cancelOrder = async (req, res) => {
  try {
    const currentUser = res.locals.user;
    const productId = req.query.prodId;
    const orderId = req.query.orderId;
    console.log("Current ordrer id ", orderId);
    console.log("Current product00 id ", productId);

    const orderd = await orderModel.findOne(
      { userId: currentUser },
      { _id: orderId }
    );
    console.log("dddggafdsfes", orderd);

    const result = await orderModel.updateOne(
      { _id: orderId, "items.product_id": productId },
      { $set: { "items.$.status": "cancelled" } }
    );

    const orderdetails = await orderModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(orderId) },
      },

      {
        $unwind: "$items",
      },

      {
        $match: { "items.product_id": new mongoose.Types.ObjectId(productId) },
      },

      {
        $lookup: {
          from: "products", // Assuming your Product model is named 'products'
          localField: "items.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
    ]);
    const quantity = orderdetails[0].items.quantity;
    console.log("afdsfaff", quantity);

    await productModel.updateOne(
      { _id: productId },
      { $inc: { countInStock: quantity } }
    );

    res.redirect("/orders");
  } catch (error) {
    console.log("error from cancel order", error);
  }
};

// return order

const returnProduct = async (req, res) => {
  try {
    const productId = req.query.prodId;
    const orderId = req.query.orderId;

    console.log("Current ordrer id ", orderId);
    console.log("Current product00 id ", productId);

    const orderdetails = await orderModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(orderId) },
      },

      {
        $unwind: "$items",
      },

      {
        $match: { "items.product_id": new mongoose.Types.ObjectId(productId) },
      },

      {
        $lookup: {
          from: "products", // Assuming your Product model is named 'products'
          localField: "items.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
    ]);
    const quantity = orderdetails[0].items.quantity;
    console.log("afdsfaff", orderdetails);
    const result = await orderModel.updateOne(
      { _id: orderId, "items.product_id": productId },
      { $set: { "items.$.status": "returned" } }
    );

    // Update countInStock in the productModel after placing the order

    await productModel.updateOne(
      { _id: productId },
      { $inc: { countInStock: quantity } }
    );

    // Your code for saving the return reason can be added here
    const returnReason = req.body.returnReason;
    console.log("Received return reason:", returnReason);
    await orderModel.updateOne(
      { _id: orderId, "items.product_id": productId },
      { $set: { "items.$.returnreason": returnReason } }
    );

    res.redirect("/orders");

    const userWallet = await WalletModel.find({ user: orderdetails[0].userId });

    const returnPrice = orderdetails[0].totalAmount;
    console.log("returnPrice", returnPrice);

    // await WalletModel.findByIdAndUpdate(userWallet, {
    //   $inc: { balance: returnPrice },
    // });

    await WalletModel.findByIdAndUpdate(
      userWallet,
      {
        $inc: { balance: returnPrice },
        $push: {
          transactions: {
            amount: returnPrice,
            description: "returned amount", // Description indicating amount was returned
            createdAt: new Date()
          }
        }
      }
    );


  } catch (error) {
    console.log("errror form returnProduct", error);
  }
};

// invoice generator

const invoiceGeneration = async (req, res, next) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.query.orderId);
    const userId = res.locals.user._id;

    const userData = await User.findById(userId);
    const orderData = await orderModel.aggregate([
      {
        $match: { _id: orderId },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
    ]);
    console.log("jkk", orderData);
    const addressId = orderData[0].delivery_address;

    const billingaddress = orderData[0].billingAddress;
    console.log("ddibilll", billingaddress);

    const address = await addressDB.findOne(
      { user_id: userId },
      { addresses: { $elemMatch: { _id: billingaddress } } }
    );
    console.log("bill address", address);

    const data = {
      order: orderData,
      user: userData,
      address: address,
    };

    res.render("users/invoice", data);



  } catch (error) {
    console.log("Invoice error", error);
    next(error);
  }
};

module.exports = {
  loadCheckout,
  placeOrder,
  loadOrders,
  viewDetails,
  cancelOrder,
  thanku,
  razorpayPayment,
  returnProduct,

  couponApply,
  invoiceGeneration,
  removeCoupon,
};
