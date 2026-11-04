# Deploy StudioSpace on Vercel

Deploy the Express API first and the Next.js frontend second as separate Vercel projects from this repository. Booking transactions require a MongoDB replica set, such as Atlas. The local runner and its on-disk database are for development.

## Prepare the source and database

Put the reviewed Vercel changes on the GitHub branch Vercel will build. The import screen currently shows `main`. Local changes become available to the Git integration after publication.

Create an Atlas database user with read/write access to the app database. Allow the API deployment's network access according to your Atlas and Vercel networking setup. Use a connection string that names the intended database. Start with an empty database and register real accounts through the app. The local seed creates demo accounts with known passwords. [Atlas connection requirements](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)

## Create the API project

| Vercel setting | Value |
| --- | --- |
| Project name | `studiospace-api` or another available name |
| Root Directory | `server` |
| Framework Preset | Express |
| Node.js Version | 24.x |
| Install, build and output overrides | Leave at the preset defaults |

Enable **Include source files outside the Root Directory** so Vercel can use the root npm workspace and lockfile. The API uses the default Express export in `server/app.ts` and opens a MongoDB connection on demand. [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) · [Vercel monorepo settings](https://vercel.com/docs/monorepos/monorepo-faq)

Add these variables to the API project's **Production** environment.

| Key | Value |
| --- | --- |
| `MONGODB_URI` | Atlas connection string for the app database |
| `JWT_SECRET` | Fresh random secret of at least 32 characters |
| `CLIENT_URL` | Exact frontend HTTPS origin, such as `https://studiospace.vercel.app`, without a trailing slash |
| `UPLOAD_STORAGE` | `mongodb` |

Generate the signing secret locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Enter it only in the API project's environment settings. Configure preview with separate database and signing credentials if you need authenticated preview deployments.

Deploy and open `https://<api-domain>/api/health`. Expect `{"status":"ok","database":true}`. A database-unavailable response means the API could not connect. Check the URI, Atlas database user and network access before proceeding.

## Create the frontend project

| Vercel setting | Value |
| --- | --- |
| Project name | `studiospace` or another available name |
| Root Directory | `client` |
| Framework Preset | Next.js |
| Node.js Version | 24.x |
| Build Command | Default `npm run build` |
| Install Command and Output Directory | Preset defaults |
| Production environment variable | `SERVER_URL=https://<api-domain>` with no `/api` suffix |

Enable **Include source files outside the Root Directory** for the workspace and shared build script. Next proxies `/api/*` to the API origin so the browser uses the frontend origin for its session cookies. If Vercel assigns a different frontend domain than planned, update the API's `CLIENT_URL` to the actual HTTPS origin and redeploy the API.

## Optional Google sign-in

Create or update a Google OAuth web client. Add the exact frontend origin and the authorized redirect URI `https://<frontend-domain>/api/auth/google/callback`. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and the matching `GOOGLE_CALLBACK_URL` in the API project's environment settings and redeploy. Complete consent with an eligible account, then verify the redirect, session after refresh and logout. [Google OAuth redirect requirements](https://developers.google.com/identity/protocols/oauth2/web-server)

## Verify the live deployment

Open `/api/health` on the frontend domain to test the rewrite. Register a test account, sign in, refresh, upload a small image, save a studio and open its detail page. Test a booking with a separate account to exercise the replica-set transaction. Hosted uploads are limited to 4 MiB to fit Vercel's function payload cap and are stored in MongoDB. Existing listings that reference locally uploaded files need those assets migrated before they can display on Vercel. [Vercel function payload limit](https://vercel.com/docs/functions/limitations#request-body-size)

The Hobby plan is for personal, non-commercial use. Choose a plan appropriate to the deployment if StudioSpace will be used commercially. [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
