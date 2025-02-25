const express = require('express')
const { adminLogin,adminRegister, adminLoggedIN ,adminLogout, customerDetails, dashLoad, blockUser, unblockUser ,deletecoupon, orderList,upload ,detailedOpen, statusChanger, daily , adminCoupon , addAdminCoupon , newCoupon , customSalesReport,adminReferral,addReferral,newReferral,updateRef,editRef ,banner,addbanner,addbannerLoad,deleteBanner} = require('../controllers/adminController')
const { currentAdmin, validateAdminToken } = require('../JWT');
const admin_Route = express()

admin_Route.set('view engine', 'ejs')
admin_Route.set('views' , './views/admin')



admin_Route.get('/' , adminLogin)
admin_Route.post('/adminRegister' , adminRegister)

admin_Route.get("*",validateAdminToken)

admin_Route.use(currentAdmin);
 
admin_Route.get('/dash' , dashLoad)

admin_Route.post('/adminLoggedIN' , adminLoggedIN)

// admin_Route.get('/dashboard' ,dashLoad)

admin_Route.get('/customers' , customerDetails)

admin_Route.get("/adminLogout" , adminLogout)

admin_Route.post("/block-user/:userId" , blockUser)
admin_Route.post("/unblock-user/:userId" , unblockUser)

admin_Route.get("/orderlist" , orderList)
admin_Route.get("/detailopen", detailedOpen)

admin_Route.post('/status', statusChanger)

admin_Route.get('/custom-sales-report', customSalesReport);

admin_Route.get('/coupon', adminCoupon)
admin_Route.get('/addcoupon', addAdminCoupon)
admin_Route.post('/addcouponn', newCoupon)
admin_Route.get('/deletecou' ,deletecoupon)
admin_Route.get('/referral', adminReferral)

admin_Route.get('/addReferral', addReferral)
admin_Route.post('/addReferral:id', newReferral)


admin_Route.get('/editref' ,editRef)


admin_Route.post('/editref/:id' ,updateRef)

admin_Route.get('/banner' ,banner)

admin_Route.get('/addbanner' ,addbannerLoad)
admin_Route.post('/addbanner' , upload.single('banner_image'), addbanner)
admin_Route.delete('/deleteban/:id' , deleteBanner)

module.exports= admin_Route
