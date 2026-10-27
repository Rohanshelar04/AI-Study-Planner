// Run from the backend folder:  node scripts/runTests.js
const assert = require("assert");

const {
    sortTasksByPriority,
    allocateTasks,
    checkForOverlaps,
    getSlotDuration
} = require("../src/utils/scheduler");

const { timeToMinutes, minutesToTime } = require("../src/utils/scheduler/timeConversion");
const {
    getAvailableMinutesBeforeDeadline,
    hasSuitableSlotBeforeDeadline,
    getRemainingCapacity
} = require("../src/utils/scheduler/slotCapacity");

// ---------- tiny test runner (no libraries needed) ----------
let passed = 0;
let failed = 0;
const failures = [];

function section(title) {
    console.log(`\n=== ${title} ===`);
}

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (error) {
        failed++;
        failures.push({ name, message: error.message });
        console.log(`  FAIL  ${name}`);
        console.log(`        ${error.message.split("\n")[0]}`);
    }
}

// Silences console.log inside functions like checkForOverlaps.
function quiet(fn) {
    const original = console.log;
    console.log = () => {};
    try {
        return fn();
    } finally {
        console.log = original;
    }
}

// ---------- helpers to build test data ----------
const slot = (date, startTime, endTime) => ({ date, startTime, endTime });
const task = (_id, title, estimatedMinutes, priority, examDate) => ({
    _id, title, estimatedMinutes, priority, examDate
});


// =====================================================
section("timeConversion.js");
// =====================================================
test("timeToMinutes('09:30') = 570", () => assert.strictEqual(timeToMinutes("09:30"), 570));
test("timeToMinutes('00:00') = 0 (midnight)", () => assert.strictEqual(timeToMinutes("00:00"), 0));
test("timeToMinutes('23:59') = 1439 (end of day)", () => assert.strictEqual(timeToMinutes("23:59"), 1439));
test("minutesToTime(570) = '09:30'", () => assert.strictEqual(minutesToTime(570), "09:30"));
test("minutesToTime(0) = '00:00'", () => assert.strictEqual(minutesToTime(0), "00:00"));
test("minutesToTime(65) pads to '01:05'", () => assert.strictEqual(minutesToTime(65), "01:05"));
test("round trip: minutesToTime(timeToMinutes(x)) = x", () => {
    for (const t of ["00:00", "07:05", "12:00", "18:45", "23:59"]) {
        assert.strictEqual(minutesToTime(timeToMinutes(t)), t);
    }
});

