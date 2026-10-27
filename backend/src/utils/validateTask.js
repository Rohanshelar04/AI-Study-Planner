
function validateTaskUpdate(body) {
   const allowedFields = [
    "status",
    "title",
    "estimatedMinutes",
    "priority",
    "remainingMinutes",
    "subjectId"
];

    const update = {};

    // 1. Validate request body
    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return {
            error: "Request body must be a valid object"
        };
    }

    // 2. Reject fields that are not allowed to be updated
    const receivedFields = Object.keys(body);

    if (
        receivedFields.some(
            field => !allowedFields.includes(field)
        )
    ) {
        return {
            error:
               "Only status, title, estimatedMinutes, priority, remainingMinutes and subjectId can be updated"
        };
    }

    // 3. Reject an empty request body
    if (receivedFields.length === 0) {
        return {
            error: "Provide at least one field to update"
        };
    }

    // 4. Validate status, if provided
    if (body.status !== undefined) {
        if (
            typeof body.status !== "string" ||
            !["pending", "completed"].includes(
                body.status.toLowerCase()
            )
        ) {
            return {
                error: "Status must be Pending or Completed"
            };
        }

        update.status = body.status.toLowerCase() === "pending"? "Pending": "Completed";
    }

    // 5. Validate estimatedMinutes, if provided
    if (body.estimatedMinutes !== undefined) {
        if (
            typeof body.estimatedMinutes !== "number" ||
            !Number.isFinite(body.estimatedMinutes) ||
            body.estimatedMinutes < 1
        ) {
            return {
                error:
                    "Estimated minutes must be a finite number >= 1"
            };
        }

        update.estimatedMinutes = body.estimatedMinutes;
    }

    // Validate remainingMinutes, if provided
if (body.remainingMinutes !== undefined) {
    if (
        typeof body.remainingMinutes !== "number" ||
        !Number.isFinite(body.remainingMinutes) ||
        body.remainingMinutes < 0
    ) {
        return {
            error: "Remaining minutes must be a finite number >= 0"
        };
    }

    update.remainingMinutes = body.remainingMinutes;
}

    // 6. Validate title, if provided
    if (body.title !== undefined) {
        if (
            typeof body.title !== "string" ||
            !body.title.trim()
        ) {
            return {
                error: "Title must be a non-empty string"
            };
        }

        update.title = body.title.trim();
    }

    // 7. Validate priority, if provided
    if (body.priority !== undefined) {
        if (
            typeof body.priority !== "string" ||
            !["Low", "Medium", "High"].includes(
                body.priority
            )
        ) {
            return {
                error:
                    "Priority must be Low, Medium or High"
            };
        }

        update.priority = body.priority;
    }

  

    // 8. Validate subjectId, if provided
   if (body.subjectId !== undefined) {
      if (
        typeof body.subjectId !== "string" ||
        !body.subjectId.trim()
      ) {
        return {
            error: "Subject ID must be a valid string"
        };
    }

        update.subjectId = body.subjectId;
     }

       return {
        data: update
       };
}

module.exports = validateTaskUpdate;