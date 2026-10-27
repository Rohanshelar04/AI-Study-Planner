import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getNextDateForDay(dayName) {
    const today = new Date();
    const targetDay = DAYS.indexOf(dayName);
    const currentDay = (today.getDay() + 6) % 7; // Monday = 0

    const daysUntil = (targetDay - currentDay + 7) % 7;

    const date = new Date(today);
    date.setDate(today.getDate() + daysUntil);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
}

function createEmptySchedule() {
    return DAYS.map((day) => ({ day, slots: [] }));
}

function createClientId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Availability() {
    const [weeklySchedule, setWeeklySchedule] = useState(createEmptySchedule);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [validationError, setValidationError] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const response = await fetch(`${API_BASE_URL}/api/availability`, {
                credentials: "include",
            });

            if (response.status === 404) {
                // A new user has not saved availability yet. Keep the editor usable.
                setWeeklySchedule(createEmptySchedule());
                return;
            }

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Could not load availability. Please log in and try again.");
            }

            const savedSchedule = Array.isArray(data) ? data : data.weeklySchedule;
            if (!Array.isArray(savedSchedule)) {
                throw new Error("The server returned an unexpected availability format.");
            }

            setWeeklySchedule(DAYS.map((day) => {
                const savedDay = savedSchedule.find((item) => item.day === day);
                return {
                    day,
                    slots: (savedDay?.slots || []).map((slot) => ({
                        startTime: slot.startTime || "",
                        endTime: slot.endTime || "",
                        clientId: createClientId(),
                    })),
                };
            }));
        } catch (error) {
            setLoadError(
                error instanceof TypeError
                    ? "Cannot connect to the backend. Start the backend server and check its MongoDB connection, then select Retry. You can still edit slots here, but saving needs the server."
                    : error.message || "Could not load availability."
            );
            // Keep all seven days visible even if the backend is unavailable.
            setWeeklySchedule((current) => current.length ? current : createEmptySchedule());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    function addSlot(day) {
        setWeeklySchedule((previous) => previous.map((item) => item.day === day
            ? { ...item, slots: [...item.slots, { clientId: createClientId(), startTime: "", endTime: "" }] }
            : item));
        setValidationError("");
        setSaveMessage("");
    }

    function removeSlot(day, clientId) {
        setWeeklySchedule((previous) => previous.map((item) => item.day === day
            ? { ...item, slots: item.slots.filter((slot) => slot.clientId !== clientId) }
            : item));
        setValidationError("");
        setSaveMessage("");
    }

    function updateSlot(day, clientId, field, value) {
        setWeeklySchedule((previous) => previous.map((item) => item.day === day
            ? { ...item, slots: item.slots.map((slot) => slot.clientId === clientId ? { ...slot, [field]: value } : slot) }
            : item));
        setValidationError("");
        setSaveMessage("");
    }

    function validateSchedule() {
        for (const daySchedule of weeklySchedule) {
            const slots = daySchedule.slots;
            for (const slot of slots) {
                if (!slot.startTime || !slot.endTime) {
                    return `${daySchedule.day}: enter both the start and end time, or remove the empty slot.`;
                }
                if (slot.endTime <= slot.startTime) {
                    return `${daySchedule.day}: the end time must be later than the start time.`;
                }
            }
            for (let i = 0; i < slots.length; i++) {
                for (let j = i + 1; j < slots.length; j++) {
                    if (slots[i].startTime < slots[j].endTime && slots[j].startTime < slots[i].endTime) {
                        return `${daySchedule.day}: study slots cannot overlap.`;
                    }
                }
            }
        }
        return "";
    }

    async function saveAvailability() {
        setValidationError("");
        setSaveMessage("");
        const validationMessage = validateSchedule();
        if (validationMessage) {
            setValidationError(validationMessage);
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/availability`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weeklySchedule: weeklySchedule.map(({ day, slots }) => ({
                        day,
                        slots: slots.map(({ startTime, endTime }) => ({ startTime, endTime })),
                    })),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Failed to save availability. Check that you are logged in.");
            }
            setLoadError("");
            setSaveMessage(`${data.message || "Your weekly availability has been saved."}${data.planRefresh?.refreshed ? " The study plan was refreshed automatically." : data.planRefresh?.warning ? " Availability was saved, but the plan could not refresh. Open Study and choose Replan Remaining Schedule." : ""}`);
        } catch (error) {
            setValidationError(error instanceof TypeError
                ? "Cannot connect to the backend. Start the server and verify the MongoDB connection before saving."
                : error.message || "Failed to save availability.");
        } finally {
            setSaving(false);
        }
    }

    const slotCount = weeklySchedule.reduce((total, day) => total + day.slots.length, 0);

    return (
        <main className="availability-page">
            <header className="availability-header">
                <div>
                    <p className="eyebrow">YOUR STUDY ROUTINE</p>
                    <h1>Weekly availability</h1>
                   <p>
                     Choose the time windows when you can study. Your planner uses these
                    slots to build a realistic schedule.
                  </p>

                <div className="availability-notice">
                     <strong>How weekly availability works</strong>
                      <p>
                        Your selected days and times repeat every week. For example,
                        a Monday slot applies to every Monday, not just the date shown.
                       The date beside each day helps you identify its next occurrence.
                       The planner schedules tasks only when they fit before their exam
                       deadlines.
                   </p>
                 </div>
                </div>
                <div className="availability-summary" aria-live="polite">
                    <strong>{slotCount}</strong>
                    <span>{slotCount === 1 ? "slot added" : "slots added"}</span>
                </div>
            </header>

            {loading && <p className="availability-notice" role="status">Loading your saved availability…</p>}
            {loadError && (
                <div className="availability-alert" role="alert">
                    <div><strong>Availability couldn't be loaded</strong><p>{loadError}</p></div>
                    <button type="button" className="button-secondary" onClick={fetchAvailability} disabled={loading}>
                        {loading ? "Retrying…" : "Retry"}
                    </button>
                </div>
            )}

            <div className="availability-days">
                {weeklySchedule.map((daySchedule) => (
                    <section className="availability-day" key={daySchedule.day}>
                        <div className="availability-day-header">
                            <div>
                                <h2>{daySchedule.day} · {getNextDateForDay(daySchedule.day)}</h2>
                                <p>{daySchedule.slots.length === 0
                                    ? "No study windows yet"
                                    : `${daySchedule.slots.length} ${daySchedule.slots.length === 1 ? "study window" : "study windows"}`}</p>
                            </div>
                            <button type="button" className="add-slot-button" onClick={() => addSlot(daySchedule.day)}>
                                <span aria-hidden="true">＋</span> Add slot
                            </button>
                        </div>

                        {daySchedule.slots.length === 0 ? (
                            <div className="availability-empty">Add a time window for this day if you plan to study.</div>
                        ) : (
                            <div className="availability-slot-list">
                                {daySchedule.slots.map((slot, index) => (
                                    <div className="availability-slot" key={slot.clientId}>
                                        <span className="slot-number">{String(index + 1).padStart(2, "0")}</span>
                                        <label>
                                            Start time
                                            <input type="time" value={slot.startTime} onChange={(event) => updateSlot(daySchedule.day, slot.clientId, "startTime", event.target.value)} />
                                        </label>
                                        <label>
                                            End time
                                            <input type="time" value={slot.endTime} onChange={(event) => updateSlot(daySchedule.day, slot.clientId, "endTime", event.target.value)} />
                                        </label>
                                        <button type="button" className="remove-slot-button" onClick={() => removeSlot(daySchedule.day, slot.clientId)} aria-label={`Remove slot ${index + 1} for ${daySchedule.day}`}>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>

            <footer className="availability-footer">
                <div><strong>Remember to save</strong><p>Your changes aren't stored until you save your schedule.</p></div>
                <button type="button" className="save-availability-button" onClick={saveAvailability} disabled={saving}>
                    {saving ? "Saving schedule…" : "Save availability"}
                </button>
            </footer>

            {validationError && <p className="form-feedback error-message" role="alert">{validationError}</p>}
            {saveMessage && <p className="form-feedback success-message" role="status">{saveMessage}</p>}
        </main>
    );
}
