const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
    from:{
        type:Number
    },
    to:{
        type:Number
    }
})
const ShippingSchema = new mongoose.Schema({
  domesticService:{
      type:String
  },
  domCost:{
      type:Number
  },
  domAdditional:{
      type:Number
  },
  domDelivery:{
    type:deliverySchema
  },
  internationalService:{
      type:String
  },
  intCost:{
      type:Number
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
  },
  title:{
      type:String,
      required:true
  },
  description:{
      type:String,
      required:true
  },
  type:{
      type:String
  }
});

module.exports = mongoose.model('shippings', ShippingSchema);