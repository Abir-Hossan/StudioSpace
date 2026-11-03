"use client";
import { usePathname } from "next/navigation";
import { Aperture, CalendarDays, Heart, Search, Settings } from "lucide-react";
import Link from "next/link";
export function MobileDock() {
  const path = usePathname();
  return (
    <nav className="mobile-dock" aria-label="Creator mobile navigation">
      {([
        ["/", "Home", Aperture],
        ["/studios", "Explore", Search],
        ["/wishlist", "Saved", Heart],
        ["/my-bookings", "Bookings", CalendarDays],
        ["/profile-settings", "Profile", Settings],
      ] as const).map(([href, label, Icon]) => (
        <Link key={href} href={href} className={path === href ? "active" : ""}>
          <Icon size={18} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
