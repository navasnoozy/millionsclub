// productsModel.js file

const moment = require ('moment');
const mongoose = require ('mongoose');



const productsSchema = new mongoose.Schema({
    barcode: {
      type: Number,
      required: true,
      default: 0,
    },
    SKU: {
      type: String,
      default: null,
    },
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
    },
    brand: {
      type: String,
    },
    
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      percentage: {
        type: Number,
      },
      valid_until: {
        type: Date,
      },
    },
    stock: [
      {
        size: {
          type: String,
        },
        color: {
          type: String,
        },
        quantity: {
          type: Number,  // Using Number type to represent quantity
        },
        price: {
          regularPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          salePrice: {
            type: Number,
            required: true,
            min: 0,
          },
        },
        _id: false, // This line prevents Mongoose from creating an _id field for each stock entry
      }
    ],
    photos: {
      type: [String],  // Assuming you want to store paths of multiple photos
    },

    createdDate:{
      type: String,
      default: ()=> moment().format('YYYY-MM-DD HH:mm:ss')
    },

    updated:{
      type:String,
      default:'N/A',
    }
  });


  const categoriesSchema = new mongoose.Schema({
    category:{
      type:String,
      required:true,
      unique:true,
    },
    subCategories:[{
      type:String,
    }]
  })
  
  const products = mongoose.model('products',productsSchema);
  const Categories = mongoose.model('Categories',categoriesSchema);

  module.exports = {
    products,
    Categories,
  };
  