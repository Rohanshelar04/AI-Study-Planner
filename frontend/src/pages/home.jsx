import { Link } from "react-router-dom";

const steps = [
    {
        number: "1",
        title: "Set your availability",
        description:
            "Choose the days and time slots when you can realistically study.",
    },
    {
        number: "2",
        title: "Add exams and subjects",
        description:
            "Enter your exam dates and organize the subjects you need to prepare.",
    },
    {
        number: "3",
        title: "Create your tasks",
        description:
            "Break your pending work into tasks with estimated durations and priorities.",
    },
    {
        number: "4",
        title: "Build your study plan",
        description:
            "Let the scheduler allocate tasks around available time and exam deadlines.",
    },
    {
        number: "5",
        title: "Study and track progress",
        description:
            "Record study sessions, review your progress, and mark tasks completed.",
    },
];

export default function Home({ authenticated }) {
    return (
        <main className="home-page">
            <section className="home-hero">
                <h1>
                    Less time figuring out what to study. More time actually
                    studying.
                </h1>

                <p className="home-hero-description">
                    Organize your exams, plan around your availability, and
                    make steady progress on the work that matters.
                </p>

                <div className="home-actions">
                    {authenticated ? (
                        <>
                            <Link className="primary-link" to="/study-plan">
                                View study plan
                            </Link>

                            <Link className="secondary-link" to="/tasks">
                                Add a task
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link className="primary-link" to="/register">
                                Get started
                            </Link>

                            <Link className="secondary-link" to="/login">
                                Log in
                            </Link>
                        </>
                    )}
                </div>
            </section>

            <section
                className="home-guide"
                aria-labelledby="getting-started-title"
            >
                <div className="home-guide-heading">
                    <h2 id="getting-started-title">
                        From pending work to a clear plan
                    </h2>
                    <p>
                        Set things up once, then use your study plan to guide
                        each study session.
                    </p>
                </div>

                <ol className="home-step-list">
                    {steps.map((step) => (
                        <li className="home-step" key={step.number}>
                            <span className="home-step-number">
                                {step.number}
                            </span>

                            <div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="home-bottom-cta">
                <div>
                    <h2>Start with your next exam</h2>
                    <p>
                        Add your study commitments and build a plan around the
                        time you have.
                    </p>
                </div>

                {authenticated ? (
                    <Link className="primary-link" to="/exams">
                        Add an exam
                    </Link>
                ) : (
                    <Link className="primary-link" to="/register">
                        Create your account
                    </Link>
                )}
            </section>
        </main>
    );
}