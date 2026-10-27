# Audit and Change Report — 2026-10-26

## Changes made

- Added vertical left sidebar navigation and moved Logout to the top-right header. Added a Profile page and retained Availability as a separate navigation destination.
- Added exam editing in the UI and authenticated `PATCH /api/exam/:id` validation in the backend.
- Added subject editing in the UI and authenticated `PATCH /api/subject/:id` validation, including checking that a selected exam belongs to the logged-in user.
- Fixed a study-plan service scope bug: exhausted-estimate diagnostics are now returned from `loadPendingTasks` and consumed by `generateStudyPlan` in the correct scope.
- Added best-effort automatic plan refresh after changes that affect scheduling: task create/update/delete, exam/subject edits, availability updates, and stopping a study session. A refresh failure does not undo a successfully saved mutation; the API returns a warning for the UI.
- Fixed task estimate updates to recalculate remaining minutes against recorded completed session durations unless the client explicitly sends a remaining estimate.
- When completing a task with an active session, the backend closes that session and records elapsed minutes first.
- Updated the Study page to refresh plan/session data after stopping or completing a task.
- Improved table action spacing and responsive sidebar styles.
- Updated README, project context, and interview notes. Corrected frontend `.env.example` to use `API_BASE_URL`.
- Removed `.env` files from the output archive. Dependency directories and build/cache output are not included.

## Verification actually performed

- `node scripts/testScheduler.js`: **55 passed, 0 failed**.
- `node -c` syntax checks passed for all backend JavaScript files.
- TypeScript's transpile parser was used to check syntax of all frontend `.js`/`.jsx` files; all parsed without syntax diagnostics.
- `node scripts/testAvailableSlots.js` could not run because `npm ci` timed out in this environment and Mongoose was not installed completely.
- `npm ci` for the frontend timed out before Parcel was available, so a production frontend build could not be run.
- MongoDB-backed route integration, live browser behavior, and the Gemini API call were not verified here.

## Remaining checks before deployment

1. On your machine, run `npm install` in both `backend` and `frontend`.
2. Run `node scripts/testScheduler.js` and `node scripts/testAvailableSlots.js` from `backend`.
3. Run `npm run build` from `frontend`.
4. With your own local `.env` and a test database, verify registration/login/logout, exam and subject editing, task updates, automatic replan, session start/stop, and task completion.
5. Test Gemini recommendations separately with a valid key, model, and quota. Schedule generation/replanning does not call Gemini.
6. Only deploy after the local integration checks pass and production CORS/cookie settings are configured.

## Security note

The uploaded source ZIP contained backend and frontend `.env` files. They have been excluded from this output. If either contained real credentials, API keys, JWT secrets, or database passwords, rotate those values before deployment. Use the included `.env.example` files to create private local configuration.
