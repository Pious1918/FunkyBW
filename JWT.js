const { sign, verify } = require("jsonwebtoken");
const userModel = require("./models/userModel");
const adminModel = require("./models/adminModel");

const createTokens = (user) => {
  const accesstoken = sign(
    { email: user.email, _id: user._id },
    process.env.USER_ACCESS_TOKEN_SECRET
  );
  return accesstoken;
};


const validateToken = (req, res, next) => {
  const accessToken = req.cookies["access-token"];
  if (!accessToken) {
    console.log("not authenticated");
    res.redirect("/");
    res.status(400).json({ error: "user not authenticated" });
  }

  try {
    const validtoken = verify(
      accessToken,
      process.env.USER_ACCESS_TOKEN_SECRET
    );
    if (validtoken) {
      req.authenticated = true;
      console.log("authenticated");
      return next();
    }
  } catch (error) {
    res.status(400).json({ error: err });
  }
};



const currentuser = (req, res, next) => {
  const accessToken = req.cookies["access-token"];

  if (accessToken) {
    verify(
      accessToken,
      process.env.USER_ACCESS_TOKEN_SECRET,
      async (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.locals.user = null;
          next();
        } else {
          // console.log(decodedToken)
          let user = await userModel.findById(decodedToken._id);
          res.locals.user = user;
          next();
        }
      }
    );
  } else {
    res.locals.user = null;
    next();
  }
};



const checkBlockedStatus = async (req, res, next) => {
  try {
    // Assuming you store the user ID in the session or access token
    const userId = req.cookies["access-token"]; // Adjust this based on your actual implementation

    if (userId) {
      const user = await userModel.findById(userId);

      if (user && user.isblocked) {
        // Clear the session or access token to log the user out
        // Example with session:
        // req.session.destroy();
        
        // Example with access token:
        res.cookie("access-token", "", {
          maxAge: 1,
        });

        return res.redirect("/login"); // Redirect to the login page or handle as needed
      }
    }

    next(); // Continue processing the request
  } catch (error) {
    console.log("Error in checkBlockedStatus middleware", error);
    res.status(500).json({ message: "Internal server error" });
  }
};












const createTokenadmin = (admin) => {
  const accesstoken = sign(
    { email: admin.email, _id: admin._id, isAdmin: true },
    process.env.ADMIN_TOKEN_SECRET
  );
  return accesstoken;
};



// Validate token for admins
const validateAdminToken = (req, res, next) => {
  const accessToken = req.cookies["admin-access-token"];
  if (!accessToken) {
    console.log(" validate token not authenticated");
    res.redirect("/admin");
    
  }

  try {


    const validToken = verify(accessToken, process.env.ADMIN_TOKEN_SECRET);
    if (validToken) {
      req.authenticated = true;
      console.log("authenticated as admin");
      return next();
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



const currentAdmin = (req, res, next) => {
  const accessToken = req.cookies["admin-access-token"];

  if (accessToken) {
    verify(
      accessToken,
      process.env.ADMIN_TOKEN_SECRET,
      async (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.locals.admin = null;
          next();
        } else {
          // console.log(decodedToken)
          let admin = await adminModel.findById(decodedToken._id);
          res.locals.admin = admin;
          next();
        }
      }
    );
  } else {
    res.locals.admin = null;
    return next();
  }
};




// pagination.js

const paginate = async (model, page, itemsPerPage) => {
  try {
    const totalCount = await model.countDocuments({});
    const data = await model.find({})
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      data,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

// paginationaggregation.js


// takes the model (MongoDB collection), page number, itemsPerPage, and an optional aggregationPipeline as parameters.
const paginateAggregation = async (model, page, itemsPerPage, aggregationPipeline = []) => {
  try {

    // calculates the number of documents to skip based on the current page and items per page.
    const skip = (page - 1) * itemsPerPage;

    // Add a $skip stage to the aggregation 
    // creates a new aggregation pipeline by adding a $skip and $limit stage to the provided pipeline.

    const paginatedPipeline = [...aggregationPipeline, { $skip: skip }, { $limit: itemsPerPage }];

    const data = await model.aggregate(paginatedPipeline);
    const totalCount = await model.aggregate([...aggregationPipeline, { $count: 'count' }]);
    const totalPages = Math.ceil(totalCount.length > 0 ? totalCount[0].count / itemsPerPage : 0);

    return {
      data,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};





module.exports = {
  createTokens,
  validateToken,
  currentuser,
  currentAdmin,
  createTokenadmin,
  validateAdminToken,
  checkBlockedStatus,
  paginate,
  paginateAggregation 
};
