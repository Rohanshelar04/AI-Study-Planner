const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const StudySession = require("../models/StudySessionModel");
const auth = require("../middleware/auth");
const { refreshPlanIfExists } = require("../services/studyPlanService");

const router = express.Router();



router.post("/start", auth, async (req, res) => {
    const userId = req.user._id;
    const { taskId } = req.body;

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({
            message: "Invalid task ID"
        });
    }

    try {
        // Verify that the task belongs to the logged-in user
        const task = await Task.findOne({
            _id: taskId,
            userId: userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found for this user"
            });
        }

        // Don't start a study session for a completed task
        if (task.status === "Completed") {
            return res.status(400).json({
                message: "Cannot start a session for a completed task"
            });
        }

        // Prevent multiple active study sessions for the same user
        const activeSession = await StudySession.findOne({
            userId: userId,
            status: "InProgress"
        });

        if (activeSession) {
            return res.status(409).json({
                message: "You already have an active study session"
            });
        }

        // Create a new study session
        const studySession = await StudySession.create({
            userId: userId,
            taskId: task._id,
            startTime: new Date()
        });

        return res.status(201).json({
            message: "Study session started successfully",
            studySession: studySession
        });
    } catch (error) {
        console.error("Study session start error:", error);

        return res.status(500).json({
            message: "Error while starting study session"
        });
    }
});


router.get("/active", auth, async (req, res) => {
    try {
        const activeSession = await StudySession.findOne({
            userId: req.user._id,
            status: "InProgress"
        }).populate("taskId", "title estimatedMinutes");

        return res.status(200).json({
            activeSession: activeSession
        });
    } catch (error) {
        console.error("Active study session error:", error);

        return res.status(500).json({
            message: "Error while fetching active study session"
        });
    }
});


router.post("/stop/:id", auth, async (req, res) => {
    const userId = req.user._id;
    const sessionId = req.params.id;

    // Validate session ID
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
            message: "Invalid study session ID"
        });
    }

    try {
        // Find an active session belonging to this user
        const studySession = await StudySession.findOne({
            _id: sessionId,
            userId: userId,
            status: "InProgress"
        });

        if (!studySession) {
            return res.status(404).json({
                message: "Active study session not found"
            });
        }

        // Calculate the actual study duration
        const endTime = new Date();

        const durationMinutes = Math.max(
            0,
            Math.round(
                (endTime.getTime() - studySession.startTime.getTime()) / 60000
            )
        );

        // Save the completed study period
        studySession.endTime = endTime;
        studySession.durationMinutes = durationMinutes;
        studySession.status = "Completed";

        await studySession.save();

        // Reduce the task's remaining estimate by the time actually studied.
        // Stopping a session does not mark the task Completed.
        const task = await Task.findOne({ _id: studySession.taskId, userId });
        if (task && task.status === "Pending") {
            const currentRemaining = task.remainingMinutes == null
                ? task.estimatedMinutes
                : task.remainingMinutes;
            task.remainingMinutes = Math.max(0, currentRemaining - durationMinutes);
            await task.save();
        }

        const planRefresh = await refreshPlanIfExists(userId);
        return res.status(200).json({
            message: "Study session stopped successfully",
            studySession,
            planRefresh,
        });
    } catch (error) {
        console.error("Study session stop error:", error);

        return res.status(500).json({
            message: "Error while stopping study session"
        });
    }
});


router.get("/task/:taskId/total-time", auth, async (req, res) => {
    const userId = req.user._id;
    const { taskId } = req.params;

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({
            message: "Invalid task ID",
        });
    }

    try {
        // Verify that the task belongs to the logged-in user
        const task = await Task.findOne({
            _id: taskId,
            userId: userId,
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found for this user",
            });
        }

        // Add the durations of all completed sessions for this task
        const result = await StudySession.aggregate([
            {
                $match: {
                    userId: userId,
                    taskId: task._id,
                    status: "Completed",
                },
            },
            {
                $group: {
                    _id: "$taskId",
                    totalStudyMinutes: {
                        $sum: "$durationMinutes",
                    },
                },
            },
        ]);

        const totalStudyMinutes =
            result.length > 0 ? result[0].totalStudyMinutes : 0;

        return res.status(200).json({
            taskId: task._id,
            totalStudyMinutes: totalStudyMinutes,
        });
    } catch (error) {
        console.error("Total study time error:", error);

        return res.status(500).json({
            message: "Error while calculating total study time",
        });
    }
});



module.exports = router;