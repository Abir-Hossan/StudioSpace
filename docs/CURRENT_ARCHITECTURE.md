# Original architecture

The Next App Router catch-all selected a page through StudioApp. StudioApp held feature presentation, data fetching, account guards, transitions and layout. TanStack Query cached results and Next rewrote same-origin API requests to Express.

Express app.ts registered all handlers and implemented session issuance, transactional writes and PDF output. Models and Zod schemas lived in sibling files. The local runner launched a persistent Mongo replica set and seeded an empty database.
