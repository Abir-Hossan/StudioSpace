# StudioSpace

A local full-stack marketplace for creative studios, film stages, podcast rooms, music suites and art workshops. **Not deployed — local development only.**

## Quick start

Requires Node.js 22.12+, 24, or 26+ (Node 24 LTS recommended), npm, and internet access for the initial dependency/MongoDB binary downloads.

```powershell
npm install --workspaces=false
npm run prepare:local
npm run local
```

Open http://localhost:3000. This command starts a real MongoDB single-node replica set backed by a local `work/local-mongo` directory, seeds it if empty, starts Express on port 4000, and runs Next.js on port 3000. It uses `mongodb-memory-server` as a binary launcher with the WiredTiger storage engine and a persistent directory; application data is stored in MongoDB, not in JavaScript arrays. Stop with Ctrl+C. The automatic development secret changes on restart, so log in again after restarting this shortcut.

`prepare:local` downloads only the MongoDB server executable from MongoDB’s official Windows ZIP using HTTP byte ranges (about 25 MB instead of the full 600 MB archive with debug symbols). On other operating systems, the runtime downloads its normal platform archive on first use. The local runner and API tests detect the prepared Windows executable automatically. Dependencies are shared at the root; `--workspaces=false` avoids Windows workspace-link permissions while preserving separate client/server commands. MongoDB postinstall downloading is disabled in package configuration so installation does not fetch the full Windows archive.

Development accounts (local only):

| Role    | Email                     | Password    |
| ------- | ------------------------- | ----------- |
| Host    | host@studiospace.local    | StudioPass1 |
| Creator | creator@studiospace.local | StudioPass1 |

The seed adds twelve studios with local PNG assets. Ratings start at zero; they are not fabricated reviews.

## Use your own MongoDB

MongoDB transactions require a replica set or Atlas. A standalone MongoDB instance is insufficient. Start a local `mongod` with `--replSet rs0 --dbpath <your-data-directory>`, then run `rs.initiate()` in mongosh. Alternatively use an Atlas development database.

Copy `.env.example` to `.env` in the project root, set the connection URI and a cryptographically random JWT secret of at least 32 characters. For the separate workspace commands, copy the same environment file to `server/.env` (dotenv resolves from that workspace’s current directory).

```powershell
npm run seed
npm run dev
```

For `npm run seed`, put the environment in `server/.env` or export the variables in the shell. Root `npm run local` reads root `.env` through dotenv and can also use Google credentials from that file. Do not commit environment files.

## Features

- Database-backed search, location/category/price filters, sorting and pagination; filters persist in the URL.
- Password registration and cookie authentication, real Google OAuth integration, private pages and ownership checks.
- Studio creation, update, deletion and local image upload with PNG conversion.
- Booking requests with authoritative price snapshots, host confirmation/rejection and pending cancellation.
- Concurrent conflict prevention, host dashboard, personal booking history and PDF booking summaries.
- Persistent wishlists, completed-booking reviews, profile editing, theme selection and responsive navigation.
- Locally persisted newsletter interest with explicit disclosure that email delivery is disabled.

## Architecture and dependencies

`client/` is Next.js App Router with TypeScript and React. TanStack Query owns API caching; React Hook Form and Zod validate account forms. The reusable Button uses the shadcn/ui composition pattern (Radix Slot, class-variance-authority, clsx and tailwind-merge); dialogs use Radix for focus containment, Escape and accessible labelling. Motion respects reduced-motion preferences. Swiper provides the three-slide hero. Tailwind’s PostCSS integration and CSS design tokens define both themes. Lucide supplies vector icons and Sonner supplies notifications.

`server/` is a separate Express application using Mongoose, Zod, bcrypt, JWT, HTTPOnly cookies, Helmet, restricted CORS and rate limits. All mutations require the custom same-origin request header and an allowed Origin outside tests. Secrets stay on the server. Google credentials use the Google auth library and state-cookie validation; accounts with an existing password are not automatically linked to Google.

No payments are collected. PDF files are booking summaries, not payment receipts. No insurance or staffed support is claimed.

### Booking concurrency and deletion policy

Pending requests may overlap. Creation, host confirmation and listing deletion use MongoDB transactions. They all write the studio revision before checking related records, making concurrent operations on the same studio conflict and retry. After retry, availability is checked again. The overlap condition is `existing.startTime < requested.endTime && existing.endTime > requested.startTime`. Confirmed sessions cannot overlap; adjacent sessions are allowed.

Only hosts can confirm/reject pending requests. Hosts can mark ended confirmed bookings completed. Creators can cancel their own pending requests. A studio with any booking history cannot be deleted, preserving references and pricing records. Deleting an unbooked studio also removes its reviews and wishlist entries in the transaction. Reviews require a completed booking and are unique per user/studio.

### API overview

