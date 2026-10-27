const express = require("express");
const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const auth = require("../middleware/auth");
const { refreshPlanIfExists } = require("../services/studyPlanService");

const router = express.Router();

function parseExamDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function validateExamInput(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Request body must be a valid object" };
    }
    const allowed = ["examName", "examDate"];
    if (Object.keys(body).some((key) => !allowed.includes(key))) {
        return { error: "Only examName and examDate can be updated" };
    }
    const data = {};
    if (body.examName !== undefined) {
        if (typeof body.examName !== "string" || !body.examName.trim()) return { error: "A valid exam name is required" };
        data.examName = body.examName.trim();
    }
    if (body.examDate !== undefined) {
        const date = parseExamDate(body.examDate);
        if (!date) return { error: "Invalid exam date. Use YYYY-MM-DD and enter a real calendar date." };
        data.examDate = date;
    }
    if (!Object.keys(data).length) return { error: "Provide at least one exam field to update" };
    return { data };
}

router.post("/", auth, async (req, res) => {
    const validation = validateExamInput(req.body);
    if (validation.error || validation.data?.examName === undefined || validation.data?.examDate === undefined) {
        return res.status(400).json({ message: validation.error || "Exam name and date are required" });
    }
    try {
        const exam = await Exam.create({ userId: req.user._id, ...validation.data });
        return res.status(201).json({ message: "Exam created successfully", exam });
    } catch (error) {
        console.error("Exam creation error:", error);
        return res.status(500).json({ message: "Error creating exam" });
    }
});

router.get("/", auth, async (req, res) => {
    try {
        const exams = await Exam.find({ userId: req.user._id }).sort({ examDate: 1, createdAt: -1 }).lean();
        return res.status(200).json(exams);
    } catch (error) {
        console.error("Exam fetch error:", error);
        return res.status(500).json({ message: "Error fetching exams" });
    }
});

router.patch("/:id", auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid exam ID" });
    }
    const validation = validateExamInput(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    try {
        const exam = await Exam.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            validation.data,
            { new: true, runValidators: true }
        );
        if (!exam) return res.status(404).json({ message: "Exam not found for this user" });
        const planRefresh = await refreshPlanIfExists(req.user._id);
        return res.status(200).json({ message: "Exam updated successfully", exam, planRefresh });
    } catch (error) {
        console.error("Exam update error:", error);
        return res.status(500).json({ message: "Error updating exam" });
    }
});

module.exports = router;
