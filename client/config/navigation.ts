import { CalendarDays, Film, Heart, LayoutDashboard, Plus, Settings, Users } from "lucide-react";
const privateRoutes = [
  "/dashboard",
  "/add-studio",
  "/my-listings",
  "/my-bookings",
  "/profile-settings",
  "/wishlist",
  "/host-bookings",
];

export const dashboardLinks = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/my-bookings", "My Bookings", CalendarDays],
  ["/host-bookings", "Booking Requests", Users],
  ["/my-listings", "My Studio Listings", Film],
  ["/add-studio", "Add New Studio", Plus],
  ["/wishlist", "Saved Spaces", Heart],
  ["/profile-settings", "Profile Settings", Settings],
] as const;


export function isWorkspacePath(path: string) {
  return privateRoutes.includes(path) || path.startsWith("/studios/edit/");
}
