const sortTasksByPriority = require("../src/utils/scheduler/sortTasks");

const tasks = [
    {
        title: "Revise DBMS",
        priority: "High",
        examDate: "2026-10-15"
    },
    {
        title: "Practice Linked Lists",
        priority: "Medium",
        examDate: "2026-10-13"
    },
    {
        title: "Revise React",
        priority: "High",
        examDate: "2026-10-13"
    }
];

const sortedTasks = sortTasksByPriority(tasks);

console.log(sortedTasks);