| Area         | Routes                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Accounts     | POST `/api/auth/register`, `/login`, `/logout`; GET `/api/auth/me`; GET `/api/auth/google`, `/google/callback` |
| Studios      | GET/POST `/api/studios`; GET `/featured`, `/mine`; GET/PATCH/DELETE `/api/studios/:id`                         |
| Availability | GET `/api/studios/:id/availability`                                                                            |
| Bookings     | POST `/api/bookings`; GET `/mine`, `/host`; PATCH `/:id/cancel`, `/:id/status`; GET `/:id/invoice`             |
| Profile      | GET/PATCH `/api/users/me`                                                                                      |
| Saved spaces | GET/POST `/api/wishlist`; DELETE `/api/wishlist/:studioId`                                                     |
| Reviews      | GET/POST `/api/studios/:id/reviews`                                                                            |
| Uploads      | POST `/api/uploads`, multipart field `image`, maximum 10 MB                                                    |
| Other        | GET `/api/dashboard`, `/api/health`; POST `/api/newsletter`                                                    |

The browser uses a same-origin Next.js rewrite for `/api`, avoiding cross-origin cookie problems. Direct API mutations need `Origin: http://localhost:3000` and `x-studiospace: 1`.

## Google OAuth setup

Create a Google Cloud OAuth web client. Configure authorized JavaScript origin `http://localhost:3000`, callback `http://localhost:4000/api/auth/google/callback`, and the consent-screen test users if the app is in testing mode. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` on the server. Google sign-in without credentials returns an informative message. No simulated Google identity is used. Live OAuth cannot be verified without your credentials and consent.

## Images and design references

All bundled raster images live in `client/public/images` and are PNG. Sixteen assets were extracted from the supplied `.fig` archive and converted locally. `provenance.json` records their source hashes. Original raster assets are about 512 pixels wide; large displays may expose that resolution limit. Uploads are decoded by Sharp and converted to PNG up to 1920 pixels wide. No image hosting key is required because the configured provider is local disk. Back up that directory along with MongoDB.

The supplied Figma import kit’s screenshots and HTML informed charcoal `#131313`, orange `#ff7043`, warm accent `#ffb59f`, twelve-pixel cards, pill navigation and cinematic layouts. The remote Figma page and requirement video were inaccessible to the research tool. The `.fig` was inspected as an archive and its raster resources recovered; editable canvas layers were not parsed. Space Grotesk and Inter weights 400, 500, 600 and 700 are bundled locally under client/public/fonts with their Open Font Licenses. No remote font request is needed.

## Commands and verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

API tests start their own real MongoDB replica set. Playwright uses the local server shortcut if no server is running. Use a clean local database for deterministic browser booking/wishlist assertions. See `VERIFICATION.md` for actual executed results, route coverage and limitations. Do not interpret a test file as evidence that its tests passed.

For the compiled API, run `node server/dist/index.js` from the repository root after exporting environment variables. For the production client, run `npm run start -w client`. Keep the API on port 4000, client on 3000 for this local configuration.

## Reliable implementation references

- [Next.js installation and App Router](https://nextjs.org/docs/app/getting-started/installation)
- [Mongoose transactions](https://mongoosejs.com/docs/transactions.html)
- [Google OAuth server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Radix accessible dialog](https://www.radix-ui.com/primitives/docs/components/dialog)

This source is a local development deliverable. Production hardening, legal policies, operational support, account recovery and deployment are outside this project’s scope. No Git commits, remote pushes or deployment are performed.


### Persistent MongoDB restart fix

The local launcher uses port 27018 and repairs a stale single-node localhost replica-set address left by earlier random-port versions. It retains the existing database. Set LOCAL_MONGO_PORT to another free port if needed. A restart regression test verifies record persistence, port migration and transactions.


## Reference-design corrections

See DESIGN-AUDIT.md for the page-by-page comparison and restored desktop/mobile arrangements. The application now includes photographic category cards, production-specification layouts, the dedicated workspace shell, expanded profile panels, mobile filtering and bottom navigation, real CSV/ICS/PDF exports, listing pause/resume, and device-local studio drafts. Existing database records are preserved; missing host specifications remain clearly identified.



## Full QA and social integration — 2 November 2026

See FULL-QA-REPORT.md for the latest evidence and production blockers. The footer links to the four platform home pages supplied by the owner; these are not StudioSpace accounts. Sessions now have hashed database records with seven-day expiry and per-session logout revocation. Existing sessions issued before this update must sign in again. MongoDB creates the AuthSession unique and TTL indexes; expiry is checked on every authenticated request rather than relying on TTL cleanup timing.

Google cancellation and token-exchange errors return useful sign-in feedback. Provider-mocked tests exercise account creation/reuse and reject unverified identities, but live Google consent and the resulting callback still require an account-holder sign-in. Local credentials were detected and the real Google handoff was verified during this audit. Targeted Zod, Sharp and Vitest upgrades remove the high/critical findings; consult the report for the remaining development-tool advisories.

