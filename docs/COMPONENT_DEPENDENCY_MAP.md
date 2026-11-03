# Component dependency map

| Parent | Dependencies and responsibilities |
| --- | --- |
| Root layout | Query, theme and notification providers, global CSS |
| App Router and not-found | StudioApp route shell and transition |
| StudioApp | User query, workspace guard, header, footer, sidebar, dock and route features |
| Header and workspace sidebar | Navigation configuration and local menu/account actions |
| Home | Steps, studio cards, hero search and featured queries |
| Explore | PrecisionFields, cards, URL filters and mobile drawer |
| Studio Details | BookingModal, gallery, studio and review queries |
| Workspace features | Shared status, metrics and dialog controls, feature forms and exports |

Features import shared modules. Shared modules have no dependencies on StudioApp. BookingModal is part of the booking feature because it owns booking fields and submission behavior.
