# Architecture

The Next route shell handles path selection, account guards and page transitions. Features own forms, modal state and filtering. TanStack Query manages API state. The shared user hook maps anonymous responses consistently.

Express mounts global middleware and route groups before the 404 and error handlers. Routes pair HTTP method and path with authentication, upload middleware and controllers. Controllers validate requests and produce responses. Services issue sessions and encapsulate booking and review transactions. The Mongoose schemas and middleware execution order are preserved.

Booking transactions lock the studio revision before overlap checks. Review writes recalculate rating summaries in the same transaction. Protected requests verify the signed JWT and the active hashed session record. Uploads still resolve to the same public images folder after the controller move.

See the [folder map](FOLDER_STRUCTURE.md), [component dependencies](COMPONENT_DEPENDENCY_MAP.md) and [API reference](API_DOCUMENTATION.md).
