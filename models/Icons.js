const mongoose = require('mongoose');
const IconsSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  type:{
      type:String,
      required:true
  }

});

module.exports = mongoose.model('Icons', IconsSchema);