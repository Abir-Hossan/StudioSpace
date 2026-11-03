# StudioSpace release audit

This audit covers `refactor/studiospace-modular-architecture` from `be9217b`. The starting seven commits were checked against Git, including four client, two server, and one cross-project documentation commit. The [initial refactor report](REFACTORING_LOG.md) records their hashes and scopes.

## Verified architecture

StudioApp composes the route shell, navigation and feature views. Query state and API communication remain centralized in the shared hook and client. The stylesheet split preserves the design declarations and their order. A static import graph check found no cycles across 72 modules. Playwright exercised public and private routes, navigation, layout widths, studios, bookings, authentication and social destinations.

Express retains all 33 baseline registrations in their original order with the same route middleware. The audit compared the registrations against `be9217b`. Mongoose schemas and the booking and review transaction implementations retain their relationships and concurrency rules. The authentication changes below distinguish invalid credentials from operational failures.

## Windows build finding

With no running Node process initially observed, a standalone probe reproduced the same EPERM while recursively creating parent and child segment directories concurrently. Nine of 120 concurrent calls failed. Zero of 120 serial calls failed. The installed Next static exporter starts these directory writes concurrently. The prior pre-creation script could not protect output regenerated during compilation.

The Windows build wrapper now serializes recursive directory creation only within generated segment directories for the selected Next output path. It propagates errors to Next and leaves other filesystem calls alone. The same concurrent probe had zero failures in 120 calls with the fix. Three clean production builds passed in separate extracted source directories, including a clean build with the final application changes. There was no evidence attributing the failure to antivirus or a separate process holding the output.

## New development commits

| Hash | Message | Files | Improvement and verification |
| --- | --- | --- | --- |
| `ca2808a` | fix(client): serialize Windows segment directory creation | scripts/build-client.mjs, scripts/windows-segment-mkdir.cjs | Scoped Windows build fix. Standalone probe and three fresh production builds passed |
| `b112c8f` | fix(client): validate sign-in return origins | client/features/auth/auth.tsx, client/tests/auth-return.spec.ts | Rejects return paths that normalize to a different origin. Browser regression passed |
| `e735c64` | fix(client): handle non-JSON API failures | client/lib/api.ts, client/tests/api-failure.spec.ts | Preserves HTTP status and gives readable feedback for an HTML proxy error. Browser regression passed |
| `37c42f8` | fix(server): reject truncated registration passwords | server/src/validators/schemas.ts, server/tests/api.test.ts | Rejects new passwords exceeding bcrypt’s 72 UTF-8 byte limit. Multibyte registration regression passed. Existing account login is unaffected |
| `44a9991` | fix(server): distinguish authentication and service failures | server/src/controllers/auth.ts, server/src/middleware/auth.ts, server/tests/auth-errors.test.ts | Invalid Google ID tokens return 401 without provider details. Session-store outages return a generic server error. Both regressions passed |

The release audit documentation commit counts toward the total only.

| Category | Required | Completed | Status |
|---|---:|---:|---|
| Client-side commits | 15 | 7 | FAIL |
| Server-side commits | 8 | 4 | FAIL |
| Total notable commits | 23 | 13 | FAIL |

The remaining shortfall is eight client commits, four server commits, and ten overall. The two cross-project documentation commits explain why the domain subtotals differ from the total.

## Validation and deployment

| Check | Result |
| --- | --- |
| TypeScript and ESLint | Passed |
| Vitest | 36 passed, including isolated MongoDB integration and startup tests |
| Playwright | 13 passed, including new redirect and proxy-error regressions |
| Route parity, stylesheet order, static import graph and Git whitespace | Passed |
| Windows production build | Three fresh builds passed |
| Live OAuth consent and callback | Pending external configuration and test-account consent |
| Target deployment | Pending target environment verification |

Google credentials are present locally. The current callback uses HTTP and does not match the isolated API preview port. Tests cover the provider handoff and mocked consent callback, session issuance, and rejection paths. For a deployed test, set `CLIENT_URL` to the exact HTTPS frontend origin and register that origin's publicly reachable `/api/auth/google/callback` URL in the Google web client. Set `GOOGLE_CALLBACK_URL` to the exact registered value and use an eligible test account to verify consent, redirect, session cookie persistence, refresh and logout. [Google web-server OAuth configuration](https://developers.google.com/identity/protocols/oauth2/web-server)

Build Next with the correct `SERVER_URL` backend target. Configure the Express frontend origin, production mode, a private signing secret and a reachable MongoDB replica set. Verify upload storage and serving across restarts, database backups, and the HTTPS frontend-to-API flow on staging. The code passes the local release checks. Full production readiness is pending those target checks.

The working tree already contained startup configuration edits, generated Next settings and upload fixtures. Those paths were excluded from the audit commits. Browser tests used an isolated database and an owned server that was stopped afterward. Remote publication status is verified separately against the feature branch hash.
