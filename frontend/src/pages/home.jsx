import { Link } from "react-router-dom";

export default function Home() {
    const steps = [
        {
            number: "01",
            title: "Set your availability",
            description:
                "Choose the days and time slots when you are available to study.",
        },
        {
            number: "02",
            title: "Add exams and subjects",
            description:
                "Enter your exam dates and organize the subjects you need to prepare.",
        },
        {
            number: "03",
            title: "Create study tasks",
            description:
                "Add pending work, estimated study minutes, and task priorities.",
        },
        {
            number: "04",
            title: "Generate your study plan",
            description:
                "Let the scheduler allocate tasks according to your available time and exam deadlines.",
        },
        {
            number: "05",
            title: "Track your progress",
            description:
                "Start study sessions, record your actual study time, and mark tasks completed when finished.",
        },
    ];

    return (
        <main className="home-page">
            <section className="home-hero">
                <p className="eyebrow">PLAN WITH PURPOSE</p>
                <h1>A study plan that adapts as you progress.</h1>
                <p>
                    Organize exam deadlines, choose when you can study, track your
                    actual study sessions, and replan the work that remains.
                </p>

                <div className="home-actions">
                    <Link className="primary-link" to="/study-plan">
                        Open Study Plan
                    </Link>
                    <Link className="secondary-link" to="/register">
                        Create Account
                    </Link>
                </div>
            </section>

            <section className="feature-grid" aria-label="Main features">
                <article>
                    <h2>Plan around availability</h2>
                    <p>
                        Use your weekly study windows to allocate tasks into
                        realistic time slots.
                    </p>
                </article>

                <article>
                    <h2>Respect exam deadlines</h2>
                    <p>
                        The deterministic scheduler checks deadlines, task duration,
                        priority, and available capacity.
                    </p>
                </article>

                <article>
                    <h2>Adapt and improve</h2>
                    <p>
                        Track study sessions, replan remaining work, and request AI
                        study recommendations.
                    </p>
                </article>
            </section>

            <section className="getting-started">
                <p className="eyebrow">YOUR FIRST STEPS</p>
                <h2>How to get started</h2>
                <p className="getting-started-intro">
                    Follow these steps to turn your pending work into a practical
                    study plan.
                </p>

                <div className="getting-started-grid">
                    {steps.map((step) => (
                        <article className="getting-started-card" key={step.number}>
                            <span className="step-number">{step.number}</span>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </article>
                    ))}
                </div>

                <div className="getting-started-action">
                    <p>Ready to organize your exam preparation?</p>
                    <Link className="primary-link" to="/register">
                        Get Started
                    </Link>
                </div>
            </section>
        </main>
    );
}