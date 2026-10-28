import { useEffect, useState } from "react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default function Tasks() {
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [estimatedMinutes, setEstimatedMinutes] = useState(30);
    const [priority, setPriority] = useState("Medium");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [editingTaskId, setEditingTaskId] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const isEditing = editingTaskId !== null;

    try {
        const response = await fetch(
            isEditing
                ? `${API_BASE_URL}/api/tasks/${editingTaskId}`
                : `${API_BASE_URL}/api/tasks`,
            {
                method: isEditing ? "PATCH" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    subjectId,
                    estimatedMinutes: Number(estimatedMinutes),
                    priority,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                (isEditing
                    ? "Failed to update task"
                    : "Failed to create task")
            );
        }

        const baseMessage = isEditing ? "Task updated successfully!" : "Task created successfully!";
     if (isEditing && data.task) {
    setTasks((previousTasks) =>
        previousTasks.map((task) =>
            task._id === data.task._id ? data.task : task
        )
    );
} else if (data.task) {
    setTasks((previousTasks) => [...previousTasks, data.task]);
}

setMessage(
    `${baseMessage}${
        data.planRefresh?.refreshed
            ? " Study plan refreshed automatically."
            : data.planRefresh?.warning
                ? " Task saved, but the plan could not refresh. Open Study and choose Replan Remaining Schedule."
                : ""
    }`
);

        // Reset all form fields
        setTitle("");
        setSubjectId("");
        setEstimatedMinutes(30);
        setPriority("Medium");
        setEditingTaskId(null);

    } catch (error) {
        setMessage(error.message);
    } finally {
        setSaving(false);
    }
}

async function fetchTasks() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks`,
            { credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load tasks");
        }

        setTasks(data);
    } catch (error) {
        setMessage(error.message);
    }
}


async function handleCompleteTask(taskId) {
    setMessage("");

    try {
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
            throw new Error(data.message || "Failed to complete task");
        }

        setMessage(`Task marked as completed!${data.planRefresh?.refreshed ? " Study plan refreshed automatically." : data.planRefresh?.warning ? " Task saved, but the plan could not refresh. Open Study and choose Replan Remaining Schedule." : ""}`);
        await fetchTasks();
    } catch (error) {
        setMessage(error.message);
    }
}

async function handleReopenTask(taskId) {
    setMessage("");

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/tasks/${taskId}`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "Pending",
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to reopen task");
        }

        setMessage(`Task reopened successfully!${data.planRefresh?.refreshed ? " Study plan refreshed automatically." : data.planRefresh?.warning ? " Task saved, but the plan could not refresh. Open Study and choose Replan Remaining Schedule." : ""}`);
        await fetchTasks();
    } catch (error) {
        setMessage(error.message);
    }
}

function handleEditTask(task) {
    setEditingTaskId(task._id);
    setTitle(task.title);
    setSubjectId(
        typeof task.subjectId === "object"
            ? task.subjectId._id
            : task.subjectId
    );
    setEstimatedMinutes(task.estimatedMinutes);
    setPriority(task.priority || "Medium");
    setMessage("");
}

    useEffect(() => {
        async function fetchSubjects() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/subject`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load subjects");
                }

                setSubjects(data);
            } catch (error) {
                setMessage(error.message);
            } finally {
                setLoading(false);
            }
        }

        async function fetchExams() {
          try {
            const response = await fetch(
            `${API_BASE_URL}/api/exam`,
            { credentials: "include" }
           );

           const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to load exams");
          }

           setExams(data);
        } catch (error) {
          setMessage(error.message);
       }
     }

        fetchSubjects();
        fetchExams();
        fetchTasks();
    }, []);

   
return (
    <main className="tasks-page">
        <h1>My Tasks</h1>
        <p>Create a task to include it in your study planning.</p>

        {loading ? (
            <p>Loading subjects...</p>
        ) : (
         <form onSubmit={handleSubmit}>
                <label htmlFor="title">Task title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                />

                <label htmlFor="subject">Subject</label>
                <select
                    id="subject"
                    value={subjectId}
                    onChange={(event) => setSubjectId(event.target.value)}
                    required
                >
                    <option value="">Select a subject</option>
                   {subjects.map((subject) => {
                          const exam = exams.find(
                            (exam) => exam._id === subject.examId
                          );
                    return (
                       <option key={subject._id} value={subject._id}>
                            {subject.subjectName} — {exam?.examName || "Unknown exam"}
                       </option>
                     );
                   })}
                </select>

                <label htmlFor="minutes">Estimated minutes</label>
                <input
                    id="minutes"
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={(event) =>
                        setEstimatedMinutes(Number(event.target.value))
                    }
                    required
                />

                <label htmlFor="priority">Priority</label>
                <select
                    id="priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
                <button type="submit" disabled={saving}>
                     {saving ? "Saving..." : "Add Task"}
                </button>
            </form>
        )}

<section className="task-list">
    <h2>My Created Tasks</h2>

    {tasks.length === 0 ? (
        <p>No tasks created yet.</p>
    ) : (
        <div className="task-table-wrapper">
            <table className="task-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Task</th>
                        <th>Subject</th>
                        <th>Exam</th>
                        <th>Minutes</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {tasks.map((task, index) => {
                        const subject = subjects.find(
                            (item) => item._id === task.subjectId
                        );

                        const exam = exams.find(
                            (item) => item._id === subject?.examId
                        );

                        return (
                            <tr key={task._id}>
                                <td>{index + 1}</td>
                                <td>{task.title}</td>
                                <td>
                                    {subject?.subjectName || "Unknown subject"}
                                </td>
                                <td>
                                    {exam?.examName || "Unknown exam"}
                                </td>
                                <td>{task.estimatedMinutes}</td>
                                <td>
                                    <span className={`priority ${task.priority.toLowerCase()}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td>{task.status}</td>
                            
                                 <td>
                                  {task.status === "Completed" ? (
                                    <>
                                   <span>Completed ✓</span>

                                   <button
                                      type="button"
                                      onClick={() => handleReopenTask(task._id)}
                                   >
                                   Reopen Task
                                   </button>
                                   </>
                                   ) : (
                                   <>
                                   <button
                                   type="button"
                                   onClick={() => handleEditTask(task)}
                                   >
                                   Edit
                                   </button>
                                 <button
                                  type="button"
                                  onClick={() => handleCompleteTask(task._id)}
                                 >
                                 Mark Completed
                                </button>
                             </>
                            )}
                            </td>
 
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )}
</section>


        {message && <p>{message}</p>}
    </main>
);

}
