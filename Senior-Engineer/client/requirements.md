## Packages
date-fns | Date formatting and manipulation for attendance and logs
recharts | Beautiful charts for the dashboard metrics
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes safely

## Notes
The backend uses mock data in-memory. Ensure all TanStack Query mutations call `queryClient.invalidateQueries` to immediately refresh the UI.
All main application routes require an active `spaceId`.
The AuthContext manages the current user session.
The SpaceContext manages the currently selected active space.
