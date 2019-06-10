//Imports
const express = require('express')
const app = express()
const process = require('process')
const bodyParser = require('body-parser')
const User = require('./models/User')
const mongoose = require('mongoose')
const Listings = require('./models/Listings')
const Activity = require('./models/ProfileActivity')
const Shipping = require('./models/Shipping')
const Category = require('./models/Categories')
const Chats = require('./models/Chats')
const Reports = require('./models/Reports')
const Icons = require('./models/Icons')
const port = process.env.PORT || 5000
const cors = require('cors')
const client = require('socket.io').listen(5001).sockets;
app.use(bodyParser.json())  //Body Parser MiddleWare
app.use(express.json())
mongoose.connect('mongodb://demo:demo123@ds133137.mlab.com:33137/puroartisan', { useNewUrlParser: true }) //MongoDB connection using Mongoose
var db = mongoose.connection //Mongo Connection Instance
db.on('open', () => console.log('database connected'))
app.use(cors())
app.get('/', function (req, res) {  //HomePage for API
    res.json({ message: 'Welcome' })
})

app.post('/api/addUser', (req, res) => {
    console.log(req.body)
    const user = req.body
    User.create(user, (err, doc) => {
        if (err) {
            res.json(err)
        }
        Activity.create({ firebaseUID: doc.firebaseUID })
        res.json({
            message: "Success",
            user: doc
        })
    })
})
app.put('/api/addImage', (req, res) => {
    const user = req.body
    if (user.profilePic) {
        User.findOneAndUpdate({ firebaseUID: user.firebaseUID }, { $set: { profilePic: user.profilePic } }, { new: true }, (err, doc) => {
            if (err) throw err
            res.json({
                message: 'Success',
                data: doc
            })
        })
    }
})
app.post('/api/status', (req, res) => {


    User.findOne({ firebaseUID: req.body.firebaseUID }, 'isLoggedIn', (err, data) => {
        if (err) res.json(err)
        res.json({
            message: 'Success',
            data
        })
    })
})

