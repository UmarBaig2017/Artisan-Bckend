const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
    from:{
        type:Number,
        required:true
    },
    to:{
        type:Number,
        required:true
    }
})
const ShippingSchema = new mongoose.Schema({
  domesticService:{
      type:String,
      required:true
  },
  domCost:{
      type:Number,
      required:true
  },
  domAdditional:{
      type:Number
  },
  domDelivery:{
    type:deliverySchema
  },
  internationalService:{
      type:String,
      required:true
  },
  intCost:{
      type:Number,
      required:true
  },
  intAdditional:{
      type:Number
  },
  intDelivery:{
    type:deliverySchema
  },
  firebaseUID:{
      type:String,
      required:true
  }
});

module.exports = mongoose.model('shippings', ShippingSchema);