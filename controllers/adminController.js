const adminModel = require("../models/adminModel");
const productDb = require("../models/productModel")
const categoryDb = require("../models/categoryModel")
const UserFromDb = require("../models/userModel");
const path = require('path')
const couponModel = require('../models/couponModel')
const referalmodel = require('../models/referralModel')
const addressfromDB = require('../models/addressModel')
const bannerModel = require('../models/bannerModel')
const orderdb = require('../models/orderModel')
const multer = require('multer')
const moment = require('moment')

const orderfromDb = require('../models/orderModel')
const { ObjectId } = require('mongoose').Types;
const jwt = require("jsonwebtoken");
const { createTokenadmin ,paginate ,paginateAggregation} = require("../JWT");
const userModel = require("../models/userModel");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/bannerImages');
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// sales report

const customSalesReport = async (req, res) => {
  try {
      // Extract starting and ending dates from the request query parameters
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      console.log("staaaaaa",startDate)
      // Parse the dates into JavaScript Date objects
      const startDateCustom = moment(startDate, 'YYYY-MM-DD').startOf('day').toDate();
      const endDateCustom = moment(endDate, 'YYYY-MM-DD').endOf('day').toDate();

      const customSalesWithProductInfo = await orderfromDb.aggregate([
          {
              $match: {
                  createdAt: { $gte: startDateCustom, $lte: endDateCustom },
              },
          },
          {
              $unwind: "$items",
          },
          {
              $lookup: {
                  from: 'products', // The name of the product collection
                  localField: 'items.product_id', // Field from the order collection
                  foreignField: '_id', // Field from the product collection
                  as: 'productInfo',
              },
          },
          {
              $unwind: "$productInfo",
          },
      ]);

      console.log("ddeerra dd",customSalesWithProductInfo)
      // You can render the sales report data in your view or send it as JSON as needed
      res.render('salesreport', { customSalesWithProductInfo, startDate, endDate });

  } catch (error) {
      console.log("Error from customSalesReport", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
}


const adminLogin = (req, res) => {
  try {
    if (req.cookies["admin-access-token"]) {
      console.log("admin authenticated");
      res.redirect("/admin/dash");
    } else {
      console.log("notttyyyy authenticated");
      res.render("adminLogin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminRegister = async (req, res) => {
  try {
    const admin = new adminModel({
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
    });

    const adminData = await admin.save();

    console.log(adminData);
    if (adminData) {
      console.log("registration successful");
    }
  } catch (error) {}
};

const adminLoggedIN = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(email);
  const adminData = await adminModel.findOne({ email: email });
  console.log(adminData);
  console.log("ghjkjhghjjh");

  if (adminData) {
    if (password == adminData.password) {
      const accesstoken = createTokenadmin(adminData);

      res.cookie("admin-access-token", accesstoken, {
        maxAge: 60 * 60 * 24 * 30 * 1000,
        httpOnly: true,
      });

      console.log("access token of admin is : " + accesstoken);
      // res.render("adminHome")
      res.redirect("/admin/dash");
      console.log("admin is logged in");
    } else {
      res.redirect("/admin");
    }
  } else {
    res.redirect("/admin");
  }
};

const dashLoad =  async(req, res) => {
  try {


   
    const orderDetails = await orderdb.find()
    // console.log("order",orderDetails)

    // total products
    const product = await productDb.find()
    const totalProduct = product.length
    // console.log("toProd= " , totalProduct)

     // total categories
     const category = await categoryDb.find()
     const totalCategory = category.length
    //  console.log("tocat= " , totalCategory)

    // total users
    const Users = await UserFromDb.find()
    const totaluser = Users.length
    // console.log("total users = ", totaluser)



    // total orders
    var totalOrders = orderDetails.length
    // console.log("totalOrders = ", totalOrders)

    // total revenue
    // var totalrevenue=0
    // if(orderDetails.length>0){

    //   for(let i=0 ; i<orderDetails.length ; i++){

        
        
    //     totalrevenue = totalrevenue+orderDetails[i]. totalAmount
        
    //   }
    // }

   
    const totalRevenue = await orderdb.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);
    console.log("totalRevenue",totalRevenue)

    // console.log("revvenue",totalRevenue)

    if (totalRevenue.length > 0) {
      var { totalAmount } = totalRevenue[0]; // Access totalAmount from the first element of the array
      console.log("totalRevenue", totalRevenue);
      console.log("totalAmount", totalAmount); // This should print the total revenue
  } else {
      console.log("No revenue data available");
  }
  



    const total = await orderdb.aggregate([
      {
        $match: {},
      },
      {
        $unwind: "$items",
      },
      {
        $match: { "items.status": "cancelled" },
      },
      {
        $group: {
          _id: null,
          totalCancelledAmount: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalCount: { $sum: 1 }, // Count the documents (cancelled products)
        },
      },
      {
        $project: {
          _id: 0,
          totalCancelledAmount: 1,
          totalCount: 1,
        },
      },
    ]);
  
    if(total>0){
      const totalCancelledAmount = total[0].totalCancelledAmount;
      // console.log("tottl",total)
  
      var Revenue = totalAmount[0] - totalCancelledAmount;
      var cancelledOrder = total[0].totalCount;

    }

console.log("RevenueRevenue",Revenue)
  
    // console.log("Revenue",Revenue)

    // // Fetch data for the chart (example: daily order count)

    const dailyOrderData = await orderdb.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(moment().subtract(30, "days").startOf("day")),
          }, // Adjust time interval as needed
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log("dailyOrderData",dailyOrderData)

    const monthlyOrderData = await orderdb.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    

    const dailyLabels = dailyOrderData.map((item) => item._id);
    const dailyData = dailyOrderData.map((item) => item.orderCount);
    console.log("dailyLabels",dailyLabels)
    console.log("dailyData",dailyData)
    const monthlyLabels = monthlyOrderData.map((item) => item._id);
    const monthlyData = monthlyOrderData.map((item) => item.orderCount);

    console.log("dailyOrderData",dailyOrderData)
    console.log("labelsmotnh:", monthlyLabels)
    console.log("datamonth:", monthlyData)











    

    res.render("adminHome" , {totalRevenue,totalAmount, totalOrders ,totaluser ,totalProduct, totalCategory ,Revenue,cancelledOrder, dailyLabels,
      dailyData,
      monthlyLabels,
      monthlyData,});
    
  } catch (error) {
    console.log(error)
    
  }



 
};

const adminLogout = async (req, res) => {
  res.cookie("admin-access-token", "", {
    maxAge: 1,
  });

  res.redirect("/admin");
  console.log("bye admin!!");
};

// const customerDetails = async (req, res) => {
//   try {
//     const userData = await UserFromDb.find({});
//     res.render("customerDetails", { data: userData });
//   } catch (error) {
//     console.log(error.message);
//   }
// };


const ITEMS_PER_PAGE = 5; // Change this based on your requirement

const customerDetails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    // Example: Get customers with a specific status
    const statusQuery = { status: 'Active' }; // Modify this based on your needs

    const paginationResult = await paginate(UserFromDb, page, ITEMS_PER_PAGE, statusQuery);

    res.render("customerDetails", {
      data: paginationResult.data,
      currentPage: paginationResult.currentPage,
      totalPages: paginationResult.totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};




const blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserFromDb.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          isblocked: true,
        },
      }
    );
    res.redirect("/admin/customers");

    console.log(user);

    console.log(user.isblocked);
  } catch (error) {}
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId);

    const user = await UserFromDb.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          isblocked: false,
        },
      }
    );
    res.redirect("/admin/customers");

    console.log(user.isblocked);
  } catch (error) {}
};


