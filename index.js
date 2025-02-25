const express = require("express");
require('dotenv').config()
const session = require("express-session");
const morgan = require("morgan");
const app = express();
const categoryController = require("./controllers/categoryController");
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/userRoute");
const path = require("path");
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URL, {})
.then(() => {
  console.log("Connected to MongoDB");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});
console.log("urll iddd",typeof(process.env.MONGODB_URL))
app.use(cookieParser());
console.log("ppp",process.env.EMAIL) 
var multer = require("multer");
// const {validateToken , currentuser}= require('./JWT')


const PORT = process.env.PORT || 3000;
// console.log(process.env.EMAIL)

app.use(
  session({
    secret: "your-secret-key", // Replace 'your-secret-key' with your own secret key
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("assets"));
app.use(express.static("adminassets"));

app.use(express.static("uploads"));

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});




// app.get('/',(req,res)=>{
//   res.end("hai")
// })


app.use(categoryController.loadCategoriesMiddleware);

app.set("view engine", "ejs");
app.set("views", "./views/users");
app.set("views", "./views/admin");
// app.set('views',path.join(__dirname, 'views'))


const adminRoute = require("./routes/adminRoute");

const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoute");

const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");
const wishRoute = require("./routes/wishRoute");
app.use(express.static(path.join(__dirname, "uploads")));





app.use("/", userRoute);
app.use("/", cartRoute);
app.use("/", orderRoute);
app.use("/", wishRoute);

app.use("/admin", adminRoute);
app.use("/admin", categoryRoute); 
app.use("/admin", productRoute);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/admin")) {
    res.render("error");
  } else {
    res.render("error");
  }

});




app.listen(PORT, () => {
  console.log("started")
  console.log(`Server is running on http://localhost:${PORT}`);
});
 