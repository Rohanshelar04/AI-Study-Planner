import { Link } from "react-router-dom";

export default function Home() {
    return (
        <main className="home-page">
            <section className="home-hero">
                <p className="eyebrow">PLAN WITH PURPOSE</p>
                <h1>A study plan that adapts as you progress.</h1>
                <p>Organize exam deadlines, choose when you can study, track your actual study sessions, and replan the work that remains.</p>
                <div className="home-actions">
                    <Link className="primary-link" to="/study-plan">Open Study Plan</Link>
                    <Link className="secondary-link" to="/register">Create Account</Link>
                </div>
            </section>
            <section className="feature-grid" aria-label="Main features">
                <article><h2>Plan around availability</h2><p>Use your weekly study windows to allocate tasks into realistic time slots.</p></article>
                <article><h2>Respect exam deadlines</h2><p>The deterministic scheduler checks deadlines, task duration, priority, and available capacity.</p></article>
                <article><h2>Adapt and improve</h2><p>Track study sessions, replan remaining work, and request AI study recommendations.</p></article>
            </section>
        </main>
    );
}
