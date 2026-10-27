const {
    sortTasksByPriority,
    allocateTasks,
    checkForOverlaps,
    getSlotDuration
} = require("../src/utils/scheduler");

const { tasks, availableSlots } = require("./sampleData");

console.log("Available slots:", availableSlots);
console.log("Tasks:", tasks);

const sortedTasks = sortTasksByPriority(tasks);
console.log(
    "Sorted tasks:",
    sortedTasks.map(task => `${task.title} — ${task.examDate}`)
);
const result = allocateTasks(sortedTasks, availableSlots);

// Report usage of each slot.
for (const slot of availableSlots) {
    const totalMinutes = getSlotDuration(slot);

    const usedMinutes = result.scheduledTasks
        .filter(task =>
            task.scheduledDate === slot.date &&
            task.scheduledStartTime >= slot.startTime &&
            task.scheduledEndTime <= slot.endTime
        )
        .reduce((total, task) => total + task.scheduledMinutes, 0);

    console.log({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        totalMinutes,
        usedMinutes,
        remainingMinutes: totalMinutes - usedMinutes
    });
}


checkForOverlaps(result.scheduledTasks);

console.log("Scheduled Tasks:");
console.log(result.scheduledTasks);

console.log("Unscheduled Tasks:");
console.log(result.unscheduledTasks);