// loading orderList

// const orderList = async(req,res)=>{
//   try {

//     const orders = await orderfromDb.aggregate([
//       {
//         $lookup: {
//           from: "users", // Assuming your user collection is named "users"
//           localField: "userId",
//           foreignField: "_id",
//           as: "user"
//         }
//       },
//       {
//         $unwind: "$user" // Assuming each order has only one corresponding user
//       }
//     ]);

  

//     res.render("orderList" ,{orders})
    
//   } catch (error) {
//     console.log("error from admin orderList", error)
//   }
// }






const orderList = async (req, res) => {
  try {

    // sets the constant ITEMS_PER_PAGE to 8, indicating the number of orders to display per page.
    const ITEMS_PER_PAGE = 8; // Change this based on your requirement

    // extracts the current page number from the request query parameters (req.query.page) or defaults to 1 if not provided.
    const page = parseInt(req.query.page) || 1;

    const aggregationPipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $sort: { createdAt: -1 } // Sort by creation date in descending order
      }
    ];

    const paginationResult = await paginateAggregation(orderfromDb, page, ITEMS_PER_PAGE, aggregationPipeline);

    res.render("orderList", {
      orders: paginationResult.data,
      currentPage: paginationResult.currentPage,
      totalPages: paginationResult.totalPages,
    });

  } catch (error) {
    console.log("error from admin orderList", error);
  }
};


