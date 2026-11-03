"use client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardLinks } from "../../config/navigation";
import { api } from "../../lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { LogOut } from "lucide-react";
export function WorkspaceSidebar({ path }: { path: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const links = [
    dashboardLinks[0],
    dashboardLinks[4],
    dashboardLinks[3],
    dashboardLinks[1],
    dashboardLinks[6],
    dashboardLinks[2],
    dashboardLinks[5],
  ];
  async function logout() {
    try {
      await api("/auth/logout", "POST");
      qc.setQueryData(["me"], null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
      router.push("/login");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <aside className="sidebar">
      <div className="eyebrow">CREATOR WORKSPACE</div>
      {links.map(([href, _label, Icon], i) => (
        <Link
          key={href}
          className={
            path === href ||
            (href === "/my-listings" && path.startsWith("/studios/edit/"))
              ? "active"
              : ""
          }
          href={href}
        >
          <Icon size={18} />
          {
            [
              "Overview / Dashboard",
              "Add New Studio",
              "My Listings",
              "My Bookings",
              "Profile Settings",
              "Booking Requests",
              "Saved Spaces",
            ][i]
          }
        </Link>
      ))}
      <button className="sidebar-logout" onClick={logout}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
