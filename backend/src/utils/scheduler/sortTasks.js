
function sortTasksByPriority(tasks) {
    const priorityRank = {
        High: 1,
        Medium: 2,
        Low: 3
    };

    return [...tasks].sort((a, b) => {
        // First: sort by earliest exam date
        const dateDifference =
            new Date(a.examDate) - new Date(b.examDate);

        if (dateDifference !== 0) {
            return dateDifference;
        }

        // Second: if dates are equal, sort by priority
        return priorityRank[a.priority] - priorityRank[b.priority];
    });
}

module.exports = sortTasksByPriority;






















