const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email:{
      type:String,
      required:[true,'Email is required'],
      unique:true
  },
  fName:{
      type:String,
      required:[true,'Full Name is required']
  },
  profilePic:{
      type:String
  },
  firebaseUID:{
      type:String
  },
  isLoggedIn:{
      type:Boolean,
      default:false
  },
  createdDate:{
      type:Date,
      default:Date.now()
  },
  tokens:{
      type:[String]
  }

});
UserSchema.index({name: 'text', ' fName': 'text'});
module.exports = mongoose.model('Users', UserSchema);