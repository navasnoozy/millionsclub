//userController.js file

const User = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const sendMail = require("../auth/sendMail");
const moment = require("moment");

const Razorpay = require("razorpay");


const Order = require("../models/order");


const productModel = require("../models/productsModel").products;
const Cart = require("../models/cartModel");

const order = require("../models/order");

const tokenMap = new Map();


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcryptjs.hash(password, 10);
    return passwordHash;
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
      $or: [{ email: email }, { phone: phone }],
    });

    if (existingUser) {
      if (existingUser.email == email) {
        return res.render("signup", { message: "Email ID already registered" });
      } else if (existingUser.phone == phone) {
        return res.render("signup", {
          message: "Mobile number already registered",
        });
      }
    }

    const securedPassword = await securePassword(password);

    const newUser = new User({
      name: name,
      phone: phone,
      email: email,
      password: securedPassword,
    });

    const UserData = await newUser.save();

    if (UserData) {
      const mailSubject = "Millions Club : Verify your email";
      const mailContent = `<div style="background-color:  aquamarine; display: flex; justify-content: center; align-items: center; border-radius: 15px; box-shadow: 0 0 1px green; padding: 20px; margin: 20px;">
    <h2 style="color: green;"> Hi ${UserData.name}!  click <a style="text-decoration: none;" href="http://localhost:5001/verifyEmail?id=${UserData._id}">here</a> to verify your mail id  </h2>
    </div>`;

      await sendMail(UserData, mailSubject, mailContent);

      const token = crypto.randomBytes(32).toString("hex");
      tokenMap.set(token, UserData._id);
      setTimeout(() => {
        tokenMap.delete(token);
      }, 5 * 60 * 1000);

      res.redirect(`/verify?token=${token}`);
    } else {
      res.render("signup", { message: "Registration failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyPage = async (req, res) => {
  try {
    const token = req.query.token;
    const userId = tokenMap.get(token);

    if (!userId) {
      return res.render("verificationPage", { message: "Time Out" });
    }

    tokenMap.delete(token);
    const UserData = await User.findById(userId);

    res.render("verificationPage", {
      message:
        "Registration successful! Please check your email and follow the instructions to verify your account.",
      user: UserData,
    });
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
      req.session.user_id = req.query.id;
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
    const { phone, email, password } = req.body;
    const UserData = await User.findOne({ email: email });

    if (!UserData || UserData.is_blocked === 1) {
      return res.render("login", { message: "Invalid Login id or password" });
    }

    if (UserData.email_verified !== 1 && UserData.phone_verified !== 1) {
      return res.render("login", {
        message: "Your account verification is peding",
      });
    }

    const passwordMatch = await bcryptjs.compare(password, UserData.password);

    if (passwordMatch) {
      req.session.user_id = UserData._id;
      return res.redirect("/user-home");
    } else {
      return res.render("login", { message: "Invalid Login id or password" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("login", {
      message: "An error occurred while logging in. Please try again.",
    });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error)
        throw (error = console.error("error destroying session", error));
    });

    res.redirect("/user-home");
  } catch (error) {
    console.error(error.message);
  }
};

const mongoose = require('mongoose');



const userHome = async (req, res) => {
  try {
    let user = null;
    let cart = null;

    if (req.session.user_id) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(req.session.user_id);
      
      if (isValidObjectId) {
        user = await User.findById(req.session.user_id);
        cart = await Cart.findOne({ userId: req.session.user_id });
      } else {
        console.error('Invalid ObjectId:', req.session.user_id);
      }
    }

    const products = await productModel.find({});

    res.render("userHome", {
      title: `Hi ${user ? user.name : "Guest"}`,
      user: user,
      products: products,
      cart: cart,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).render("error", { message: "An error occurred while loading the home page." });
  }
};


const loadProductPage = async (req, res) => {
  try {
    const id = req.query.Id;
    let user = null;
    let cart = null;
    let totalItems = 0;

    if (req.session.user_id) {
      user = await User.findById({ _id: req.session.user_id });
      cart = await Cart.findOne({ userId: user._id });
    }

    const product = await productModel.findById(id);
    const relatedProducts = await productModel
      .find({
        category: product.category,
        _id: { $ne: product._id },
      })
      .limit(4);

    res.render("productPage", {
      title: product.productName,
      user: user,
      product: product,
      products: relatedProducts,
      cart: cart,
    });
  } catch (error) {
    console.log(error.message, "An error occured while loading product page");
  }
};

const addtoCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.session.user_id;

    const product = await productModel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId: userId });

    if (cart) {
      const existingProductIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (existingProductIndex > -1) {
        cart.products[existingProductIndex].quantity += 1;
      } else {
        cart.products.push({
          productId: productId,
          quantity: 1,
          price: product.stock[0].price.salePrice,
        });
      }
    } else {
      cart = new Cart({
        userId: userId,
        products: [
          {
            productId: productId,
            quantity: 1,
            price: product.stock[0].price.salePrice,
          },
        ],
      });
    }

    const totals = cart.products.reduce(
      (acc, item) => {
        return {
          totalPrice: acc.totalPrice + item.quantity * item.price,
          totalQuantity: acc.totalQuantity + item.quantity,
        };
      },
      { totalPrice: 0, totalQuantity: 0 }
    );

    cart.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");
    (cart.totalPrice = totals.totalPrice),
      (cart.totalQuantity = totals.totalQuantity);

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cartQuantity: totals.totalQuantity,
    });
  } catch (error) {
    console.error("Error while adding item to cart", error.message);
  }
};

