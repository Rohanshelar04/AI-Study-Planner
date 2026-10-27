const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            unique:true,
        },

      weeklySchedule:[
           {
               day:{
                 type:String,
                 required:true
               },
               slots:[
                   {
                         startTime:{
                             type:String,
                             required:true
                         },
                        endTime:{
                             type:String,
                             required:true
                         }

                   }
               ]

           }

      ]
});

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;