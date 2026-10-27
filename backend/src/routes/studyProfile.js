const express = require("express");
const StudyProfile = require("../models/StudyProfile");
const auth = require("../middleware/auth");
const router = express.Router();

function validateHours(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 16;
}

router.get("/", auth, async (req, res) => {
    try {
        const profile = await StudyProfile.findOne({ userId: req.user._id }).lean();
        if (!profile) return res.status(404).json({ message: "Study profile has not been configured yet." });
        return res.status(200).json(profile);
    } catch (error) {
        console.error("Study profile fetch error:", error);
        return res.status(500).json({ message: "Failed to fetch study profile" });
    }
});

router.post("/", auth, async (req, res) => {
    const { dailyStudyHours } = req.body || {};
    if (!validateHours(dailyStudyHours)) return res.status(400).json({ message: "Daily study hours must be a number between 1 and 16." });
    try {
        const profile = await StudyProfile.findOneAndUpdate(
            { userId: req.user._id },
            { userId: req.user._id, dailyStudyHours },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return res.status(200).json({ message: "Study profile saved successfully", profile });
    } catch (error) {
        console.error("Study profile save error:", error);
        return res.status(500).json({ message: "Failed to save study profile" });
    }
});

router.put("/", auth, async (req, res) => {
    const { dailyStudyHours } = req.body || {};
    if (!validateHours(dailyStudyHours)) return res.status(400).json({ message: "Daily study hours must be a number between 1 and 16." });
    try {
        const profile = await StudyProfile.findOneAndUpdate(
            { userId: req.user._id },
            { userId: req.user._id, dailyStudyHours },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return res.status(200).json({ message: "Study profile updated successfully", profile });
    } catch (error) {
        console.error("Study profile update error:", error);
        return res.status(500).json({ message: "Failed to update study profile" });
    }
});

module.exports = router;
