const express = require('express')

const order_route = express()

const ordercontroller = require('../controllers/orderController')

// route for order checkout
order_route.get('/checkout', ordercontroller.loadCheckout)
order_route.post('/checkout', ordercontroller.placeOrder)

// order_route.post('/checkout', ordercontroller.placeOrder)

order_route.get('/thanku',ordercontroller.thanku)

// route to go to the order page in dashboard and get the order details
order_route.get('/orders', ordercontroller.loadOrders)
order_route.get('/details', ordercontroller.viewDetails)

// invoice generate    
order_route.get('/invoice-generate', ordercontroller.invoiceGeneration)
// route to cancel the order
order_route.post('/cancelOrder', ordercontroller.cancelOrder)

// product return
order_route.post('/returnproduct', ordercontroller.returnProduct)
// order_route.post('/create-razorpay-order', ordercontroller.orders)

order_route.post('/create-razorpay-order', ordercontroller.razorpayPayment);

order_route.post('/applycoupon' , ordercontroller.couponApply)
order_route.post('/cancelCoupon', ordercontroller.removeCoupon)



module.exports = order_route