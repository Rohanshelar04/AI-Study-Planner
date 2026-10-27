const express = require("express");
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");
const auth = require("../middleware/auth");
const { refreshPlanIfExists } = require("../services/studyPlanService");

const router = express.Router();

function validateSubjectInput(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Request body must be a valid object" };
    if (Object.keys(body).some((key) => !["subjectName", "examId"].includes(key))) return { error: "Only subjectName and examId can be updated" };
    const data = {};
    if (body.subjectName !== undefined) {
        if (typeof body.subjectName !== "string" || !body.subjectName.trim()) return { error: "A valid subject name is required" };
        data.subjectName = body.subjectName.trim();
    }
    if (body.examId !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(body.examId)) return { error: "A valid exam ID is required" };
        data.examId = body.examId;
    }
    if (!Object.keys(data).length) return { error: "Provide at least one subject field to update" };
    return { data };
}

async function ensureExamBelongsToUser(examId, userId) {
    if (!mongoose.Types.ObjectId.isValid(examId)) return null;
    return Exam.findOne({ _id: examId, userId }).select("_id").lean();
}

router.post("/", auth, async (req, res) => {
    const validation = validateSubjectInput(req.body);
    if (validation.error || validation.data?.subjectName === undefined || validation.data?.examId === undefined) {
        return res.status(400).json({ message: validation.error || "Subject name and exam ID are required" });
    }
    try {
        const exam = await ensureExamBelongsToUser(validation.data.examId, req.user._id);
        if (!exam) return res.status(404).json({ message: "Exam not found for this user" });
        const subject = await Subject.create({ userId: req.user._id, ...validation.data });
        return res.status(201).json({ message: "Subject created successfully", subject });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "This subject already exists for this exam" });
        console.error("Subject creation error:", error);
        return res.status(500).json({ message: "Error while creating subject" });
    }
});

router.get("/", auth, async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user._id }).sort({ subjectName: 1 }).lean();
        return res.status(200).json(subjects);
    } catch (error) {
        console.error("Subject fetch error:", error);
        return res.status(500).json({ message: "Error while fetching subject data" });
    }
});

router.patch("/:id", auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid subject ID" });
    const validation = validateSubjectInput(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });
    try {
        if (validation.data.examId) {
            const exam = await ensureExamBelongsToUser(validation.data.examId, req.user._id);
            if (!exam) return res.status(404).json({ message: "Exam not found for this user" });
        }
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            validation.data,
            { new: true, runValidators: true }
        );
        if (!subject) return res.status(404).json({ message: "Subject not found for this user" });
        const planRefresh = await refreshPlanIfExists(req.user._id);
        return res.status(200).json({ message: "Subject updated successfully", subject, planRefresh });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "This subject already exists for this exam" });
        console.error("Subject update error:", error);
        return res.status(500).json({ message: "Error while updating subject" });
    }
});

module.exports = router;
