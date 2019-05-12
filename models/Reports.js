const mongoose = require('mongoose');
const ReportScehma = new mongoose.Schema({
  email:{
      type:String,
      required:[true,'Email is required'],
      unique:true
  },
  fName:{
      type:String,
      required:[true,'Full Name is required']
  },
  firebaseUID:{
      type:String
  },
  createdDate:{
      type:Date,
      default:Date.now()
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
      type:String,
      required:true
  }

});

module.exports = mongoose.model('Reports', ReportScehma);