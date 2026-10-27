const assert = require("node:assert/strict");

const Availability = require("../src/models/Availability");
const { loadAvailableSlots } = require("../src/services/studyPlanService");


console.log("Starting loadAvailableSlots tests...");

const userId = "test-user";

const fakeAvailability = {
    weeklySchedule: [
        {
            day: "Saturday",
            slots: [
                { startTime: "09:00", endTime: "10:00" },
                { startTime: "10:00", endTime: "12:00" },
                { startTime: "14:00", endTime: "16:00" }
            ]
        }
    ]
};

// Replace the database query with our fake availability.
Availability.findOne = () => ({
    lean: async () => fakeAvailability
});

console.log("Fake availability configured.");

async function runTests() {
    // Saturday, October 17, 2026, at 11:00 AM in India.
    const fixedNow = new Date("2026-10-17T05:30:00.000Z");

    const slots = await loadAvailableSlots(
        userId,
        "2026-10-17",
        1,
        fixedNow
    );

    assert.deepEqual(slots, [
        {
            date: "2026-10-17",
            startTime: "11:00",
            endTime: "12:00"
        },
        {
            date: "2026-10-17",
            startTime: "14:00",
            endTime: "16:00"
        }
    ]);

    console.log("PASS: expired slots are skipped");
    console.log("PASS: ongoing slots are trimmed");
    console.log("PASS: future slots remain unchanged");
}

runTests().catch(error => {
    console.error("TEST FAILED:", error);
    process.exitCode = 1;
});