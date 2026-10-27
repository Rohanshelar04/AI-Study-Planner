const {
    getAvailableMinutesBeforeDeadline,
    hasSuitableSlotBeforeDeadline,
    getRemainingCapacity
} = require("./slotCapacity");

// Explains why a task could not be scheduled.
// Used for EVERY unscheduled task, so all of them get the same level of detail.
function diagnoseUnscheduledTask(task, availableSlots, scheduledTasks) {
    const originalCapacity =
        getAvailableMinutesBeforeDeadline(task, availableSlots);

    const originallyHadSuitableSlot =
        hasSuitableSlotBeforeDeadline(task, availableSlots);

    const { totalRemainingMinutes, hasSuitableRemainingSlot } =
        getRemainingCapacity(task, availableSlots, scheduledTasks);


    let reason;
    let recommendation;

    // Case 1: Not enough total time existed originally.
    if (originalCapacity < task.estimatedMinutes) {
        reason = "Insufficient total available time before the deadline";
        recommendation =
            `Only ${originalCapacity} minutes are available before ` +
            `your exam, but this task requires ` +
            `${task.estimatedMinutes} minutes. Consider adding ` +
            `availability or reviewing your workload.`;
    }
    // Case 2: Total time may be enough, but every original slot is too short.
    else if (!originallyHadSuitableSlot) {
        reason = "Available time is spread across slots that are too short";
        recommendation =
            `You have ${originalCapacity} minutes available before ` +
            `your exam, but no individual slot is long enough for ` +
            `this ${task.estimatedMinutes}-minute task. Consider ` +
            `creating a longer slot or splitting the task in the future.`;
    }
    // Case 3: Earlier allocations consumed too much total capacity.
    else if (totalRemainingMinutes < task.estimatedMinutes) {
        reason = "Insufficient remaining capacity after earlier allocations";
        recommendation =
            `Only ${totalRemainingMinutes} minutes remain before ` +
            `your exam, but this task requires ` +
            `${task.estimatedMinutes} minutes. Review your schedule ` +
            `or availability.`;
    }
    // Case 4: Enough total time remains, but no individual slot fits.
    else if (!hasSuitableRemainingSlot) {
        reason = "No sufficiently long free slot remains after earlier allocations";
        recommendation =
            `Enough time may remain overall, but no individual ` +
            `remaining slot can fit this ${task.estimatedMinutes}-minute ` +
            `task. Review your schedule or availability.`;
    }
    // Case 5: None of the expected explanations applies.
    else {
        reason = "Scheduling result requires further investigation";
        recommendation =
            "A suitable free slot appears to remain. Review the " +
            "allocation logic to determine why this task was not scheduled.";
    }

    return {
        ...task,
        reason,
        recommendation,
        requiredMinutes: task.estimatedMinutes,
        totalAvailableMinutes: originalCapacity,
        totalRemainingMinutes
    };
}

module.exports = diagnoseUnscheduledTask;