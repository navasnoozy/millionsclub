// cartModel.js file:

const mongoose = require ('mongoose');
const Schema = mongoose.Schema;
const moment = require ('moment');

const cartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    products:[
        {
            productId:{
                type:Schema.Types.ObjectId,
                ref:'products',
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            },
            price:{
                type:Number,
                required:true,
            }
        }
    ],
    totalPrice:{
        type:Number,
        required:true,
        default:0
    },
    totalQuantity:{
        type:Number,
        required:true,
        default:0
    },
    createdAt:{
        type:Date,
        default:()=>moment().format('YYYY-MM-DD HH:mm:ss')

    },
    updatedAt:{
        type:Date,
        default:null
    },

});

module.exports = mongoose.model('Cart',cartSchema);

