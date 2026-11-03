# Refactoring plan

1. Record the starting route table, middleware order and working tree.
2. Move feature views with their existing state and query keys. Keep route composition in StudioApp.
3. Extract layout, navigation, shared UI, user querying and reusable helpers.
4. Separate HTTP registration from handlers and move complex transactions to services.
5. Split design and responsive CSS at the existing media-query boundary.
6. Verify types, lint, database/API behavior, browser workflows, build and staged diffs before publishing the feature branch.
