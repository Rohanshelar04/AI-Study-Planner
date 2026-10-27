# AI Study Planner â€” Interview Notes

**Updated 2026-10-26.** Use `PROJECT-ARCHITECTURE.md` as the current implementation source of truth. The verification section distinguishes tested logic from features that still need database/browser testing.

## 60-second project explanation

â€œMy AI Study Planner is a React and Express application backed by MongoDB. Students create exams, subjects, tasks, and weekly availability. The backend uses a deterministic scheduler to allocate pending work within available slots and before exam deadlines. I track actual study sessions and replan the remaining work by creating a new plan snapshot rather than overwriting plan history. I also added optional Gemini recommendations, but AI does not control the schedule calculations. Protected APIs use an authenticated user ID and validate resource ownership.â€

## Why deterministic scheduling plus AI?

- Deterministic code is testable and enforces hard constraints such as deadline eligibility, slot capacity, and task duration.
- An LLM can produce contextual explanations or study suggestions, but should not invent time slots or make authoritative time calculations.
- If the Gemini key is missing, invalid, or over quota, recommendations can fail while deterministic generation/replanning remains available.

## Replanning and history

`POST /api/study-plan/replan` starts from the current India-local date, loads pending tasks and current/future recurring availability, and calls the deterministic allocator. It creates a new `StudyPlan` snapshot, preserving older plan documents. `GET /api/study-plan` only retrieves saved plans.

Mutations that change scheduling inputs attempt to refresh the schedule when a plan already exists. Creating a new exam/subject or changing the profile target does not generate a redundant plan snapshot. If the refresh fails, the data change remains saved and the API returns a warning so the user can manually replan. This avoids reporting a successful mutation as failed merely because schedule recalculation failed afterward.

## Actual study time

- A session start is stored by the backend.
- Stop calculates elapsed minutes on the backend rather than trusting a frontend duration.
- Stopping reduces a pending task's remaining estimate but does not automatically complete the task.
- Marking a task complete while a session is active closes the session first.
- Editing the estimated total recalculates remaining minutes against recorded completed session time unless an explicit remaining estimate is provided.

## API validation and ownership

- The authenticated identity comes from `req.user._id`, not a user ID in the request body.
- Exam/subject/task updates filter by both resource ID and authenticated user ID.
- Subject creation/update verifies that the selected exam belongs to the same user.
- Completed tasks must be reopened before editing their details.
- Exam dates are validated as real `YYYY-MM-DD` calendar dates.

## Recent UI changes

- Authenticated app uses a vertical sidebar and separate top-right logout control.
- Main navigation includes Home, Study, Tasks, Exams, Subjects, Availability, and Profile.
- Exams and subjects have edit actions and server-side PATCH endpoints.
- Relevant data changes attempt to refresh an existing plan automatically; the Study page still provides manual replan controls.
- The Profile page stores a daily study-hour preference. Weekly Availability slots remain the actual input to the deterministic scheduler.

## Current test evidence

- `node scripts/testScheduler.js`: 55 passed, 0 failed in this environment.
- Syntax checks using `node -c` passed for edited backend files.
- `node scripts/testAvailableSlots.js` could not run because dependency installation timed out and Mongoose was unavailable.
- Frontend production build could not be verified because Parcel dependencies were not installed successfully.
- MongoDB-backed integration and Gemini provider calls remain unverified. Do not claim they passed until run.

## Local run commands

Backend terminal:

```bash
cd backend
npm install
npm run dev
```

Frontend terminal:

```bash
cd frontend
npm install
npm start
```

Configure `backend/.env` using `backend/.env.example` and keep all secrets out of source control. Frontend can use `API_BASE_URL=http://localhost:5000`.

## Future Improvements and Remaining Work

- Run available-slot tests and frontend production build after dependencies install.
- Test the full app against a dedicated test MongoDB database.
- Verify Gemini API key/model/quota and improve provider timeout/retry behavior.
- Add planned-versus-actual analytics and optional daily availability overrides.
- Define safe delete behavior for exams/subjects with dependent records.
- Verify production CORS and secure-cookie behavior on the selected hosting domains.

