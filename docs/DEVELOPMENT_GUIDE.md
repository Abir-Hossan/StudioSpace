# Development guide

Use a Node version permitted by the root manifest. Install with `npm install --workspaces=false` when Windows workspace links are restricted. Run `npm run prepare:local` and `npm run local` for local development. The [README](../README.md) describes the environment and demo fixtures.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` and `npm run build`. Isolate browser runs with `LOCAL_MONGO_DB_PATH`, `LOCAL_MONGO_PORT`, `API_PORT`, `PORT` and `STUDIOSPACE_TEST_URL`. Playwright uses the installed Chrome channel on Windows.

For deployment, use a persistent replica set and private JWT secret. Set the API target before building Next. Run the compiled API and Next start command with matching origins. Verify HTTPS sessions, the Google callback, durable uploads and backups in the target environment.
