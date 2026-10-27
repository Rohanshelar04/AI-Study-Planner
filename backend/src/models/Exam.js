const mongoose = require("mongoose");


const examSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    examName:{
        type:String,
        required: true,
        trim: true
    },
     examDate: {
        type: Date,
        required: true
    },
},{ timestamps: true });


const Exam = mongoose.model("Exam",examSchema);

module.exports = Exam;