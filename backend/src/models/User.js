const mongoose = require("mongoose");
const {Schema} = mongoose;

const userschema = new Schema({
     name:{
          type: String,
          required:true,
          minLength:2,
          maxLength:60,
     },
     email:{
          type: String,
          required:true,
          lowercase: true,
          trim: true,
          unique: true 
     },
     password:{
          type: String,
          required:true,
     }
});


const User = mongoose.model("User",userschema);

module.exports = User;

