
import { useEffect, useState } from "react";

const API_BASE_URL =
    process.env.API_BASE_URL || "http://localhost:5000";

export default function StudyPlan() {
    const [studyPlans, setStudyPlans] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSession, setActiveSession] = useState(null);
    const [sessionError, setSessionError] = useState("");
    const [stoppingSession, setStoppingSession] = useState(false);
    const [taskStudyTimes, setTaskStudyTimes] = useState({});
    const [slotEndNotice, setSlotEndNotice] = useState("");
    const [notifiedSlotKeys, setNotifiedSlotKeys] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [replanning, setReplanning] = useState(false);
    const [gettingRecommendations, setGettingRecommendations] = useState(false);
    const [recommendation, setRecommendation] = useState("");
    const [recommendationError, setRecommendationError] = useState("");
    const [availabilityRequired, setAvailabilityRequired] = useState(false);

    const currentPlan = studyPlans[0];

    // Use the current task records from the backend, not old plan snapshots.
    const hasAnyTasks = allTasks.length > 0;

    const hasPendingTasks = allTasks.some(
        (task) => task.status !== "Completed"
    );

    const scheduledTasks = currentPlan?.scheduledTasks || [];
    const unscheduledTasks = currentPlan?.unscheduledTasks || [];

    // Check whether the saved plan actually represents any pending tasks.
    const hasPendingTasksInCurrentPlan = [
        ...scheduledTasks,
        ...unscheduledTasks,
    ].some((task) => task.status !== "Completed");

    async function fetchTaskStudyTime(taskId) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/study-sessions/task/${taskId}/total-time`,
                { credentials: "include" }
            );

            if (response.status === 404) {
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch study time"
                );
            }

            setTaskStudyTimes((previousTimes) => ({
                ...previousTimes,
                [data.taskId]: data.totalStudyMinutes,
            }));
        } catch (error) {
            console.error("Error fetching task study time:", error);
        }
    }

    async function fetchStudyPlans() {
        try {
           setError("");
        setAvailabilityRequired(false);

        // Check current availability before displaying a saved plan.
        const availabilityResponse = await fetch(
            `${API_BASE_URL}/api/availability`,
            { credentials: "include" }
        );
if (availabilityResponse.status === 404) {
    setStudyPlans([]);
    setAllTasks([]);
    setAvailabilityRequired(true);

    const sessionResponse = await fetch(
        `${API_BASE_URL}/api/study-sessions/active`,
        { credentials: "include" }
    );

    const sessionData = await sessionResponse.json();

    if (!sessionResponse.ok) {
        throw new Error(
            sessionData.message || "Failed to fetch active study session"
        );
    }

    setActiveSession(sessionData.activeSession);
    return;
}
        if (!availabilityResponse.ok) {
            throw new Error("Failed to fetch availability");
        }

        const weeklySchedule = await availabilityResponse.json();

        const hasAvailability =
            Array.isArray(weeklySchedule) &&
            weeklySchedule.some(
                (day) => Array.isArray(day.slots) && day.slots.length > 0
            );

if (!hasAvailability) {
    setStudyPlans([]);
    setAllTasks([]);
    setAvailabilityRequired(true);

    const sessionResponse = await fetch(
        `${API_BASE_URL}/api/study-sessions/active`,
        { credentials: "include" }
    );

    const sessionData = await sessionResponse.json();

    if (!sessionResponse.ok) {
        throw new Error(
            sessionData.message || "Failed to fetch active study session"
        );
    }

    setActiveSession(sessionData.activeSession);
    return;
}
        const response = await fetch(
            `${API_BASE_URL}/api/study-plan`,
            { credentials: "include" }
        );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch study plans"
                );
            }

            const tasksResponse = await fetch(
                `${API_BASE_URL}/api/tasks`,
                { credentials: "include" }
            );

            const tasksData = await tasksResponse.json();

            if (!tasksResponse.ok) {
                throw new Error(
                    tasksData.message || "Failed to fetch tasks"
                );
            }

            // Save the latest task statuses from the backend.
            setAllTasks(tasksData);

            const taskMap = new Map(
                tasksData.map((task) => [task._id, task])
            );

            const plans = (data.studyPlans || []).map((plan) => ({
                ...plan,

                scheduledTasks: (plan.scheduledTasks || [])
                    .filter((task) => taskMap.has(task._id))
                    .map((task) => ({
                        ...task,
                        status: taskMap.get(task._id).status,
                    })),

                unscheduledTasks: (plan.unscheduledTasks || []).map(
                    (task) => ({
                        ...task,
                        status:
                            taskMap.get(task._id)?.status ?? task.status,
                    })
                ),
            }));

            setStudyPlans(plans);

            const latestPlan = plans[0];

            if (latestPlan) {
                latestPlan.scheduledTasks.forEach((task) => {
                    fetchTaskStudyTime(task._id);
                });
            }

            const sessionResponse = await fetch(
                `${API_BASE_URL}/api/study-sessions/active`,
                { credentials: "include" }
            );

            const sessionData = await sessionResponse.json();

            if (!sessionResponse.ok) {
                throw new Error(
                    sessionData.message ||
                        "Failed to fetch active study session"
                );
            }

            setActiveSession(sessionData.activeSession);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGeneratePlan() {
    setGenerating(true);
    setLoading(true);
    setStudyPlans([]);
    setError("");
    setAvailabilityRequired(false);
    setSessionError("");

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/study-plan/generate`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to generate study plan"
            );
        }

        await fetchStudyPlans();
    } catch (error) {
        setError(error.message);

        setAvailabilityRequired(
            [
                "Please configure your study availability before generating a study plan.",
                "No usable study availability remains. Please update your availability and try again.",
            ].includes(error.message)
        );
    } finally {
        setGenerating(false);
        setLoading(false);
    }
}

    async function handleReplan() {
        setReplanning(true);
        setError("");
        setSessionError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/study-plan/replan`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to replan the remaining schedule"
                );
            }

            setRecommendation("");
            setRecommendationError("");

            await fetchStudyPlans();
        } catch (error) {
            setError(error.message);
        } finally {
            setReplanning(false);
        }
    }

    async function getAIRecommendations() {
        setGettingRecommendations(true);
        setRecommendationError("");
        setRecommendation("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/ai/recommendations`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to generate AI recommendations"
                );
            }

            setRecommendation(data.recommendation);
        } catch (error) {
            setRecommendationError(error.message);
        } finally {
            setGettingRecommendations(false);
        }
    }

    async function startStudy(taskId) {
        try {
            setSessionError("");

            const response = await fetch(
                `${API_BASE_URL}/api/study-sessions/start`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ taskId }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to start study session"
                );
            }

            setActiveSession(data.studySession);
        } catch (error) {
            setSessionError(error.message);
        }
    }

