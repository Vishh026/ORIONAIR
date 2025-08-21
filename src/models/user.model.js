const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type:String,
            required:true
        },
        lastname: {
            type:String,
            required:true
        }
    },
    username: {
        type:String,
        // required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String
    }
})

const userModel = mongoose.model('user',userSchema)

module.exports = userModel