import { useEffect, useState } from "react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default function Subjects() {
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState("");
    const [examId, setExamId] = useState("");
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setError("");
            const [examResponse, subjectResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/exam`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/api/subject`, { credentials: "include" }),
            ]);
            const [examData, subjectData] = await Promise.all([examResponse.json(), subjectResponse.json()]);
            if (!examResponse.ok) throw new Error(examData.message || "Failed to load exams");
            if (!subjectResponse.ok) throw new Error(subjectData.message || "Failed to load subjects");
            setExams(examData);
            setSubjects(subjectData);
            if (!examId && examData.length) setExamId(examData[0]._id);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    function startEditing(subject) {
        setEditingSubjectId(subject._id);
        setSubjectName(subject.subjectName);
        setExamId(subject.examId);
        setMessage("");
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetForm() {
        setEditingSubjectId(null);
        setSubjectName("");
        setExamId(exams[0]?._id || "");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        const editing = Boolean(editingSubjectId);
        try {
            const response = await fetch(
                editing ? `${API_BASE_URL}/api/subject/${editingSubjectId}` : `${API_BASE_URL}/api/subject`,
                {
                    method: editing ? "PATCH" : "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subjectName: subjectName.trim(), examId }),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || (editing ? "Failed to update subject" : "Failed to create subject"));
            setMessage(`${data.message || (editing ? "Subject updated" : "Subject created")}${data.planRefresh?.refreshed ? " Study plan refreshed automatically." : data.planRefresh?.warning ? " The subject was saved, but the study plan could not refresh. Open Study and choose Replan Remaining Schedule." : ""}`);
            resetForm();
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const getExamName = (id) => exams.find((exam) => exam._id === id)?.examName || "Unknown exam";

    return (
        <main className="page-content exams-page">
            <header className="page-header">
                <p className="eyebrow">YOUR COURSEWORK</p>
                <h1>My Subjects</h1>
                <p>Organize subjects under exams. You can correct a subject name or move it to another exam later.</p>
            </header>

            {loading ? <p>Loading exams and subjects...</p> : (
                <>
                    {exams.length === 0 ? <section className="content-panel"><p>Create an exam first on the Exams page.</p></section> : (
                        <section className="content-panel">
                            <h2>{editingSubjectId ? "Edit Subject" : "Add a Subject"}</h2>
                            <form className="form-grid" onSubmit={handleSubmit}>
                                <label htmlFor="subjectName">Subject name
                                    <input id="subjectName" value={subjectName} maxLength={100} onChange={(event) => setSubjectName(event.target.value)} placeholder="e.g. DBMS" required />
                                </label>
                                <label htmlFor="examId">Associated exam
                                    <select id="examId" value={examId} onChange={(event) => setExamId(event.target.value)} required>
                                        <option value="">Select an exam</option>
                                        {exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.examName}</option>)}
                                    </select>
                                </label>
                                <div className="form-actions">
                                    <button type="submit" disabled={saving}>{saving ? "Saving..." : editingSubjectId ? "Save Changes" : "Add Subject"}</button>
                                    {editingSubjectId && <button className="secondary-button" type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
                                </div>
                            </form>
                        </section>
                    )}

                    <section className="content-panel exam-list">
                        <div className="section-heading"><h2>Saved Subjects</h2><span className="count-pill">{subjects.length}</span></div>
                        {subjects.length === 0 ? <p className="empty-state">No subjects created yet.</p> : (
                            <div className="exam-table-wrapper"><table className="exam-table">
                                <thead><tr><th>#</th><th>Subject</th><th>Exam</th><th>Actions</th></tr></thead>
                                <tbody>{subjects.map((subject, index) => <tr key={subject._id}>
                                    <td>{index + 1}</td><td>{subject.subjectName}</td><td>{getExamName(subject.examId)}</td>
                                    <td><div className="table-actions"><button type="button" className="secondary-button" onClick={() => startEditing(subject)}>Edit</button></div></td>
                                </tr>)}</tbody>
                            </table></div>
                        )}
                    </section>
                </>
            )}
            {message && <p className="success-message" role="status">{message}</p>}
            {error && <p className="error-message" role="alert">{error}</p>}
        </main>
    );
}
