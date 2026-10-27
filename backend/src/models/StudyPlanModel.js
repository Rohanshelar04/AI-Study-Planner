
const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["Generated"],
            required: true,
            default: "Generated",
        },

        // Snapshot of tasks successfully scheduled
        scheduledTasks: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },

        // Snapshot of tasks that could not be scheduled
        unscheduledTasks: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },

        // Tasks still waiting to be allocated
        pendingTasks: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },

        // Availability used when generating this plan
        availableSlotsSnapshot: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
    },
    { timestamps: true }
);

const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);

module.exports = StudyPlan;
