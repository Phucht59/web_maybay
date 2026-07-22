# Scope: E2E Testing Suite

## Architecture
- **Target folder**: `tests/e2e/`
- **Framework**: Built-in Node.js `node:test` and `node:assert` runner. Runs entirely offline with zero external dependencies, perfect for the CODE_ONLY environment constraints.
- **Verification Methods**:
  - **API Tests**: Uses global `fetch` to test booking endpoints: login, get seats, hold, release, payment hold, cancel payment, and expired seat cleanup.
  - **Frontend E2E Tests**: Uses `msedge --headless --dump-dom <url>` and/or `chrome --headless --dump-dom <url>` to fetch the fully-rendered HTML from the running React development server, verifying that:
    1. The page loads successfully (does not crash or show a white screen).
    2. The DOM contains correct seat counts, status labels (Available, Held, Sold), and correct pricing.
    3. Layout elements are present without overflows (e.g. checking containers, layout classes).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Infra Setup | Create the test runner (`tests/e2e/runner.js`), shared helpers (auth, api, shell/spawn process managers), and a basic smoke test. | None | PLANNED |
| 2 | Tier 1 & 2 Tests | Implement Tier 1 (Feature Coverage, >=35 tests) and Tier 2 (Boundary & Corner cases, >=35 tests). | M1 | PLANNED |
| 3 | Tier 3 & 4 Tests | Implement Tier 3 (Cross-Feature Combinations, >=7 tests) and Tier 4 (Real-world Scenarios, >=5 tests). | M2 | PLANNED |
| 4 | Verification & Publishing | Verify the complete suite against the backend and frontend. Fix any test/infra issues. Publish `TEST_INFRA.md` and `TEST_READY.md`. | M3 | PLANNED |

## Interface Contracts
- **Test Runner Command**: `node tests/e2e/runner.js`
- **Test Run Output**: Standard Node.js test output with a summary of passed/failed tests.
- **Port usage**: Backend on `http://localhost:5071`, Frontend on `http://localhost:5173`.