async function stopStudy(sessionId) {
    if (stoppingSession) return;

    setStoppingSession(true);
    setSessionError("");

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/study-sessions/stop/${sessionId}`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to stop study session"
            );
        }

        const taskId =
            typeof activeSession.taskId === "object"
                ? activeSession.taskId._id
                : activeSession.taskId;

        setActiveSession(null);

        await fetchTaskStudyTime(taskId);
        await fetchStudyPlans();
    } catch (error) {
        setSessionError(error.message);
    } finally {
        setStoppingSession(false);
    }
}

    async function completeTask(taskId) {
        try {
            setSessionError("");

            const response = await fetch(
                `${API_BASE_URL}/api/tasks/${taskId}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "Completed",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to complete task"
                );
            }

            // Refresh task statuses and saved plans from the backend.
            await fetchStudyPlans();
        } catch (error) {
            setSessionError(error.message);
        }
    }

    useEffect(() => {
        fetchStudyPlans();
    }, []);

    useEffect(() => {
        if (!activeSession || studyPlans.length === 0) {
            return;
        }

        const taskId =
            typeof activeSession.taskId === "object"
                ? activeSession.taskId?._id
                : activeSession.taskId;

        const scheduledTask = (
            studyPlans[0].scheduledTasks || []
        ).find((task) => task._id === taskId);

        if (
            !scheduledTask ||
            !scheduledTask.scheduledDate ||
            !scheduledTask.scheduledEndTime
        ) {
            return;
        }

        const slotKey = [
            taskId,
            scheduledTask.scheduledDate,
            scheduledTask.scheduledStartTime,
            scheduledTask.scheduledEndTime,
        ].join("-");

        if (notifiedSlotKeys.includes(slotKey)) {
            return;
        }

        const slotEnd = new Date(
            `${scheduledTask.scheduledDate}T${scheduledTask.scheduledEndTime}:00+05:30`
        );

        if (Number.isNaN(slotEnd.getTime())) {
            return;
        }

        const delay = slotEnd.getTime() - Date.now();

    

        function showSlotEndNotice() {
            setSlotEndNotice(
                `Your scheduled study time for "${scheduledTask.title}" has ended. You can continue studying until you finish the task. Continuing may delay later tasks. Once you're finished, we can review your remaining schedule and adjust it if needed.`
            );

            setNotifiedSlotKeys((previousKeys) =>
                previousKeys.includes(slotKey)
                    ? previousKeys
                    : [...previousKeys, slotKey]
            );
        }

      if (delay <= 0){  
            showSlotEndNotice();
            return;
        }

        const timeoutId = setTimeout(showSlotEndNotice, delay);

        return () => clearTimeout(timeoutId);
    }, [activeSession, studyPlans, notifiedSlotKeys]);

    return (
        <main className="study-plan">
            <header className="page-header">
                <p className="eyebrow">YOUR LEARNING JOURNEY</p>
                <h1>My Study Plan</h1>

                <p>
                    Stay organized and make progress toward your exams.
                </p>

                <div className="plan-actions">
                    <button
                        onClick={handleGeneratePlan}
                        disabled={generating || replanning || loading}
                    >
                        {generating
                            ? "Generating Plan..."
                            : "Generate Study Plan"}
                    </button>

                    <button
                        className="secondary-button"
                        onClick={handleReplan}
                        disabled={generating || replanning || loading}
                    >
                        {replanning
                            ? "Replanning..."
                            : "Replan Remaining Schedule"}
                    </button>

                    <button
                        className="secondary-button"
                        onClick={getAIRecommendations}
                        disabled={
                            gettingRecommendations ||
                            loading ||
                            studyPlans.length === 0
                        }
                    >
                        {gettingRecommendations
                            ? "Getting Recommendations..."
                            : "AI Study Recommendations"}
                    </button>
                </div>
            </header>

           {loading && (
                   <p>
                           {generating
                             ? "Generating study plan..."
                             : "Loading study plans..."}
                   </p>
            )}
         {error && (
              <div className="error-message" role="alert">
               <p>{error}</p>

             {!availabilityRequired && (
                   <button
                       onClick={() => {
                       setError("");
                       setLoading(true);
                       fetchStudyPlans();
                      }}
                    >
                    Retry Loading
                   </button>
             )}
           </div>
         )}
            {sessionError && (
                <p className="error-message" role="alert">
                    {sessionError}
                </p>
            )}

            {recommendationError && (
                <div className="error-message" role="alert">
                    <p>{recommendationError}</p>
                </div>
            )}

          
{recommendation && (
    <section className="recommendation-panel">
        <div className="recommendation-header">
            <h2>AI Study Recommendations</h2>
            <button
                type="button"
                className="secondary-button"
                onClick={() => setRecommendation("")}
            >
                Dismiss
            </button>
        </div>

        <p>{recommendation}</p>

        <p className="recommendation-note">
            Recommendations are advisory. The backend scheduler
            remains responsible for time slots, capacity, and
            exam deadlines.
        </p>
    </section>
)}

            {slotEndNotice && (
                <div className="slot-end-notice">
                    <p>{slotEndNotice}</p>
                    <button onClick={() => setSlotEndNotice("")}>
                        Dismiss
                    </button>
                </div>
            )}


{activeSession && (
    <div className="active-session">
        <p>
            {stoppingSession
                ? "Stopping study session..."
                : "Study session in progress."}
        </p>

        <button
            onClick={() => stopStudy(activeSession._id)}
            disabled={stoppingSession}
        >
            {stoppingSession ? "Stopping..." : "Stop Study"}
        </button>
    </div>
)}
        {!loading && !error && availabilityRequired && (
    <section className="plan-section">
        <h2>Study availability required</h2>
        <p>
            Please configure your study availability before viewing
            or generating a study plan.
        </p>
        <button
            onClick={() => {
                window.location.href = "/";
            }}
        >
            Configure Availability
        </button>
    </section>
)}

          {!loading && !error && !availabilityRequired && studyPlans.length === 0 && ( 
                <section className="plan-section">
                    <h2>No saved study plan</h2>
                    <p>
                        Use Generate Study Plan to create a plan from your
                        current tasks and availability.
                    </p>
                </section>
            )}

            {!loading &&
                !error &&
                !availabilityRequired &&
                studyPlans.length > 0 &&
                !hasAnyTasks && (
                    <section className="plan-section">
                        <h2>No tasks yet</h2>
                        <p>
                            Add a task before generating your study plan.
                        </p>
                        <button
                            onClick={() => {
                                window.location.href = "/";
                            }}
                        >
                            Go to Home
                        </button>
                    </section>
                )}

            {!loading &&
                !error &&
                !availabilityRequired &&
                studyPlans.length > 0 &&
                hasAnyTasks &&
                !hasPendingTasks && (
                    <section className="plan-section">
                        <h2>All tasks completed!</h2>
                        <p>
                            Great work! You have completed all your tasks.
                        </p>
                        <p>
                            Add a new task whenever you're ready to plan
                            your next study session.
                        </p>
                        <button
                            onClick={() => {
                                window.location.href = "/";
                            }}
                        >
                            Go to Home
                        </button>
                    </section>
                )}

            {!loading &&
                !error &&
                studyPlans.length > 0 &&
                !availabilityRequired &&
                hasPendingTasks &&
                !hasPendingTasksInCurrentPlan && (
                    <section className="plan-section">
                        <h2>Pending tasks need a plan</h2>
                        <p>
                            You still have pending tasks, but the latest
                            saved plan does not contain any pending tasks.
                            Generate a new plan or replan the remaining
                            schedule to refresh it.
                        </p>
                    </section>
                )}

            {!loading &&
                !error &&
                studyPlans.length > 0 &&
                !availabilityRequired &&
                hasPendingTasks &&
                hasPendingTasksInCurrentPlan && (
                    <section className="plan-section">
                        <h2>Scheduled Tasks</h2>

                        <div className="task-list">
                            {scheduledTasks.map((task) => {
                                const activeTaskId =
                                    typeof activeSession?.taskId === "object"
                                        ? activeSession.taskId?._id
                                        : activeSession?.taskId;

                                const isActiveTask =
                                    activeTaskId === task._id;

                                return (
                                    <article
                                        className="task-card"
                                        key={task._id}
                                    >
                                        <div className="task-card-header">
                                            <h3>{task.title}</h3>
                                            <span
                                                className={`priority ${(
                                                    task.priority || "Medium"
                                                ).toLowerCase()}`}
                                            >
                                                {task.priority} Priority
                                            </span>
                                        </div>

                                        <p className="task-date">
                                            {task.scheduledDate}
                                        </p>

                                        <div className="task-details">
                                            <p>
                                                <strong>Time</strong>
                                                <span>
                                                    {task.scheduledStartTime}{" "}
                                                    - {task.scheduledEndTime}
                                                </span>
                                            </p>

                                            <p>
                                                <strong>Duration</strong>
                                                <span>
                                                    {task.scheduledMinutes}{" "}
                                                    minutes
                                                </span>
                                            </p>

                                            <p>
                                                <strong>Actual study time</strong>
                                                <span>
                                                    {taskStudyTimes[task._id] ??
                                                        0}{" "}
                                                    minutes
                                                </span>
                                            </p>

                                            <p>
                                                <strong>Exam date</strong>
                                                <span>{task.examDate}</span>
                                            </p>
                                        </div>

                                        {!activeSession &&
                                            task.status !== "Completed" && (
                                                <button
                                                    onClick={() =>
                                                        startStudy(task._id)
                                                    }
                                                >
                                                    Start Study
                                                </button>
                                            )}

                                        {task.status !== "Completed" && (
                                            <button
                                                onClick={() =>
                                                    completeTask(task._id)
                                                }
                                                disabled={isActiveTask}
                                            >
                                                Mark as Completed
                                            </button>
                                        )}

                                        {task.status === "Completed" && (
                                            <p>Completed</p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>

                        <h2 className="unscheduled-heading">
                            Unscheduled Tasks
                        </h2>

                        <div className="task-list">
                            {unscheduledTasks.length === 0 ? (
                                <p>All eligible tasks are scheduled.</p>
                            ) : (
                                unscheduledTasks.map((task) => (
                                    <article
                                        className="task-card unscheduled-card"
                                        key={task._id}
                                    >
                                        <h3>{task.title}</h3>
                                        {task.examDate && (
                                         <p>
                                          <strong>Exam date:</strong>{" "}
                                          {new Date(`${task.examDate}T00:00:00`).toLocaleDateString(
                                           "en-IN",
                                          {
                                           day: "numeric",
                                           month: "short",
                                           year: "numeric",
                                         }
                                       )}
                                      </p>
                                      )}

                                        <p>
                                            <strong>Reason:</strong>{" "}
                                            {task.reason}
                                        </p>
                                        <p>{task.recommendation}</p>
                                        <p>
                                            <strong>Required time:</strong>{" "}
                                            {task.requiredMinutes} minutes
                                        </p>
                                        {task.status === "Completed" && (
                                            <p>Completed</p>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                )}
        </main>
    );
}
