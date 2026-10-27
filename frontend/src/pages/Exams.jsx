import { useEffect, useState } from "react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

function dateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function Exams() {
    const [examName, setExamName] = useState("");
    const [examDate, setExamDate] = useState("");
    const [exams, setExams] = useState([]);
    const [editingExamId, setEditingExamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function fetchExams() {
        try {
            setError("");
            const response = await fetch(`${API_BASE_URL}/api/exam`, { credentials: "include" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to load exams");
            setExams(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchExams(); }, []);

    function startEditing(exam) {
        setEditingExamId(exam._id);
        setExamName(exam.examName);
        setExamDate(dateInputValue(exam.examDate));
        setMessage("");
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetForm() {
        setEditingExamId(null);
        setExamName("");
        setExamDate("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        const editing = Boolean(editingExamId);
        try {
            const response = await fetch(
                editing ? `${API_BASE_URL}/api/exam/${editingExamId}` : `${API_BASE_URL}/api/exam`,
                {
                    method: editing ? "PATCH" : "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ examName: examName.trim(), examDate }),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || (editing ? "Failed to update exam" : "Failed to create exam"));
            setMessage(`${data.message || (editing ? "Exam updated" : "Exam created")}${data.planRefresh?.refreshed ? " Study plan refreshed automatically." : data.planRefresh?.warning ? " The exam was saved, but the study plan could not refresh. Open Study and choose Replan Remaining Schedule." : ""}`);
            resetForm();
            await fetchExams();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="page-content exams-page">
            <header className="page-header">
                <p className="eyebrow">DEADLINES</p>
                <h1>My Exams</h1>
                <p>Create and update exam dates. Changes refresh an existing study plan when possible.</p>
            </header>

            <section className="content-panel">
                <h2>{editingExamId ? "Edit Exam" : "Add an Exam"}</h2>
                <form className="form-grid" onSubmit={handleSubmit}>
                    <label htmlFor="examName">Exam name
                        <input id="examName" type="text" maxLength={100} value={examName} onChange={(event) => setExamName(event.target.value)} placeholder="e.g. Semester 7 Exams" required />
                    </label>
                    <label htmlFor="examDate">Exam date
                        <input id="examDate" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} required />
                    </label>
                    <div className="form-actions">
                        <button type="submit" disabled={saving}>{saving ? "Saving..." : editingExamId ? "Save Changes" : "Add Exam"}</button>
                        {editingExamId && <button className="secondary-button" type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
                    </div>
                </form>
                {message && <p className="success-message" role="status">{message}</p>}
                {error && <p className="error-message" role="alert">{error}</p>}
            </section>

            <section className="content-panel exam-list">
                <div className="section-heading"><h2>Saved Exams</h2><span className="count-pill">{exams.length}</span></div>
                {loading ? <p>Loading exams...</p> : exams.length === 0 ? <p className="empty-state">No exams created yet. Add your first exam above.</p> : (
                    <div className="exam-table-wrapper"><table className="exam-table">
                        <thead><tr><th>#</th><th>Exam Name</th><th>Exam Date</th><th>Actions</th></tr></thead>
                        <tbody>{exams.map((exam, index) => <tr key={exam._id}>
                            <td>{index + 1}</td><td>{exam.examName}</td>
                            <td>{new Date(exam.examDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</td>
                            <td><div className="table-actions"><button type="button" className="secondary-button" onClick={() => startEditing(exam)}>Edit</button></div></td>
                        </tr>)}</tbody>
                    </table></div>
                )}
            </section>
        </main>
    );
}
