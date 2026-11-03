# StudioSpace — full QA, social integration and link audit

**Audit date:** 2 November 2026 (Asia/Dhaka)  
**Assessment: NOT READY FOR PRODUCTION.** The local application passes its automated functional checks and requested social-link changes are complete. One full production build succeeded, but fresh rebuilds intermittently fail with a Windows filesystem error; live Google consent/callback and a deployed environment have not been verified. These limits are release blockers, not claims that the implemented local workflows fail.

## A. Project overview and scope

| Area | Implementation inspected |
|---|---|
| Frontend | Next.js 16.4.3 App Router, React 19, TypeScript |
| Backend | Separate Express 5 API, Zod validation, Sharp image conversion, PDFKit exports |
| Database | MongoDB via Mongoose; transactions use a replica set |
| Authentication | Passwords hashed with bcrypt; signed HTTPOnly cookie sessions; Google authorization-code/ID-token flow |
| Routing | `client/app/[[...slug]]/page.tsx` validates public/account routes; StudioApp renders the corresponding view; Next rewrites `/api/*` to Express |
| UI/icons | Existing CSS/Tailwind setup, Lucide, Motion, Swiper, Radix dialog, React Hook Form; brand SVGs added without another dependency |
| Tests | Vitest 5.0.5, Supertest, Playwright with installed Chrome |
| Deployment | Separate Next/Express processes and external production MongoDB required; no deployed target supplied or changed |

Tests ran against an isolated database in `work/full-qa-db` on ports 3002/4002/27020. API tests used their own disposable replica sets. Existing application records and root environment secrets were not edited. The owned QA services were stopped after testing.

## B. Social media integration

The relevant location was the public footer's `community-socials` group in `client/components/studio-app.tsx`. It contained Photography, Film, Audio and Creator community icons, plus an extra X icon, all pointing to `/about#community`. Only this footer group was replaced; the actual studio category controls retain their original icons and behavior.

| Social platform | Requested icon replacement | Correct URL | Click tested | Status |
|---|---|---|---|---|
| Facebook | Creator → Facebook brand silhouette | https://www.facebook.com/ | Keyboard Enter/new-tab destination | PASS |
| Instagram | Audio → Instagram camera glyph | https://www.instagram.com/ | Keyboard Enter/new-tab destination | PASS |
| X (Twitter) | Film → X brand glyph | https://x.com/?lang=en | Keyboard Enter/new-tab destination | PASS |
| YouTube | Photography → YouTube play glyph | https://www.youtube.com/ | Keyboard Enter/new-tab destination | PASS |

Each link has an accessible name, visible focus/hover/active states, and `target="_blank" rel="noopener noreferrer"`. Four links render at desktop and 320px mobile width. Their vector glyphs use currentColor and preserve the footer's size/spacing. These are platform home pages supplied by the owner, not invented StudioSpace profiles.

