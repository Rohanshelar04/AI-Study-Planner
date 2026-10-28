const Task = require("../models/Task");
const Availability = require("../models/Availability");
const StudyPlan = require("../models/StudyPlanModel");
const StudySession = require("../models/StudySessionModel");
const { allocateTasks } = require("../utils/scheduler");

// Load pending tasks belonging to the authenticated user
async function loadPendingTasks(userId) {
    const tasks = await Task.find({
        userId,
        status: "Pending"
    })
        .populate({
            path: "subjectId",
            match: { userId },
            select: "subjectName examId",
            populate: {
                path: "examId",
                match: { userId },
                select: "examDate"
            }
        })
        .lean();

    const taskIds = tasks.map((task) => task._id);
    const sessionTotals = await StudySession.aggregate([
        {
            $match: {
                userId,
                taskId: { $in: taskIds },
                status: "Completed",
            },
        },
        {
            $group: {
                _id: "$taskId",
                totalMinutes: { $sum: "$durationMinutes" },
            },
        },
    ]);
    const studiedMinutesByTask = new Map(
        sessionTotals.map((item) => [String(item._id), item.totalMinutes])
    );

    const schedulerTasks = [];
    const exhaustedEstimateTasks = [];

    for (const task of tasks) {
        // Verify that the referenced subject and exam belong to this user
        const subject = task.subjectId;
        const exam = subject?.examId;


        if (!subject || !exam || !exam.examDate) {
            throw new Error(
                `Task "${task.title}" has an invalid subject or exam reference.`
            );
        }
         
         const examDate = exam.examDate;

         if (
                  !(examDate instanceof Date) ||
                   Number.isNaN(examDate.getTime())
        ) {
                     throw new Error(
                     `Task "${task.title}" has an invalid exam date.`
          );
       }

        const actualStudyMinutes = studiedMinutesByTask.get(String(task._id)) || 0;
        const remainingMinutes = task.remainingMinutes == null
            ? Math.max(0, task.estimatedMinutes - actualStudyMinutes)
            : task.remainingMinutes;

        // A pending task whose estimate has already been fully used still needs
        // the user to mark it complete or update its estimate, but it needs no
        // additional scheduled minutes in this plan.
        if (remainingMinutes <= 0) {
            exhaustedEstimateTasks.push({
                _id: task._id,
                title: task.title,
                priority: task.priority,
                examDate: examDate.toISOString().slice(0, 10),
                requiredMinutes: 0,
                reason: "The estimated study time has already been used, but this task is still marked Pending.",
                recommendation: "Mark the task Completed if you have finished it, or update its remaining time before replanning.",
            });
            continue;
        }

        schedulerTasks.push({
            _id: task._id,
            title: task.title,
            estimatedMinutes: remainingMinutes,
            originalEstimatedMinutes: task.estimatedMinutes,
            actualStudyMinutes,
            remainingMinutes,
            priority: task.priority,
            examDate: examDate.toISOString().slice(0, 10)
        });
    }

    return { schedulerTasks, exhaustedEstimateTasks };
}

async function loadAvailableSlots(userId,startDate,numberOfDays = 7,now = new Date()){
    const availability = await Availability.findOne({ userId }).lean();

   if (
    !availability ||
    !Array.isArray(availability.weeklySchedule) ||
    availability.weeklySchedule.length === 0 ||
    !availability.weeklySchedule.some(
        day => Array.isArray(day.slots) && day.slots.length > 0
    )
) {
    throw new Error("Availability has not been configured.");
}
    const availableSlots = [];

    const start = new Date(`${startDate}T00:00:00.000Z`);

    if (
        Number.isNaN(start.getTime()) ||
        start.toISOString().slice(0, 10) !== startDate
    ) {
        throw new Error("Invalid planning start date.");
    }


const indiaDateTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
});

const parts = Object.fromEntries(
    indiaDateTime
        .formatToParts(now)
        .map(({ type, value }) => [type, value])
);

const todayInIndia = `${parts.year}-${parts.month}-${parts.day}`;
const indiaTime = `${parts.hour}:${parts.minute}`;

    for (let dayOffset = 0; dayOffset < numberOfDays; dayOffset++) {
        const currentDate = new Date(start);
        currentDate.setUTCDate(start.getUTCDate() + dayOffset);

        const date = currentDate.toISOString().slice(0, 10);

        // Convert JavaScript's day number to a weekday name.
        const weekdayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        const dayName = weekdayNames[currentDate.getUTCDay()];

        const dailySchedule = availability.weeklySchedule.find(
            entry => entry.day.toLowerCase() === dayName.toLowerCase()
        );

       if (!dailySchedule || !Array.isArray(dailySchedule.slots)) {
              continue;
      }

 for (const slot of dailySchedule.slots) {
    // Skip slots that have already ended today.
  if (date === todayInIndia && slot.endTime <= indiaTime) {
    continue;
}

const startTime = date === todayInIndia && slot.startTime < indiaTime? indiaTime : slot.startTime;

          availableSlots.push({
                      date,
                      startTime,
                      endTime: slot.endTime
           });
     }
  }

  if (availableSlots.length === 0) {
    throw new Error("No usable study availability remains in the planning period.");
  }

    return availableSlots;
}


async function generateStudyPlan(userId, startDate) {
    // Every generation/replan creates a new snapshot. Existing plans are not
    // modified, so historical and completed/past plan data remains intact.
    const { schedulerTasks: tasks, exhaustedEstimateTasks } = await loadPendingTasks(userId);

    const availableSlots = await loadAvailableSlots(
        userId,
        startDate
    );

    const result = allocateTasks(tasks, availableSlots);
    result.unscheduledTasks.push(...exhaustedEstimateTasks);

    const studyPlan = await StudyPlan.create({
        userId,
        status: "Generated",
        scheduledTasks: result.scheduledTasks,
        unscheduledTasks: result.unscheduledTasks,
        pendingTasks: result.pendingTasks,
        availableSlotsSnapshot: availableSlots
    });

    return studyPlan;
}


async function refreshPlanIfExists(userId) {
    try {
        const existingPlan = await StudyPlan.findOne({ userId }).select("_id").lean();
        if (!existingPlan) return { refreshed: false };

        const now = new Date();
    const startDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

        await generateStudyPlan(userId, startDate);
        return { refreshed: true };
    } catch (error) {
        // A saved data change must remain successful even if a new plan cannot
        // be generated. The API caller can surface this warning to the user.
        console.error("Automatic study-plan refresh failed:", error.message);
        return { refreshed: false, warning: error.message };
    }
}

module.exports = {
    loadPendingTasks,
    loadAvailableSlots,
    generateStudyPlan,
    refreshPlanIfExists,
};


