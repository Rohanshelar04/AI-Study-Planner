const mongoose = require("mongoose");

const studyProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    dailyStudyHours: {
        type: Number,
        required: true
    }
});

const StudyProfile = mongoose.model("StudyProfile", studyProfileSchema);

module.exports = StudyProfile;