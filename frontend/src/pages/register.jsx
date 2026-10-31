import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default function Register({ onRegisterSuccess }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const navigate = useNavigate();

    async function handleRegister(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Registration failed");

            // Log the new user in right away so they go straight into the app.
            const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const loginData = await loginResponse.json();
            if (!loginResponse.ok) {
                throw new Error(
                    loginData.message ||
                        "Your account was created, but automatic login failed. Please log in."
                );
            }

            onRegisterSuccess();
            navigate("/", { replace: true });
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
                    <div className="password-field">
                        <input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword((current) => !current)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                    </div>
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