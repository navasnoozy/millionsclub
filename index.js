const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const flash = require('connect-flash');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');

// Passport config
require('./auth/passport')(passport);

// Set up multer for file uploads
const upload = multer({
  limits: {
    fieldSize: 25 * 1024 * 1024 // 25 MB
  }
});
app.use(upload.none()); // Allow no files to be uploaded by default

app.use(flash());

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your secret key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    autoRemove: 'interval',
    autoRemoveInterval: 1 // Removes expired sessions every 1 minute
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5001;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/MillionsClub')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// User route
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

// Admin route
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

app.listen(PORT, () => {
  console.log(`Millions Club server is running at http://localhost:${PORT}`);
});
