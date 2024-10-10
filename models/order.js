// order.js file:

const mongoose = require("mongoose");
const moment = require("moment");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  invoiceNumber: { type: String, unique: true }, 
  paymentMethod: {
    type: String,
    enum: ["COD", "Razorpay"],
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
  razorpayOrderId: {
    type: String,
  },
  deliveryStatus: {
    type: String,
    enum: ["Processing", "Shipped", "Deliverd"],
    default: "Processing",
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  totalQuantity: {
    type: Number,
    required: true,
  },
  deliveryAddress: {
    fullName: String,
    mobileNumber: String,
    pincode: Number,
    locality: String,
    address: String,
    city: String,
    state: String,
    addressType: String,
  },
  createdAt: {
    type: Date,
    default: () => moment().format("YYYY-MM-DD HH:mm:ss"),
  },
});

module.exports = mongoose.model("Order", orderSchema);
