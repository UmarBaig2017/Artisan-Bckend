const mongoose = require('mongoose');
const ActivitySchema = new mongoose.Schema({
onSale:{
    type:[String]   //_id of Listings
},
Favorites:{
    type:[String]   //_id of Listings
},
Conversations:{
    type:[String]   //_id of Chats
},
firebaseUID:{
    type:String,
    required:true
}
});

module.exports = mongoose.model('Activity', ActivitySchema);