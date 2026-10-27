import { useEffect, useState } from "react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default function Profile() {
    const [dailyStudyHours, setDailyStudyHours] = useState("4");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/study-profile`, { credentials: "include" });
                if (response.status === 404) return;
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load profile");
                setDailyStudyHours(String(data.dailyStudyHours));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/study-profile`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dailyStudyHours: Number(dailyStudyHours) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to save profile");
            setMessage(`${data.message}. Note: weekly Availability slots, not this profile target, currently determine the scheduler's available time.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="page-content profile-page">
            <header className="page-header"><p className="eyebrow">YOUR SETTINGS</p><h1>Profile</h1><p>Set your usual daily study target.</p></header>
            <section className="content-panel profile-card">
                <div className="profile-avatar" aria-hidden="true">SP</div>
                <h2>Study preferences</h2>
                <p>This target is saved with your study profile. Your actual schedule is still constrained by your weekly availability and exam dates.</p>
                {loading ? <p>Loading profile...</p> : <form className="form-grid profile-form" onSubmit={handleSubmit}>
                    <label htmlFor="dailyStudyHours">Daily study target (hours)
                        <input id="dailyStudyHours" type="number" min="1" max="16" step="0.5" value={dailyStudyHours} onChange={(event) => setDailyStudyHours(event.target.value)} required />
                    </label>
                    <div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Preferences"}</button></div>
                </form>}
                {message && <p className="success-message" role="status">{message}</p>}
                {error && <p className="error-message" role="alert">{error}</p>}
            </section>
        </main>
    );
}
