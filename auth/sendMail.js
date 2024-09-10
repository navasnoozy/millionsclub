const nodemailer = require("nodemailer");

const sendMail = async (UserData, mailSubject, mailContent) => {
    try {
      const testAccount = await nodemailer.createTestAccount();
  
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        requireTLS: true,
        auth: {
          user: process.env.credEmail,
          pass: process.env.credPassword,
        },
      });
  
      const mailFormat = {
        from: testAccount.user,
        to: UserData.email,
        subject: mailSubject,
        html: mailContent,
      };
  
      transporter.sendMail(mailFormat, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log("Mail has been sent", info.response);
        }
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  module.exports = sendMail;
  



