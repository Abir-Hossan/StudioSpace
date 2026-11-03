"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Aperture,
  ArrowLeft,
  ArrowRight,
  Bell,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Share2,
  Sun,
  X,
} from "lucide-react";

import { api, User } from "../../lib/api";

import { dashboardLinks, isWorkspacePath } from "../../config/navigation";

type HeaderProps = {
  user: User | null | undefined;
};

type HeaderDisclosure = "navigation" | "profile" | "notifications";

export function Brand() {
  return (
    <Link href="/" className="brand">
      <Aperture size={31} />
      <span>
        Studio<span className="accent">Space</span>
      </span>
      <small>REC</small>
    </Link>
  );
}

export function Header({ user }: HeaderProps) {
  const path = usePathname();
  const [disclosure, setDisclosure] = useState<HeaderDisclosure | null>(null);
  const menu = disclosure === "navigation";
  const profile = disclosure === "profile";
  const notifications = disclosure === "notifications";
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const profileTrigger = useRef<HTMLButtonElement>(null);
  const notificationTrigger = useRef<HTMLButtonElement>(null);
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const router = useRouter();

  const workspace = isWorkspacePath(path);

  const authPage = path === "/login" || path === "/register";
  const detailPage = /^\/studios\/[^/]+$/.test(path);

  const alerts = useQuery<{ pending: number; upcoming: number }>({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard"),
    enabled: !!user,
  });

  useEffect(() => {
    setDisclosure(null);
  }, [path]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!disclosure || !(e.target instanceof Element)) return;
      const boundary = disclosure === "navigation" ? "header" : ".profile";
      if (!e.target.closest(boundary)) setDisclosure(null);
    };

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && disclosure) {
        if (menu) menuTrigger.current?.focus();
        else if (profile) profileTrigger.current?.focus();
        else notificationTrigger.current?.focus();
        setDisclosure(null);
      }
    };

    document.addEventListener("pointerdown", click);
    document.addEventListener("keydown", key);

    return () => {
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("keydown", key);
    };
  }, [disclosure, menu, profile]);

  function toggleDisclosure(target: HeaderDisclosure) {
    setDisclosure(current => current === target ? null : target);
  }

  async function logout() {
    try {
      await api("/auth/logout", "POST");
      qc.setQueryData(["me"], null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
      router.push("/login");
      toast.success("Signed out");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const avatar = user ? (
    <div className="profile account-menu">
      <button
        ref={profileTrigger}
        type="button"
        className="account-trigger"
        aria-label="Profile menu"
        aria-expanded={profile}
        aria-controls="account-menu"
        onClick={() => toggleDisclosure("profile")}
      >
        {workspace && (
          <span>
            <strong>{user.name}</strong>
            <small>{user.professionalTitle || "CREATOR WORKSPACE"}</small>
          </span>
        )}

        <span className="avatar">
          {user.name.slice(0, 1).toUpperCase()}
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </span>
      </button>

      {profile && (
        <div className="dropdown" id="account-menu">
          <strong>{user.name}</strong>
          <small>{user.email}</small>

          {dashboardLinks.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}

          <button onClick={logout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link className="login-link" href="/login">
      Login
    </Link>
  );

  return (
    <header
      className={
        workspace
          ? "workspace-header"
          : authPage
            ? "auth-header"
            : "public-header"
      }
    >
      {detailPage && (
        <div className="mobile-detail-header">
          <Link href="/studios" aria-label="Back to Explore Studios">
            <ArrowLeft size={21} />
          </Link>

          <strong>Studio Details</strong>

          <button
            aria-label="Share studio"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                toast.success("Studio link copied");
              } catch {
                toast.error("Copy the studio URL from your address bar.");
              }
            }}
          >
            <Share2 size={17} />
          </button>

          {avatar}
        </div>
      )}

      <div className="nav-wrap">
        <div className="header-brand">
          <Brand />

          {workspace && (
            <button
              ref={menuTrigger}
              type="button"
              className="icon sidebar-toggle"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => toggleDisclosure("navigation")}
            >
              <Menu size={17} />
            </button>
          )}
        </div>

        {workspace ? (
          <form action="/studios" className="workspace-search">
            <Search size={18} />
            <input
              name="search"
              aria-label="Search studios"
              placeholder="Search stages, soundpacks, permits…"
            />
          </form>
        ) : authPage ? (
          <nav className="auth-nav">
            <Link className={path === "/login" ? "active" : ""} href="/login">
              Log In
            </Link>

            <Link
              className={path === "/register" ? "active" : ""}
              href="/register"
            >
              Register
            </Link>

            <span />
            <Link href="/studios">Explore Studios</Link>
          </nav>
        ) : (
          <nav className="desktop-nav">
            {[
              ["/", "Home"],
              ["/studios", "Explore Studios"],
              ["/how-it-works", "How It Works"],
              ["/about", "About Us"],
            ].map(([href, text]) => (
              <Link
                key={href}
                href={href}
                className={path === href ? "active" : ""}
              >
                {text}
              </Link>
            ))}
          </nav>
        )}

        {!authPage && (
          <div className="nav-actions">
            {!workspace && (
              <button
                className="icon"
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun size={17} className="sun" />
                <Moon size={17} className="moon" />
              </button>
            )}

            <Link href="/add-studio" className="button primary host-link">
              {workspace ? (
                <>
                  <Plus size={16} />
                  List Stage
                </>
              ) : (
                "Host Your Space"
              )}
            </Link>

            {user && (
              <div className="profile notification-menu">
                <button
                  className="icon"
                  ref={notificationTrigger}
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notifications}
                  aria-controls="notification-menu"
                  onClick={() => toggleDisclosure("notifications")}
                >
                  <Bell size={18} />

                  {!!alerts.data?.pending && (
                    <span className="notification-dot" />
                  )}
                </button>

                {notifications && (
                  <div className="dropdown" id="notification-menu">
                    <strong>Production notifications</strong>
                    <p>{alerts.data?.pending ?? 0} pending studio requests</p>

                    <Link href="/host-bookings">
                      Review booking requests
                      <ArrowRight size={14} />
                    </Link>

                    <p>
                      {alerts.data?.upcoming ?? 0} upcoming confirmed sessions
                    </p>

                    <Link href="/my-bookings">
                      View your reservations
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {avatar}

            {!user && !workspace && (
              <Link href="/register" className="button outline register-nav">
                Register
              </Link>
            )}

            {!workspace && (
              <button
                ref={menuTrigger}
                type="button"
                className="icon mobile-toggle"
                aria-label="Toggle navigation"
                aria-expanded={menu}
                aria-controls="mobile-menu"
                onClick={() => toggleDisclosure("navigation")}
              >
                {menu ? <X /> : <Menu />}
              </button>
            )}
          </div>
        )}
      </div>

      {menu && (
        <nav
          className="mobile-menu"
          id="mobile-menu"
          aria-label="Mobile navigation"
        >
          {[
            ["/", "Home"],
            ["/studios", "Explore Studios"],
            ["/how-it-works", "How It Works"],
            ["/about", "About Us"],
            ...(user
              ? dashboardLinks.map(([h, l]) => [h, l])
              : [
                  ["/login", "Login"],
                  ["/register", "Register"],
                ]),
          ].map(([h, l]) => (
            <Link key={h} href={h}>
              {l}
            </Link>
          ))}

          {user && (
            <button className="button outline" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
