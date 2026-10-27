const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const StudySession = require("../models/StudySessionModel");
const Subject = require("../models/Subject");
const auth = require("../middleware/auth");
const validateTaskUpdate = require("../utils/validateTask");
const { refreshPlanIfExists } = require("../services/studyPlanService");

const router = express.Router();

// Create a task
router.post("/", auth, async (req, res) => {
    const userId = req.user._id;

    const {subjectId,title,estimatedMinutes,priority} = req.body;

    // Validate request data
    if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof estimatedMinutes !== "number" ||
        !Number.isFinite(estimatedMinutes) ||
        estimatedMinutes < 1 ||
        !subjectId ||
        !mongoose.Types.ObjectId.isValid(subjectId) ||
        (
            priority !== undefined &&
            (
                typeof priority !== "string" ||
                !["Low", "Medium", "High"].includes(priority)
            )
        )
    ) {
        return res.status(400).json({
            message:
                "Invalid task data. Check subjectId, title, estimatedMinutes and priority."
        });
    }

    try {
        // Verify that the subject belongs to the logged-in user
        const subject = await Subject.findOne({
            _id: subjectId,
            userId: userId
        });

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found for this user"
            });
        }

        // Create the task
        const task = await Task.create({
            userId: userId,
            subjectId: subject._id,
            title: title.trim(),
            estimatedMinutes: estimatedMinutes,
            remainingMinutes: estimatedMinutes,
            priority: priority
        });

        const planRefresh = await refreshPlanIfExists(userId);
        return res.status(201).json({
            message: "Task created successfully",
            task,
            planRefresh,
        });
    } catch (error) {
        console.error("Task creation error:", error);

        return res.status(500).json({
            message: "Error while creating task"
        });
    }
});


// Get all tasks belonging to the logged-in user
router.get("/", auth, async (req, res) => {
    const userId = req.user._id;

    try {
        const tasks = await Task.find({
            userId: userId
        });

        return res.status(200).json(tasks);
    } catch (error) {
        console.error("Task fetching error:", error);

        return res.status(500).json({
            message: "Error while fetching tasks"
        });
    }
});


// Update a task
router.patch("/:id", auth, async (req, res) => {
    const userId = req.user._id;
    const id = req.params.id;

    // 1. Validate task ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid task ID"
        });
    }

    // 2. Validate request body
    const validation = validateTaskUpdate(req.body);

    if (validation.error) {
        return res.status(400).json({
            message: validation.error
        });
    }

    try {
        // Verify an updated subject belongs to the authenticated user.
        if (validation.data.subjectId) {
            if (!mongoose.Types.ObjectId.isValid(validation.data.subjectId)) {
                return res.status(400).json({ message: "Invalid subject ID" });
            }
            const subject = await Subject.findOne({ _id: validation.data.subjectId, userId });
            if (!subject) return res.status(400).json({ message: "Subject not found for this user" });
        }

       // 3. Find the task belonging to the authenticated user
const existingTask = await Task.findOne({
    _id: id,
    userId: userId
});

if (!existingTask) {
    return res.status(404).json({
        message: "Task not found for this user"
    });
}

// 4. Prevent editing task details after completion.
// Allow only reopening it by changing status to Pending.
if (existingTask.status === "Completed") {
    const onlyReopening =
        validation.data.status === "Pending" &&
        Object.keys(validation.data).length === 1;

    if (!onlyReopening) {
        return res.status(400).json({
            message: "Completed tasks cannot be edited. Reopen the task first."
        });
    }
}

// If the user completes a task during an active session, close that
// session once on the server so the session does not remain orphaned.
if (validation.data.status === "Completed" && existingTask.status !== "Completed") {
    const activeSession = await StudySession.findOne({
        userId,
        taskId: existingTask._id,
        status: "InProgress",
    });
    if (activeSession) {
        const endTime = new Date();
        activeSession.endTime = endTime;
        activeSession.durationMinutes = Math.max(0, Math.round((endTime.getTime() - activeSession.startTime.getTime()) / 60000));
        activeSession.status = "Completed";
        await activeSession.save();
        const currentRemaining = existingTask.remainingMinutes == null
            ? existingTask.estimatedMinutes
            : existingTask.remainingMinutes;
        existingTask.remainingMinutes = Math.max(0, currentRemaining - activeSession.durationMinutes);
        await existingTask.save();
    }
}

// If the estimate changed and the client did not provide a custom remaining
// estimate, preserve already-recorded study time when recalculating remaining work.
if (validation.data.estimatedMinutes !== undefined && validation.data.remainingMinutes === undefined) {
    const totals = await StudySession.aggregate([
        { $match: { userId, taskId: existingTask._id, status: "Completed" } },
        { $group: { _id: "$taskId", totalMinutes: { $sum: "$durationMinutes" } } },
    ]);
    const studiedMinutes = totals[0]?.totalMinutes || 0;
    validation.data.remainingMinutes = Math.max(0, validation.data.estimatedMinutes - studiedMinutes);
}

// 5. Update the task
const updatedTask = await Task.findOneAndUpdate(
    {
        _id: id,
        userId: userId
    },
    validation.data,
    {
        new: true,
        runValidators: true
    }
);
       

        // Refresh only after the data change succeeds. A refresh failure is
        // reported separately and does not roll back the task update.
        const planRefresh = await refreshPlanIfExists(userId);
        return res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask,
            planRefresh,
        });
    } catch (error) {
        console.error("Task update error:", error);

        return res.status(500).json({
            message: "An error occurred while updating the task"
        });
    }
});


// Delete a task
router.delete("/:id", auth, async (req, res) => {
    const userId = req.user._id;
    const id = req.params.id;

    // 1. Validate task ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid task ID"
        });
    }

    try {
        // 2. Delete only the authenticated user's task
        const deletedTask = await Task.findOneAndDelete({
            _id: id,
            userId: userId
        });

        // 3. Check whether the task existed for this user
        if (!deletedTask) {
            return res.status(404).json({
                message: "Task not found for this user"
            });
        }

        // 4. Return success
        const planRefresh = await refreshPlanIfExists(userId);
        return res.status(200).json({
            message: "Task deleted successfully",
            task: deletedTask,
            planRefresh,
        });
    } catch (error) {
        console.error("Task deletion error:", error);

        return res.status(500).json({
            message: "An error occurred while deleting the task"
        });
    }
});

module.exports = router;
