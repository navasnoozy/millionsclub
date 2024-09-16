//adminController.js

const User = require("../models/userModel");
const products = require("../models/productsModel");
const bcryptjs = require("bcryptjs");
const randomString = require("randomstring");
const nodemailer = require("nodemailer");
const moment = require("moment");
const sendMail = require("../auth/sendMail");
const SendmailTransport = require("nodemailer/lib/sendmail-transport");

const fs = require("fs");
const path = require("path");
const { query } = require("express");
const { AwsInstance } = require("twilio/lib/rest/accounts/v1/credential/aws");
const { title, disconnect } = require("process");

const securePassword = async (password) => {
  try {
    const hashPassword = await bcryptjs.hash(password, 10);
    return hashPassword;
  } catch (error) {
    console.error(error.message);
  }
};

const loadLoginPage = async (req, res) => {
  try {
    res.render("login", { title: "Admin Login || MILLIONS CLUB" });
  } catch (error) {
    console.error(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    console.log("admin verify login");
    const { email, password } = req.body;
    const UserData = await User.findOne({ email: email });

    if (!UserData || UserData.is_admin == 0) {
      return res.render("login", { message: "Invalid email id or password" });
    }

    const passwordMatch = await bcryptjs.compare(password, UserData.password);

    if (passwordMatch) {
      req.session.user_id = UserData._id;
      req.session.is_admin = true;
      return res.redirect("/admin/dashboard");
    } else {
      return res.render("login", { message: "Invalid email id or password" });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.find({});
    res.render("dashboard", { title: "Dashboard | Admin", users: userData });
  } catch (error) {
    console.error(error.message);
  }
};

const editUser = async (req, res) => {
  try {
    const userId = req.query.Id;
    const userData = await User.findById({ _id: userId });
    res.render("edit-user", {
      title: "Edit user | Millions Club",
      user: userData,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, id, phone, email, verify_phone, verify_email } = req.body;

    const updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

    await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: name,
          phone: phone,
          email: email,
          phone_verified: verify_phone ? 1 : 0,
          email_verified: verify_email ? 1 : 0,
          updatedAt: updatedAt,
        },
      }
    );
    req.flash("success", "Updation successfull");
    res.redirect("/admin/customers");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "An error occurred while updating the user");
    res.redirect("/admin/customers");
  }
};

const loadAddUser = async (req, res) => {
  try {
    res.render("add-user");
  } catch (error) {
    console.error(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    console.log("add user working");
    const { name, phone, email } = req.body;
    const tempPassword = randomString.generate(8);
    const spassword = await securePassword(tempPassword);

    const existingUser = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });

    if (existingUser) {
      if (existingUser.email == email) {
        req.flash("error", "Email id already registered");
      } else {
        req.flash("error", "Phone number already registered");
      }
      return res.redirect("/admin/add-user");
    }

    const newUser = new User({
      name,
      phone,
      email,
      password: spassword,
    });

    const userData = await newUser.save();

    const mailSubject = "Your MillionsClub Login Creditionals";
    const mailContent = `<div style="background-color:  aquamarine; display: flex;   flex-direction: column; justify-content: center; align-items: center; border-radius: 15px; box-shadow: 0 0 1px green; padding: 20px; margin: 20px;">
    <h2 style="color: green;"> Hi ${userData.name}!  click <a style="text-decoration: none;" href="http://localhost:5001/verifyEmail?id=${userData._id}">here</a> to verify your mail id  </h2>
    <div>   <h4>Your email id is your username</h4></div>
 
    <div>   <h4>Password: ${tempPassword}</h4></div>
 
    </div>`;
    await sendMail(userData, mailSubject, mailContent);

    req.flash(
      "success",
      `New user added successfully, password has been sent to ${userData.email}`
    );
    res.redirect("/admin/customers");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "An error occurred while adding the user");
  }
};



