# Folder structure

| Path | Responsibility |
| --- | --- |
| client/app | App Router entry points, Tailwind tokens and local fonts |
| client/components/layout | Header, footer, workspace sidebar and mobile dock |
| client/components/shared | Shared feedback and workspace UI |
| client/features | Home, Explore, Studios, Auth, Listings, Bookings, Dashboard, Profile, Wishlist and informational views |
| client/config, hooks, lib | Navigation, user querying, API types and client, formatting and downloads |
| client/styles | Base design and responsive cascade |
| client/tests | Browser regressions |
| server/src/app.ts, index.ts, local.ts | Express composition, production startup and local runner |
| server/src/routes, controllers, services | Endpoint registration, HTTP handling and business workflows |
| server/src/config, middleware, validators, utils, types | Environment, OAuth, request policy, validation, errors and request types |
| server/src/models, server/tests | Schema definitions and API/database tests |
