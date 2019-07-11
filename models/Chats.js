const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    createdAt:{
        type:String,
        default:Date.now()
    },
    text:{
        type:String
    },
    image:{
        type:String
    },
    senderAvatarLink:{
        type:String,
        default:'https://placeimg.com/140/140/any'
    },
    senderID:{
        type:String,
        required:true
    }
})

const ChatsSchema = new mongoose.Schema({
    messages:{
    type:[MessageSchema]
    },
    firebaseUID:{
    type:String,
    required:true
    },
    sellerUserID:{
        type:String,
        required:true
    },
    sellerProfilePic:{
        type:String,
        default:'https://placeimg.com/140/140/any'
    },
    sellerFname:{         //seller
        type:String,
        required:true
    },
    buyerProfilePic:{
        type:String,
        default:'https://placeimg.com/140/140/any'
    },
    buyerFname:{         //seller
        type:String,
        required:true
    },
});

module.exports = mongoose.model('Chats', ChatsSchema);