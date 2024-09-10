//userRoute.js file

const express = require("express");
const user_route = express();
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const userController = require("../controllers/userController");
const phoneVerify = require("../auth/phoneVerify");
const { config } = require("dotenv");
const passport = require('passport');
const {isLogin, isLogout} = require('../middlewares/auth');



user_route.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  })
);

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.set("view engine", "ejs");
user_route.set("views", "./views/user");




user_route.get('/auth/google',
    passport.authenticate('google', { scope: ['profile','email'] }));
  
user_route.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      console.log('Google auth successful, user:', req.user);
      res.redirect('/home');
    });





user_route.get("/", isLogout,  userController.loadHome);
user_route.get("/home", isLogout, userController.loadHome);

user_route.get("/signup", isLogout, userController.loadSignUpPage);
user_route.post("/signup", userController.insertUser);

user_route.get("/verify", userController.verifyPage);
user_route.post("/verify", phoneVerify.sendOTP);


user_route.get("/verifyEmail", userController.verifyEmail);

user_route.get("/login",isLogout, userController.loadLoginPage);
user_route.post("/login", userController.loginUser);

user_route.get('/user-home',isLogin,userController.loadHome);

user_route.get('/logout', isLogout, userController.logout);


module.exports = user_route;