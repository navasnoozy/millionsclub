//index.js file

const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const flash = require ('connect-flash');
const passport = require('passport');
const session = require ('express-session');
const MongoStore = require('connect-mongo');

//passport config
require('./auth/passport')(passport);

const multer = require('multer');
const upload = multer();
app.use(upload.none());



app.use(flash());

app.use(session({
    secret: process.env.SESSION_SECRET || 'your secret key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:'mongodb://localhost:27017/MillionsClub',
      collectionName:'sessions',
      autoRemove:'interval',
      autoRemoveInterval:1
    }),
    cookie:{
      maxAge:1000*60*60*24,//1 day age
    }
  }));

app.use(passport.initialize());
app.use(passport.session())

const PORT = process.env.PORT || 5001;

mongoose.connect('mongodb://localhost:27017/MillionsClub');

//serve static files from public directory
app.use(express.static(path.join(__dirname,'public')))

//user route
const userRoute = require('./routes/userRoute');
//user route prefix
app.use('/',userRoute); 

//admin route
const adminRoute = require('./routes/adminRoute');
// admin route prefix
app.use('/admin',adminRoute);



app.listen(PORT,()=>{
    console.log(`millions club server is running at ${PORT}`);
})