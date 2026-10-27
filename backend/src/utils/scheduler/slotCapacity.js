const { timeToMinutes } = require("./timeConversion");


function getSlotDuration(slot) {
    const [startHour, startMinute] = slot.startTime.split(":").map(Number);
    const [endHour, endMinute] = slot.endTime.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    return endTotalMinutes - startTotalMinutes;
}


// Checks original availability, without subtracting scheduled tasks.
function getAvailableMinutesBeforeDeadline(task, availableSlots) {
    return availableSlots
        .filter(slot => slot.date < task.examDate)
        .reduce((total, slot) => total + getSlotDuration(slot), 0);
}

function hasSuitableSlotBeforeDeadline(task, availableSlots) {
    return availableSlots.some(slot =>
        slot.date < task.examDate &&
        getSlotDuration(slot) >= task.estimatedMinutes
    );
}

// Calculates actual remaining capacity before this task's deadline.
function getRemainingCapacity(task, availableSlots, scheduledTasks) {
    const eligibleSlots = availableSlots.filter(
        slot => slot.date < task.examDate
    );

    let totalRemainingMinutes = 0;
    let hasSuitableRemainingSlot = false;

    for (const slot of eligibleSlots) {
        const totalMinutes = getSlotDuration(slot);

        const usedMinutes = scheduledTasks
            .filter(scheduledTask =>
                scheduledTask.scheduledDate === slot.date &&
                scheduledTask.scheduledStartTime >= slot.startTime &&
                scheduledTask.scheduledEndTime <= slot.endTime
            )
            .reduce((total, scheduledTask) => {
                return total + scheduledTask.scheduledMinutes;
            }, 0);

        const remainingMinutes = totalMinutes - usedMinutes;

        totalRemainingMinutes += remainingMinutes;

        if (remainingMinutes >= task.estimatedMinutes) {
            hasSuitableRemainingSlot = true;
        }
    }

    return {
        totalRemainingMinutes,
        hasSuitableRemainingSlot
    };
}


module.exports = {
    getSlotDuration,
    getAvailableMinutesBeforeDeadline,
    hasSuitableSlotBeforeDeadline,
    getRemainingCapacity
};
