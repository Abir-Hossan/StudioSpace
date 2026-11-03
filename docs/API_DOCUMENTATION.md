# API documentation

Paths below are relative to `/api`. Mutations require the configured Origin and `x-studiospace: 1`. Protected routes require an active session cookie. Validation and domain errors use a JSON `message` where handled by application error middleware.

| Methods and paths | Access and behavior |
| --- | --- |
| POST /auth/register, /auth/login, /auth/logout | Public. Register, establish session or revoke current session |
| GET /auth/me, /users/me and PATCH /users/me | Session. Read or update the current profile |
| GET /auth/google, /auth/google/callback | Public. OAuth start and callback |
| GET /health | Public. API and database health |
| GET /studios, /studios/featured, /studios/network | Public. Search with pagination, featured studios or location counts |
| GET /studios/catalog.pdf | Public. PDF catalog |
| GET /studios/mine, POST /studios | Session. Host listings or create studio |
| GET, PATCH, DELETE /studios/:id | Public read. Owner-only edit and eligible deletion |
| POST /uploads | Session. Multipart image field, up to 10 MB |
| POST /bookings | Session. Studio ID and time range, returns priced request |
| GET /bookings/mine, /bookings/host | Session. Creator and host reservations |
| GET /bookings/summary.pdf | Session. Booking summaries |
| GET /studios/:id/availability | Public. Confirmed time ranges |
| PATCH /bookings/:id/cancel | Creator. Cancel own pending request |
| PATCH /bookings/:id/status | Host. Confirmed, Cancelled or Completed where permitted |
| GET /bookings/:id/invoice | Participant. Confirmed or completed booking PDF |
| GET, POST /wishlist and DELETE /wishlist/:id | Session. List, add or remove saved studios |
| GET, POST /studios/:id/reviews | Public read. Completed booking required for posting |
| POST /newsletter | Public. Register email interest |
| GET /dashboard | Session. Workspace metrics and activity |

The route and validator modules define the exact accepted fields. Mongo transactions enforce overlap rules, review consistency and booking-history protection.