// =====================================================
section("slotCapacity.js");
// =====================================================
test("getSlotDuration: 09:00-10:10 = 70", () => {
    assert.strictEqual(getSlotDuration(slot("2026-10-12", "09:00", "10:10")), 70);
});
test("getSlotDuration: zero-length slot = 0", () => {
    assert.strictEqual(getSlotDuration(slot("2026-10-12", "09:00", "09:00")), 0);
});
test("getAvailableMinutesBeforeDeadline: only counts slots before exam date", () => {
    const slots = [
        slot("2026-10-12", "09:00", "10:00"), // 60, counts
        slot("2026-10-14", "09:00", "10:00"), // 60, counts
        slot("2026-10-15", "09:00", "10:00"), // exam day, ignored
        slot("2026-10-16", "09:00", "10:00")  // after exam, ignored
    ];
    assert.strictEqual(getAvailableMinutesBeforeDeadline(task(1, "t", 30, "High", "2026-10-15"), slots), 120);
});
test("getAvailableMinutesBeforeDeadline: no slots = 0", () => {
    assert.strictEqual(getAvailableMinutesBeforeDeadline(task(1, "t", 30, "High", "2026-10-15"), []), 0);
});
test("hasSuitableSlotBeforeDeadline: true when one slot is long enough", () => {
    const slots = [slot("2026-10-12", "09:00", "09:30"), slot("2026-10-13", "09:00", "10:00")];
    assert.strictEqual(hasSuitableSlotBeforeDeadline(task(1, "t", 50, "High", "2026-10-15"), slots), true);
});
test("hasSuitableSlotBeforeDeadline: false when all slots too short", () => {
    const slots = [slot("2026-10-12", "09:00", "09:30"), slot("2026-10-13", "09:00", "09:30")];
    assert.strictEqual(hasSuitableSlotBeforeDeadline(task(1, "t", 50, "High", "2026-10-15"), slots), false);
});
test("hasSuitableSlotBeforeDeadline: long slot on exam day does not count", () => {
    const slots = [slot("2026-10-15", "09:00", "12:00")];
    assert.strictEqual(hasSuitableSlotBeforeDeadline(task(1, "t", 50, "High", "2026-10-15"), slots), false);
});
test("getRemainingCapacity: subtracts already scheduled minutes", () => {
    const slots = [slot("2026-10-12", "09:00", "10:00")];
    const scheduled = [{
        scheduledDate: "2026-10-12", scheduledStartTime: "09:00",
        scheduledEndTime: "09:40", scheduledMinutes: 40
    }];
    const r = getRemainingCapacity(task(2, "t", 30, "High", "2026-10-15"), slots, scheduled);
    assert.strictEqual(r.totalRemainingMinutes, 20);
    assert.strictEqual(r.hasSuitableRemainingSlot, false);
});
test("getRemainingCapacity: nothing scheduled = full capacity", () => {
    const slots = [slot("2026-10-12", "09:00", "10:00")];
    const r = getRemainingCapacity(task(2, "t", 30, "High", "2026-10-15"), slots, []);
    assert.strictEqual(r.totalRemainingMinutes, 60);
    assert.strictEqual(r.hasSuitableRemainingSlot, true);
});

test("getRemainingCapacity: counts several tasks in the same slot", () => {
    const slots = [slot("2026-10-12", "11:00", "13:00")]; // 120 minutes
    const scheduled = [
        { scheduledDate: "2026-10-12", scheduledStartTime: "11:00", scheduledEndTime: "11:50", scheduledMinutes: 50 },
        { scheduledDate: "2026-10-12", scheduledStartTime: "11:50", scheduledEndTime: "12:30", scheduledMinutes: 40 }
    ];

    const fits30 = getRemainingCapacity(task(3, "t", 30, "High", "2026-10-15"), slots, scheduled);
    assert.strictEqual(fits30.totalRemainingMinutes, 30);
    assert.strictEqual(fits30.hasSuitableRemainingSlot, true);

    const fits40 = getRemainingCapacity(task(4, "t", 40, "High", "2026-10-15"), slots, scheduled);
    assert.strictEqual(fits40.hasSuitableRemainingSlot, false);
});

// =====================================================
section("sortTasks.js");
// =====================================================
test("sorts by earliest exam date first", () => {
    const sorted = sortTasksByPriority([
        task(1, "late", 10, "High", "2026-10-20"),
        task(2, "early", 10, "Low", "2026-10-10")
    ]);
    assert.deepStrictEqual(sorted.map(t => t._id), [2, 1]);
});
test("same date: High, then Medium, then Low", () => {
    const sorted = sortTasksByPriority([
        task(1, "low", 10, "Low", "2026-10-15"),
        task(2, "high", 10, "High", "2026-10-15"),
        task(3, "med", 10, "Medium", "2026-10-15")
    ]);
    assert.deepStrictEqual(sorted.map(t => t._id), [2, 3, 1]);
});
test("date beats priority (Low priority earlier exam goes first)", () => {
    const sorted = sortTasksByPriority([
        task(1, "high-late", 10, "High", "2026-10-20"),
        task(2, "low-early", 10, "Low", "2026-10-10")
    ]);
    assert.strictEqual(sorted[0]._id, 2);
});
test("does not change the original array", () => {
    const original = [task(1, "b", 10, "Low", "2026-10-20"), task(2, "a", 10, "High", "2026-10-10")];
    const copy = JSON.stringify(original);
    sortTasksByPriority(original);
    assert.strictEqual(JSON.stringify(original), copy);
});
test("empty array returns empty array", () => {
    assert.deepStrictEqual(sortTasksByPriority([]), []);
});
test("single task returns that task", () => {
    assert.strictEqual(sortTasksByPriority([task(1, "x", 10, "High", "2026-10-15")]).length, 1);
});
test("equal date and priority keep original order (stable)", () => {
    const sorted = sortTasksByPriority([
        task(1, "first", 10, "High", "2026-10-15"),
        task(2, "second", 10, "High", "2026-10-15")
    ]);
    assert.deepStrictEqual(sorted.map(t => t._id), [1, 2]);
});

