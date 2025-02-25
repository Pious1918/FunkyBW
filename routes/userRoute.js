const express = require('express')



const user_route = express()

// user_route.set('view engine', 'ejs')
user_route.set('views' , './views/users')


const userController = require('../controllers/usercontroller');
const { validateToken, currentuser } = require('../JWT');

// user_route.use(validateToken);
user_route.use(currentuser);
user_route.get('*',currentuser)

user_route.get('/' , userController.homeLoad)

user_route.get('/register' , userController.registerLoad)


user_route.post('/register' , userController.signup)


user_route.post('/resend' , userController.resentOtp)

user_route.post('/verify' , userController.verifyotp)

user_route.get('/login' ,userController.loginload)

user_route.post('/login' ,  userController.verifyLogin)

user_route.get('/userdashboard' , userController.userdashLoad)

user_route.get('/logout' , userController.logout)



// forget password
user_route.get('/forget' , userController.forget)
user_route.post('/forget' , userController.typedEmail)

user_route.post('/newPass' , userController.newPass)
// password confirmation
user_route.patch('/conPass' , userController.confiPass)



user_route.get('/coupon' , userController.userCoupon)


user_route.get('/productDetails/:productId' , userController.productDetailsLoad)






// user Profile
user_route.get('/profile' , userController.profilePage)
user_route.get('/editprofile' , userController.editProfileload)
user_route.post('/editprofile' , userController.editprofile)


user_route.get('/address' , userController.addressPage)
user_route.get('/addaddress' , userController.addAddress)
user_route.post('/addaddress', userController.giveAdd)
user_route.get('/editaddress' , userController.loadEditAdd)
user_route.post('/editaddress/:addressId' , userController.updateAddress)
user_route.get('/deleteaddress/:addressId' , userController.removeAddress)


// change password

user_route.get('/editpass' , userController.passPageLoad)
user_route.post('/editpass' , userController.editPass)

// user_route.get('/disCat' , userController.fetchCatFromAdmin)


// user_route.post('/resend' , userController.resendotp)


// wallet

user_route.get('/wallet' , userController.wallet)
user_route.post('/wallet', userController.addMony);

user_route.post('/withdraw', userController.withdraw);


user_route.get('/wallethistory' , userController.walletHistory)
user_route.post('/create-razorpay-order-wallet', userController.razorpayPaymentwallet);


user_route.get('/filter',  userController.ourStore )
// user_route.get('/filterr',  userController.filter )

// user_route.get('/filter-products', userController.applyFilter);


// product search
user_route.get('/search', userController.search);
user_route.get('/referal', userController.referalPage);




module.exports = user_route