const buyNow = async (req, res) => {
  try {
    const productId = req.query.Id;
    const userId = req.session.user_id;

    const product = await productModel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId: userId });

    if (cart) {
      const existingProductIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (existingProductIndex > -1) {
        cart.products[existingProductIndex].quantity += 1;
      } else {
        cart.products.push({
          productId: productId,
          quantity: 1,
          price: product.stock[0].price.salePrice,
        });
      }
    } else {
      cart = new Cart({
        userId: userId,
        products: [
          {
            productId: productId,
            quantity: 1,
            price: product.stock[0].price.salePrice,
          },
        ],
      });
    }

    const totals = cart.products.reduce(
      (acc, item) => {
        return {
          totalPrice: acc.totalPrice + item.quantity * item.price,
          totalQuantity: acc.totalQuantity + item.quantity,
        };
      },
      { totalPrice: 0, totalQuantity: 0 }
    );

    cart.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");
    (cart.totalPrice = totals.totalPrice),
      (cart.totalQuantity = totals.totalQuantity);

    cart = await cart.save();

    res.redirect(`/cart?cartId=${cart._id}`);
  } catch (error) {
    console.error(error.message);
  }
};

const cart = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const userData = await User.findById(userId);

    let cartData = await Cart.findOne({ userId: userData._id });

    if (!cartData) {
      return res.render("cart", {
        title: `Hi ${userData ? userData.name : "Guest"}`,
        cart: cartData,
        user: userData,
      });
    }

    cartData = await Cart.findById(cartData._id).populate({
      path: "products.productId",
      select: "productName photos discount stock",
    });



    res.render("cart", {
      title: `Hi ${userData ? userData.name : "Guest"}`,
      cart: cartData,
      user: userData,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const itemId = req.query.Id;

    const userId = req.session.user_id;

    const cart = await Cart.findOne({ userId });

    const productIndex = cart.products.findIndex(
      (product) => product._id.toString() === itemId
    );

    cart.products.splice(productIndex, 1);

    const totals = cart.products.reduce(
      (acc, item) => {
        return {
          totalPrice: acc.totalPrice + item.price * item.quantity,
          totalQuantity: acc.totalQuantity + item.quantity,
        };
      },
      { totalPrice: 0, totalQuantity: 0 }
    );


    cart.totalPrice = totals.totalPrice;
    cart.totalQuantity = totals.totalQuantity;

    if(cart.products.length===0){
      await Cart.deleteOne({_id:cart._id});
      console.log('empty cart deleted');
      
    }else{

      await cart.save()
    }



    res.redirect('/cart')

  } catch (error) {
    console.error(error.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    const { cartId, paymentMethod, deliveryAddress } = req.body;

    const cart = await Cart.findById(cartId).populate("products.productId");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }


    const date = new Date();
    const invoiceNumber = `INV-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}-${Math.floor(Math.random() * 10000)}`;


    const orderData = {
      userId: cart.userId,
      products: cart.products.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.price,
      })),
      invoiceNumber,
      paymentMethod,
      deliveryAddress,
      totalPrice: cart.totalPrice,
      totalQuantity: cart.totalQuantity,
    };

    if (paymentMethod === "COD") {
      const newOrder = new Order(orderData);
      await newOrder.save();

      // Clear the cart
      await Cart.findByIdAndDelete(cartId);

      return res
        .status(200)
        .json({
          success: true,
          orderId: newOrder._id,
          message: "Order placed successfully",
        });
    } else if (paymentMethod === "Razorpay") {
      
      const options = {
        amount: cart.totalPrice * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);

      const newOrder = new Order({
        ...orderData,
        paymentStatus: "Pending",
        razorpayOrderId: razorpayOrder.id,
      });
      await newOrder.save();

      return res.status(200).json({
        success: true,
        orderId: newOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    }
  } catch (error) {
    console.error('Error in placeOrder:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred while placing the order",
      error: error.message
      });
  }
};

const verifyPayment = async (req, res) => {
  try {

    

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, deliveryAddress } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {

      
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: "Paid" },
        { new: true }
      );

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Clear the cart
      await Cart.findOneAndDelete({ userId: order.userId });

      return res
        .status(200)
        .json({ success: true, message: "Payment verified successfully",orderId:order._id });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while verifying the payment",
      });
  }
};

const loadOrderConfirmation = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).render("error", { message: "Order not found" });
    }

    const user = await User.findById(order.userId);

    res.render("order-confirmation", {
      title: "Order Confirmation",
      user: user,
      order: order,
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .render("error", {
        message: "An error occurred while loading the order confirmation page",
      });
  }
};

const loadUserProfile = async (req, res) => {
  try {


    const userId = req.session.user_id;

    const userData = await User.findById(userId);

    const cartData = await Cart.findOne({userId:userData._id})






    
    res.render('user-profile',{
      title:userData.name,
      user:userData,
      cart:cartData,

    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrders = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    const orders = await Order.find({ userId: userData._id })
      .populate('products.productId')
      .sort({ createdAt: -1 }); // Sort by most recent first

    res.render('orders', {
      title: `Hi ${userData.name} - Your Orders`,
      user: userData,
      orders: orders,
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).render('error', { message: 'An error occurred while loading your orders.' });
  }
};

module.exports = {
  loadSignUpPage,
  insertUser,
  verifyPage,
  verifyEmail,
  loadLoginPage,
  loginUser,

  userHome,
  logout,
  loadProductPage,
  addtoCart,
  cart,
  buyNow,
  placeOrder,
  verifyPayment,
  loadOrderConfirmation,
  deleteCartItem,
  loadUserProfile,
  loadOrders,
  verifyPayment,
};
