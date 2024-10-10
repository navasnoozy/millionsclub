//adminController.js

const User = require("../models/userModel");
const { products, Categories } = require("../models/productsModel");
const Order = require ('../models/order')
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
    // Fetch orders data for dashboard
    const todayOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lte: new Date().setHours(23, 59, 59, 999),
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        }
      }
    ]);

    const yesterdayOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0),
            $lte: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(23, 59, 59, 999),
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        }
      }
    ]);

    const monthOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        }
      }
    ]);

    const yearOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        }
      }
    ]);

    const totalSales = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        }
      }
    ]);


    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.aggregate([
      {
        $match:{deliveryStatus:'pending'}
      },
      {
        $group:{
          _id:null,
          orderCount:{$sum:1},
          totalAmount:{$sum:'$totalPrice'}
        }
      }
    ]);

    const processingOrders = await Order.countDocuments({deliveryStatus:"Processing"});

    const recentOrders =await Order.find()
    .sort({createdAt:-1})
    .limit(10)
    .select('')



    res.render("dashboard", {
      title: "Dashboard | Admin",
      todayOrders: todayOrders[0] || { totalSales: 0, orderCount: 0 },
      yesterdayOrders: yesterdayOrders[0] || { totalSales: 0, orderCount: 0 },
      monthOrders: monthOrders[0] || { totalSales: 0, orderCount: 0 },
      yearOrders: yearOrders[0] || { totalSales: 0, orderCount: 0 },
      totalSales: totalSales[0] || { totalSales: 0, orderCount: 0 },
      totalOrders: totalOrders,
      pendingOrders: pendingOrders,
      processingOrders: processingOrders,
      recentOrders: recentOrders
    });
    
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
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    let query;

    if (searchQuery) {
      query = {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      };

      //only add phone number to the query if the searchQuery is a valid number
      if (!isNaN(searchQuery)) {
        query.$or.push({ phone: parseInt(searchQuery) });
      }
    }

    const users = await User.find(searchQuery ? query : {})
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments(searchQuery ? query : {});

    res.render("dashboard", {
      title: "Dashboard | Admin",
      users: users,
      searchQuery: searchQuery || "",
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
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

// display product or search product
const searchProduct = async (req, res) => {
  try {


    const searchQuery = req.query.search;
    let query;

    const page = parseInt(req.query.page);
    const limit = 2;

    if (searchQuery) {
      query = {
        $or: [{ productName: { $regex: searchQuery, $options: "i" } }],
      };

      if (!isNaN(searchQuery)) {
        query.$or.push({ barcode: parseInt(searchQuery) });
      }
    }

    const listProduct = await products
      .find(searchQuery ? query : {})
      .skip((page - 1) * limit)
      .limit(limit);

    const totalProducts = await products.countDocuments(
      searchQuery ? query : {}
    );

    res.render("dashboard", {
      product: listProduct,
      searchQuery: searchQuery,
      title: "Catalog | Admin",
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.error("Error while search Product......." + error.message);
    req.flash("error", "An error occured while searching");
    res.redirect("admin/catalog");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Categories.find({});

    res.render("addProduct", { title: "Add Product | Millions Club",
      categories:categories,
     });
  } catch (error) {
    console.error(error.message);
  }
};

const addProduct = async (req, res) => {

  try {

    const categoryData = await Categories.findById({_id:req.body.categoryId});

    const productData = {
      barcode: req.body.barcode,
      SKU: req.body.sku,
      productName: req.body.productName,
      category: categoryData.category,
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



const deleteProduct = async (req, res) => {
  try {
    console.log("delete product working");

    const id = req.params.id;

    const deletedProduct = await products.findByIdAndDelete(id);
    console.log(deletedProduct.photos);

    if (deletedProduct) {
      const photoPaths = deletedProduct.photos;

      // Deleting photos from storage
      photoPaths.forEach((photoPath) => {
        const fullPhotoPath = path.join(__dirname, "../public", photoPath);
        console.log(fullPhotoPath);

        fs.unlink(fullPhotoPath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${fullPhotoPath}`, err.message);
          } else {
            console.log(`Deleted file: ${fullPhotoPath}`);
          }
        });
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ message: "Error deleting product" });
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.query.Id;

    const path = req.path;

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

const updateProduct = async (req, res) => {
  try {
    const id = req.query.Id;
    const updated = moment().format("YYYY-MM-DD HH:mm:ss");

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
      updated: updated,
    };

    await products.findByIdAndUpdate(id, { $set: productData });

    req.flash("success", "Product upation successfull");
    res.redirect("/admin/catalog");
  } catch (error) {
    console.error("error occured while updating product", error.message);
    req.flash("error", "An error occured while updating the product");
  }
};

const loadCategoryManager = async (req, res) => {
  try {
    const categories = await Categories.find({});

    res.render("categoryManager", {
      title: "Category Management",
      categories: categories,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//add new category or subcategory
const addCategory = async (req, res) => {
  try {
    const newCategory = req.body.newCategory;

    const existingCategory = await Categories.findOne({
      category: newCategory,
    });

    if (existingCategory) {
      req.flash("error", "Category already exist");
      return res.redirect("/admin/settings");
    }

    if (newCategory) {
      const addCategory = new Categories({
        category: newCategory,
      });

      await addCategory.save();
    };



    req.flash("success", `new Category Successfully Added`);
    res.redirect("/admin/settings");
  } catch (error) {
    console.error(error.message);
  }
};




const addSubCategory = async (req, res) => {
  try {
    const { category, newSubCategory } = req.body;

    // Find the category by name
    const categoryItem = await Categories.findOne({ category: category });

    if (!categoryItem) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/settings');
    }

    // Check if the subcategory already exists
    if (categoryItem.subCategories.includes(newSubCategory)) {
      req.flash('error', 'Subcategory already exists');
      return res.redirect('/admin/settings');
    }

    // Add the new subcategory
    categoryItem.subCategories.push(newSubCategory);

    // Save the updated category
    await categoryItem.save();

    req.flash('success', 'Subcategory successfully added');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error(error.message);
    req.flash('error', 'An error occurred while adding the subcategory');
    res.redirect('/admin/settings');
  }
};

const removeCategory = async (req,res)=>{
  try {
    const {Id,subCategory}= req.query;




    if(subCategory == 'undefined' && Id == 'undefined'){
      req.flash('error','Category not found');
      return res.redirect('/admin/settings');
    }

    if(!subCategory){
 await Categories.findByIdAndDelete({_id:Id})
    }else{
   await Categories.findByIdAndUpdate (
        {_id:Id},
        {$pull: {subCategories:subCategory}},
        {new:true},
      );
    };



    req.flash('success',`successfully deleted`);
    return res.redirect('/admin/settings')
    

  } catch (error) {
    console.error(error.message,'An Error occured while removing category');
    
  }
};

const getSubcategories = async (req,res)=>{
  try {
    console.log('fetching sub categories');
    
     const id = req.query.Id;

     

     const categoryData = await Categories.findOne({_id:id});

     

     if (categoryData){
      return res.status(200).json({subCategories:categoryData.subCategories});
     }else{
      return res.status(404).json({error:'Category not found'});
     }


  } catch (error) {
    console.error(error.message);
    return res.status(500).json({error:'Error while fetching subcategories'});
    
  }
};













const loadOrders = async (req, res) => {
  try {

    
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const searchQuery = req.query.search || '';
    const status = req.query.status || '';

    let query = {};
    if (searchQuery) {
      query.$or = [
        { _id: { $regex: searchQuery, $options: 'i' } },
        { 'userId.name': { $regex: searchQuery, $options: 'i' } }
      ];
    }
    if (status) {
      query.deliveryStatus = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);


      

    const totalOrders = await Order.countDocuments(query);

    res.render('dashboard', {
      title: 'Orders | Admin',
      orders: orders,
      moment: moment,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      searchQuery: searchQuery,
      status: status
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    req.flash('error', 'An error occurred while loading orders');
    res.redirect('/admin/dashboard');
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('userId', 'name email')
      .populate('products.productId', 'productName');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    res.render('orderDetails', { order: order, moment: moment }, (err, html) => {
      if (err) {
        console.error('Error rendering order details:', err);
        res.status(500).send('Error rendering order details');
      } else {
        res.send(html);
      }
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).send('Error fetching order details');
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(orderId, { deliveryStatus: status }, { new: true });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Error updating order status' });
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
  loadCategoryManager,
  addCategory,
  addSubCategory,
  removeCategory,
  getSubcategories,
  loadOrders,
  getOrderDetails,
  updateOrderStatus
};
