const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    name:{
        type:String
    },
    iconName:{
        type:String
    },
    iconType:{
        type:String
    },
    color:{
        type:String
    }
})

const CategorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    iconName:{
        type:String,
        required:true
    },
    iconType:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    subCategories:{
        type:[subCategorySchema]
    }
});

module.exports = mongoose.model('Categories', CategorySchema);