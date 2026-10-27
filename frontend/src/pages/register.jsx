import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleRegister(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Registration failed");
            setMessage(`${data.message} You can now log in.`);
            setName("");
            setEmail("");
            setPassword("");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <p className="eyebrow">GET STARTED</p>
                <h1>Create your account</h1>
                <p>Set up your study planner and organize your exam preparation.</p>
                <form onSubmit={handleRegister} className="auth-form">
                    <label htmlFor="register-name">Name</label>
                    <input id="register-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
                    <label htmlFor="register-email">Email</label>
                    <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    <label htmlFor="register-password">Password</label>
                    <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" />
                    <p className="form-hint">Use a strong password with uppercase and lowercase letters, a number, and a symbol.</p>
                    <button type="submit" disabled={saving}>{saving ? "Creating account..." : "Create account"}</button>
                </form>
                {message && <p className="success-message" role="status">{message}</p>}
                {error && <p className="error-message" role="alert">{error}</p>}
                <p>Already registered? <Link to="/login">Log in</Link></p>
            </section>
        </main>
    );
}
