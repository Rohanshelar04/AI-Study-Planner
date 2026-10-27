const mongoose = require("mongoose");


const subjectSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    subjectName:{
        type:String,
        required: true,
        trim: true,
        uppercase: true
    },
    examId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"Exam",
          required:true,
    }
   
},{ timestamps: true });

subjectSchema.index(
    { userId: 1, examId: 1, subjectName: 1 },
    { unique: true }
);


const Subject = mongoose.model("Subject",subjectSchema);

module.exports = Subject;