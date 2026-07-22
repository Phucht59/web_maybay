## 2026-07-12T10:59:26+07:00

<USER_REQUEST>
Objective: Implement the E2E testing infrastructure in `tests/e2e/`.
Do not modify any application code.
Your agent metadata directory is `c:\Huflit\web_maybay\.agents\worker_m1_infra_1\`. Please create your `progress.md` and `handoff.md` in that directory.

Tasks:
1. Create `tests/e2e/helpers/app.js` which handles:
   - Starting the backend ASP.NET Core API at `http://localhost:5071` if not running.
   - Starting the frontend React Vite dev server at `http://localhost:5173` if not running.
   - Stopping/killing the started processes at the end of the test run.
   - Waiting for the servers to be responsive before running tests.
2. Create `tests/e2e/helpers/api.js` containing helper functions using Node's native `fetch` to interact with:
   - `/api/Account/Register` (POST)
   - `/api/Account/Login` (POST)
   - `/api/booking/flights/{flightId}/seats` (GET)
   - `/api/booking/flights/{flightId}/seats/{seatId}/hold` (POST)
   - `/api/booking/flights/{flightId}/seats/{seatId}/hold` (DELETE/release)
   - `/api/booking/flights/{flightId}/payment-hold` (POST)
   - `/api/booking/flights/{flightId}/payment-hold` (DELETE/cancel)
3. Create `tests/e2e/helpers/dom.js` which loads a page from the React dev server using a headless browser (Edge or Chrome via `--headless --dump-dom`) and extracts/attests elements/text.
4. Create a basic smoke test `tests/e2e/smoke.test.js` using Node.js's built-in `node:test` runner.
5. Create `tests/e2e/runner.js` which manages starting the apps, running all `.test.js` files, shutting down the apps, and outputting results.
6. Verify that running `node tests/e2e/runner.js` successfully launches the apps, runs the smoke test, reports success, and terminates all processes.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please report the absolute paths of the created files and test run results in your handoff report.
</USER_REQUEST>
