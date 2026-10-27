const validateAvailability = (weeklySchedule) => {
    if (!Array.isArray(weeklySchedule)) {
        return {
            valid: false,
            message: "weeklySchedule must be an array"
        };
    }


    const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
];

   const toMinutes = (time) => {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes;
   };


const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

for (const dayobj of weeklySchedule) {


    // 1. Check that the day entry is an object
    if (!dayobj || typeof dayobj !== "object" || Array.isArray(dayobj)) {
        return {
            valid: false,
            message: "Each schedule entry must be an object"
        };
    }

    // 2. Check that slots is an array
    if (!Array.isArray(dayobj.slots)) {
        return {
            valid: false,
            message: "slots must be an array"
        };
    }


    if (!daysOfWeek.includes(dayobj.day)) {
        return { valid: false, message: "Invalid day name" };
    }

    

    for (const slot of dayobj.slots) {
        if (!slot || typeof slot !== "object" || Array.isArray(slot)) {
          return {
                     valid: false,
                     message: "Each slot must be an object"
          };
        }
        if (
            typeof slot.startTime !== "string" ||
            typeof slot.endTime !== "string" ||
            !timeRegex.test(slot.startTime) ||
            !timeRegex.test(slot.endTime)
        ) {
            return {
                valid: false,
                message: "Times must use valid 24-hour HH:mm format"
            };
        }

     
        if (toMinutes(slot.endTime) <= toMinutes(slot.startTime)) {
            return {
                valid: false,
                message: "End time must be after start time"
            };
        }
    }

    for (let i = 0; i < dayobj.slots.length; i++) {
    for (let j = i + 1; j < dayobj.slots.length; j++) {
        const slotA = dayobj.slots[i];
        const slotB = dayobj.slots[j];

        const startA = toMinutes(slotA.startTime);
        const endA = toMinutes(slotA.endTime);
        const startB = toMinutes(slotB.startTime);
        const endB = toMinutes(slotB.endTime);

        if (startA < endB && startB < endA) {
            return {
                valid: false,
                message: `Study slots overlap on ${dayobj.day}`
            };
        }
    }
}
}

  return { valid: true };
};
module.exports = validateAvailability;