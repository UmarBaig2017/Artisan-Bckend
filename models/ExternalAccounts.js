const mongoose = require('mongoose');
const ExternalAcctSchema = new mongoose.Schema({
  
  firebaseUID:{
      type:String
  },
  createdDate:{
      type:Date,
      default:Date.now()
  },
  account_holder_name:{
      type:String
  },
  currency:{
      type:String,
      default:"usd"
  },
  account_holder_type:{
      type:String
  },
  routing_number:{
      type:String
  },
  country:{
      type:String,
      default:"US"
  },
  account_number:{
      type:String
  }

});

module.exports = mongoose.model('ExternalAccounts', ExternalAcctSchema);