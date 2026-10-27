# AI Study Planner — Current Project Context

**Updated: 2026-10-26. This file is the current source of truth for the supplied ZIP.** Older descriptions from earlier development stages are intentionally not carried forward where they conflict with the current implementation.

## Purpose and architecture

The application is a MERN-style project: React 19 + React Router + Parcel frontend; Express 5 + Mongoose backend; MongoDB persistence; bcrypt/JWT authentication with an HttpOnly cookie. The deterministic scheduler owns hard constraints such as task duration, available-slot capacity, and exam deadlines. Gemini is optional and advisory only; AI recommendations do not generate or change authoritative time slots.

## Current folders

- `backend/src/app.js` — Express setup, CORS, JSON/cookie parsing, API mounts.
- `backend/src/models/` — User, StudyProfile, Availability, Exam, Subject, Task, StudyPlan, StudySession.
- `backend/src/routes/` — auth, profile, availability, exam, subject, task, study plan, study sessions, AI recommendations.
- `backend/src/services/studyPlanService.js` — load pending work, load future availability, generate immutable plan snapshots, safely attempt automatic refresh after user data changes.
- `backend/src/utils/scheduler/` — sorting, capacity, allocation, overlap checking, unscheduled-task diagnosis, time conversion.
- `backend/scripts/` — scheduler and available-slot tests plus sample/demo scripts.
- `frontend/src/App.jsx` — route protection and authenticated sidebar/topbar.
- `frontend/src/pages/` — Home, Login, Register, Study Plan, Availability, Tasks, Exams, Subjects, Profile.
- `frontend/src/index.css` — global theme, forms/tables, sidebar, responsive layout.

## Current API surface

- `/api/auth` — registration, login, current-user/session check, logout.
- `/api/study-profile` — GET and POST/PUT to read/save `dailyStudyHours`.
- `/api/availability` — GET and PUT recurring weekly slots.
- `/api/exam` — GET/POST and PATCH `/:id`.
- `/api/subject` — GET/POST and PATCH `/:id`.
- `/api/tasks` — GET/POST, PATCH `/:id`, DELETE `/:id`.
- `/api/study-plan` — POST `/generate`, POST `/replan`, GET saved plan snapshots.
- `/api/study-sessions` — start, stop, active-session lookup, per-task total study time.
- `/api/ai/recommendations` — optional Gemini-based coaching text.

All user-specific operations must use the authenticated `req.user._id` and verify ownership. Exam and subject edit routes validate IDs and parent ownership. Completed tasks can only be reopened through the task update route; details cannot be changed until reopened.

## Scheduling and replanning rules

- Only pending tasks are candidates for scheduling.
- A task must be placed before its exam date; a slot on the exam date is not eligible.
- Tasks are sorted by exam date first and then priority according to the scheduler's existing rules.
- Tasks must fit the allocator's slot constraints; multiple tasks may fit in one availability slot.
- Today's expired slots are skipped and an in-progress day is trimmed to the current India-local time.
- Remaining minutes are used for planning. Completed study-session durations reduce the task's stored remaining estimate when a session stops.
- If a pending task's estimate is exhausted, the plan records an explanatory unscheduled entry instead of allocating zero minutes.
- `GET /api/study-plan` retrieves saved snapshots; it does not generate a plan. `POST /api/study-plan/replan` creates a new snapshot from the current India-local date and preserves earlier plan documents.
- Mutations that affect scheduling (task create/update/delete, exam or subject edits, availability changes, and session completion) attempt to refresh the plan if a saved plan already exists. Creating a new exam/subject or changing the profile target does not create a duplicate plan because those actions do not change an existing task's allocation.  If refreshing fails, the saved mutation remains successful and the API returns a `planRefresh.warning`; the user can manually replan from the Study page. Historical plan documents are not overwritten.
- Study-session duration is calculated on the backend. Stopping a session does not mark the task complete. If a task is marked complete while its session is active, the backend closes that session and records elapsed minutes first.

## UI and behavior added in the 2026-10-26 update

- Replaced the horizontal authenticated navigation with a vertical left sidebar. Logout is in the top-right header. Navigation includes Home, Study, Tasks, Exams, Subjects, Availability, and Profile.
- Added a Profile page for `dailyStudyHours`. This is a saved preference; the deterministic scheduler's actual available time is determined by the weekly Availability slots, not this value.
- Added edit forms/buttons for exams and subjects.
- Added authenticated `PATCH /api/exam/:id` and `PATCH /api/subject/:id` with validation and user ownership checks.
- Changes to relevant planning data attempt an automatic safe replan when a prior plan exists. A refresh failure is reported separately from the successful mutation.
- Fixed a study-plan service scope bug where `exhaustedEstimateTasks` was referenced in `generateStudyPlan` without being in scope. `loadPendingTasks` now returns both scheduler tasks and exhausted-estimate diagnostics.
- Task estimate edits recalculate remaining minutes using recorded completed-session time unless an explicit remaining-minute value is supplied.
- Completing a task during an active study session closes that session on the backend.
- Improved task action spacing and applied the sidebar/dashboard styling.
- Updated frontend `.env.example` to use `API_BASE_URL`, and removed real `.env` files from the distributable archive.

## Environment configuration

Backend `.env.example` keys: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
Frontend `.env.example`: `API_BASE_URL`.

Never put real `.env` files, API keys, JWT secrets, or database credentials in a ZIP/repository. If a real secret was included in the uploaded ZIP, rotate it before deployment.

## Verification status for this ZIP update

- `node scripts/testScheduler.js`: **55 passed, 0 failed**.
- Backend syntax checks for edited route/service files: passed with `node -c`.
- `node scripts/testAvailableSlots.js`: could not run in the extracted environment because the dependency install did not complete and Mongoose was unavailable.
- Frontend production build: not verified; `npm ci` timed out in this environment before Parcel was available.
- MongoDB-backed API integration and Gemini recommendations: not verified because a live database/provider configuration was not available for a full integration run.

## Future Improvements and Remaining Work

- Run `node scripts/testAvailableSlots.js` after a complete `npm install` in backend.
- Run `npm run build` in frontend after dependencies install successfully.
- Test registration/login, exam/subject/task edits, automatic replan, study session timing, completion/reopening, and ownership boundaries against a test MongoDB database.
- Verify the AI recommendation endpoint with a valid Gemini API key, model, and quota. AI failure is separate from schedule generation.
- Add integration tests around automatic refresh failures and task/session updates.
- Add planned-versus-actual analytics, optional daily availability overrides, AI timeouts/retries, and a deliberate deletion policy for exams/subjects with dependent records.
- Verify HTTPS cookie settings, CORS origins, and login persistence on chosen deployment hosts before deploying.
