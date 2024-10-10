const moment = require ('moment');
const mongoose = require ('mongoose');

const salesSchema = mongoose.Schema({
    productId :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'product',
        required:true,
        unique:true,
    },
    totalQuantitySold:{
        type:Number,
        default:0.
    },
    totalBuyersCount:{
        type:Number,
        default:0,
    },

});


module.exports = mongoose.model('sales',salesSchema);