const availableSlots = [
    { date: "2026-10-12", startTime: "09:00", endTime: "10:00" }
];

const tasks = [
    { _id: 1, title: "Big DBMS revision", estimatedMinutes: 90, priority: "High", examDate: "2026-10-15" },
    { _id: 2, title: "Short React revision", estimatedMinutes: 30, priority: "Medium", examDate: "2026-10-20" }
];

module.exports = { tasks, availableSlots };