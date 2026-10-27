const mongoose = require("mongoose");


const taskSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    subjectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Subject",
        required: true,
    },
    title:{
          type:String,
          required:true,
          trim:true,
    },
   estimatedMinutes: {
      type: Number,
      required: true,
      min: 1,
   },
   remainingMinutes: {
    type: Number,
    min: 0,
    default: null
  },
   priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
   },
    status:{
        type:String,
        enum:["Pending","Completed"],
        default:"Pending"
    }
},{ timestamps: true });



const Task = mongoose.model("Task",taskSchema);

module.exports = Task;