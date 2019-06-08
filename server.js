//Imports
const express = require('express')
var http = require('http');

const app = express()
var server = http.createServer(app);
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
const PaymentInfo = require('./models/PaymentInfo')
const Icons = require('./models/Icons')
const stripe = require("stripe")(process.env.LIVE_KEY);
const port = process.env.PORT || 5000
const ExternalAccount = require('./models/ExternalAccounts')
const Orders = require('./models/Orders')
const cors = require('cors')
const client = require('socket.io').listen(server).sockets;
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
    const user = req.body
    User.create(user, (err, doc) => {
        if (err) {
            res.json(err)
        }
        else{
            Activity.create({ firebaseUID: doc.firebaseUID })
        res.json({
            message: "Success",
            user: doc
        })
        }
    })
})
app.put('/api/addImage', (req, res) => {
    const user = req.body
    if (user.profilePic) {
        User.findOneAndUpdate({ firebaseUID: user.firebaseUID }, { $set: { profilePic: user.profilePic } }, { new: true }, (err, doc) => {
            if (err) res.json({message:"Failed",err})
          else  res.json({
                message: 'Success',
                data: doc
            })
        })
    }
})
app.post('/api/status', (req, res) => {
    User.findOne({ firebaseUID: req.body.firebaseUID }, 'isLoggedIn', (err, data) => {
        if (err) res.json(err)
       else res.json({
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
       else res.json({
            message: 'Success',
            user: doc
        })
    })
})
app.post('/api/googleError',(req,res)=>{
    console.log(req.body)
    res.json({
        message:"OK"
    })
})
app.post('/api/checkgoogle',(req,res)=>{
    /*
    photoURL:
   'https://lh6.googleusercontent.com/-I0Tlk-_p1Ro/AAAAAAAAAAI/AAAAAAAAAIY/PUV7eqmicSk/s96-c/photo.jpg',
  displayName: 'Hamza Ali',
  email: 'hamxa1331@gmail.com',
  isAnonymous: false,
  emailVerified: true,
  providerId: 'firebase',
  uid: 'QdTe1vcjiBZwWrKzyaV4TAghGP93' 
    */
    let {displayName,email,photoURL,uid} = req.body
    let firebaseUID = uid
    let data = {
        fName:displayName,
        email,
        firebaseUID,
        profilePic:photoURL,
        isLoggedIn:true
    }
    console.log('google')
    User.findOne({firebaseUID},(err,doc)=>{
        if(doc===null){
            User.create(data,(error,user)=>{
                if(user){
                console.log(doc)
                    Activity.create({ firebaseUID: user.firebaseUID })
                    res.json({
                        message:"Success",
                        doc:user
                    })
                }
            })
        }
        else{
            User.findOneAndUpdate({firebaseUID}, { $set: { isLoggedIn: true } }, { new: true }, (err, doc) => {
                if (err) res.json(err)
                
                else res.json({
                    message: 'Success',
                     doc
                })
            })
        }
    })
})
app.put('/api/fbLogin',(req,res)=>{
    let {firebaseUID} = req.body
    User.findOne({firebaseUID},(err,doc)=>{
        if(doc===null){
            User.create(req.body,(error,user)=>{
                if(user){
                    res.json({
                        message:"Success",
                        doc
                    })
                    Activity.create({ firebaseUID: user.firebaseUID })
                }
            })
        }
        else{
            User.findOneAndUpdate({firebaseUID}, { $set: { isLoggedIn: true } }, { new: true }, (err, doc) => {
                if (err) res.json(err)
               else res.json({
                    message: 'Success',
                     doc
                })
            })
        }
    })
})
app.put('/api/logout', (req, res) => {
    const {firebaseUID} = req.body
    User.findOneAndUpdate({firebaseUID}, { isLoggedIn: false }, { new: true }, (err, doc) => {
        if (err) res.json(err)
       else res.json({
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
    if(token){
        User.findOneAndUpdate({firebaseUID:req.body.firebaseUID},{$push:{tokens:token}},{new:true},(err,doc)=>{
            if(err)res.json({message:"Failed",err})
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
            if(err)res.json({message:"Failed",err})
           else res.json({
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
                    else res.json({
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
app.post('/api/addIcons',(req,res)=>{
    const data = req.body
    let icons = data.map(icon=>{
        return{
            name:icon,
            type:'ionicon'
        }
    })
    Icons.create(icons,(err,docs)=>{
        if(err)res.json({message:"Failed",err})
       else res.json({
            message:'Success',
            docs
        })
    })
})
app.get('/api/getIcons:type',(req,res)=>{
    let {type} = req.params
    Icons.find({type:type},(err,docs)=>{
        if(err)res.json({message:"Failed",err})
        else res.json({
            message:'Success',
            docs
        })
    })
})
app.get('/api/getListing:listingId', (req, res) => {
    Listings.findById(req.params.listingId, (err, doc) => {
        if (err) res.json({message:"Failed",err})
        User.findOne({ firebaseUID: doc.firebaseUID }, 'fName profilePic', (err, data) => {
            Shipping.findOne({ firebaseUID: doc.firebaseUID }, (err, shipping) => {
                let result = {
                    doc,
                    userData: data,
                    shipping
                }
                if (err) res.json({message:"Failed",err})
                res.json({
                    message: "Success",
                    result
                })
            })
        })
    })
})
app.put('/api/dislike',(req,res)=>{
    Activity.findOneAndUpdate({firebaseUID:req.body.firebaseUID},{$pull:{Favorites:req.body.id}},{new:true},(err,doc)=>{
        if(err)res.json({message:"Falied"})
        res.json({
            message:"Success",
            doc
        })
    })
})
app.get('/api/getCategories',(req,res)=>{
    Category.find({},(err,docs)=>{
        if(err)res.json({message:"Failed",err})
        else res.json({
            message:"Success",
            docs
        })
    })
})
app.get('/api/getShippings:firebaseUID', (req, res) => {
    Shipping.find({ firebaseUID: req.params.firebaseUID }, (err, docs) => {
        if (err) res.json(err)
        res.json({
            message: "Success",
            data: docs
        })
    })
})
app.get('/api/getShipping:id',(req,res)=>{
    Shipping.findById(req.params.id,(err,doc)=>{
        if(err)res.json({message:"Failed",err})
       else res.json({
            message:"Success",
            data:doc
        })
    })
})
app.delete('/api/deleteShipping:id',(req,res)=>{
    Shipping.findByIdAndDelete(req.params.id,(err,doc)=>{
        if(err)res.json({message:"Failed",err})
        else{
            res.json({
                message:"Success",
                doc
            })
        }
    })
})
app.post('/api/getFilteredShippings',(req,res)=>{
    Shipping.find({firebaseUID:req.body.id,type:req.body.type},(err,docs)=>{
        if(err)res.json({message:"Failed",err})
        else{
            res.json({
                message:"Success",
                docs
            })
        }
    })
})

app.put('/api/updateShipping:id',(req,res)=>{
    const query = Object.assign({}, req.body)
    let id = req.params.id
    Shipping.findByIdAndUpdate(id,query,{new:true},(err,doc)=>{
        if(err)res.json({message:'Failed',err})
        else{
            res.json({
                message:"Success",
                doc
            })
        }
    })
})
app.get('/api/getShips',(req,res)=>{
    Shipping.find({},(err,docs)=>{
        if(err)res.json({
            message:"Failed",
            err
        })
        res.json({
            message:"Success",
            docs
        })
    })
})
app.put('/api/addShipping', (req, res) => {
    let data = req.body
            Shipping.create(data, (err, docs) => {
                if (err) res.json(err)
                return res.json({
                    message: "Success",
                    data: docs
                })
            })
})
app.put('/api/editShipping:id',(req,res)=>{
    let id = req.body.id

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
    Category.findByIdAndUpdate(req.body.id, { $push: { subCategories: req.body } }, { new: true }, (err, docs) => {
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
        else res.json({
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
app.get('/api/getFavoriteIds:firebaseUID',(req,res)=>{
    if(req.params.firebaseUID!==null){
        Activity.findOne({firebaseUID:req.params.firebaseUID},'Favorites',(err,docs)=>{
            if(err)res.json({
                message:"Failed"
            })
            else{
                res.json({
                    message:"Success",
                    docs
                })
            }
        })
    }
})

app.get('/api/getFavorites:firebaseUID',(req,res)=>{
    Activity.findOne({firebaseUID:req.params.firebaseUID},'Favorites',(err,doc)=>{
        if(err){
            console.log(err)
            res.json({message:'Failed'})
        }
        else{
                let ids = doc.Favorites
                let objecIDs = ids.map(id => mongoose.Types.ObjectId(id))
                console.log(objecIDs)
                if (ids.length > 0) {
                    Listings.find({ _id: { $in: objecIDs } }, (err, docs) => {
                        if (err) res.json({message:"Failed",err})
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
app.get('/api/getPurchases:firebaseUID',(req,res)=>{
    Activity.findOne({firebaseUID:req.params.firebaseUID},'Purchases',(err,doc)=>{
        if(err){
            res.json({message:'Failed'})
        }
        else{
                let ids = doc.Purchases
                let objecIDs = ids.map(id => mongoose.Types.ObjectId(id))
                if (ids.length > 0) {
                    Orders.find({ _id: { $in: objecIDs } }, (err, docs) => {
                        if (err) res.json({message:"Failed",err})
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
app.get('/api/Orders:firebaseUID',(req,res)=>{
    Activity.findOne({firebaseUID:req.params.firebaseUID},'Orders',(err,doc)=>{
        if(err){
            res.json({message:'Failed'})
        }
        else{
                let ids = doc.Orders
                let objecIDs = ids.map(id => mongoose.Types.ObjectId(id))
                if (ids.length > 0) {
                    Orders.find({ _id: { $in: objecIDs } }, (err, docs) => {
                        if (err) res.json({message:"Failed",err})
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
app.post('/api/report',(req,res)=>{
    Reports.create(req.body,(err,doc)=>{
        if(err)res.json({message:"Failed",err})
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
        if (err) res.json({message:"Failed",err})

        if (doc.Conversations) {
            let conversations = doc.Conversations
            let objecIDs = conversations.map(conversation => mongoose.Types.ObjectId(conversation))
            if (conversations.length > 0) {
                Chats.find({ _id: { $in: objecIDs } }, (err, docs) => {
                    if (err) res.json({message:"Failed",err})
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
app.get('/getAcc',(req,res)=>{
    stripe.accounts.list(
        { limit: 5 },
        function(err, accounts) {
          // asynchronously called
          res.json({message:"Success",accounts})
        }
      );
})
// app.post('/api/getChatMessages',(req,res)=>{
//     Chats.findById(req.body.chatId,(err,doc)=>{
//         if(err)res.json({message:"Failed",err})
//         res.json({
//             message:"Success",
//             data:doc
//         })
//     })
// })
app.get('/api/getTokens:firebaseUID',(req,res)=>{
        User.findOne({firebaseUID:req.params.firebaseUID},'tokens',(err,doc)=>{
            if(err)res.json({message:"Failed",err})
            res.json({
                message:'Success',
                doc
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
app.post('/paym',(req,res)=>{
    var collfeefloat=req.body.Category==='Services'?req.body.amount*0.2:req.body.amount*0.1
   var collfee= Math.ceil(collfeefloat)
    stripe.customers.create({
      email:req.body.token.email,   //khareed rha hai..
    }).then((customer) => {
      return stripe.charges.create({
        amount:req.body.amount,
        currency: "usd",
        source: req.body.token.id,
        application_fee_amount:collfee,   //platform pese
      }, {
        stripe_account: req.body.accountID,  //jis ko bhej rahe hain...
      }).then(function(charge) {
        let data = Object.assign({}, req.body)
        delete data.token
        Orders.create(data,(err,doc)=>{
            if(err){
                console.log(err)
                res.json({message:"Failed",err})
            }
            else{
                console.log(doc)
                Activity.findOneAndUpdate({ firebaseUID: req.body.buyerFirebaseUID }, { $push: { Purchases: doc._id } }, { new: true }, (err, res) => console.log('Buyer DOne...', res))
                Activity.findOneAndUpdate({ firebaseUID: req.body.sellerFirebaseUID }, { $push: { Orders: doc._id } }, { new: true }, (err, res) => console.log('Seller DOne...', res))
                res.json({
                    message:"Success",
                    doc,
                    charge
                })
            }
        })
      });
    });  
  })
  app.get('/api/getUserListings:firebaseUID',(req,res)=>{
      Listings.find({firebaseUID:req.params.firebaseUID},(err,docs)=>{
          if(err)res.json({message:"Failed"})
          else {
              console.log(docs)
              res.json({
                message:"Success",
                docs
            })
          }
      })
  })
  app.get('/api/getPaymentInfo:firebaseUID',(req,res)=>{
    PaymentInfo.findOne({firebaseUID:req.params.firebaseUID},(err,doc)=>{
        if(doc!==null){
            console.log(doc)
            res.json({
                message:"Success",
                doc
            })
        }

        else{
            res.json({message:"Failed"})
        }
    })
  })
  app.get('/tos',(req,res)=>{
  
    stripe.accounts.update('acct_1Eat1XIMeTEWEPkW',{
      tos_acceptance:{
        ip:req.connection.remoteAddress,
        date:Math.floor(Date.now()/1000)
      }
    })
    res.json({
      message:"Success"
    })
  })
  app.post('/createacc',(req,res)=>{
    let data = req.body
    for(let c in data){
      if(data[c]==='')
      {
      res.json({
        message:"Failed",  
      })
      return
    } 
    }
    let dateofbirth = data.dob.split('/')
    if(data.type==='Individual'){
      let account = {
        default_currency:"usd",
        type:"custom",
        country:"US",
      requested_capabilities:["card_payments"],
      business_type:"individual",
      individual:{
        first_name:data.first_name,
        last_name:data.last_name,
        gender:data.gender,
        id_number:data.ssn,
        email:data.email,
        phone:data.phone,
        dob:{
          month:dateofbirth[0],
          day:dateofbirth[1],
          year:dateofbirth[2]
        },
        address:{
          line1:data.line1,
          state:data.state,
          postal_code:data.postal_code,
          city:data.city,
          country:"US"
        }
      },
          business_profile:{
            url:data.businesweb,
            mcc:data.mcc
          },
          tos_acceptance:{
            ip:req.connection.remoteAddress,
            date:Math.floor(Date.now()/1000)
          }
      }
      stripe.accounts.create(account, function(err, response) {
        if(err){
            console.log(err)
            res.json({
                message:"Failed"
            })
        }
        else{            
            let profile = {
          businessType:"individual",
          first_name:data.first_name,
            last_name:data.last_name,
            gender:data.gender,
            ssn:data.ssn,
            email:data.email,
            phone:data.phone,
            address:{
                line1:data.line1,
                state:data.state,
                postal_code:data.postal_code,
                city:data.city,
                country:"US",
                mcc:data.mcc
              },
              dob:{
                month:dateofbirth[0],
                day:dateofbirth[1],
                year:dateofbirth[2]
              },
              firebaseUID:data.firebaseUID,
              accountID:response.id,
              businesweb:data.businesweb
            }
            PaymentInfo.create(profile,(err,doc)=>{
                if(err)res.json({message:"Failed",err})
                console.log(doc)
                res.json({
                  message:"Success",
                  doc
                })
            })
        }
      });
    }
  })
  app.post('/person',(req,res)=>{
    stripe.accounts.createPerson(
      'acct_1EaXXRCEW9pT8D0d',
      req.body,
      function(err, person) {
        if(err) res.json({message:"Failed",err})
        res.json({
          message:"Success",
          person
        })
      }
    );
  })
  app.post('/createexternalacc',(req,res)=>{
    /*
        country: '',
        currency: '',
        account_holder_name: '',
        account_holder_type: '',
        routing_number: '',
        account_number:''
    */
    let data = {
        routing_number:req.body.routing_number,
        account_holder_name:req.body.account_holder_name,
        account_holder_type:req.body.account_holder_type,
        currency:"usd",
        country:'US',
        account_number:req.body.account_number
    }
    stripe.tokens.create({
      bank_account:data
    }, function(err, token) {
        if(err)console.log(err)
        else{
            stripe.accounts.createExternalAccount(
                req.body.accountID,
                {
                  external_account:token.id,
                },
                function(err, bank_account) {
                  // asynchronously called
                  if(err)res.json({message:"Falied"})
                else{
                    console.log(bank_account)
                    let acct = {
                        ...data,
                        firebaseUID:req.body.firebaseUID
                    }
                    ExternalAccount.create(acct,(err,doc)=>{
                        res.json({
                            message:"Success",
                            doc
                        })
                    })
                }
                }
              );
        }
    });
  })
app.put('/api/searchListing', (req, res) => {
    Listings.find({ $text: { $search: req.body.title } })
        .limit(10)
        .exec((err, docs) => {
            if (err) res.json({message:"Failed",err})
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
server.listen(port, function () {
    console.log('Listening on port' + port)
})


