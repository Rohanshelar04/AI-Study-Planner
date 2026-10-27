import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default function Login({ onLoginSuccess })  {
   const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(event) {
        event.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Login failed");
          onLoginSuccess();
          navigate("/study-plan", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <p className="eyebrow">WELCOME BACK</p>
                <h1>Log in</h1>
                <form onSubmit={handleLogin} className="auth-form">
                    <label htmlFor="emailid">Email</label>
                    <input id="emailid" type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} required />
                    <label htmlFor="pass">Password</label>
                    <input id="pass" type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required />
                    <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
                </form>
                {message && <p className="success-message" role="status">{message}</p>}
                {error && <p className="error-message" role="alert">{error}</p>}
                <p>New here? <Link to="/register">Create an account</Link></p>
            </section>
        </main>
    );
}
