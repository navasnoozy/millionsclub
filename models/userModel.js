//userModel.js file

const moment = require('moment');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
name:{
    type:String,
    require:true
},
phone:{
    type:Number,
},
email:{
    type:String,
    require:true
},
password:{
    type:String,
    require:true,
},
email_verified:{
    type:Number,
    default:0,
},
phone_verified:{
    type:Number,
    default:0,
},
is_admin:{
    type:Number,
    default:0,
},
is_blocked:{
    type:Number,
    default:0,
},
createdAt:{
    type:String,
    default:()=> moment().format('YYYY-MM-DD HH:mm:ss')
},
updatedAt:{
    type:String,
    default:()=> moment().format('YYYY-MM-DD HH:mm:ss')
},
OTP:{
    type:String,
},
otpExpiration:{
    type:Date,
    default:Date.now,
    get:(otpExpiration)=>otpExpiration.getTime(),
    set:(otpExpiration)=> new Date(otpExpiration),
},
googleId: {
    type: String,
  },

});


module.exports = mongoose.model('User',userSchema);