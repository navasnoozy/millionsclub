const moment = require ('moment');
const mongoose = require ('mongoose');

const reviewsSchema = mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      reviewText: {
        type: String,
      },
      reviewDate: {
        type: String,
        default: () => moment().format('YYYY-MM-DD HH:mm:ss'),
      }
});

module.exports = mongoose.model('reviews',reviewsSchema);