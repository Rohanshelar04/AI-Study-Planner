
const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },

        startTime: {
            type: Date,
            required: true,
        },

        endTime: {
            type: Date,
            default: null,
        },

        durationMinutes: {
            type: Number,
            default: 0,
            min: 0,
        },

        status: {
            type: String,
            enum: ["InProgress", "Completed"],
            default: "InProgress",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("StudySession", studySessionSchema);
