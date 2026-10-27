const express = require("express");
const authMiddleware = require("../middleware/auth");
const {generateStudyPlan} = require("../services/studyPlanService");
const router = express.Router();
const StudyPlan = require("../models/StudyPlanModel");



router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const now = new Date();

         const indiaDate = new Intl.DateTimeFormat("en-CA", {
                      timeZone: "Asia/Kolkata",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit"
          }).format(now);

        const startDate = indiaDate;

        const studyPlan = await generateStudyPlan(
            req.user._id,
            startDate
        );

        return res.status(201).json({
            message: "Study plan generated successfully",
            studyPlan
        });
    } catch (error) {
    console.error("Study plan generation error:", error);

    return res.status(500).json({
        message: "Failed to generate study plan"
    });
   }
});



// Replan from the current India-local date using only pending work and future
// availability. A new snapshot is created; previous plans are preserved.
router.post("/replan", authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const startDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(now);

        const studyPlan = await generateStudyPlan(req.user._id, startDate);

        return res.status(201).json({
            message: "Remaining schedule replanned successfully",
            studyPlan,
        });
    } catch (error) {
        console.error("Study plan replanning error:", error);
        return res.status(500).json({
            message: error.message === "Availability has not been configured."
                ? error.message
                : "Failed to replan the remaining schedule",
        });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const studyPlans = await StudyPlan.find({
            userId: req.user._id
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            studyPlans
        });
    } catch (error) {
        console.error("Fetch study plans error:", error);

        return res.status(500).json({
            message: "Failed to fetch study plans"
        });
    }
});



module.exports = router;