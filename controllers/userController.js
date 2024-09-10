//userController.js file


const User = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const crypto = require('crypto');
const sendMail = require ('../auth/sendMail');
const { error } = require("console");

const tokenMap = new Map ()

const securePassword = async (password) => {
  try {
    const passwordHash = await bcryptjs.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error.message);
  }
};




const loadHome = async(req,res)=>{
  try {
    let user = null;
    if (req.user) {
      // If user is authenticated (either through local strategy or Google)
      user = req.user;
    }
    res.render('home')
  } catch (error) {
    console.error(error.message);
  }
};

const loadSignUpPage = async (req, res) => {
  try {
    res.render("signup", { title: "Signup | MILLIONS Club" });
  } catch (error) {
    console.error(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    
    const existingUser = await User.findOne({
      $or:[{email:email},{phone:phone}]
    });

    if(existingUser){
      if(existingUser.email==email){
        return res.render('signup',{message:'Email ID already registered'})
      }else if(existingUser.phone==phone){
        return res.render('signup',{message:'Mobile number already registered'})
      }
  
    }

   
    const securedPassword = await securePassword(password);

    const newUser = new User({
      name: name,
      phone: phone,
      email: email,
      password: securedPassword,
    });

   const  UserData = await newUser.save();

    if (UserData) {

      const mailSubject = "Millions Club : Verify your email";
      const mailContent = `<div style="background-color:  aquamarine; display: flex; justify-content: center; align-items: center; border-radius: 15px; box-shadow: 0 0 1px green; padding: 20px; margin: 20px;">
    <h2 style="color: green;"> Hi ${UserData.name}!  click <a style="text-decoration: none;" href="http://localhost:5001/verifyEmail?id=${UserData._id}">here</a> to verify your mail id  </h2>
    </div>`;

      await sendMail(UserData, mailSubject, mailContent);


      const token = crypto.randomBytes(32).toString('hex');
      tokenMap.set(token,UserData._id)
      setTimeout(() => {
        tokenMap.delete(token)
      }, 5*60*1000);

      res.redirect(`/verify?token=${token}`);

    } else {
      res.render("signup", { message: "Registration failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const verifyPage = async (req,res)=>{
  try {
    const token = req.query.token;
    const userId = tokenMap.get(token)

    if(!userId){
      return res.render('verificationPage',{message:'Time Out'})
    }

    tokenMap.delete(token);
    const UserData = await User.findById(userId);


    res.render('verificationPage', {
      message:
        "Registration successful! Please check your email and follow the instructions to verify your account.",
      user: UserData,
    })
  } catch (error) {
    console.error(error.message);
  }
};





const verifyEmail = async (req, res) => {
  try {
    const verified = await User.updateOne(
      { _id: req.query.id },
      { $set: { email_verified: 1 } }
    );

    if (verified) {
      req.session.user_id = req.query.id
      res.render("verificationPage", {
        message: "Successfully verified your email",
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const loadLoginPage = async (req, res) => {
  try {
    res.render("login", { title: "Login | MILLIONS CLUB" });
  } catch (error) {
    console.error(error.message);
  }
};





const loginUser = async (req, res) => {
  try {

    const {phone, email,password}= req.body;
    const UserData = await User.findOne({email:email});

    if(!UserData || UserData.is_blocked===1){
     return res.render('login',{message:'Invalid Login id or password'});
    };

    

    if(UserData.email_verified !== 1 && UserData.phone_verified !==1){
      return res.render('login',{message:'Your account verification is peding'})
    }

       const passwordMatch = await bcryptjs.compare(password,UserData.password);

       if(passwordMatch){
        req.session.user_id = UserData._id;
       return res.redirect('/user-home')
       }else{
       return res.render('login',{message:'Invalid Login id or password'});
       }
       
    

  } catch (error) {
    console.error(error.message);
    res.status(500).render('login',{message:'An error occurred while logging in. Please try again.'})
  }
};

const logout = async (req,res)=>{
  try {
    req.session.destroy((error)=>{
      if (error) throw error = console.error('error destroying session', error);
    })
    req.flash('success', 'Successfully logged out' );
    res.redirect('/admin')
  } catch (error) {
    console.error(error.message);
  }
}






module.exports = {
  loadSignUpPage,
  insertUser,
  verifyPage,
  verifyEmail,
  loadLoginPage,
  loginUser,
  loadHome,
  logout,
};