// =====================================================
section("checkOverlaps.js");
// =====================================================
const scheduled = (title, date, start, end) => ({
    title, scheduledDate: date, scheduledStartTime: start, scheduledEndTime: end
});
test("no overlap: back-to-back tasks (end = next start) are OK", () => {
    const ok = quiet(() => checkForOverlaps([
        scheduled("A", "2026-10-12", "09:00", "09:40"),
        scheduled("B", "2026-10-12", "09:40", "10:10")
    ]));
    assert.strictEqual(ok, true);
});
test("overlap detected on same date", () => {
    const ok = quiet(() => checkForOverlaps([
        scheduled("A", "2026-10-12", "09:00", "09:40"),
        scheduled("B", "2026-10-12", "09:30", "10:00")
    ]));
    assert.strictEqual(ok, false);
});
test("same times on different dates are not an overlap", () => {
    const ok = quiet(() => checkForOverlaps([
        scheduled("A", "2026-10-12", "09:00", "09:40"),
        scheduled("B", "2026-10-13", "09:00", "09:40")
    ]));
    assert.strictEqual(ok, true);
});
test("one task completely inside another is an overlap", () => {
    const ok = quiet(() => checkForOverlaps([
        scheduled("A", "2026-10-12", "09:00", "11:00"),
        scheduled("B", "2026-10-12", "09:30", "10:00")
    ]));
    assert.strictEqual(ok, false);
});
test("empty list and single task pass", () => {
    assert.strictEqual(quiet(() => checkForOverlaps([])), true);
    assert.strictEqual(quiet(() => checkForOverlaps([scheduled("A", "2026-10-12", "09:00", "09:40")])), true);
});

// =====================================================
section("allocateTasks.js: normal scheduling");
// =====================================================
test("one task fits in one slot", () => {
    const r = allocateTasks([task(1, "A", 40, "High", "2026-10-15")], [slot("2026-10-12", "09:00", "10:10")]);
    assert.strictEqual(r.scheduledTasks.length, 1);
    assert.strictEqual(r.scheduledTasks[0].scheduledStartTime, "09:00");
    assert.strictEqual(r.scheduledTasks[0].scheduledEndTime, "09:40");
    assert.strictEqual(r.unscheduledTasks.length, 0);
});
test("two tasks back to back in same slot, correct times", () => {
    const r = allocateTasks(
        [task(1, "A", 40, "High", "2026-10-15"), task(2, "B", 30, "Low", "2026-10-15")],
        [slot("2026-10-12", "09:00", "10:10")]
    );
    assert.strictEqual(r.scheduledTasks.length, 2);
    assert.deepStrictEqual(
        r.scheduledTasks.map(t => [t.scheduledStartTime, t.scheduledEndTime]),
        [["09:00", "09:40"], ["09:40", "10:10"]]
    );
    assert.strictEqual(quiet(() => checkForOverlaps(r.scheduledTasks)), true);
});
test("higher priority is scheduled first even if listed last", () => {
    const r = allocateTasks(
        [task(1, "low", 30, "Low", "2026-10-15"), task(2, "high", 30, "High", "2026-10-15")],
        [slot("2026-10-12", "09:00", "10:00")]
    );
    assert.strictEqual(r.scheduledTasks[0]._id, 2);
});
test("task exactly equal to slot length fits (boundary)", () => {
    const r = allocateTasks([task(1, "A", 70, "High", "2026-10-15")], [slot("2026-10-12", "09:00", "10:10")]);
    assert.strictEqual(r.scheduledTasks.length, 1);
    assert.strictEqual(r.scheduledTasks[0].scheduledEndTime, "10:10");
});
test("task one minute longer than slot does NOT fit (boundary)", () => {
    const r = allocateTasks([task(1, "A", 71, "High", "2026-10-15")], [slot("2026-10-12", "09:00", "10:10")]);
    assert.strictEqual(r.scheduledTasks.length, 0);
    assert.strictEqual(r.unscheduledTasks.length, 1);
});
test("task moves to the second slot when first is too small", () => {
    const r = allocateTasks(
        [task(1, "A", 30, "High", "2026-10-15"), task(2, "B", 40, "Medium", "2026-10-15")],
        [slot("2026-10-12", "09:00", "09:40"), slot("2026-10-13", "10:00", "11:00")]
    );
    assert.strictEqual(r.scheduledTasks.length, 2);
    assert.strictEqual(r.scheduledTasks[1].scheduledDate, "2026-10-13");
    assert.strictEqual(r.scheduledTasks[1].scheduledStartTime, "10:00");
});