const blockUser = async (req, res) => {
  try {
    console.log("block/unblock user working");

    const userId = req.params.id;

    const userData = await User.findById(userId);

    if (userData) {
      userData.is_blocked = userData.is_blocked === 0 ? 1 : 0;
      await userData.save();

      const action = userData.is_blocked === 1 ? "blocked" : "unblocked";

      res.status(200).json({
        success: true,
        message: `${userData.name} has been ${action}`,
        is_blocked: userData.is_blocked,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while blocking/unblocking the user",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    const deleteUser = await User.findByIdAndDelete(id);
    if (deleteUser) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({
        success: false,
        message: "An error occured while deleting the user",
      });
    }
  } catch (error) {
    console.error("Error occured while deleting user", error.message);
    res.status(500).json({
      success: false,
      message: "An error occured while deleting the user",
    });
  }
};

// display users or search users
const searchUser = async (req, res) => {
  try {
    console.log(" users search funciton called");

    const searchQuery = req.query.search;
    let users;

    if (searchQuery) {
      const query = {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      };

      //only add phone number to the query if the searchQuery is a valid number
      if (!isNaN(searchQuery)) {
        query.$or.push({ phone: parseInt(searchQuery) });
      }

      users = await User.find(query);
    } else {
      users = await User.find({});
    }

    res.render("dashboard", {
      title: "Dashboard | Admin",
      users: users,
      searchQuery: searchQuery || "",
    });
  } catch (error) {
    console.error("Error in search user", error.message);
    req.flash("error", "An error occured while searching");
    res.redirect("admin/customers");
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error("error while destroying session", error.message);
      }
    });

    res.redirect("/admin");
  } catch (error) {
    console.error(error.message);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    res.render("addProduct", { title: "Add Product | Millions Club" });
  } catch (error) {
    console.error(error.message);
  }
};

const addProduct = async (req, res) => {
  console.log("add product is working");

  try {
    const productData = {
      barcode: req.body.barcode,
      SKU: req.body.sku,
      productName: req.body.productName,
      category: req.body.category,
      subCategory: req.body.subCategory,
      brand: req.body.brand,
      cost: req.body.cost,
      discount: {
        percentage: req.body.discountPercentage,
        valid_until: req.body.validUntil,
      },
      stock: [
        {
          size: req.body.stockSize,
          color: req.body.stockColor,
          quantity: req.body.stockQuantity,
          price: {
            regularPrice: req.body.regularPrice,
            salePrice: req.body.salePrice,
          },
        },
      ],
      photos: req.savedImages,
    };

    const newProduct = new products(productData);
    await newProduct.save();

    req.flash("success", "Product added successfully");
    res.redirect("/admin/catalog");
  } catch (error) {
    console.error("Error while adding product:", error.message);
    req.flash("error", "An error occurred while adding the product.");
    res.redirect("/admin/add-product");
  }
};

// display product or search product
const searchProduct = async (req, res) => {
  try {
    console.log("display display product is working");

    const searchQuery = req.query.search;
    let listProduct;

    if (searchQuery) {
      const query = {
        $or: [{ productName: { $regex: searchQuery, $options: "i" } }],
      };

      if (!isNaN(searchQuery)) {
        query.$or.push({ barcode: parseInt(searchQuery) });
      }

      listProduct = await products.find(query);
    } else {
      listProduct = await products.find({});
    }

    res.render("dashboard", {
      product: listProduct,
      searchQuery: searchQuery,
      title: "Catalog | Admin",
    });
  } catch (error) {
    console.error("Error while search Product......." + error.message);
    req.flash("error", "An error occured while searching");
    res.redirect("admin/catalog");
  }
};

const deleteProduct = async (req, res) => {
  try {
    console.log("delete product working");

    const id = req.params.id;

    const deletedProduct = await products.findByIdAndDelete(id);
    if (deletedProduct) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the product",
    });
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.query.Id;

    const productData = await products.findById(id);

    res.render("editProduct", {
      product: productData,
      title: "Edit Product | MillionsClub",
    });
  } catch (error) {
    console.error("An error occured while updating product", error.message);
    req.flash("error", "An error occured while updating product");
  }
};



const updateProduct = async (req,res)=>{
  try {

    const id = req.query.Id;
    const updated =   moment().format("YYYY-MM-DD HH:mm:ss");

    const productData = {
      barcode: req.body.barcode,
      SKU: req.body.sku,
      productName: req.body.productName,
      category: req.body.category,
      subCategory: req.body.subCategory,
      brand: req.body.brand,
      cost: req.body.cost,
      discount:{
        percentage:req.body.discountPercentage,
        valid_until: req.body.validUntil,
      },
      stock:[
        {
          size: req.body.stockSize,
          color: req.body.stockColor,
          quantity: req.body.stockQuantity,
          price:{
            regularPrice: req.body.regularPrice,
            salePrice: req.body.salePrice,
          }
        }
      ],
      updated:updated,

    }


    await products.findByIdAndUpdate(
      id,
      {$set:productData}
      
    )

    req.flash('success','Product upation successfull')
    res.redirect('/admin/catalog')

  } catch (error) {
    console.error('error occured while updating product',error.message);
    req.flash('error','An error occured while updating the product')
  }
};

module.exports = {
  loadLoginPage,
  verifyLogin,
  loadDashboard,
  editUser,
  updateUser,
  deleteUser,
  loadAddUser,
  addUser,
  blockUser,
  searchUser,
  logout,
  loadAddProduct,
  addProduct,
  searchProduct,
  deleteProduct,
  editProduct,
  updateProduct,
};
