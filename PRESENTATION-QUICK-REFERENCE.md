# AI Study Planner — Presentation Quick Reference

## 1. Project Pitch

AI Study Planner is a MERN-stack web application that helps students organize pending academic tasks around their available study time, priorities, and exam deadlines. It uses deterministic backend scheduling to allocate tasks and includes AI-based study recommendations.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Parcel |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT, HttpOnly cookies |
| Password hashing | bcrypt |
| Scheduling | Deterministic backend logic |
| AI recommendations | Gemini integration |

## 3. Main Request Flow

1. The user interacts with the React frontend.
2. The frontend sends authenticated API requests.
3. Express routes and authentication middleware process requests.
4. Backend logic validates data and applies business rules.
5. MongoDB stores and retrieves application data.
6. The frontend displays the API response.

## 4. Important Scheduling Decisions

- Schedule pending tasks rather than completed tasks.
- Respect exam deadlines and available slot capacity.
- Consider the nearest exam deadline before later exams.
- Allow multiple tasks within a suitable availability slot.
- Report work that cannot fit into the available time.
- Keep deterministic scheduling separate from AI recommendations.
- Retrieve saved plans with `GET /api/study-plan`.
- Generate and save a plan with `POST /api/study-plan/generate`.

## 5. Authentication Talking Points

- Passwords are hashed using bcrypt.
- The backend issues a JWT during login.
- The JWT is stored in an HttpOnly cookie.
- Protected routes authenticate incoming requests.
- User-specific resources require backend ownership checks.
- Production deployment requires correct HTTPS, CORS, and cookie configuration.

## 6. Study Session Talking Points

- A scheduled slot represents available time.
- A study session records actual time spent studying.
- Session start and stop are separate from task completion.
- Actual study time should accumulate across sessions.
- Backend timestamps and calculations protect data integrity.

Verify each behavior against the current implementation before presenting it as a completed feature.

## 7. Suggested Demo Order

1. Login.
2. Show study profile and availability.
3. Show exams, subjects, and tasks.
4. Generate a study plan.
5. Explain scheduled and unscheduled tasks.
6. Start and stop a study session.
7. Demonstrate task completion and actual-time tracking.
8. Show AI recommendations if the integration is working.
9. Explain current limitations and future improvements.

## 8. Interview Questions to Prepare

- Why did you choose the MERN stack?
- Why is deterministic scheduling used instead of AI for time allocation?
- How are exam deadlines handled?
- What is the difference between a slot and a study session?
- How does JWT cookie authentication work?
- How do you prevent cross-user access?
- How do you test scheduling constraints?
- What happens when available study time is insufficient?
- What would you improve next?

## 9. Future Improvements

- Break-aware study estimates.
- Adaptive replanning after overruns.
- Planned-versus-actual study analytics.
- Temporary daily availability overrides.
- Additional integration tests.
- Production deployment and monitoring.

## 10. Final Reminder

Explain the reasoning behind your technical decisions, demonstrate only features you have verified, and be honest about unfinished work.