app.put('/api/login', (req, res) => {
    console.log('API call', req.body)
    const firebaseUID = req.body
    User.findOneAndUpdate(firebaseUID, { $set: { isLoggedIn: true } }, { new: true }, (err, doc) => {
        if (err) res.json(err)
        res.json({
            message: 'Success',
            user: doc
        })
    })
})
app.put('/api/logout', (req, res) => {
    const firebaseUID = req.body
    User.findOneAndUpdate(firebaseUID, { isLoggedIn: false }, { new: true }, (err, doc) => {
        if (err) res.json(err)
        res.json({
            message: 'Success',
            user: doc
        })
    })
})
app.post('/api/addListing', (req, res) => {
    const data = req.body
    Listings.create(data, (err, doc) => {
        if (err) res.json(err)
        else{
            Activity.findOneAndUpdate({ firebaseUID: doc.firebaseUID }, { $push: { onSale: doc._id } }, { new: true }, (err, docs) => {

            })
            res.json({
                message: 'Success',
                data: doc
            })
        }
    })
})
app.put('/api/addToken',(req,res)=>{
    const {token} = req.body
    console.log(token)
    console.log(typeof token)
    if(token){
        User.findOneAndUpdate({firebaseUID:req.body.firebaseUID},{$push:{tokens:token}},{new:true},(err,doc)=>{
            if(err)throw err
            res.json({
                message:"Success",
                doc
            })
        })
    }
    else{
        res.json({
            message:'Error'
        })
    }
})
app.post('/api/findByLocation',(req,res)=>{
    if(req.body.longitude && req.body.latitude && req.body.distance)
    {
    console.log(req.body.latitude)
    Listings.find(
        {
          geometry: {
             $nearSphere: {
                $geometry: {
                   type : "Point",
                   coordinates : [req.body.longitude,  req.body.latitude ]    //longitude and latitude
                },
                $minDistance: 0,
                $maxDistance: req.body.distance*1000
             }
          }
        },
        (err,docs)=>{
            if(err)throw err
            res.json({
                message:"Success",
                docs
            })   
        }
     )
    }
     else res.json({
         message:"Lcation Not Found",

     })
})
app.post('/api/getListings:page', (req, res) => {
    const query = Object.assign({}, req.body)
    var perPage = 20
    var page = req.params.page || 1
    console.log(query)
    if (query.hasOwnProperty("minPrice")) {
        delete query.minPrice
        delete query.maxPrice
        if (query.hasOwnProperty('last')) {
            let startDate = new Date()
            startDate.setDate(startDate.getDate() - query.last)
            startDate.setHours(0)   // Set the hour, minute and second components to 0
            startDate.setMinutes(0)
            startDate.setSeconds(0)
            Listings.find({
                trade: query.trade, $or: [{ shippingNational: query.deliverable }, { shippingInternational: query.deliverable }], price: {
                    $lte: req.body.maxPrice,
                    $gte: req.body.minPrice
                },
                createdDate: { $gte: startDate }
            }).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {

                Listings.estimatedDocumentCount().exec((err, count) => {
                    if (err) return res.json({ message: err })
                    res.json({
                        data,
                        current: page,
                        pages: Math.ceil(count / perPage)
                    })
                })
            })
        }
        else {
            Listings.find({
                trade: req.body.trade, $or: [{ shippingNational: req.body.deliverable }, { shippingInternational: req.body.deliverable }], price: {
                    $lte: req.body.maxPrice,
                    $gte: req.body.minPrice
                }
            }).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {

                Listings.estimatedDocumentCount().exec((err, count) => {
                    if (err) return res.json({ message: err })
                    else res.json({
                        data,
                        current: page,
                        pages: Math.ceil(count / perPage)
                    })
                })
            })
        }
    }
    else {
        Listings.find(query).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {
            Listings.estimatedDocumentCount().exec((err, count) => {
                if (err) return res.json({ message: err })
                else res.json({
                    data,
                    current: page,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
    }
})
app.post('/api/getFilteredListings:page',(req,res)=>{
    const query = Object.assign({}, req.body)
    var perPage = 20
    var page = req.params.page || 1
    if (query.hasOwnProperty('last')) {
        let startDate = new Date()
        startDate.setDate(startDate.getDate() - query.last)
        startDate.setHours(0)   // Set the hour, minute and second components to 0
        startDate.setMinutes(0)
        startDate.setSeconds(0)
        Listings.find({
            trade: query.trade,shippingNational:query.shippingNational,shippingInternational:query.shippingInternational,
                price: {
                $gte: req.body.minPrice
            },
            createdDate: { $gte: startDate }
        }).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {

            Listings.estimatedDocumentCount().exec((err, count) => {
                if (err) return res.json({ message: err })
               else res.json({
                    data,
                    current: page,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
    }
    
})
app.post('/api/addIcons',(req,res)=>{
    const data = req.body
    let icons = data.map(icon=>{
        return{
            name:icon,
            type:'ionicon'
        }
    })
    Icons.create(icons,(err,docs)=>{
        if(err)throw err
        res.json({
            message:'Success',
            docs
        })
    })
})
app.get('/api/getIcons:type',(req,res)=>{
    let {type} = req.params
    Icons.find({type:type},(err,docs)=>{
        if(err)throw err
        res.json({
            message:'Success',
            docs
        })
    })
})
app.get('/api/getListing:listingId', (req, res) => {
    Listings.findById(req.params.listingId, (err, doc) => {
        if (err) throw err
        User.findOne({ firebaseUID: doc.firebaseUID }, 'fName profilePic', (err, data) => {
            Shipping.findOne({ firebaseUID: doc.firebaseUID }, (err, shipping) => {
                let result = {
                    doc,
                    userData: data,
                    shipping
                }
                if (err) throw err
                res.json({
                    message: "Success",
                    result
                })
            })
        })
    })
})


app.get('/api/getShipping:firebaseUID', (req, res) => {
    Shipping.findOne({ firebaseUID: req.params.firebaseUID }, (err, docs) => {
        if (err) res.json(err)
        res.json({
            message: "Success",
            data: docs
        })
    })
})
app.put('/api/addShipping', (req, res) => {
    Shipping.findOne({ firebaseUID: req.body.firebaseUID }, (err, docs) => {
        if (err) throw err
        if (docs === null) {    //insert
            let data = req.body
            Shipping.create(data, (err, docs) => {
                if (err) res.json(err)
                return res.json({
                    message: "Success",
                    data: docs
                })
            })
        }
        else {           //update
            let data = req.body
            Shipping.findOneAndUpdate({ firebaseUID: req.body.firebaseUID }, data, { new: true }, (err, doc) => {
                if (err) throw err
                return res.json({
                    message: "Success",
                    data: doc
                })
            })
        }
    })
})
app.get('/api/getProfile:firebaseUID', (req, res) => {
    User.findOne({ firebaseUID: req.params.firebaseUID }, (err, doc) => {
        if (err) res.json(err)
        let data = doc
        Activity.findOne({ firebaseUID: req.body.firebaseUID }, (err, docs) => {
            if (err) res.json(err)
            let userData = {
                data, docs
            }
            res.json({
                message: 'Success',
                user: userData
            })
        })
    })
})
app.post('/api/addCategory', (req, res) => {
    Category.create(req.body, (err, docs) => {
        if (err) res.json(err)
        res.json({
            message: "Success",
            category: docs
        })
    })
})
app.post('/api/addSubCategory', (req, res) => {
    Category.findByIdAndUpdate({ _id: req.body.id }, { $push: { subCategories: req.body } }, { new: true }, (err, docs) => {
        if (err) res.json(err)
        res.json({
            message: "Success",
            data: docs
        })
    })
})
app.delete('/api/deleteCategory', (req, res) => {
    Category.findByIdAndRemove(req.body.id, (err, doc) => {
        if (err) res.json(err)
        res.json({
            message: "Success",
            data: doc
        })
    })
})
app.put('/api/addFavorite', (req, res) => {
    Activity.findOneAndUpdate({ firebaseUID: req.body.firebaseUID }, { $push: { Favorites: req.body.id } }, { new: true }, (err, docs) => {
        if (err) res.json(err)
        res.json({
            message: "Success",
            data: docs
        })
    })
})
app.post('/api/report',(req,res)=>{
    Reports.create(req.body,(err,doc)=>{
        if(err)throw err
        res.json({
            message:"Success",
            data:doc
        })
    })
})
// app.get('/api/getChats',(req,res)=>{
//     const chatIds = req.body
//     let chats = []
//     chatIds.forEach(id=>{
//         Chats.findById(id,(err,docs)=>{
//             if(err)return err
//             chats.push(docs)
//         })
//     })
//     if(chats.length>0){
//         res.json({
//             message:"Success",
//             data:chats
//         })
//     }
//     else{
//         res.json({
//             message:"No chat found"
//         })
//     }

// })
/*
Get messages of a chat by userID
    if chat is found, return chat with messages
        else
        create chat for firebaseUID of user, push the chatId 
*/
app.put('/api/getChats', (req, res) => { //get messages of a chat from conversations
    Activity.findOne({ firebaseUID: req.body.firebaseUID }, 'Conversations', (err, doc) => {
        if (err) throw err

        if (doc.Conversations) {
            let conversations = doc.Conversations
            let objecIDs = conversations.map(conversation => mongoose.Types.ObjectId(conversation))
            if (conversations.length > 0) {
                Chats.find({ _id: { $in: objecIDs } }, (err, docs) => {
                    if (err) throw err
                    if (docs.length > 0)
                        res.json({
                            message: "Success",
                            data: docs
                        })
                })
            }
        }
    })
})
// app.post('/api/getChatMessages',(req,res)=>{
//     Chats.findById(req.body.chatId,(err,doc)=>{
//         if(err)throw err
//         res.json({
//             message:"Success",
//             data:doc
//         })
//     })
// })
app.get('/api/getTokens:firebaseUID',(req,res)=>{
        User.findOne({firebaseUID:req.params.firebaseUID},'tokens',(err,doc)=>{
            if(err)throw err
            res.json({
                message:'Success',
                doc
            })
        })
})
app.get('/api/getCategories',(req,res)=>{
    Category.find({},(err,docs)=>{
        if (err) throw err
        res.json({
            message: "success",
            docs
        })
    })
})
app.put('/api/getMessages', (req, res) => {         //get messages of a chat from listing
    Chats.findOne({ sellerUserID: req.body.sellerUserID, firebaseUID: req.body.firebaseUID }, (err, docs) => {
        if (err) res.json(err)
        console.log(docs)
        if (docs !== null) {
            res.json({
                message: "Success",
                data: docs
            })
        }
        else {
            let data = req.body
            Chats.create(data, (err, doc) => {
                if (err) res.json(err)
                if (doc !== null) {
                    Activity.findOneAndUpdate({ firebaseUID: req.body.firebaseUID }, { $push: { Conversations: doc._id } }, { new: true }, (err, res) => console.log('Buyer DOne...', res))
                    Activity.findOneAndUpdate({ firebaseUID: req.body.sellerUserID }, { $push: { Conversations: doc._id } }, { new: true }, (err, res) => console.log('Seller DOne...', res))
                    res.json({
                        message: "Chat created",
                        data: doc
                    })

                }

            })
        }
    })
})
app.post('/api/getUsers:page', (req, res) => {
    const query = Object.assign({}, req.body)
    var perPage = 20
    var page = req.params.page || 1
    console.log(query)
    if (query.hasOwnProperty("minPrice")) {
        delete query.minPrice
        delete query.maxPrice
        if (query.hasOwnProperty('last')) {
            let startDate = new Date()
            startDate.setDate(startDate.getDate() - query.last)
            startDate.setHours(0)   // Set the hour, minute and second components to 0
            startDate.setMinutes(0)
            startDate.setSeconds(0)
            User.find({
                trade: query.trade, $or: [{ shippingNational: query.deliverable }, { shippingInternational: query.deliverable }], price: {
                    $lte: req.body.maxPrice,
                    $gte: req.body.minPrice
                },
                createdDate: { $gte: startDate }
            }).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {

                User.estimatedDocumentCount().exec((err, count) => {
                    if (err) return res.json({ message: err })
                    res.json({
                        data,
                        current: page,
                        pages: Math.ceil(count / perPage)
                    })
                })
            })
        }
        else {
            User.find({
                trade: req.body.trade, $or: [{ shippingNational: req.body.deliverable }, { shippingInternational: req.body.deliverable }], price: {
                    $lte: req.body.maxPrice,
                    $gte: req.body.minPrice
                }
            }).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {

                User.estimatedDocumentCount().exec((err, count) => {
                    if (err) return res.json({ message: err })
                    res.json({
                        data,
                        current: page,
                        pages: Math.ceil(count / perPage)
                    })
                })
            })
        }
    }
    else {
        User.find(query).skip((perPage * page) - perPage).limit(perPage).exec((err, data) => {
            User.estimatedDocumentCount().exec((err, count) => {
                if (err) return res.json({ message: err })
                res.json({
                    data,
                    current: page,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
    }
})
app.put('/api/searchListing', (req, res) => {
    Listings.find({ $text: { $search: req.body.title } })
        .limit(10)
        .exec((err, docs) => {
            if (err) throw err
            res.json(docs)
        });
})
client.on('connection', (socket) => {
    console.log('Client connected')
    // Create function to send status
    sendStatus = function (s) {
        socket.emit('status', s);
    }

    // Get chats from mongo collection
    // Handle input events
    socket.on('input', (response) => {

        let data = JSON.parse(response)
        let { chatId } = data
        let message = {}
        if (data.hasOwnProperty('text')) {
            message = {
                createdAt: data.createdAt,
                text: data.text,
                senderAvatarLink: data.senderAvatarLink,
                senderID: data.senderID
            }
        }
        else if (data.hasOwnProperty('image')) {
            message = {
                createdAt: data.createdAt,
                image: data.image,
                senderAvatarLink: data.senderAvatarLink,
                senderID: data.senderID
            }
        }
        let firebaseUID = data.senderID
        // Check for name and message
        if (firebaseUID == '' || message == undefined) {
            // Send error status
            return
        } else {
            // Insert message
            Chats.findByIdAndUpdate(chatId, { $push: { messages: message } }, { new: true }, (err, docs) => {
                if (err) console.log('Error: ' + err)
                let newmsg = docs.messages[docs.messages.length - 1]
                newmsg.fName = docs.fName
                let emitter = socket.broadcast
                emitter.emit('Sent', JSON.stringify(newmsg))
            })
            // Chats.insert({firebaseUID: firebaseUID, message: message}, function(){
            //     client.emit('output', [data]);

            //     // Send status object
            //     sendStatus({
            //         message: 'Message sent',
            //         clear: true
            //     });
            // });
        }
    });

    // Handle clear
    socket.on('clear', function (data) {
        // Remove all chats from collection
        Chats.remove({}, function () {
            // Emit cleared
            socket.emit('cleared');
        });
    });
});
//Server
app.listen(port, function () {
    console.log('Listening on port' + port)
})