test("nearer exam is scheduled before a later exam", () => {
    const r = allocateTasks(
        [
            task(1, "near-low", 30, "Low", "2026-10-15"),
            task(2, "far-high", 30, "High", "2026-10-20")
        ],
        [slot("2026-10-12", "09:00", "10:00")]
    );

    assert.deepStrictEqual(
        r.scheduledTasks.map(t => t._id),
        [1, 2]
    );
});

test("scheduled tasks never use slots on or after the exam date", () => {
    const r = allocateTasks(
        [task(1, "A", 30, "High", "2026-10-15")],
        [slot("2026-10-12", "09:00", "09:10"), slot("2026-10-14", "09:00", "10:00")]
    );
    assert.ok(r.scheduledTasks.every(t => t.scheduledDate < t.examDate));
});
test("input task array is not modified", () => {
    const tasks = [task(1, "A", 30, "High", "2026-10-15"), task(2, "B", 30, "Low", "2026-10-15")];
    const before = JSON.stringify(tasks);
    allocateTasks(tasks, [slot("2026-10-12", "09:00", "10:00")]);
    assert.strictEqual(JSON.stringify(tasks), before);
});

// =====================================================
section("allocateTasks.js: edge cases");
// =====================================================
test("no tasks -> everything empty", () => {
    const r = allocateTasks([], [slot("2026-10-12", "09:00", "10:00")]);
    assert.deepStrictEqual([r.scheduledTasks.length, r.unscheduledTasks.length, r.pendingTasks.length], [0, 0, 0]);
});
test("no slots -> task unscheduled with 'Insufficient total available time'", () => {
    const r = allocateTasks([task(1, "A", 30, "High", "2026-10-15")], []);
    assert.strictEqual(r.scheduledTasks.length, 0);
    assert.strictEqual(r.unscheduledTasks[0].reason, "Insufficient total available time before the deadline");
    assert.strictEqual(r.unscheduledTasks[0].totalAvailableMinutes, 0);
});
test("no tasks and no slots -> no crash", () => {
    const r = allocateTasks([], []);
    assert.strictEqual(r.scheduledTasks.length, 0);
});
test("slot ON the exam date is not usable", () => {
    const r = allocateTasks([task(1, "A", 30, "High", "2026-10-15")], [slot("2026-10-15", "09:00", "11:00")]);
    assert.strictEqual(r.scheduledTasks.length, 0);
    // No slot exists before the exam, so the diagnosis reports 0 available minutes.
    assert.strictEqual(r.unscheduledTasks[0].reason, "Insufficient total available time before the deadline");
    assert.strictEqual(r.unscheduledTasks[0].totalAvailableMinutes, 0);
});
test("slot AFTER the exam date is not usable", () => {
    const r = allocateTasks([task(1, "A", 30, "High", "2026-10-15")], [slot("2026-10-16", "09:00", "11:00")]);
    assert.strictEqual(r.scheduledTasks.length, 0);
    assert.strictEqual(r.unscheduledTasks.length, 1);
});
test("zero-length slot schedules nothing", () => {
    const r = allocateTasks([task(1, "A", 30, "High", "2026-10-15")], [slot("2026-10-12", "09:00", "09:00")]);
    assert.strictEqual(r.scheduledTasks.length, 0);
    assert.strictEqual(r.unscheduledTasks.length, 1);
});

