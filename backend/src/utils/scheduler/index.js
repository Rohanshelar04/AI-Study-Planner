const sortTasksByPriority = require("./sortTasks");
const allocateTasks = require("./allocateTasks");
const checkForOverlaps = require("./checkOverlaps");
const { getSlotDuration } = require("./slotCapacity");

module.exports = {
    sortTasksByPriority,
    allocateTasks,
    checkForOverlaps,
    getSlotDuration   // the demo's slot usage report needs this
};