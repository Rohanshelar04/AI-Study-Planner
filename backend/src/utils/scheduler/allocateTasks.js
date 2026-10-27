const { getSlotDuration } = require("./slotCapacity");
const { timeToMinutes, minutesToTime } = require("./timeConversion");
const diagnoseUnscheduledTask = require("./diagnoseUnscheduled");

function allocateTasks(tasks, availableSlots) {
     const scheduledTasks = [];
     const unscheduledTasks = [];
     let pendingTasks = [...tasks];

     for (
         let slotIndex = 0;
         slotIndex < availableSlots.length;
         slotIndex++
    ){
        const slot = availableSlots[slotIndex];

        let currentTime = timeToMinutes(slot.startTime);
        let remainingMinutes = getSlotDuration(slot);


        while (pendingTasks.length > 0) {
            // 1. Remove tasks whose exam date has arrived or passed.
            const expiredTasks = pendingTasks.filter(
                task => slot.date >= task.examDate
            );

            for (const task of expiredTasks) {
                unscheduledTasks.push(
                    diagnoseUnscheduledTask(
                        task,
                        availableSlots,
                        scheduledTasks,
                    )
                );
            }

            pendingTasks = pendingTasks.filter(
                task => slot.date < task.examDate
            );

            if (pendingTasks.length === 0) {
                break;
            }

            // 2. Define task priority.
            const priorityRank = {
                High: 3,
                Medium: 2,
                Low: 1
            };

            // 3. Find the nearest upcoming exam date.
            const nearestExamDate = pendingTasks.reduce(
                (nearestDate, task) =>
                    task.examDate < nearestDate
                        ? task.examDate
                        : nearestDate,
                pendingTasks[0].examDate
            );

            // 4. Find tasks for that exam that fit in the remaining time.
            const sameExamCandidates = pendingTasks
                .filter(
                    task =>
                        task.examDate === nearestExamDate &&
                        task.estimatedMinutes <= remainingMinutes
                )
                .sort(
                    (a, b) =>
                        priorityRank[b.priority] -
                        priorityRank[a.priority]
                );

            // 5. If a task for the nearest exam fits, schedule it.
            if (sameExamCandidates.length > 0) {
                const task = sameExamCandidates[0];

                const scheduledStartTime = minutesToTime(currentTime);

                currentTime += task.estimatedMinutes;
                remainingMinutes -= task.estimatedMinutes;

                const scheduledEndTime = minutesToTime(currentTime);

                scheduledTasks.push({
                    ...task,
                    scheduledDate: slot.date,
                    scheduledStartTime,
                    scheduledEndTime,
                    scheduledMinutes: task.estimatedMinutes
                });

                // Remove the scheduled task from pending tasks.
                pendingTasks = pendingTasks.filter(
                    pendingTask =>
                        String(pendingTask._id) !== String(task._id)
                );

                // Recalculate candidates using the remaining time.
                continue;
            }

            // 6. No task for the nearest exam fits.
            // Find tasks for later exams that fit.
            const laterExamCandidates = pendingTasks
                .filter(
                    task =>
                        task.examDate > nearestExamDate &&
                        task.estimatedMinutes <= remainingMinutes
                )
                .sort(
                    (a, b) =>
                        a.examDate.localeCompare(b.examDate) ||
                        priorityRank[b.priority] -
                            priorityRank[a.priority]
                );

           
            // 7. If a later-exam task fits, schedule it automatically.
            if (laterExamCandidates.length > 0) {
                const task = laterExamCandidates[0];

                const scheduledStartTime = minutesToTime(currentTime);

                currentTime += task.estimatedMinutes;
                remainingMinutes -= task.estimatedMinutes;

                const scheduledEndTime = minutesToTime(currentTime);

                scheduledTasks.push({
                    ...task,
                    scheduledDate: slot.date,
                    scheduledStartTime,
                    scheduledEndTime,
                    scheduledMinutes: task.estimatedMinutes
                });

                pendingTasks = pendingTasks.filter(
                    pendingTask =>
                        String(pendingTask._id) !== String(task._id)
                );

                continue;
            }


            // 8. Nothing eligible fits in the remaining time.
            // Keep pending tasks and move to the next slot.
            break;
        }    
    }

    // All slots have been considered.
    // Explain why each remaining pending task was not scheduled.
    for (const task of pendingTasks) {
        unscheduledTasks.push(
            diagnoseUnscheduledTask(
                task,
                availableSlots,
                scheduledTasks,
            )
        );
    }

    return {
        scheduledTasks,
        unscheduledTasks,
        pendingTasks: []
    };
}

module.exports = allocateTasks;