// opening of that order details

const detailedOpen = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
    

      const orderDetails = await orderfromDb.aggregate([
        {
          $match: { _id: new ObjectId(orderId) }
        },
        {
          $unwind: "$items"
        },
        {
          $lookup: {
            from: "products", // Assuming your Product model is named 'Product'
            localField: "items.product_id",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
       
        
        
      ]);
      console.log("order dfs",orderDetails)
      
      
      const userid = orderDetails[0].userId
      console.log("userid" , userid)
      
      const billing = orderDetails[0].billingAddress
      // console.log("billingg" , billing)
   
      const address= await addressfromDB.findOne({user_id: userid},{addresses: { $elemMatch: { _id: billing } }})
      // console.log("bill address" , address)
      // console.log("detailserd ikorr",orderDetails)
      res.render("detailedOrder" ,{orderId , orderDetails , address: address.addresses})

    
  } catch (error) {
    console.log("error from detailedOpen", error)
  }
}


const statusChanger = async(req,res)=>{

  try {

    const orderId = req.query.orderId
    console.log("odii",orderId)

    const productId = req.query.proId
    console.log(req.query.proId)
    const newStatus = req.body.orderStatus; 
    console.log("sttuss",newStatus)

    const orderDetails = await orderfromDb.findOneAndUpdate(
      {
        _id: new ObjectId(orderId), 
        'items.product_id': new ObjectId(productId),
      },
      {
        $set: {
          'items.$.status': newStatus,
        },
      },
      { new: true } // To return the updated document (without new true it wont update)
    );

     // Decrease totalprice only if the status is changed to 'cancelled'
     if (newStatus === 'cancelled') {
      // Find the item in the order
      const orderItem = orderDetails.items.find(
        (item) => item.product_id.toString() === productId
      );

      // Calculate the total price to decrease based on price and quantity
      const totalPriceToDecrease = orderItem.price * orderItem.quantity;

      // Update the order's totalprice by subtracting the calculated amount
      await orderfromDb.findOneAndUpdate(
        { _id: new ObjectId(orderId) },
        {
          $inc: { totalAmount: -totalPriceToDecrease },
        }
      );
    }

    
    // await orderfromDb.findOneAndUpdate({ _id: new ObjectId(orderId) }, { $set: { "items.$.status": newStatus } })
    res.redirect('/admin/orderlist')
  } catch (error) {
    console.log("error from status changer", error)
  }
}


function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const adminCoupon = async(req,res)=>{
  try {

    const currentCoupons = await couponModel.find()
    console.log("kk",currentCoupons)
    res.render("coupon" ,{currentCoupons ,formatDate})
    
  } catch (error) {
    console.log("error from adminCoupon",error)
  }
}

const addAdminCoupon = async(req,res)=>{
  try {

  
    res.render("addCoupon")
    
  } catch (error) {
    console.log("errror from addAdminCoupon",error)
  }
}

const newCoupon = async(req,res)=>{
  try {



    const { name,discount,starting,ending,minprice,maxprice } = req.body

    const existingCoupon = await couponModel.findOne({ code: { $regex: new RegExp("^" + name + "$", "i") } });
        if (existingCoupon) {
          res.render("addCoupon",{message:"coupon name already exists"})
        }

    const newcoupon = new couponModel({

      code:name,
      discountPercentage:discount,
      startingDate:starting,
      expirationDate:ending,
      minTotal:minprice,
      maxTotal:maxprice
    })

    await newcoupon.save()
    res.redirect("/admin/coupon")
    
    
    console.log("ddd",name,discount,starting,ending,price)
    
  } catch (error) {
    console.log("error from newCoupon",error)
  }
}



// delete coupon 