The browser test intercepted third-party page bodies while asserting the exact outgoing URL, to separate application navigation from external login/bot restrictions. Independent external checks returned the Facebook login/rate-limit page, an Instagram response with no readable content, and YouTube; X returned HTTP 403 to automated access. X is therefore externally restricted, not classified as a broken destination. External availability is not guaranteed by a local click test. Sources: [Facebook](https://www.facebook.com/), [Instagram](https://www.instagram.com/), [X](https://x.com/?lang=en), [YouTube](https://www.youtube.com/).

## C. Broken-link and interaction audit

The final browser audit checked **218 rendered internal link occurrences, 41 distinct destinations, across 17 pages**. Internal links returned successful responses, query/resource links were retained, same-page anchors existed, and no `href="#"`, `javascript:` or `undefined` destinations were found. A successful HTTP response alone is insufficient for a catch-all app, so page navigation/heading assertions, private-route redirects, back/forward/refresh and complete workflows were tested separately.

Pages inspected: Home, Explore, About, How It Works, Terms, Privacy, Login, Register, a real Studio Details page, Dashboard, My Listings, My Bookings, Host Booking Requests, Wishlist, Profile Settings, Add Studio and Edit Studio. Navbar/mobile menus, footer categories/platform links, authentication navigation, workspace sidebar, dynamic listing links and export links were included. Existing Terms/Privacy information pages were retained; no legal policies, social accounts or contact details were invented.

Only confirmed navigation issues are listed below; passing links are not represented as defects.

| Location | Link or element | Problem | Fix applied | Verification |
|---|---|---|---|---|
| Footer / social media | Four requested social platforms and extra legacy X | Community-information links did not reach the requested platforms | Replaced group with exactly four labelled brand links and supplied URLs | PASS: exact href, keyboard activation, new tab and mobile checks |
| Authentication | Google cancellation/error return | Cancellation attempted a token exchange without a code | Return to sign-in with a clear cancellation/retry message; clear state cookie | PASS: cancellation, missing code, provider error regressions |

No additional broken Navbar, footer, listing or internal page destinations were confirmed. Form buttons were exercised as actions rather than converted into navigation: signup/login, logout, studio upload/create/edit/delete, booking/cancellation, gallery/filter modal controls, profile saves, drafts, sorting/filtering, theme persistence, CSV/ICS/PDF exports and mobile navigation. These tests sample the implemented workflows; they do not certify every possible account/data combination.

Host contact uses the listing's stored email, and map links use the listing's stored location. Demo `.local` email addresses are not deliverable company support addresses. Email delivery and newsletter dispatch remain intentionally unavailable; saving newsletter interest is distinct from sending mail.

## D. Application testing summary

**Final automated runs: 33 backend tests + 11 browser tests = 44 passed, 0 failed.** The backend count includes 32 API/security/authentication cases and one persistent local MongoDB restart case. Browser suites include 126 route/viewport combinations at 320, 375, 430, 768, 1024, 1440 and 1920px. This is a route-layout count, not 126 separate Playwright tests.

The table uses executed test cases or named release checks; areas overlap and must not be added together. Blocked items are unverified acceptance steps, not passing tests.

| No. | Testing area | Priority | Passed | Failed | Blocked | Overall status |
|---|---|---|---:|---:|---:|---|
| 1 | Application startup | High | 2 | 0 | 0 | PASS: isolated start/health and persistent restart regression |
| 2 | Google authentication | High | 8 | 0 | 1 | PARTIAL: 7 API cases plus browser handoff; live consent/callback unverified |
| 3 | User management | High | 6 | 0 | 0 | PASS for tested registration/login/profile/privacy cases |
| 4 | Core features | High | 8 | 0 | 0 | PASS for tested CRUD, pricing, bookings, reviews, wishlist and host UI flows |
| 5 | API testing | High | 32 | 0 | 0 | PASS for implemented API regression suite |
| 6 | Database testing | High | 7 | 0 | 0 | PASS for tested CRUD, ownership, concurrency, history, unique records, reviews and restart |
| 7 | UI/UX testing | Medium | 6 | 0 | 0 | PASS: design controls, exports/profile, socials, navigation and two responsive suites |
| 8 | Security testing | High | 10 | 0 | 1 | PARTIAL: request/session/ownership checks pass; development dependency remediation remains |
| 9 | Automated testing | Medium | 44 | 0 | 0 | PASS: complete final backend/browser suites |
| 10 | Production readiness | High | 6 | 1 | 3 | PARTIAL: server compilation, typecheck, lint, production audit, one full build and compiled-API smoke pass; fresh build reliability fails; production OAuth, live callback and deployed smoke tests blocked |

### Authentication and security evidence

- Email registration, duplicate-email rejection, invalid credentials, session refresh, protected-route returns, logout and profile persistence passed. Private user responses omit password hashes.
- Seven Google API cases cover absent configuration, state generation, invalid state/cancellation/missing code, exchange failure, verified account creation/reuse, unverified identity/password-account conflict, and copied/expired/forged session rejection. Provider account creation is explicitly **mocked**; this is not a real Google consent test.
- Local Google client/secret/callback settings are now present. The browser reached Google's real sign-in page. No Google password or consent was submitted. The configured callback is a local HTTP callback; a production HTTPS callback has not been configured or verified. The isolated preview is on different ports from the ordinary configured callback, so completing its callback was deliberately not attempted.
- Session tokens now require an unexpired hashed database record as well as valid JWT signature/expiry. Logout revokes only that session; other sessions are retained. TTL cleanup is housekeeping; access checks enforce expiry immediately. Old pre-update sessions must sign in again. This addresses server-side invalidation described in [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- Cross-origin mutations, missing protection headers, malformed/oversized JSON, invalid query bounds, literal regex search, invalid uploads, cross-user editing/booking changes and conflicting confirmations were tested. Inputs are validated server-side; query structures are built by the API rather than accepting arbitrary MongoDB filters. React text rendering is used for user text; this was reviewed, not claimed as a comprehensive XSS penetration test.
- Cookie flags are HTTPOnly/SameSite=Lax and Secure in production; a compiled production-API smoke test verified those response flags, successful login, authenticated retrieval, copied-token logout revocation and cross-origin rejection against the isolated database. Deployed HTTPS cookie/proxy behavior remains untested. CORS is limited to CLIENT_URL; mutation-origin validation was executed outside the test-mode bypass.
- No Google/private-key patterns were found in the searched source directories. This was a limited source-pattern check, not proof that every possible secret format is absent. `.env` stays excluded from the deliverable.
- **All 38 listing-image requests succeeded.** Browser image-decoding checks also passed. No unhandled page errors were reported by the link-navigation test. Browser extensions are absent in the test profile; the earlier Dark Reader hydration warnings were not reproduced here.

### Dependency review

Targeted upgrades: Zod **4.6.7**, Sharp **0.35.5**, Vitest **5.0.5**, with root/workspace declarations and lockfile aligned. Validation, image conversion, tests and TypeScript were rerun after these changes. Vitest's removed `describe.sequential` API was replaced with the ordinary sequential suite; the config was renamed to `.mts` for ESM compatibility.

| Scan | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|
| Before | 12 | 2 | 2 | 16 |
| After, all dependencies | 11 | 0 | 0 | 11 |
| After, production dependencies only | 0 | 0 | 0 | 0 |

Remaining moderate findings are in the ESLint/typescript-eslint/minimatch development chain. They are documented, not forcibly downgraded or overridden with an incompatible transitive major version. Audit totals are advisory findings, not evidence of successful exploitation. See the saved audit JSON and the [Tinypool maintainer advisory](https://github.com/tinylibs/tinypool/security/advisories/GHSA-85c8-ppgw-ccpr) for the worker-options issue; scanner severity labels may differ from upstream labels.

### Build and deployment evidence

One `npm run build` completed successfully, including both static pages and the dynamic catch-all route. Later fresh rebuilds for isolated production routing failed again during static generation with `EPERM: operation not permitted, mkdir ...client/.next/server/app/_not-found.segments/_not-found`. Precreating the folder is not a reliable remedy. Both successful and failed build logs are retained. The underlying Windows permission mechanism has not been established, so reproducible clean builds remain unverified. A compiled Express API was separately started with NODE_ENV=production against the isolated database; its six health/authentication/cookie/origin checks passed. A complete production frontend-to-API browser session and deployed HTTPS smoke test were not obtained.

No deployment, DNS, hosted database, Google consent-screen configuration, production secrets, backups or monitoring were changed. Production must use a persistent replica set, HTTPS, strong private JWT configuration, correct CLIENT_URL/SERVER_URL routing, durable upload storage and matching Google web-client callback settings. The local memory-server wrapper is a development convenience, not the recommended hosted database. Google's documentation requires a consistent authorization-code/callback flow: [Google web-server OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server).

## E. Confirmed bug report

| ID / severity | Reproduction and actual behavior | Root cause and fix | Regression result |
|---|---|---|---|
| QA-001 / Medium | Activate footer community/social icons; all go to About instead of requested platforms | Placeholder community destinations. Replaced footer group with accessible Facebook/Instagram/X/YouTube brand links | PASS: four exact keyboard/new-tab destinations; mobile render |
| QA-002 / Medium | OAuth callback with matching state and `error=access_denied`, or missing code; token exchange receives no usable code | Callback did not branch for cancellation. Added safe cancellation/missing-code/exchange-error return and state clearing | PASS: new callback regressions |
| QA-003 / High | Keep a copy of a login cookie, log out, replay the cookie; the old stateless JWT remains valid until expiry | Cookie clearing alone cannot revoke a signed token. Added hashed per-session database records and deletion on logout | PASS: copied token changes from 200 before logout to 401 afterward; expired/forged cases rejected |
| QA-004 / Medium | Upload non-image bytes named `.png`; decoder throws and API classifies it as an internal error | Decoder errors were not mapped to input validation. Catch conversion errors and return 400; retain true disk failures as server errors | PASS: invalid upload rejected; valid upload converts to a PNG signature |
| QA-005 / High-Critical advisory findings | Run dependency audit against initial lockfile | Vulnerable Zod/Sharp/Vitest chains. Targeted version updates and workspace alignment | PASS: high/critical counts now zero; production audit zero; all regression tests pass |
| QA-006 / High, intermittent | Run repeated fresh production builds in this Windows session | Static-output folder creation intermittently fails with EPERM; host-policy root cause unconfirmed | PARTIAL: one full build passed; later fresh rebuilds failed |

The pre-fix session-revocation and decoder-error gaps were established by source review; their fixed paths were exercised by the new regression tests. No separate baseline exploitation run is claimed. Test-development failures were also corrected: a logout selector used the wrong class/name; a history test advanced before navigation settled; a Google test assumed credentials were absent although local credentials are now configured. These were harness assumptions, not fabricated product defects. Only the final clean runs are counted in the summary.

## F. Files changed

| File | Change and reason | Verification |
|---|---|---|
| `client/components/social-links.tsx` | New dependency-free brand links, exact supplied URLs, accessible external behavior | Social browser test and visual mobile review |
| `client/components/studio-app.tsx` | Replace obsolete footer community group with SocialLinks; retain category icons | Link and existing browser suites |
| `client/app/design.css` | Hover, keyboard focus and active states for social links | Browser focus/mobile assertions and screenshot review |
| `server/src/models.ts` | AuthSession hashed-token/expiry schema with unique and TTL indexes | Session regression tests |
| `server/src/app.ts` | Session issuance/revocation checks; Google cancellation/error paths and normalized email lookup; invalid-image validation | API/auth/security regressions; typecheck |
| `server/tests/api.test.ts` | Add Google, session and request/upload regressions; adapt Vitest suite API | 32 API cases pass |
| `client/tests/qa.spec.ts` | Social keyboard destinations, rendered link audit, signup/logout/Google handoff tests | 3 new browser cases pass |
| `vitest.config.ts` → `vitest.config.mts` | Use ESM config extension for upgraded runner | Complete backend suite |
| Root/server/client `package.json`, `package-lock.json` | Targeted security upgrades and Node runtime requirement | Install/lock update, audit, tests, typecheck/lint |
| `client/tsconfig.json` | Remove temporary QA-output include paths | Typecheck |
| `.gitignore` | Ignore isolated QA Next output | Source-package review |
| `README.md`, `VERIFICATION.md` | Current runtime/session/QA information and limitations | Compared with recorded results |
| `FULL-QA-REPORT.md`, `qa-evidence/*` | This report and saved execution evidence | Final evidence/package review |

The separate `design-review/social-footer-mobile.png` is a review screenshot, not a runtime asset. Dependency directories, database files, generated builds, browser artifacts and secrets are excluded from the refreshed source ZIP.

## G. Remaining issues and release gates

1. Resolve the intermittent Windows build failure and obtain repeatable clean builds plus a complete frontend/API production-mode smoke test on the target platform.
2. Complete an account-holder Google consent → callback → session flow and cancellation flow with the actual registered callback. Local credentials exist; no Google account login/consent was available to complete that step. Configure/verify the production HTTPS callback before release.
3. Review the 11 remaining moderate development-tool findings with compatible supported upgrades. Do not treat a zero production audit as a complete security certification.
4. Supply and validate the actual deployment environment, managed replica-set database, durable upload storage, production secrets, HTTPS/proxy behavior, backup/restore and operational monitoring. No deployed application was available for testing.
5. External social platforms can impose sign-in or bot restrictions; X's automated 403 remains externally unverified. Mail delivery/newsletter dispatch, payments and insurance are intentionally not active services. Existing informational Terms/Privacy pages are not newly drafted legal policies.

## H. Final assessment

**NOT READY FOR PRODUCTION.** The requested social integration and verified local bug fixes are complete. All 44 automated tests pass, the rendered-link audit finds no additional broken internal destinations, and high/critical dependency findings are removed. Production readiness cannot be certified until build reproducibility, live Google callback and deployment gates above are satisfied.

Execution evidence is in `qa-evidence/`: backend/browser runs, rendered links, asset checks, before/after/production dependency scans, build output, lint and typecheck logs. No numerical statement of line/branch code coverage is made; coverage instrumentation was not enabled.

