import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    NavLink,
    useNavigate,
    useLocation,
    Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import {
    Home as HomeIcon,
    CalendarDays,
    ListChecks,
    GraduationCap,
    BookOpen,
    Clock,
    User,
    LogOut,
    CalendarCheck,
} from "lucide-react";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import StudyPlan from "./pages/studyPlan";
import Availability from "./pages/Availability";
import Tasks from "./pages/Tasks";
import Exams from "./pages/Exams";
import Subjects from "./pages/Subjects";
import Profile from "./pages/Profile";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

const mainNavItems = [
    { to: "/", label: "Home", icon: HomeIcon, end: true },
    { to: "/study-plan", label: "Study plan", icon: CalendarDays },
    { to: "/tasks", label: "Tasks", icon: ListChecks },
    { to: "/exams", label: "Exams", icon: GraduationCap },
    { to: "/subjects", label: "Subjects", icon: BookOpen },
    { to: "/availability", label: "Availability", icon: Clock },
];

const pageTitles = {
    "/": "Home",
    "/study-plan": "Study plan",
    "/tasks": "Tasks",
    "/exams": "Exams",
    "/subjects": "Subjects",
    "/availability": "Availability",
    "/profile": "Profile",
};

function Navigation({ authenticated, setAuthenticated }) {
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Logout failed. Please try again.");
            setAuthenticated(false);
            navigate("/login");
        } catch (error) {
            alert(error.message || "Could not log out. Check your backend connection.");
        }
    }

    if (!authenticated) {
        return (
            <header className="public-topbar">
                <Link className="brand-mark" to="/">Study Planner</Link>
                <div className="public-links">
                    <Link to="/login">Login</Link>
                    <Link className="primary-link" to="/register">Register</Link>
                </div>
            </header>
        );
    }

    const pageTitle = pageTitles[location.pathname] || "Study Planner";

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <Link className="sidebar-brand" to="/study-plan">
                    <span className="brand-symbol"><CalendarCheck size={18} aria-hidden="true" /></span>
                    <span>Study Planner</span>
                </Link>

                <nav className="sidebar-nav" aria-label="Main navigation">
                    {mainNavItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                        >
                            <Icon className="sidebar-icon" size={18} aria-hidden="true" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    >
                        <User className="sidebar-icon" size={18} aria-hidden="true" />
                        <span>Profile</span>
                    </NavLink>
                    <button type="button" className="sidebar-link" onClick={handleLogout}>
                        <LogOut className="sidebar-icon" size={18} aria-hidden="true" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            <header className="app-topbar">
                <span className="topbar-title">{pageTitle}</span>
                <Link className="topbar-user" to="/profile" aria-label="Open profile">
                    <span className="topbar-avatar"><User size={16} aria-hidden="true" /></span>
                </Link>
            </header>
        </div>
    );
}

function ProtectedRoute({ authenticated, children }) {
    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function AppContent() {
    const [authenticated, setAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    credentials: "include",
                });

                setAuthenticated(response.ok);
            } catch (error) {
                setAuthenticated(false);
            } finally {
                setCheckingAuth(false);
            }
        }

        checkAuth();
    }, []);

    if (checkingAuth) {
        return (
            <div className="page-loading" role="status">
                <span className="spinner" aria-hidden="true" />
                Checking your session...
            </div>
        );
    }

    return (
        <>
            <Navigation authenticated={authenticated} setAuthenticated={setAuthenticated} />
            <div className={authenticated ? "app-content" : "public-content"}>
            <Routes>
                <Route path="/" element={<Home />} />

            <Route
              path="/login"
              element={
                 authenticated
                 ? <Navigate to="/study-plan" replace />
                 : <Login onLoginSuccess={() => setAuthenticated(true)} />
             }
            />

                <Route
                    path="/register"
                    element={
                        authenticated
                            ? <Navigate to="/study-plan" replace />
                            : <Register />
                    }
                />

                <Route
                    path="/study-plan"
                    element={
                        <ProtectedRoute authenticated={authenticated}>
                            <StudyPlan />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/availability"
                    element={
                        <ProtectedRoute authenticated={authenticated}>
                            <Availability />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/tasks"
                    element={
                        <ProtectedRoute authenticated={authenticated}>
                            <Tasks />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/exams"
                    element={
                          <ProtectedRoute authenticated={authenticated}>
                          <Exams />
                          </ProtectedRoute>
                    }
                 />

                 <Route
                    path="/subjects"
                    element={<ProtectedRoute authenticated={authenticated}><Subjects /></ProtectedRoute>}
                 />
                 <Route
                    path="/profile"
                    element={<ProtectedRoute authenticated={authenticated}><Profile /></ProtectedRoute>}
                 />
            </Routes>
            </div>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}