test("task not scheduled is never lost (scheduled + unscheduled = total)", () => {
    const tasks = [
        task(1, "A", 90, "High", "2026-10-15"),
        task(2, "B", 40, "Medium", "2026-10-15"),
        task(3, "C", 30, "Low", "2026-10-15"),
        task(4, "D", 500, "Low", "2026-10-14")
    ];

    const slots = [
        slot("2026-10-12", "09:00", "10:10"),
        slot("2026-10-13", "10:00", "11:00")
    ];

    const r = allocateTasks(sortTasksByPriority(tasks), slots);

    assert.strictEqual(
        r.scheduledTasks.length + r.unscheduledTasks.length,
        tasks.length
    );
});

test("task expires when a later slot is already on/after exam date", () => {
    const r = allocateTasks(
        [task(1, "A", 40, "High", "2026-10-15")],
        [slot("2026-10-12", "09:00", "09:20"), slot("2026-10-15", "09:00", "11:00")]
    );
    assert.strictEqual(r.scheduledTasks.length, 0);
    assert.strictEqual(r.unscheduledTasks.length, 1);
    // Only 20 minutes existed before the exam, but the task needs 40.
    assert.strictEqual(r.unscheduledTasks[0].reason, "Insufficient total available time before the deadline");
    assert.strictEqual(r.unscheduledTasks[0].totalAvailableMinutes, 20);
});

// =====================================================
section("allocateTasks.js: reasons for unscheduled tasks");
// =====================================================
test("Case 2: not enough total time", () => {
    const r = allocateTasks([task(1, "A", 90, "High", "2026-10-15")], [slot("2026-10-12", "09:00", "10:00")]);
    const u = r.unscheduledTasks[0];
    assert.strictEqual(u.reason, "Insufficient total available time before the deadline");
    assert.strictEqual(u.totalAvailableMinutes, 60);
});
test("Case 3: total time enough but every slot too short (your original sample data)", () => {
    const r = allocateTasks(
        [task(1, "A", 90, "High", "2026-10-15")],
        [slot("2026-10-12", "09:00", "10:10"), slot("2026-10-13", "10:00", "11:00")]
    );
    assert.strictEqual(r.unscheduledTasks[0].reason, "Available time is spread across slots that are too short");
});
test("Case 4: earlier tasks used up the capacity", () => {
    const r = allocateTasks(
        [task(1, "A", 40, "High", "2026-10-15"), task(2, "B", 30, "Medium", "2026-10-15")],
        [slot("2026-10-12", "09:00", "10:00")]
    );
    assert.strictEqual(r.scheduledTasks.length, 1);
    assert.strictEqual(r.unscheduledTasks[0]._id, 2);
    assert.strictEqual(r.unscheduledTasks[0].reason, "Insufficient remaining capacity after earlier allocations");
    assert.strictEqual(r.unscheduledTasks[0].totalRemainingMinutes, 20);
});
test("Case 5: enough minutes overall but split into pieces too small", () => {
    const r = allocateTasks(
        [task(1, "A", 40, "High", "2026-10-15"), task(2, "B", 40, "Medium", "2026-10-15"), task(3, "C", 35, "Low", "2026-10-15")],
        [slot("2026-10-12", "09:00", "10:00"), slot("2026-10-13", "09:00", "10:00")]
    );
    assert.strictEqual(r.scheduledTasks.length, 2);
    assert.strictEqual(r.unscheduledTasks[0]._id, 3);
    assert.strictEqual(r.unscheduledTasks[0].reason, "No sufficiently long free slot remains after earlier allocations");
});
test("unscheduled tasks include a recommendation text", () => {
    const r = allocateTasks([task(1, "A", 90, "High", "2026-10-15")], [slot("2026-10-12", "09:00", "10:00")]);
    assert.ok(typeof r.unscheduledTasks[0].recommendation === "string" && r.unscheduledTasks[0].recommendation.length > 0);
});