const deletecoupon = async(req,res)=>{

  try {

      const coupon = req.query.id
      const couponoffer = await couponModel.findByIdAndDelete({_id:coupon})

  
  

      res.redirect('/admin/coupon')
      
  } catch (error) {
      console.log("error from updateProductOffer",error)
      
  }
}





// load referral page

const adminReferral = async(req,res)=>{

  try {

    const currentref = await referalmodel.find()

    res.render("referral",{currentref})
    
  } catch (error) {
    console.log("error from adminReferral",error)
  }
}
// addReferral

const addReferral = async(req,res)=>{

  try {

    res.render("newReferral")
    
  } catch (error) {
    console.log("error from addReferral", error)
  }
}
// applying new referral

const newReferral = async(req,res)=>{

  try {
    
    const {referal,signup} =req.body
    const red= req.body.referal
    console.log("reff",req.body.referal)
    // console.log("reff",signup)

    const newref = new referalmodel({
      refferalBonus:referal,
      signupBonus:signup

    })
    
    await newref.save()
    res.redirect('/admin/referral')
  } catch (error) {
    console.log("error from newReferral",error)
  }
}



// edit page

const editRef = async(req,res)=>{

  try {

    const id = req.query.id;
    const currentref = await referalmodel.findById({_id:id})
    // console.log("ddddew",currentref)
    res.render("newReferral",{currentref})
    
  } catch (error) {
    console.log("error from editRef",error)
  }
}

// update refoffer

const updateRef = async(req,res)=>{
  try {

    const idd= req.params.id
    console.log('iddd',idd)
    const refff = await referalmodel.find({_id:idd})
    
    
    const {referal,signup} =req.body
    const updatedRef = await referalmodel.findByIdAndUpdate(
      { _id: idd }, // Filter to find the document by its id
      { $set: { refferalBonus: referal, signupBonus: signup } }, // Update fields
      { new: true } // Return the modified document
    );
    console.log('iddd',updatedRef)
    if (!updatedRef) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    // If you want to send the updated document as a response
    res.redirect('/admin/referral')


  
console.log("kk",referal)

  } catch (error) {
    console.log("error from updateRef",error)
  }
}

// banner management

const banner = async(req,res)=>{

  try {

    const banner = await bannerModel.find()

    res.render("banner",{banner})
    
  } catch (error) {
    console.log("error from banner",error)
  }
}


const deleteBanner = async(req,res)=>{

  try {

    const banId = req.params.id
    console.log("idd",banId)
    const bannerName = await bannerModel.findByIdAndDelete({_id:banId})
    console.log("bannerName",bannerName)
    res.status(200).send({ message: "Banner deleted successfully" });
    // res.redirect("/admin/banner")
  } catch (error) {
    console.log("error from deleteBanner",error)
    res.status(500).send({ error: "Internal server error" });
  }
}




const addbannerLoad = async(req,res)=>{


  try {
      
  
    res.render('addbanner', { message: "Category Uploaded" });



     

  } catch (error) {
      console.log(error)
      
  }
}




const addbanner = async(req,res)=>{


  try {
      
      
      const {bname }= req.body

      const banner_image = path.basename(req.file.path);

      const existbanner = await bannerModel.findOne({
        bname: { $regex: new RegExp(`^${bname}$`, 'i') },
    })

    if(existbanner){
        res.render('addbanner' , {message :"Banner already exists"})
    }
    else{




      console.log("banner ima ",banner_image)
          const newBanner = new bannerModel({
            bname: bname,
              banner_image: banner_image, // Save the cropped image filename
              
             
          });

          await newBanner.save();
          console.log("category is: ", newBanner);
          res.render('addbanner', { message: "Category Uploaded" });
        }


     

  } catch (error) {
      console.log(error)
      
  }
}





module.exports = {
  adminLogin,
  adminRegister,
  adminLoggedIN,
  dashLoad,
  customerDetails,
  adminLogout,
  blockUser,
  unblockUser,
  orderList,
  detailedOpen,
  statusChanger,
  adminCoupon,
  addAdminCoupon,
  newCoupon,
  deletecoupon,
  customSalesReport,
  adminReferral,
  addReferral,
  newReferral,
  updateRef,
  editRef,
  banner,
  addbanner,
  upload,
  addbannerLoad,
  deleteBanner

};
