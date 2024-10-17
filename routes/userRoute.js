const express = require("express");
const user_route = express();
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const userController = require("../controllers/userController");
const phoneVerify = require("../auth/phoneVerify");
const passport = require('passport');
const { isLogin, isLogout } = require('../middlewares/auth');

// Remove the local session setup; it's already done in the index.js file
// user_route.use(
//   session({
//     secret: uuidv4(), // This should use a consistent secret
//     resave: false,
//     saveUninitialized: true,
//   })
// );

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.set("view engine", "ejs");
user_route.set("views", "./views/user");

// Google Authentication Routes
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

user_route.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        console.log('Google auth successful, user:', req.user);
        res.redirect('/home');
    });

// User Routes
user_route.get("/", isLogout, userController.userHome);
user_route.get("/home", isLogout, userController.userHome);
user_route.get("/signup", isLogout, userController.loadSignUpPage);
user_route.post("/signup", userController.insertUser);
user_route.get("/verify", userController.verifyPage);
user_route.post("/verify", phoneVerify.sendOTP);
user_route.get("/verifyEmail", userController.verifyEmail);
user_route.get("/login", isLogout, userController.loadLoginPage);
user_route.post("/login", userController.loginUser);
user_route.get('/user-home', userController.userHome);
user_route.get('/logout', userController.logout);
user_route.get('/user-home/productPage', userController.loadProductPage);
user_route.post('/user-home/productPage/addtocart', isLogin, userController.addtoCart);
user_route.get('/cart', isLogin, userController.cart);
user_route.get('/cart/delete', isLogin, userController.deleteCartItem);
user_route.get('/buynow', isLogin, userController.buyNow);
user_route.get('/userProfile', isLogin, userController.loadUserProfile);
user_route.get('/orders', isLogin, userController.loadOrders);
user_route.post('/place-order', isLogin, userController.placeOrder);
user_route.get('/order-confirmation/:orderId', isLogin, userController.loadOrderConfirmation);
user_route.post('/verify-payment', isLogin, userController.verifyPayment);

module.exports = user_route;