test("full automatic run finishes with no overlap", () => {
    const slots = [
        slot("2026-10-12", "09:00", "10:00"),
        slot("2026-10-13", "09:00", "10:00")
    ];

    const tasks = [
        task(1, "a", 90, "High", "2026-10-15"),
        task(2, "b", 30, "Low", "2026-10-18"),
        task(3, "c", 25, "High", "2026-10-20")
    ];

    const r = allocateTasks(sortTasksByPriority(tasks), slots);

    assert.strictEqual(
        r.scheduledTasks.length + r.unscheduledTasks.length,
        tasks.length
    );

    assert.strictEqual(
        quiet(() => checkForOverlaps(r.scheduledTasks)),
        true
    );
});


// =====================================================
section("Diagnosis consistency (expired + declined tasks)");
// =====================================================
test("expired tasks get recommendation and capacity fields too", () => {
    const r = allocateTasks(
        [task(1, "A", 40, "High", "2026-10-15")],
        [slot("2026-10-12", "09:00", "09:20"), slot("2026-10-15", "09:00", "11:00")]
    );
    const u = r.unscheduledTasks[0];
    assert.ok(typeof u.recommendation === "string" && u.recommendation.length > 0);
    assert.strictEqual(typeof u.totalAvailableMinutes, "number");
    assert.strictEqual(typeof u.totalRemainingMinutes, "number");
    assert.strictEqual(u.requiredMinutes, 40);
});test("every unscheduled task has the same set of fields", () => {
    const slots = [
        slot("2026-10-12", "09:00", "10:00"),
        slot("2026-10-15", "09:00", "10:00")
    ];

    const r = allocateTasks(
        [
            task(1, "A", 40, "High", "2026-10-15"),
            task(2, "B", 30, "Medium", "2026-10-15"),
            task(3, "C", 500, "Low", "2026-10-14")
        ],
        slots
    );

    const keysOf = t => Object.keys(t).sort().join(",");

    assert.ok(r.unscheduledTasks.length > 0);

    const first = keysOf(r.unscheduledTasks[0]);

    assert.ok(
        r.unscheduledTasks.every(t => keysOf(t) === first)
    );
});
test("expired task diagnosis counts minutes already used (Case 4)", () => {
    const r = allocateTasks(
        [task(1, "A", 40, "High", "2026-10-15"), task(2, "B", 30, "Medium", "2026-10-15")],
        [slot("2026-10-12", "09:00", "10:00"), slot("2026-10-15", "09:00", "10:00")]
    );
    const b = r.unscheduledTasks.find(t => t._id === 2);
    assert.strictEqual(b.reason, "Insufficient remaining capacity after earlier allocations");
    assert.strictEqual(b.totalRemainingMinutes, 20);
});



// =====================================================
// Summary
// =====================================================
console.log("\n----------------------------------------");
console.log(`Total: ${passed + failed}   Passed: ${passed}   Failed: ${failed}`);
if (failed > 0) {
    console.log("\nFailed tests:");
    failures.forEach(f => console.log(` - ${f.name}\n     ${f.message.split("\n")[0]}`));
    process.exitCode = 1;
}