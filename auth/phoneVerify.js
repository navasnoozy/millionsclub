const User = require("../models/userModel");
const twilio = require("twilio");
const OTP_generator = require("otp-generator");

const twilio_SID = process.env.TWILIO_ACCOUNT_SID;
const twilio_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const COUNTRY_CODE = "+91";

const twilio_client = new twilio(twilio_SID, twilio_TOKEN);

//sending otp to mobile number
const sendOTP = async (req, res) => {
  console.log("sendotp function working");
  try {
    const { phone } = req.body;

    const OTP = OTP_generator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const cDate = new Date();
    if (OTP) {
      await User.findOneAndUpdate(
        { phone },
        { $set: { OTP, otpExpiration: new Date(cDate.getTime()) } },
        // { OTP, otpExpiration: new Date(cDate.getTime()) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // twilio_client.messages.create({
      //   body: `Your Millions Club verification code is ${OTP}`,
      //   to: `${COUNTRY_CODE}${phone}`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      // });
      res.status(200).json({ Notifi: "OTP sent successfully" });
    } else {
      res.status(500).json({ Notifi: "Failed to generate OTP" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ Notifi: "An error occurred while sending OTP" });
  }
};

//otp validation
const validateOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const userData = await User.findOne({ phone: phone });

    if (!userData) {
      return res.status(404).json({ otpVerifyStatus: "User not found" });
    }

    if (userData.OTP !== otp) {
      return res.status(400).json({ otpVerifyStatus: "Invalid OTP" });
    }

    const currentTime = new Date();
    const otpExpirationTime = new Date(userData.otpExpiration);

    otpExpirationTime.setMinutes(otpExpirationTime.getMinutes() + 3);

    if (currentTime > otpExpirationTime) {
      return res.status(400).json({ otpVerifyStatus: "OTP has expired" });
    }

    res.status(200).json({ otpVerifyStatus: "OTP verification successfull" });
    req.session.user_id = userData._id;
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ otpValidationNotifi: "An error occured while validating OTP" });
  }
};

module.exports = {
  sendOTP,
  validateOTP,
};
