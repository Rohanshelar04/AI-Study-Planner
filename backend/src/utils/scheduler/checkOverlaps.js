function checkForOverlaps(scheduledTasks) {
    for (let i = 0; i < scheduledTasks.length; i++) {
        for (let j = i + 1; j < scheduledTasks.length; j++) {
            const first = scheduledTasks[i];
            const second = scheduledTasks[j];

            if (first.scheduledDate !== second.scheduledDate) {
                continue;
            }

            const overlaps =
                first.scheduledStartTime < second.scheduledEndTime &&
                second.scheduledStartTime < first.scheduledEndTime;

            if (overlaps) {
                console.log(
                    `OVERLAP DETECTED: "${first.title}" and ` +
                    `"${second.title}" on ${first.scheduledDate}.`
                );

                return false;
            }
        }
    }

    console.log("Overlap check passed: no scheduled tasks overlap.");
    return true;
}




module.exports = checkForOverlaps;