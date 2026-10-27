const express = require("express");
const Availability = require("../models/Availability");
const router = express.Router();
const auth = require("../middleware/auth");
const validateAvailability = require("../utils/validateAvailability");
const { refreshPlanIfExists } = require("../services/studyPlanService");

router.put("/", auth, async (req, res) => {
    const id = req.user._id;
    const { weeklySchedule } = req.body;

    const result = validateAvailability(weeklySchedule);

    if (!result.valid) {
        return res.status(400).json({
            message: result.message
        });
    }

    try {
        await Availability.findOneAndUpdate(
            { userId: id },
            { weeklySchedule },
            { upsert: true, new: true, runValidators: true }
        );

        const planRefresh = await refreshPlanIfExists(id);
        return res.status(200).json({ message: "Schedule saved successfully", planRefresh });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving schedule");
    }
});

router.get("/", auth, async (req, res) => {
    const id = req.user._id;

    try {
        const availability = await Availability.findOne({ userId: id });

        if (!availability) {
            return res.status(404).send("Availability not found");
        }

        res.status(200).json(availability.weeklySchedule);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;
