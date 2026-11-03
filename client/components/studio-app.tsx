"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Aperture,
  ArrowRight,
  Heart,
  MapPin,
  Star,
  Menu,
  X,
  Sun,
  Moon,
  Camera,
  Film,
  Mic,
  Music,
  Palette,
  LayoutDashboard,
  CalendarDays,
  Plus,
  Settings,
  LogOut,
  Search,
  ShieldCheck,
  Users,
  Check,
  SlidersHorizontal,
  Share2,
  Wifi,
  ImagePlus,
  Clock,
  FileText,
  Wallet,
  Timer,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Bell,
  Download,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { motion, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError, Studio, User, Booking, categories } from "./api";
import { Button, Modal } from "./ui";
import { SocialLinks } from "./social-links";
const icons = [Camera, Film, Mic, Music, Palette];
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
const privateRoutes = [
  "/dashboard",
  "/add-studio",
  "/my-listings",
  "/my-bookings",
  "/profile-settings",
  "/wishlist",
  "/host-bookings",
];
const dashboardLinks = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/my-bookings", "My Bookings", CalendarDays],
  ["/host-bookings", "Booking Requests", Users],
  ["/my-listings", "My Studio Listings", Film],
  ["/add-studio", "Add New Studio", Plus],
  ["/wishlist", "Saved Spaces", Heart],
  ["/profile-settings", "Profile Settings", Settings],
] as const;
function useUser() {
  return useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<User>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
  });
}
function State({
  loading,
  error,
  empty = false,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
}) {
  if (loading) return <div className="skeleton" aria-label="Loading studios" />;
  if (error)
    return (
      <div role="alert" className="empty">
        <h3>We couldn’t load this.</h3>
        <p>{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  if (empty)
    return (
      <div className="empty">
        <Aperture size={36} />
        <h3>A little room for possibility.</h3>
        <p>There’s nothing here yet. Explore a space to get started.</p>
        <Link className="button primary" href="/studios">
          Explore Studios
        </Link>
      </div>
    );
  return null;
}
function Brand() {
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
function Header() {
  const { data: user } = useUser();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [profile, setProfile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const workspace =
    privateRoutes.includes(path) || path.startsWith("/studios/edit/");
  const authPage = path === "/login" || path === "/register";
  const detailPage = /^\/studios\/[^/]+$/.test(path);
  const alerts = useQuery<{ pending: number; upcoming: number }>({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard"),
    enabled: !!user,
  });
  useEffect(() => {
    setMenu(false);
    setProfile(false);
    setNotifications(false);
  }, [path]);
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.target instanceof Element && !e.target.closest(".profile")) {
        setProfile(false);
        setNotifications(false);
      }
      if (e.target instanceof Element && !e.target.closest("header"))
        setMenu(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setProfile(false);
        setNotifications(false);
      }
    };
    document.addEventListener("pointerdown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("keydown", key);
    };
  }, []);
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
        className="account-trigger"
        aria-label="Profile menu"
        aria-expanded={profile}
        onClick={() => setProfile(!profile)}
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
        <div className="dropdown">
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
              className="icon sidebar-toggle"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
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
                  aria-label="Notifications"
                  aria-expanded={notifications}
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={18} />
                  {!!alerts.data?.pending && (
                    <span className="notification-dot" />
                  )}
                </button>
                {notifications && (
                  <div className="dropdown">
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
                className="icon mobile-toggle"
                aria-label="Toggle navigation"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X /> : <Menu />}
              </button>
            )}
          </div>
        )}
      </div>
      {menu && (
        <nav className="mobile-menu">
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
function Footer() {
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  async function subscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ message: string }>("/newsletter", "POST", {
        email: new FormData(e.currentTarget).get("email"),
      });
      toast.success(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (path === "/login" || path === "/register")
    return (
      <footer className="auth-footer">
        <span>
          © {new Date().getFullYear()} StudioSpace. All rights reserved.
        </span>
        <div>
          <Link href="/terms">Production Use Terms</Link>
          <Link href="/privacy">Privacy & Safety</Link>
          <Link href="/studios">Soundstage Network</Link>
        </div>
      </footer>
    );
  return (
    <footer
      className={
        "reference-footer " +
        (path === "/studios"
          ? "explore-footer"
          : /^\/studios\/[^/]+$/.test(path)
            ? "detail-footer"
            : "")
      }
    >
      <div className="footer-grid">
        <div>
          <Brand />
          <p>
            Cinematic soundstages, cyclorama rooms, and audio suites for
            creative crews, directors, and artists.
          </p>
          <SocialLinks />
        </div>
        <div>
          <h4>CATEGORIES</h4>
          {categories.map((c) => (
            <Link key={c} href={"/studios?category=" + encodeURIComponent(c)}>
              {c}
            </Link>
          ))}
        </div>
        <div>
          <h4>PLATFORM</h4>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/about">About StudioSpace</Link>
          <Link href="/terms">Host Guidelines</Link>
          <Link href="/privacy">Privacy & Safety</Link>
          <Link href="/add-studio">Host Your Space</Link>
        </div>
        <div>
          <h4>PRODUCTION CALL SHEET</h4>
          <p>
            Receive future space updates and production news.
            <br />
            Interest is saved; email delivery is not enabled.
          </p>
          <form onSubmit={subscribe} className="newsletter">
            <input
              name="email"
              type="email"
              aria-label="Newsletter email"
              placeholder="director@production.co"
              required
            />
            <Button
              variant="outline"
              disabled={busy}
              aria-label="Save newsletter interest"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} StudioSpace. Designed for analog
          tactility and digital speed.
        </span>
        <div>
          <span>CREATIVE SPACE NETWORK</span>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/terms">Studio Regulations</Link>
        </div>
      </div>
    </footer>
  );
}
function Card({ studio: s }: { studio: Studio }) {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const { data: saved = [] } = useQuery<{ studioId: Studio }[]>({
    queryKey: ["wishlist"],
    queryFn: () => api("/wishlist"),
    enabled: !!user,
  });
  const isSaved = saved.some((w) => w.studioId?._id === s._id);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!user) {
      window.location.href =
        "/login?next=" +
        encodeURIComponent(location.pathname + location.search);
      return;
    }
    setBusy(true);
    try {
      await api(
        isSaved ? "/wishlist/" + s._id : "/wishlist",
        isSaved ? "DELETE" : "POST",
        isSaved ? undefined : { studioId: s._id },
      );
      await qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(isSaved ? "Removed from saved spaces" : "Space saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="studio-card production-card">
      <div className="card-image">
        <Link href={"/studios/" + s._id}>
          <img src={s.images[0]} alt={s.title} loading="lazy" />
        </Link>
        <span className="category-tag">
          <span className="tiny-dot" />
          {s.category}
        </span>
        <button
          aria-label={isSaved ? "Remove saved studio" : "Save studio"}
          aria-pressed={isSaved}
          disabled={busy}
          className={"save " + (isSaved ? "saved" : "")}
          onClick={save}
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <div className="image-price">
          <strong>{money(s.hourlyRate)}</strong>
          <small> / hr</small>
        </div>
        <span className="image-spec">
          {s.specs?.usableArea
            ? s.specs.usableArea.toLocaleString() + " SQ FT"
            : s.maxCapacity + " PERSONS"}
        </span>
      </div>
      <div className="card-body">
        <div className="rating">
          <span>
            <MapPin size={12} />
            {s.city} · {s.country}
          </span>
          <span>
            <Star size={12} className="accent" />
            {s.reviewCount
              ? s.averageRating.toFixed(2) + " (" + s.reviewCount + ")"
              : "New"}
          </span>
        </div>
        <Link href={"/studios/" + s._id}>
          <h3>{s.title}</h3>
        </Link>
        <p className="card-description">{s.overview}</p>
        <div className="card-amenities">
          {s.amenities.slice(0, 3).map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
        <div className="card-bottom">
          <span className="request-label">● Host confirmation</span>
          <Link className="spec-link" href={"/studios/" + s._id}>
            View Details
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Steps() {
  const q = useQuery<{ items: Studio[]; total: number }>({
    queryKey: ["studio-count"],
    queryFn: () => api("/studios"),
  });
  return (
    <section className="section reference-steps">
      <div className="eyebrow">PRODUCTION PIPELINE</div>
      <h2>How Booking Works</h2>
      <p>
        Designed around real call sheets. Lock your shooting location in minutes
        <br className="desktop-break" /> without lengthy broker paperwork.
      </p>
      <div className="steps">
        {[
          "Discover Spaces",
          "Select Shoot Hours",
          "Request Your Session",
          "Create & Produce",
        ].map((s, i) => {
          const Icon = [Search, CalendarDays, ShieldCheck, Film][i];
          return (
            <article key={s}>
              <div>
                <span className="step-num">0{i + 1}</span>
                <Icon size={21} />
              </div>
              <h3>{s}</h3>
              <p>
                {
                  [
                    "Filter by precise technical requirements, capacity and location.",
                    "Reserve hourly blocks and review your session estimate.",
                    "The host reviews availability and confirms your request.",
                    "Show up with your crew and focus on what you came to make.",
                  ][i]
                }
              </p>
            </article>
          );
        })}
      </div>
      <div className="pipeline-strip">
        <span>
          <span className="tiny-dot" />
          Active studios today
        </span>
        <span>
          {q.data?.total ?? "…"} spaces in the local studio collection
        </span>
        <Link href="/studios">
          View current inventory
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
function Home() {
  const [category, setCategory] = useState("");
  const q = useQuery<Studio[]>({
    queryKey: ["featured", category],
    queryFn: () =>
      api(
        "/studios/featured" +
          (category ? "?category=" + encodeURIComponent(category) : ""),
      ),
  });
  const reduce = useReducedMotion();
  const slides = [
    [
      "hero-production",
      "Find Your Space.",
      "Create Your Story.",
      "Discover extraordinary creative spaces and cinematic soundstages tailored for your next breakthrough production.",
    ],
    [
      "hero-soundstage",
      "Your Vision Deserves",
      "The Perfect Studio.",
      "From professional daylight photography lofts to acoustic-damped post-production recording suites.",
    ],
    [
      "hero-music",
      "Your Space.",
      "Our Creative Community.",
      "Open your studio doors to the filmmakers, artists and musicians creating what comes next.",
    ],
  ];
  return (
    <>
      <section className="hero reference-hero">
        <Swiper
          modules={[Autoplay, Navigation, Pagination, A11y]}
          navigation
          pagination={{ clickable: true }}
          autoplay={
            reduce
              ? false
              : {
                  delay: 6500,
                  disableOnInteraction: true,
                  pauseOnMouseEnter: true,
                }
          }
          loop
        >
          {slides.map(([image, a, b, text], i) => (
            <SwiperSlide key={image}>
              <div
                className="hero-slide"
                style={{
                  backgroundImage: `linear-gradient(90deg,rgba(8,8,8,.75),rgba(8,8,8,.18)),linear-gradient(0deg,#101010dc,transparent),url(/images/${image}.png)`,
                }}
              >
                <div className="hero-copy">
                  <span className="eyebrow pill">
                    <span className="dot" />
                    {i === 1
                      ? "ARCHITECTURAL SOUNDSTAGES"
                      : "CURATED FOR CREATIVE PRODUCTION"}
                  </span>
                  <h1>
                    {a}
                    <br />
                    <span>{b}</span>
                  </h1>
                  <p>{text}</p>
                  <Link
                    className="button primary"
                    href={i === 2 ? "/add-studio" : "/studios"}
                  >
                    {i === 2 ? "Host Your Space" : "Discover Spaces"}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <form className="hero-search" action="/studios">
          <label>
            Category
            <select name="category">
              <option value="">All Production Types</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input name="location" placeholder="City or neighborhood" />
          </label>
          <label>
            Production date
            <input
              name="availableDate"
              type="date"
              aria-label="Production date"
            />
          </label>
          <label>
            Crew size
            <select name="crew">
              <option value="">Any crew size</option>
              {[5, 10, 20, 40].map((n) => (
                <option key={n} value={n}>
                  {n}+ persons
                </option>
              ))}
            </select>
          </label>
          <Button>
            <Search size={15} />
            Find Stage
          </Button>
        </form>
      </section>
      <div className="container">
        <section className="section category-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ROOM FOR EVERY VISION</div>
              <h2>Browse Studio Types</h2>
            </div>
            <p>
              Engineered spaces by acoustical spec, power
              <br className="desktop-break" /> supply, and spatial height.
            </p>
          </div>
          <div className="categories photo-categories">
            {categories.map((c, i) => (
              <Link key={c} href={"/studios?category=" + encodeURIComponent(c)}>
                <img
                  src={
                    "/images/" +
                    [
                      "studio-photo",
                      "studio-film",
                      "studio-podcast",
                      "hero-music",
                      "studio-art",
                    ][i] +
                    ".png"
                  }
                  alt={c}
                />
                <div>
                  <span className="eyebrow">
                    {
                      [
                        "CYC & DAYLIGHT",
                        "LIGHTS · CAMERA",
                        "VOICE · BROADCAST",
                        "TRACK · MIX",
                        "MAKE · BUILD",
                      ][i]
                    }
                  </span>
                  <h3>
                    {
                      [
                        "Photo Studios",
                        "Film Stages",
                        "Podcast Lounges",
                        "Music Suites",
                        "Art Workshops",
                      ][i]
                    }
                  </h3>
                  <p>
                    {
                      [
                        "Cycloramas, photo grids & daylight lofts.",
                        "Film production stages and flexible sets.",
                        "Recording rooms made for conversation.",
                        "Sound-treated rooms for your next record.",
                        "Room for hands-on ideas and artistry.",
                      ][i]
                    }
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="section featured-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                CURATED STAGES · REAL-TIME INVENTORY
              </div>
              <h2>Spaces Worth Creating In</h2>
              <p>
                Handpicked spaces with production-ready lighting and acoustical
                treatment.
              </p>
            </div>
            <div className="segmented">
              {["", ...categories.slice(0, 4)].map((c, i) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {
                    ["All", "Photography", "Film Stages", "Podcasts", "Music"][
                      i
                    ]
                  }
                </button>
              ))}
            </div>
          </div>
          <State
            loading={q.isPending}
            error={q.error}
            empty={q.data?.length === 0}
          />
          <div className="studio-grid home-cards">
            {q.data?.map((s) => (
              <Card key={s._id} studio={s} />
            ))}
          </div>
          <Link className="text-link collection-link" href="/studios">
            View the complete collection <ArrowRight size={15} />
          </Link>
        </section>
        <Steps />
        <section className="protection-panel">
          <div>
            <div className="eyebrow pill">
              <ShieldCheck size={12} />
              PRODUCTION INFRASTRUCTURE
            </div>
            <h2>
              Your Space.
              <br />
              <span className="accent">
                Our Creative
                <br />
                Community.
              </span>
            </h2>
            <p>
              Host with confidence. Clear studio details, account-based profiles
              and a booking schedule you control.
            </p>
            <Link className="button primary" href="/add-studio">
              Host Your Space
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="protection-grid">
            {[
              [
                "Verified Profiles",
                "Registered accounts link each request to a creator and each space to its host.",
                "ACCOUNT-BASED IDENTITY",
                Users,
              ],
              [
                "Equipment Safety",
                "Document your equipment and agree on safe use before a studio session.",
                "HOST-DEFINED CONDITIONS",
                Camera,
              ],
              [
                "Liability Information",
                "Discuss deposits, responsibilities and any required coverage directly with the host.",
                "NO PLATFORM INSURANCE",
                ShieldCheck,
              ],
              [
                "Host & Creator Assistance",
                "Review booking information, manage requests and keep your schedule in one place.",
                "SELF-SERVICE WORKSPACE",
                CalendarDays,
              ],
            ].map(([title, text, label, Icon]) => {
              const I = Icon as typeof Camera;
              return (
                <article key={String(title)}>
                  <I size={23} />
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                  <small>{String(label)}</small>
                </article>
              );
            })}
          </div>
        </section>
        <section
          className="closing-cta"
          style={{
            backgroundImage:
              "linear-gradient(#131313c9,#131313ef),url(/images/hero-production.png)",
          }}
        >
          <div className="eyebrow">START YOUR NEXT PROJECT</div>
          <h2>Great Ideas Need Great Spaces.</h2>
          <p>
            Find your setting. Bring your crew. Create something that matters.
          </p>
          <div className="button-row">
            <Link href="/studios" className="button primary">
              Explore the Collection
            </Link>
            <Link href="/add-studio" className="button outline">
              List Your Studio
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
function Explore() {
  const router = useRouter();
  const urlParams = useSearchParams();
  const search = urlParams.size ? "?" + urlParams.toString() : "";
  const params = new URLSearchParams(search);
  const [maxRate, setMaxRate] = useState(params.get("max") || "");
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = useQuery<{
    items: Studio[];
    total: number;
    page: number;
    pages: number;
  }>({
    queryKey: ["studios", search],
    queryFn: () => api("/studios" + search),
  });
  useEffect(() => setMaxRate(params.get("max") || ""), [search]);
  function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    for (const [k, v] of f) {
      if (v && k !== "amenity") p.set(k, String(v));
    }
    const amenities = f.getAll("amenity");
    if (amenities.length) p.set("amenities", amenities.join(","));
    router.push("/studios" + (p.size ? "?" + p.toString() : ""));
  }
  function page(n: number) {
    params.set("page", String(n));
    router.push("/studios?" + params.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function remove(k: string) {
    params.delete(k);
    params.delete("page");
    router.push("/studios?" + params.toString());
  }
  return (
    <div className="explore-page">
      <div className="container">
        <section className="explore-intro">
          <div>
            <span className="eyebrow pill">
              <span className="tiny-dot" />
              LIVE INVENTORY MATRIX
            </span>
            <h1>
              Find the Space Behind Your
              <br className="desktop-break" />
              Next Masterpiece.
            </h1>
            <p>
              Discover production stages, sound suites, and creative warehouses
              <br className="desktop-break" /> for your next project.
            </p>
          </div>
          <div className="segmented view-switch">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <LayoutDashboard size={14} />
              Grid View
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <Menu size={14} />
              List View
            </button>
          </div>
        </section>
        <form
          onSubmit={apply}
          key={search}
          className="explore-form"
          id="explore-filters"
        >
          <div className="explore-toolbar">
            <div className="toolbar-fields">
              <div className="mobile-search-group">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    name="search"
                    aria-label="Studio name"
                    placeholder="Search by stage name"
                    defaultValue={params.get("search") || ""}
                  />
                </label>
                <button
                  type="button"
                  className="mobile-filter-trigger"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
              </div>
              <select
                name="category"
                aria-label="Category"
                defaultValue={params.get("category") || ""}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="rate-slider">
                <span>
                  Max Rate
                  <strong>
                    {maxRate ? money(Number(maxRate)) + " / hr" : "Any rate"}
                  </strong>
                </span>
                <input
                  name={maxRate ? "max" : undefined}
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={maxRate || "500"}
                  onChange={(e) => setMaxRate(e.target.value)}
                />
              </label>
              <select
                name="sort"
                aria-label="Sort by"
                defaultValue={params.get("sort") || "newest"}
              >
                <option value="newest">Newest Spaces</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div className="mobile-category-bar">
              {["", ...categories].map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className={
                    (params.get("category") || "") === c ? "active" : ""
                  }
                  onClick={() => {
                    params.delete("page");
                    if (c) params.set("category", c);
                    else params.delete("category");
                    router.push("/studios?" + params.toString());
                  }}
                >
                  {
                    [
                      "All Stages",
                      "Photo Cyc",
                      "Film Stage",
                      "Podcast",
                      "Music",
                      "Art",
                    ][i]
                  }
                </button>
              ))}
            </div>
            <div className="active-filters">
              <small>ACTIVE FILTERS:</small>
              {Array.from(params.entries())
                .filter(([k]) => !["page", "sort"].includes(k))
                .map(([k, v]) => (
                  <button type="button" key={k} onClick={() => remove(k)}>
                    {v.replaceAll(",", " · ")}
                    <X size={11} />
                  </button>
                ))}
              <button
                type="button"
                className="clear-link"
                onClick={() => router.push("/studios")}
              >
                Clear All Filters
              </button>
            </div>
            <div className="inventory-caption">
              <span className="tiny-dot" />
              {q.data?.total ?? "…"} creative spaces · database inventory
              <div className="mobile-inventory-view segmented">
                <button
                  type="button"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => setView("grid")}
                >
                  <LayoutDashboard size={12} />
                  GRID
                </button>
                <button
                  type="button"
                  className={view === "list" ? "active" : ""}
                  onClick={() => setView("list")}
                >
                  <Menu size={12} />
                  LIST
                </button>
              </div>
            </div>
          </div>
          <div className="explore-layout">
            <aside className="filters precision-filters">
              <div className="precision-title">
                <h3>
                  <SlidersHorizontal size={16} />
                  Precision Filters
                </h3>
                <button type="button" onClick={() => router.push("/studios")}>
                  Reset
                </button>
              </div>
              <PrecisionFields params={params} />
              <Button>Apply filters</Button>
              <div className="filter-guarantee">
                <ShieldCheck size={15} />
                <h4>HOST INFORMATION</h4>
                <p>
                  Check listed equipment, technical specifications and access
                  details before requesting your session.
                </p>
              </div>
            </aside>
            <section
              className={"results " + (view === "list" ? "list-results" : "")}
            >
              <State
                loading={q.isPending}
                error={q.error}
                empty={q.data?.items.length === 0}
              />
              <div className="studio-grid explore-grid">
                {q.data?.items.map((s) => (
                  <Card key={s._id} studio={s} />
                ))}
              </div>
              <div className="pagination reference-pagination">
                <span>
                  Showing {q.data?.total ? (q.data.page - 1) * 9 + 1 : 0}–
                  {q.data ? Math.min(q.data.page * 9, q.data.total) : 0} of{" "}
                  {q.data?.total ?? 0} studios
                </span>
                {q.data && q.data.pages > 1 && (
                  <div>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={q.data.page === 1}
                      onClick={() => page(q.data!.page - 1)}
                    >
                      ‹
                    </Button>
                    {Array.from(
                      { length: Math.min(q.data.pages, 8) },
                      (_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={q.data!.page === i + 1 ? "active" : ""}
                          onClick={() => page(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ),
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={q.data.page === q.data.pages}
                      onClick={() => page(q.data!.page + 1)}
                    >
                      ›
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </form>
        <section className="concierge-panel">
          <div>
            <span className="eyebrow">CREATIVE SPACE NETWORK</span>
            <h2>
              Need a turnkey production stage
              <br />
              with camera package & crew?
            </h2>
            <p>
              Compare equipment and studio specifications, then confirm your
              <br className="desktop-break" /> requirements directly with your
              host before the shoot.
            </p>
            <div className="button-row">
              <Link href="/how-it-works" className="button primary">
                Plan Your Production
              </Link>
              <a href="/api/studios/catalog.pdf" className="button outline">
                Download Studio Spec Catalog (PDF)
              </a>
            </div>
          </div>
          <div className="dispatch-panel">
            <h4>
              LOCAL INVENTORY STATUS <span className="tiny-dot" />
            </h4>
            <p>
              <span>Matching spaces</span>
              <strong>{q.data?.total ?? 0}</strong>
            </p>
            <div className="progress-track">
              <i style={{ width: q.data?.total ? "100%" : "0%" }} />
            </div>
            <p>
              <span>Booking confirmation</span>
              <strong>Host reviewed</strong>
            </p>
            <p>
              <span>Equipment requirements</span>
              <strong>Check listing</strong>
            </p>
            <small>LIVE DATA · NO PAYMENTS COLLECTED</small>
          </div>
        </section>
      </div>
      <Modal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Precision Filters"
      >
        <form
          className="mobile-precision-form"
          onSubmit={(e) => {
            apply(e);
            setFiltersOpen(false);
          }}
        >
          {["search", "category", "sort"].map((k) => (
            <input key={k} type="hidden" name={k} value={params.get(k) || ""} />
          ))}
          {maxRate && <input type="hidden" name="max" value={maxRate} />}
          <PrecisionFields params={params} />
          <Button>Apply filters</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              router.push("/studios");
              setFiltersOpen(false);
            }}
          >
            Clear filters
          </Button>
        </form>
      </Modal>
    </div>
  );
}
function Details({ id }: { id: string }) {
  const q = useQuery<Studio>({
    queryKey: ["studio", id],
    queryFn: () => api("/studios/" + id),
  });
  const reviews = useQuery<
    {
      _id: string;
      rating: number;
      comment: string;
      createdAt: string;
      userId: { name: string };
    }[]
  >({
    queryKey: ["reviews", id],
    queryFn: () => api("/studios/" + id + "/reviews"),
  });
  const availability = useQuery<{ startTime: string; endTime: string }[]>({
    queryKey: ["availability", id],
    queryFn: () => api("/studios/" + id + "/availability"),
  });
  const [image, setImage] = useState(0);
  const [gallery, setGallery] = useState(false);
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const { data: user } = useUser();
  const router = useRouter();
  const qc = useQueryClient();
  const saved = useQuery<{ studioId: Studio }[]>({
    queryKey: ["wishlist"],
    queryFn: () => api("/wishlist"),
    enabled: !!user,
  });
  if (q.isPending || q.error)
    return (
      <div className="container page">
        <State loading={q.isPending} error={q.error} />
        <Link href="/studios">Back to studios</Link>
      </div>
    );
  const s = q.data;
  const spec = s.specs || {};
  const duration = Math.max(
    0,
    (+new Date("2000-01-01T" + end) - +new Date("2000-01-01T" + start)) /
      3600000,
  );
  const isSaved = saved.data?.some((w) => w.studioId?._id === id);
  async function save() {
    if (!user) {
      router.push("/login?next=" + encodeURIComponent("/studios/" + id));
      return;
    }
    try {
      await api(
        isSaved ? "/wishlist/" + id : "/wishlist",
        isSaved ? "DELETE" : "POST",
        isSaved ? undefined : { studioId: id },
      );
      await qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(isSaved ? "Space removed" : "Space saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/studios/" + id + "/reviews", "POST", {
        rating: Number(f.get("rating")),
        comment: f.get("comment"),
      });
      await qc.invalidateQueries({ queryKey: ["reviews", id] });
      await qc.invalidateQueries({ queryKey: ["studio", id] });
      toast.success("Review published");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const specs = [
    [
      "USABLE SPACE",
      spec.usableArea
        ? spec.usableArea.toLocaleString() + " sq ft"
        : "Not provided",
      "Floor area",
    ],
    [
      "GRID HEIGHT",
      spec.gridHeight ? spec.gridHeight + " ft" : "Not provided",
      "Rigging clearance",
    ],
    ["CREW MAX", s.maxCapacity + " pax", "Maximum capacity"],
    [
      "ACOUSTICS",
      spec.soundproofRating || "Not provided",
      "Host-listed specification",
    ],
  ];
  return (
    <div className="container page reference-details">
      <div className="breadcrumb">
        <Link href="/">Home</Link> /{" "}
        <Link href={"/studios?category=" + encodeURIComponent(s.category)}>
          {s.category}
        </Link>{" "}
        / {s.title}
      </div>
      <div className="detail-heading">
        <div>
          <h1>
            {s.title}
            <span className="badge stage-id">
              STAGE ID / {id.slice(-6).toUpperCase()}
            </span>
          </h1>
          <p className="inline">
            {s.category}
            <span>•</span>
            <Star size={14} className="accent" />
            {s.reviewCount
              ? s.averageRating.toFixed(2) + " (" + s.reviewCount + " reviews)"
              : "New listing"}
            <span>•</span>
            <MapPin size={14} />
            {s.city}, {s.country}
          </p>
        </div>
        <div className="button-row">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                toast.success("Studio link copied");
              } catch {
                toast.error(
                  "Could not copy the link. Copy it from your address bar.",
                );
              }
            }}
          >
            <Share2 size={14} />
            Share
          </Button>
          <Button variant="outline" onClick={save}>
            <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
      <div className="photo-mosaic">
        <button
          className="mosaic-cover"
          onClick={() => {
            setImage(0);
            setGallery(true);
          }}
          aria-label="Open studio photo gallery"
        >
          <img src={s.images[0]} alt={s.title + " main stage"} />
          <span className="photo-caption">
            <span className="dot" />
            MAIN STAGE VIEW ·{" "}
            {s.specs?.usableArea
              ? s.specs.usableArea.toLocaleString() + " SQ FT"
              : s.category.toUpperCase()}
          </span>
        </button>
        <div
          className={"mosaic-side count-" + Math.min(s.images.length - 1, 4)}
        >
          {s.images.slice(1, 5).map((src, i) => (
            <button
              key={src + i}
              onClick={() => {
                setImage(i + 1);
                setGallery(true);
              }}
              aria-label={"View image " + (i + 2)}
            >
              <img src={src} alt={s.title + " photo " + (i + 2)} />
            </button>
          ))}
          {s.images.length === 1 && (
            <div className="gallery-empty">
              <Camera size={35} />
              <p>More photos can be requested from the host.</p>
            </div>
          )}
          <Button
            className="view-photos"
            variant="outline"
            onClick={() => setGallery(true)}
          >
            <Camera size={14} />
            View All {s.images.length} Photos
          </Button>
        </div>
      </div>
      <div className="details-layout">
        <div>
          <div className="specification-strip">
            {specs.map(([label, value, hint]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
                <span>{hint}</span>
              </div>
            ))}
          </div>
          <section className="host-profile-strip">
            <span className="avatar">{s.ownerName?.slice(0, 1)}</span>
            <div>
              <strong>Hosted by {s.ownerName}</strong>
              <p>Registered studio host · {s.city}</p>
              <small>
                <span className="tiny-dot" />
                Request-based reservations
              </small>
            </div>
            <Button variant="outline" onClick={() => setContact(true)}>
              Contact Host
            </Button>
          </section>
          <section className="detail-section">
            <h2>
              The {s.category === "Film Stages" ? "Soundstage" : "Studio"}{" "}
              Environment
            </h2>
            <p className="preline">{s.overview}</p>
          </section>
          <section className="technical-matrix panel">
            <div className="section-heading">
              <h3>
                <SlidersHorizontal size={17} />
                Technical Specifications Matrix
              </h3>
              <small>HOST-PROVIDED DETAILS</small>
            </div>
            <div>
              {[
                ["POWER SUPPLY", spec.powerSupply],
                [
                  "GRID / PIPE RIG",
                  spec.gridHeight
                    ? spec.gridHeight + " ft grid height"
                    : undefined,
                ],
                [
                  "USABLE FLOOR SPACE",
                  spec.usableArea ? spec.usableArea + " sq ft" : undefined,
                ],
                [
                  "INTERNET / UTILITIES",
                  s.amenities.find((a) => /wi-fi|internet/i.test(a)),
                ],
                ["LOAD-IN ACCESS", spec.access],
                ["AIR HANDLING / ACOUSTICS", spec.soundproofRating],
              ].map(([a, b]) => (
                <article key={a}>
                  <small>{a}</small>
                  <strong>{b || "Not provided"}</strong>
                </article>
              ))}
            </div>
          </section>
          <section className="detail-section">
            <h2>Included Production Amenities</h2>
            <div className="amenity-tiles">
              {s.amenities.map((a, i) => {
                const Icon = [Wifi, Camera, ShieldCheck, Users, Film, Music][
                  i % 6
                ];
                return (
                  <div key={a}>
                    <span className="amenity-icon">
                      <Icon size={19} />
                    </span>
                    <div>
                      <strong>{a}</strong>
                      <small>Included in the host listing</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="stage-rules panel">
            <h3>Production Policies & Stage Rules</h3>
            <div>
              {(s.rules?.length
                ? s.rules
                : [
                    "Confirm noise, access and equipment conditions with your host before arrival.",
                    "Leave the studio and equipment in the condition agreed with the host.",
                    "Discuss haze, pyrotechnics and specialist activities before requesting a session.",
                    "Additional hours require a new host-approved booking; no payment is collected here.",
                  ]
              ).map((rule, i) => (
                <article key={rule}>
                  <span className="accent">{["◖", "◇", "♧", "◷"][i % 4]}</span>
                  <p>{rule}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="detail-section reviews-section" id="reviews">
            <h2>
              <Star size={23} className="accent" />
              {s.reviewCount ? s.averageRating.toFixed(2) : "New"}{" "}
              <small>· {s.reviewCount} Creator Reviews</small>
            </h2>
            {!!reviews.data?.length && (
              <div className="review-distribution">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n}>
                    <span>{n} stars</span>
                    <div className="progress-track">
                      <i
                        style={{
                          width:
                            (100 *
                              reviews.data!.filter((r) => r.rating === n)
                                .length) /
                              reviews.data!.length +
                            "%",
                        }}
                      />
                    </div>
                    <span>
                      {reviews.data!.filter((r) => r.rating === n).length}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <State error={reviews.error} />
            {reviews.data?.length === 0 && (
              <p>
                No reviews yet. Reviews are available after a completed booking.
              </p>
            )}
            {reviews.data?.map((r) => (
              <article className="review panel" key={r._id}>
                <div className="review-author">
                  <span className="avatar">
                    {r.userId?.name?.slice(0, 1) || "C"}
                  </span>
                  <div>
                    <strong>{r.userId?.name || "Creator"}</strong>
                    <small>Completed studio booking · {r.rating}/5</small>
                  </div>
                  <time>
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <p>“{r.comment}”</p>
              </article>
            ))}
            {user && (
              <form onSubmit={review} className="review-form">
                <h3>Share your experience</h3>
                <p className="small muted">
                  A completed booking is required. One review per studio.
                </p>
                <label>
                  Rating
                  <select name="rating">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} stars
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Your review
                  <textarea
                    name="comment"
                    required
                    minLength={5}
                    maxLength={2000}
                  />
                </label>
                <Button disabled={busy}>Publish review</Button>
              </form>
            )}
          </section>
          <section className="detail-section studio-location">
            <h2>Studio Location</h2>
            <div className="location-blueprint">
              <MapPin size={28} />
              <strong>
                {s.address}, {s.city}, {s.country}
              </strong>
              <a
                className="button outline"
                target="_blank"
                rel="noopener noreferrer"
                href={
                  "https://www.google.com/maps/search/?api=1&query=" +
                  encodeURIComponent(
                    s.address + ", " + s.city + ", " + s.country,
                  )
                }
              >
                Open Directions
                <ArrowUpRight size={13} />
              </a>
            </div>
          </section>
        </div>
        <aside className="booking-card specification-booking">
          <div className="booking-price">
            <h2>
              {money(s.hourlyRate)}
              <small>/hour</small>
            </h2>
            <span>
              <Star size={12} />
              {s.reviewCount ? s.averageRating.toFixed(2) : "New"}
            </span>
          </div>
          <label>
            PRODUCTION DATE
            <input
              aria-label="Production date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toLocaleDateString("en-CA")}
            />
          </label>
          <div className="two">
            <label>
              CALL TIME (START)
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              WRAP TIME (END)
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <div className="crew-summary">
            <Users size={16} />
            <span>
              CREW & CAST CAPACITY<strong>Up to {s.maxCapacity} people</strong>
            </span>
          </div>
          <div className="summary">
            <p>
              <span>
                {money(s.hourlyRate)} × {duration} hours
              </span>
              <span>{money(duration * s.hourlyRate)}</span>
            </p>
            <p>
              <span>Security deposit</span>
              <span>{money(s.securityDeposit)}</span>
            </p>
            <p className="booking-total">
              <span>Estimated Total</span>
              <strong>
                {money(duration * s.hourlyRate + s.securityDeposit)}
              </strong>
            </p>
          </div>
          <Button
            onClick={() =>
              user
                ? setOpen(true)
                : router.push(
                    "/login?next=" + encodeURIComponent("/studios/" + id),
                  )
            }
          >
            Book Workspace Now
          </Button>
          <p className="booking-disclosure">
            ● You won’t be charged yet · Host confirmation required
          </p>
          <div className="booking-assurance">
            <ShieldCheck size={17} />
            <span>
              No payment collected. Confirm equipment and liability arrangements
              with your host.
            </span>
          </div>
          <details>
            <summary>
              Upcoming reserved sessions ({availability.data?.length ?? 0})
            </summary>
            <State error={availability.error} />
            {availability.data?.map((a, i) => (
              <p className="small" key={i}>
                {new Date(a.startTime).toLocaleString()} –{" "}
                {new Date(a.endTime).toLocaleString()}
              </p>
            ))}
            {availability.data?.length === 0 && (
              <p>No upcoming confirmed reservations.</p>
            )}
          </details>
        </aside>
      </div>
      <div className="mobile-booking-bar">
        <div>
          <strong>
            {money(s.hourlyRate)}
            <small> / hr</small>
          </strong>
          <span>
            Estimate: {money(duration * s.hourlyRate + s.securityDeposit)}
          </span>
        </div>
        <Button
          disabled={s.status === "paused"}
          onClick={() =>
            user
              ? setOpen(true)
              : router.push(
                  "/login?next=" + encodeURIComponent("/studios/" + id),
                )
          }
        >
          <CalendarDays size={15} />
          {s.status === "paused" ? "Studio Paused" : "Book Workspace Now"}
        </Button>
      </div>
      <BookingModal
        studio={s}
        open={open}
        close={() => setOpen(false)}
        initialDate={date}
        initialStart={start}
        initialEnd={end}
      />
      <Modal
        open={gallery}
        onOpenChange={setGallery}
        title={s.title + " / Photo Gallery"}
      >
        <img
          className="lightbox-main"
          src={s.images[image]}
          alt={s.title + " view " + (image + 1)}
        />
        <div className="lightbox-thumbs">
          {s.images.map((src, i) => (
            <button
              key={src + i}
              className={image === i ? "selected" : ""}
              onClick={() => setImage(i)}
              aria-label={"View gallery image " + (i + 1)}
            >
              <img src={src} alt={"Photo " + (i + 1)} />
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={contact}
        onOpenChange={setContact}
        title={"Contact " + s.ownerName}
      >
        <p>
          Confirm studio access, equipment and production requirements before
          your session.
        </p>
        <div className="panel">
          <strong>{s.ownerName}</strong>
          <p>{s.ownerEmail}</p>
          <p>
            {s.address}, {s.city}, {s.country}
          </p>
        </div>
        {s.ownerEmail && (
          <a href={"mailto:" + s.ownerEmail} className="button primary">
            Open email application
            <ArrowRight size={15} />
          </a>
        )}
        <p className="small muted">
          Messages are sent through your own email application. StudioSpace does
          not operate an in-app messaging service.
        </p>
      </Modal>
    </div>
  );
}
function BookingModal({
  studio: s,
  open,
  close,
  initialDate = "",
  initialStart = "09:00",
  initialEnd = "12:00",
}: {
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  studio: Studio;
  open: boolean;
  close: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setStart(initialStart);
      setEnd(initialEnd);
    }
  }, [open, initialDate, initialStart, initialEnd]);
  const duration =
    (+new Date(`${date}T${end}`) - +new Date(`${date}T${start}`)) / 3600000;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("End time must be after start time");
      return;
    }
    setBusy(true);
    try {
      await api("/bookings", "POST", {
        studioId: s._id,
        startTime: new Date(date + "T" + start).toISOString(),
        endTime: new Date(date + "T" + end).toISOString(),
      });
      await qc.invalidateQueries({ queryKey: ["bookings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Booking request saved. Awaiting host confirmation.");
      close();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title="Make room for your next idea"
    >
      <h3>{s.title}</h3>
      <form onSubmit={submit}>
        <label>
          Booking date
          <input
            type="date"
            required
            min={new Date().toLocaleDateString("en-CA")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="two">
          <label>
            Start time
            <input
              type="time"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            End time
            <input
              type="time"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <div className="summary">
          <p>
            <span>
              {Number.isFinite(duration) && duration > 0 ? duration : 0} hours ×{" "}
              {money(s.hourlyRate)}
            </span>
            <span>{money(duration > 0 ? duration * s.hourlyRate : 0)}</span>
          </p>
          <p>
            <span>Security deposit</span>
            <span>{money(s.securityDeposit)}</span>
          </p>
          <hr />
          <p>
            <strong>Estimated total</strong>
            <strong>
              {money(
                (duration > 0 ? duration * s.hourlyRate : 0) +
                  s.securityDeposit,
              )}
            </strong>
          </p>
        </div>
        <p className="small muted">
          Times use your device’s local timezone. No payment is collected.
          Overlapping pending requests may coexist; only one can be confirmed.
        </p>
        <Button disabled={busy}>
          {busy ? "Saving request…" : "Request Booking"}
        </Button>
      </form>
    </Modal>
  );
}
const authSchema = z.object({
  remember: z.boolean().optional(),
  accepted: z.boolean().optional(),
  accountIntent: z.enum(["creator", "host"]).optional(),
  name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Use at least six characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter"),
  photoURL: z
    .union([z.string().url("Enter a valid photo URL"), z.literal("")])
    .optional(),
  confirm: z.string().optional(),
});
type AuthValues = z.infer<typeof authSchema>;
function Auth({ register: signup }: { register: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { remember: true, accountIntent: "creator" },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [forgot, setForgot] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();
  const count = useQuery<{ total: number }>({
    queryKey: ["studio-count"],
    queryFn: () => api("/studios"),
  });
  const intent = watch("accountIntent");
  const pass = watch("password") || "";
  useEffect(() => {
    const err = new URLSearchParams(location.search).get("error");
    if (err) toast.error(err);
  }, []);
  async function submit(d: AuthValues) {
    if (signup && (!d.name || d.name.trim().length < 2)) {
      setError("name", { message: "Enter your full name" });
      return;
    }
    if (signup && d.password !== d.confirm) {
      setError("confirm", { message: "Passwords do not match" });
      return;
    }
    if (signup && !d.accepted) {
      setError("accepted", {
        message: "Please agree to the terms and privacy policy",
      });
      return;
    }
    try {
      await api("/auth/" + (signup ? "register" : "login"), "POST", d);
      toast.success(
        signup ? "Account created. Sign in to get started." : "Welcome back",
      );
      await qc.invalidateQueries({ queryKey: ["me"] });
      const next = new URLSearchParams(location.search).get("next");
      router.push(
        signup
          ? "/login"
          : next?.startsWith("/") && !next.startsWith("//")
            ? next
            : "/dashboard",
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <div
      className={
        "auth-layout reference-auth " +
        (signup ? "registration-page" : "login-page")
      }
    >
      <section className="auth-art">
        <img
          src={
            "/images/" + (signup ? "hero-music" : "reference-login") + ".png"
          }
          alt={
            signup
              ? "Creative music production studio"
              : "Cinematic film production studio"
          }
        />
        <div className="auth-network">
          <span className="pill">
            <span className="tiny-dot" />
            LIVE CREATIVE NETWORK
          </span>
          <small>{count.data?.total ?? "…"} studio spaces</small>
          <small>{categories.length} creative disciplines</small>
        </div>
        <div className="auth-art-copy">
          <span className="eyebrow">
            {signup ? "SOUNDSTAGE & SPACE EXCHANGE" : "ARCHITECTURE OF CINEMA"}
          </span>
          <h1>
            {signup ? (
              <>
                Join the Creative
                <br />
                <span className="accent">Workspace</span> Network.
              </>
            ) : (
              <>
                Find Your Space.
                <br />
                <span className="accent">Create Your Story.</span>
              </>
            )}
          </h1>
          {signup ? (
            <>
              <p>
                Discover creative spaces for film production, commercial stills,
                podcasting, music, and hands-on artistry.
              </p>
              <div className="signup-benefits">
                {[
                  [
                    ShieldCheck,
                    "Find your production setting",
                    "Compare equipment, location and hourly rates in one place.",
                  ],
                  [
                    Users,
                    "Share your space with creators",
                    "List your studio and stay in control of booking requests.",
                  ],
                  [
                    CalendarDays,
                    "Plan a session with clarity",
                    "Save spaces, request hours and track host-confirmed reservations.",
                  ],
                ].map(([Icon, title, text]) => {
                  const I = Icon as typeof Film;
                  return (
                    <div key={String(title)}>
                      <I size={23} />
                      <section>
                        <h3>{String(title)}</h3>
                        <p>{String(text)}</p>
                      </section>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
          <div className="production-note">
            <p>
              {signup
                ? "“Make room for what comes next. A great space gives a new idea somewhere to begin.”"
                : "“Every frame begins with the room you build around it. Find the environment that lets your production take shape.”"}
            </p>
            <small>STUDIOSPACE · CREATIVE PRODUCTION</small>
          </div>
          {!signup && (
            <div className="auth-fact-tiles">
              <div>
                <small>CREATIVE SPACES</small>
                <strong>{count.data?.total ?? "…"}</strong>
              </div>
              <div>
                <small>STUDIO TYPES</small>
                <strong className="accent">
                  {categories.length} Categories
                </strong>
              </div>
              <div>
                <small>RESERVATIONS</small>
                <strong className="positive">Host Confirmed</strong>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <Brand />
          <small className="eyebrow">
            {signup
              ? "PORTAL TERMINAL / CREATIVE COMMUNITY"
              : "YOUR PRODUCTION WORKSPACE"}
          </small>
          <h1>{signup ? "Create Creator Account" : "Welcome Back"}</h1>
          <p>
            {signup
              ? "Book creative stages or list your facilities today."
              : "Sign in to access your soundstage bookings, studio listings, and production schedule."}
          </p>
          {signup && (
            <div className="intent-selector segmented">
              <button
                type="button"
                className={intent === "creator" ? "active" : ""}
                onClick={() => setValue("accountIntent", "creator")}
              >
                <Camera size={17} />
                I’m a Creator / Renter
              </button>
              <button
                type="button"
                className={intent === "host" ? "active" : ""}
                onClick={() => setValue("accountIntent", "host")}
              >
                <Film size={17} />
                I’m a Studio Host / Owner
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit(submit)} noValidate>
            {signup && (
              <label>
                Full name
                <input
                  {...register("name")}
                  autoComplete="name"
                  placeholder="Alex Rivera"
                />
                {errors.name && (
                  <small className="error">{errors.name.message}</small>
                )}
              </label>
            )}
            <label>
              {signup ? "Professional production email" : "Email address"}
              <div className="input-icon">
                <Mail size={17} />
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  aria-label="Email address"
                  placeholder="director@production.co"
                />
              </div>
              {errors.email && (
                <small className="error">{errors.email.message}</small>
              )}
            </label>
            {signup && (
              <label>
                Profile photo URL (optional)
                <div className="input-icon">
                  <Camera size={18} />
                  <input
                    {...register("photoURL")}
                    type="url"
                    placeholder="https://your-image-url"
                  />
                </div>
                {errors.photoURL && (
                  <small className="error">{errors.photoURL.message}</small>
                )}
              </label>
            )}
            <label>
              <span className="password-label">
                Password
                {!signup && (
                  <button type="button" onClick={() => setForgot(true)}>
                    Forgot Password?
                  </button>
                )}
              </span>
              <div className="password-input input-icon">
                <LockKeyhole size={17} />
                <input
                  {...register("password")}
                  aria-label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <small className="error">{errors.password.message}</small>
              )}
            </label>
            {signup ? (
              <>
                <div className="password-checks">
                  <span className={pass.length >= 6 ? "positive" : ""}>
                    <Check size={14} />
                    Min 6 characters
                  </span>
                  <span className={/[A-Z]/.test(pass) ? "positive" : ""}>
                    <Check size={14} />
                    Uppercase letter
                  </span>
                  <span className={/[a-z]/.test(pass) ? "positive" : ""}>
                    <Check size={14} />
                    Lowercase letter
                  </span>
                </div>
                <label>
                  Confirm password
                  <input
                    {...register("confirm")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                  />
                  {errors.confirm && (
                    <small className="error">{errors.confirm.message}</small>
                  )}
                </label>
                <label className="check-label terms-agreement">
                  <input type="checkbox" {...register("accepted")} />
                  <span>
                    I agree to the StudioSpace{" "}
                    <Link href="/terms">Terms of Use</Link> and{" "}
                    <Link href="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.accepted && (
                  <small className="error">{errors.accepted.message}</small>
                )}
              </>
            ) : (
              <label className="check-label remember">
                <input type="checkbox" {...register("remember")} />
                Keep me signed in for 7 days
              </label>
            )}
            <Button
              aria-label={signup ? "Create Account" : "Sign In"}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait…"
                : signup
                  ? "Complete Registration"
                  : "Sign In to StudioSpace"}
              <ArrowRight size={19} />
            </Button>
          </form>
          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>
          <a href="/api/auth/google" className="button outline google-signin">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285f4"
                d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.4c2-1.9 2.8-4.4 2.8-7.9Z"
              />
              <path
                fill="#34a853"
                d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.9-1.8-5.7-4.2H2.9v2.7A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#fbbc05"
                d="M6.3 13.7A6 6 0 0 1 6 12c0-.6.1-1.2.3-1.7V7.6H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.4l3.3-2.7Z"
              />
              <path
                fill="#ea4335"
                d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.9 9.9 0 0 0 12 2a10 10 0 0 0-9.1 5.6l3.4 2.7C7.1 7.9 9.4 6.1 12 6.1Z"
              />
            </svg>
            Continue with Google Workspace
          </a>
          <p className="auth-switch">
            {signup
              ? "Already have an active account?"
              : "Don’t have a studio production account?"}
            <Link href={signup ? "/login" : "/register"}>
              {signup
                ? "Sign in to StudioSpace"
                : "Create an Account / Register"}
              <ArrowRight size={14} />
            </Link>
          </p>
          <div className="auth-security">
            <ShieldCheck size={16} />
            HTTPOnly authentication cookies<span>•</span>
            <LockKeyhole size={16} />
            Private workspace access
          </div>
        </div>
      </section>
      <Modal open={forgot} onOpenChange={setForgot} title="Password recovery">
        <p>
          Password recovery is not available in this local edition. Use your
          existing account password or Google sign-in if your account was
          registered with Google.
        </p>
        <Button onClick={() => setForgot(false)}>Back to Sign In</Button>
      </Modal>
    </div>
  );
}
function StudioForm({ id }: { id?: string }) {
  const { data: user } = useUser();
  const q = useQuery<Studio>({
    queryKey: ["studio", id],
    queryFn: () => api("/studios/" + id),
    enabled: !!id,
  });
  const router = useRouter();
  const qc = useQueryClient();
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState(categories[0]);
  const [amenities, setAmenities] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draftSaved, setDraftSaved] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  useEffect(() => {
    if (q.data) {
      setImages(q.data.images);
      setCategory(q.data.category);
      setAmenities(q.data.amenities.join(", "));
    }
  }, [q.data]);
  useEffect(() => {
    if (id || !user?._id) return;
    try {
      const raw = localStorage.getItem("studiospace-studio-draft:" + user._id);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft.fields || !Array.isArray(draft.images)) return;
      setImages(
        draft.images
          .filter(
            (src: unknown) =>
              typeof src === "string" &&
              /^\/images\/[a-zA-Z0-9_-]+\.png$/.test(src),
          )
          .slice(0, 12),
      );
      if (categories.includes(draft.category)) setCategory(draft.category);
      setAmenities(String(draft.amenities || ""));
      for (const [name, value] of Object.entries(draft.fields)) {
        const control = (
          document.getElementById("studio-editor") as HTMLFormElement
        )?.elements.namedItem(name);
        if (
          control instanceof HTMLInputElement ||
          control instanceof HTMLTextAreaElement ||
          control instanceof HTMLSelectElement
        ) {
          if (!(control instanceof HTMLInputElement && control.type === "file"))
            control.value = String(value);
        }
      }
      setDraftSaved("Draft restored from this device.");
    } catch {
      toast.error("The saved draft could not be restored.");
    }
  }, [id, user?._id]);
  function saveDraft() {
    if (!user) return;
    const form = document.getElementById("studio-editor") as HTMLFormElement;
    try {
      localStorage.setItem(
        "studiospace-studio-draft:" + user._id,
        JSON.stringify({
          fields: Object.fromEntries(new FormData(form)),
          images,
          category,
          amenities,
          savedAt: new Date().toISOString(),
        }),
      );
      setDraftSaved(
        "Draft saved on this device at " + new Date().toLocaleTimeString(),
      );
      toast.success("Draft saved on this device");
    } catch {
      toast.error("Could not save the draft on this device.");
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.set("image", file);
      const r = await api<{ url: string }>("/uploads", "POST", data);
      setImages((a) => [...a, r.url].slice(0, 12));
      toast.success("Image uploaded and converted to PNG");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!images.length) {
      toast.error("Upload at least one studio image");
      return;
    }
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    setBusy(true);
    try {
      const data = Object.fromEntries(f);
      await api("/studios" + (id ? "/" + id : ""), id ? "PATCH" : "POST", {
        ...data,
        category,
        status:
          submitter?.name === "listingStatus"
            ? submitter.value
            : q.data?.status || "active",
        hourlyRate: Number(data.hourlyRate),
        securityDeposit: Number(data.securityDeposit),
        maxCapacity: Number(data.maxCapacity),
        images,
        amenities: amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        specs: {
          usableArea: data.usableArea ? Number(data.usableArea) : undefined,
          gridHeight: data.gridHeight ? Number(data.gridHeight) : undefined,
          powerSupply: String(data.powerSupply || ""),
          soundproofRating: String(data.soundproofRating || ""),
          access: String(data.access || ""),
          parking: String(data.parking || ""),
        },
        rules: String(data.rules || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["listings"] }),
        qc.invalidateQueries({ queryKey: ["studio", id] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["studios"] }),
        qc.invalidateQueries({ queryKey: ["featured"] }),
      ]);
      if (!id && user)
        localStorage.removeItem("studiospace-studio-draft:" + user._id);
      toast.success(id ? "Studio updated" : "Studio published");
      router.push("/my-listings");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setDeleting(true);
    try {
      await api("/studios/" + id, "DELETE");
      await qc.invalidateQueries({ queryKey: ["listings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Studio deleted");
      router.push("/my-listings");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  function toggleAmenity(a: string) {
    const list = amenities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setAmenities(
      (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]).join(
        ", ",
      ),
    );
  }
  if (id && q.isPending) return <State loading />;
  if (id && (q.error || q.data?.ownerId !== user?._id))
    return (
      <State
        error={q.error || new Error("Only the host may edit this studio")}
      />
    );
  const s = q.data;
  const sp = s?.specs || {};
  const identity = (
    <section className="form-module panel">
      <ModuleTitle
        index="01"
        code="STAGE-META"
        title={
          id
            ? "Stage Identification & Classification"
            : "Basic Information & Archetype"
        }
      />
      <label>
        Studio title
        <input
          name="title"
          required
          minLength={3}
          maxLength={150}
          defaultValue={s?.title}
          placeholder="The Obsidian Cyc & Volume Stage"
        />
      </label>
      <label className="field-label">Primary Production Classification</label>
      <div className="category-choices">
        {categories.map((c, i) => {
          const Icon = icons[i];
          return (
            <button
              key={c}
              type="button"
              className={category === c ? "selected" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              <Icon size={23} />
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      <label>
        Tell the story of your space
        <textarea
          name="overview"
          required
          minLength={20}
          maxLength={10000}
          rows={6}
          defaultValue={s?.overview}
          placeholder="Describe the studio, acoustics, lighting and what makes it suitable for your next production."
        />
      </label>
      <div className="two">
        <label>
          Usable floor area (sq ft)
          <input
            name="usableArea"
            type="number"
            min="1"
            defaultValue={sp.usableArea}
            placeholder="Optional"
          />
        </label>
        <label>
          Grid / ceiling height (ft)
          <input
            name="gridHeight"
            type="number"
            min="1"
            step="0.1"
            defaultValue={sp.gridHeight}
            placeholder="Optional"
          />
        </label>
      </div>
    </section>
  );
  const pricing = (
    <section className="form-module panel">
      <ModuleTitle
        index="02"
        code="FINANCIAL-CLEARANCE"
        title={id ? "Pricing Envelope" : "Commercial Terms & Personnel Limits"}
      />
      <div className={id ? "" : "three"}>
        <label>
          Hourly rate (USD)
          <input
            name="hourlyRate"
            type="number"
            min="1"
            max="100000"
            step="0.01"
            required
            defaultValue={s?.hourlyRate}
          />
          <small>Standard production rate / hour</small>
        </label>
        <label>
          Security deposit (USD)
          <input
            name="securityDeposit"
            type="number"
            min="0"
            max="100000"
            step="0.01"
            required
            defaultValue={s?.securityDeposit ?? 0}
          />
          <small>Arrange directly with your host</small>
        </label>
        <label>
          Maximum capacity
          <input
            name="maxCapacity"
            type="number"
            min="1"
            max="10000"
            required
            defaultValue={s?.maxCapacity || 6}
          />
          <small>Maximum crew and cast / persons</small>
        </label>
      </div>
      <div className="booking-assurance">
        <ShieldCheck size={18} />
        <span>
          Reservations require host confirmation. No online payment or escrow
          service is provided.
        </span>
      </div>
    </section>
  );
  const logistics = (
    <section className="form-module panel">
      <ModuleTitle
        index={id ? "04" : "03"}
        code="LOGISTICS-GPS"
        title={
          id
            ? "Logistics, Access & Dispatch"
            : "Physical Dispatch & Load-In Vector"
        }
      />
      <label>
        Street address
        <input
          name="address"
          required
          minLength={3}
          maxLength={300}
          defaultValue={s?.address}
        />
      </label>
      <div className="two">
        <label>
          City
          <input
            name="city"
            required
            minLength={2}
            maxLength={100}
            defaultValue={s?.city}
          />
        </label>
        <label>
          Country
          <input
            name="country"
            required
            minLength={2}
            maxLength={100}
            defaultValue={s?.country}
          />
        </label>
      </div>
      <div className="location-blueprint">
        <MapPin size={30} />
        <strong>
          {s
            ? s.address + ", " + s.city
            : "Your production address appears on your studio listing."}
        </strong>
        <span>Host-provided location · Confirm access before arrival</span>
      </div>
      <div className="two">
        <label>
          Truck & crew entry / access
          <input
            name="access"
            defaultValue={sp.access}
            placeholder="Ground-floor access, freight lift, entry instructions"
            maxLength={300}
          />
        </label>
        <label>
          Production vehicle parking
          <input
            name="parking"
            defaultValue={sp.parking}
            placeholder="Parking spaces and loading conditions"
            maxLength={150}
          />
        </label>
      </div>
    </section>
  );
  const media = (
    <section className="form-module panel">
      <ModuleTitle
        index={id ? "02" : "04"}
        code="LOCAL PNG ASSETS"
        title={
          id ? "Production Asset Gallery" : "High-Res Media Asset Ingestion"
        }
      />
      <div
        className="upload media-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          for (const f of Array.from(e.dataTransfer.files).slice(
            0,
            12 - images.length,
          ))
            await upload(f);
        }}
      >
        <ImagePlus size={35} />
        <h3>
          {uploading
            ? "Converting and uploading…"
            : "Drop production photos or studio stills here"}
        </h3>
        <p>
          PNG, JPG and WebP · Maximum 10 MB each
          <br />
          Saved locally as optimized PNG · Up to 12 images
        </p>
        <label className="button outline file-picker">
          Browse Computer Files
          <input
            aria-label="Upload studio photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading || images.length >= 12}
            multiple
            onChange={async (e) => {
              for (const file of Array.from(e.target.files || []).slice(
                0,
                12 - images.length,
              ))
                await upload(file);
            }}
          />
        </label>
      </div>
      <div className="upload-previews">
        {images.map((src, i) => (
          <div key={src + i}>
            <img src={src} alt={"Studio upload " + (i + 1)} />
            <span>{i === 0 ? "COVER PHOTO" : "STUDIO STILL " + i}</span>
            <button
              type="button"
              aria-label={"Remove image " + (i + 1)}
              onClick={() => setImages((a) => a.filter((_, n) => n !== i))}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
  const utilities = (
    <section className="form-module panel">
      <ModuleTitle
        index={id ? "03" : "05"}
        code="POWER-GRID"
        title={
          id
            ? "Production Spec Matrix & Utilities"
            : "Technical Amenities & Electrical Distribution"
        }
      />
      <div className="two">
        <label>
          Power supply
          <input
            name="powerSupply"
            defaultValue={sp.powerSupply}
            maxLength={150}
            placeholder="Power rating, outlets and distribution"
          />
        </label>
        <label>
          Acoustics / sound isolation
          <input
            name="soundproofRating"
            defaultValue={sp.soundproofRating}
            maxLength={150}
            placeholder="Host-supplied rating or description"
          />
        </label>
      </div>
      <div className="amenity-picker">
        {[
          "High-speed Wi-Fi",
          "Lighting kit",
          "Climate control",
          "Equipment storage",
          "Changing room",
          "Ground-floor access",
          "Green room",
          "Freight lift",
          "Parking",
          "Restroom",
        ].map((a) => (
          <label className="check-label" key={a}>
            <input
              type="checkbox"
              checked={amenities
                .split(",")
                .map((s) => s.trim())
                .includes(a)}
              onChange={() => toggleAmenity(a)}
            />
            {a}
          </label>
        ))}
      </div>
      <label>
        Additional amenities (comma separated)
        <input
          name="amenities"
          value={amenities}
          onChange={(e) => setAmenities(e.target.value)}
          placeholder="Add your specific equipment and facilities"
        />
      </label>
      <label>
        Production policies & stage rules (one per line)
        <textarea
          name="rules"
          rows={4}
          maxLength={6000}
          defaultValue={s?.rules?.join("\n")}
          placeholder="Noise and working hours&#10;Equipment and clean-up conditions&#10;Specialist activities requiring prior agreement"
        />
      </label>
    </section>
  );
  const host = (
    <section className="form-module panel host-dossier">
      <ModuleTitle
        index="06"
        code="ACCOUNT IDENTITY"
        title={id ? "Host Credential Vault" : "Host & Guarantor Dossier"}
      />
      <div className={id ? "" : "two"}>
        <label>
          Host name
          <input value={user?.name || ""} readOnly />
        </label>
        <label>
          Host email
          <input value={user?.email || ""} readOnly />
        </label>
      </div>
      <p className="small muted">
        <ShieldCheck size={15} />
        Host identity is derived from your signed-in account and cannot be
        overridden in this form. Insurance and permit verification are not
        provided by StudioSpace.
      </p>
      <Link href="/profile-settings" className="text-link">
        Manage profile identity
        <ArrowRight size={14} />
      </Link>
    </section>
  );
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            CREATOR WORKSPACE /{" "}
            {id ? "INVENTORY / EDIT STAGE" : "STAGE ONBOARDING / SPECS"}
          </div>
          <h1>
            {id ? "Update Studio Specifications" : "Onboard New Creative Space"}
          </h1>
          <p>
            {id
              ? "Modify technical power drops, acoustics, hourly rates, and operational logistics for " +
                s?.title +
                "."
              : "Register your soundstage, daylight loft, audio suite, or production workshop in the StudioSpace network."}
          </p>
        </div>
        <div className="button-row">
          {!id && (
            <Button
              variant="outline"
              onClick={() => {
                const form = document.getElementById(
                  "studio-editor",
                ) as HTMLFormElement;
                setPreviewTitle(
                  (form.elements.namedItem("title") as HTMLInputElement).value,
                );
                setPreview(true);
              }}
            >
              Preview Listing
            </Button>
          )}
          <Link href="/my-listings" className="button outline">
            Discard Changes
          </Link>
          <Button form="studio-editor" disabled={busy || uploading}>
            {busy ? "Saving…" : id ? "Save Changes" : "Publish Studio"}
          </Button>
        </div>
      </div>
      <form
        id="studio-editor"
        className={
          "studio-form reference-studio-form " + (id ? "edit-studio-form" : "")
        }
        onSubmit={submit}
        key={s?._id || "new"}
      >
        {id ? (
          <>
            <div className="edit-main">
              {identity}
              {media}
              {utilities}
              {logistics}
            </div>
            <aside className="edit-aside">
              {pricing}
              {host}
              <section className="panel decommission">
                <h3>Decommission or Pause Listing</h3>
                <p>
                  Paused spaces are hidden from search and stop accepting new
                  booking requests. Booking history is preserved.
                </p>
                <Button
                  name="listingStatus"
                  value={s?.status === "paused" ? "active" : "paused"}
                  variant="outline"
                  disabled={busy}
                >
                  {s?.status === "paused" ? "Resume Listing" : "Pause Listing"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDelete(true)}
                >
                  Delete Studio…
                </Button>
              </section>
            </aside>
          </>
        ) : (
          <>
            {identity}
            {pricing}
            {logistics}
            {media}
            {utilities}
            {host}
          </>
        )}
        <div className="save-bar">
          <span>
            <Clock size={15} />
            {id
              ? "Changes are published only when you save."
              : draftSaved ||
                "Complete your production details before publishing."}
          </span>
          <div className="button-row">
            <Link href="/my-listings" className="button outline">
              Discard Changes
            </Link>
            {!id && (
              <Button type="button" variant="outline" onClick={saveDraft}>
                Save Draft
              </Button>
            )}
            <Button disabled={busy || uploading}>
              {busy ? "Saving…" : id ? "Save Changes" : "Publish Studio"}
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </form>
      <Modal
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete this studio?"
      >
        <p>
          Studios with booking history cannot be deleted. Pausing preserves all
          records and removes the studio from search.
        </p>
        <Button onClick={remove} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete Studio"}
        </Button>
      </Modal>
      <Modal open={preview} onOpenChange={setPreview} title="Listing preview">
        <p>
          Your studio will appear in the marketplace’s card layout. Uploaded
          images, pricing, technical details and amenities are saved only when
          you publish.
        </p>
        {images[0] && (
          <img
            className="lightbox-main"
            src={images[0]}
            alt="New studio cover preview"
          />
        )}
        <p>
          <strong>{previewTitle || "Your new studio"}</strong>
        </p>
        <span className="badge">{category}</span>
      </Modal>
    </>
  );
}
function Listings() {
  const q = useQuery<Studio[]>({
    queryKey: ["listings"],
    queryFn: () => api("/studios/mine"),
  });
  const host = useQuery<Booking[]>({
    queryKey: ["bookings", true],
    queryFn: () => api("/bookings/host"),
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Studio | null>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const studios = q.data || [];
  const bookings = host.data || [];
  const filtered = studios
    .filter(
      (s) =>
        (s.title + " " + s.city + " " + s.address + " " + s.amenities.join(" "))
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!category || s.category === category) &&
        (!status || (s.status || "active") === status),
    )
    .sort((a, b) =>
      sort === "price-desc"
        ? b.hourlyRate - a.hourlyRate
        : sort === "rating"
          ? b.averageRating - a.averageRating
          : 0,
    );
  const visible = filtered.slice((page - 1) * 6, page * 6);
  const reviewed = studios.filter((s) => s.reviewCount > 0);
  const ratingCount = reviewed.reduce((v, s) => v + s.reviewCount, 0);
  const booked = bookings.filter((b) =>
    ["Confirmed", "Completed"].includes(b.status),
  );
  async function remove() {
    setBusy(true);
    try {
      await api("/studios/" + target!._id, "DELETE");
      await qc.invalidateQueries({ queryKey: ["listings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      setTarget(null);
      toast.success("Studio deleted");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            CREATOR WORKSPACE // INVENTORY MANAGEMENT
          </div>
          <h1>
            My Creative Spaces &<br />
            Soundstages
          </h1>
          <p>
            Manage your active studio listings, calendar availability, pricing
            tiers, and stage specifications.
          </p>
        </div>
        <div className="stack-actions">
          <Button
            variant="outline"
            onClick={() =>
              downloadCSV(
                "StudioSpace-listings.csv",
                [
                  "Studio",
                  "Category",
                  "City",
                  "Rate",
                  "Deposit",
                  "Capacity",
                  "Status",
                ],
                studios.map((s) => [
                  s.title,
                  s.category,
                  s.city,
                  s.hourlyRate,
                  s.securityDeposit,
                  s.maxCapacity,
                  s.status || "active",
                ]),
              )
            }
          >
            <Download size={16} />
            Export CSV
          </Button>
          <Link href="/add-studio" className="button primary">
            <Plus size={17} />
            Add New Studio
          </Link>
        </div>
      </div>
      <div className="stats reference-stats inventory-stats">
        <Metric
          label="TOTAL LISTED STAGES"
          value={String(studios.length)}
          detail={
            studios.filter((s) => s.status !== "paused").length +
            " Active Listings"
          }
          icon={Film}
        />
        <Metric
          label="STUDIO HOURS BOOKED"
          value={
            booked.reduce((v, b) => v + bookingHours(b), 0).toFixed(1) + " hrs"
          }
          detail="Confirmed & completed sessions"
          icon={Clock}
        />
        <Metric
          label="RESERVED BOOKING VALUE"
          value={money(booked.reduce((v, b) => v + b.totalPrice, 0))}
          detail="No payment collected"
          icon={Wallet}
        />
        <Metric
          label="AGGREGATE SCORE"
          value={
            ratingCount
              ? (
                  reviewed.reduce(
                    (v, s) => v + s.averageRating * s.reviewCount,
                    0,
                  ) / ratingCount
                ).toFixed(2)
              : "—"
          }
          detail={ratingCount + " reviews"}
          icon={Star}
        />
      </div>
      <div className="inventory-toolbar panel">
        <label className="search-field">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by stage name, equipment, or address…"
            aria-label="Search my listings"
          />
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Listing category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Listing status"
        >
          <option value="">All Statuses</option>
          <option value="active">Live & Bookable</option>
          <option value="paused">Paused</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort my listings"
        >
          <option value="newest">Newest Listed</option>
          <option value="price-desc">Highest Hourly Rate</option>
          <option value="rating">Highest Rated</option>
        </select>
        <div className="segmented">
          <button
            className={view === "list" ? "active" : ""}
            aria-label="Inventory list view"
            onClick={() => setView("list")}
          >
            <Menu size={18} />
          </button>
          <button
            className={view === "grid" ? "active" : ""}
            aria-label="Inventory grid view"
            onClick={() => setView("grid")}
          >
            <LayoutDashboard size={18} />
          </button>
        </div>
      </div>
      <State
        loading={q.isPending}
        error={q.error}
        empty={q.data?.length === 0}
      />
      {view === "grid" ? (
        <div className="studio-grid">
          {visible.map((s) => (
            <div key={s._id}>
              <Card studio={s} />
              <div className="button-row inventory-grid-actions">
                <Link
                  href={"/studios/edit/" + s._id}
                  className="button outline"
                >
                  Edit
                </Link>
                <Button variant="ghost" onClick={() => setTarget(s)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="inventory-table panel">
          <div className="inventory-head">
            <span>STAGE & COVER</span>
            <span>CATEGORY & POWER</span>
            <span>LOCATION</span>
            <span>RATES & DEPOSIT</span>
            <span>PERFORMANCE</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {visible.map((s) => (
            <article className="listing-row inventory-row" key={s._id}>
              <div className="inventory-identity">
                <img src={s.images[0]} alt={s.title} />
                <div>
                  <Link href={"/studios/" + s._id}>
                    <h3>{s.title}</h3>
                  </Link>
                  <small className="accent">
                    STAGE {s._id.slice(-6).toUpperCase()} ·{" "}
                    {s.specs?.usableArea
                      ? s.specs.usableArea + " sq ft"
                      : s.maxCapacity + " pax"}
                  </small>
                </div>
              </div>
              <div>
                <span className="spec-chip">
                  {s.category}
                  <small>{s.specs?.powerSupply || "Power: not provided"}</small>
                </span>
              </div>
              <div className="inventory-location">
                <MapPin size={16} />
                {s.city}, {s.country}
              </div>
              <div>
                <strong>
                  {money(s.hourlyRate)}
                  <small>/hr</small>
                </strong>
                <p>Deposit: {money(s.securityDeposit)}</p>
              </div>
              <div>
                <span className="inline">
                  <Star size={14} className="accent" />
                  {s.reviewCount
                    ? s.averageRating.toFixed(2) + " (" + s.reviewCount + ")"
                    : "No reviews"}
                </span>
                <small className="positive">
                  {
                    bookings.filter(
                      (b) =>
                        b.studioId?._id === s._id && b.status !== "Cancelled",
                    ).length
                  }{" "}
                  reservations
                </small>
              </div>
              <div>
                <span
                  className={
                    "badge " +
                    (s.status === "paused"
                      ? "status-Pending"
                      : "status-Confirmed")
                  }
                >
                  ● {s.status === "paused" ? "PAUSED" : "LIVE & BOOKABLE"}
                </span>
              </div>
              <div className="inventory-actions">
                <Link
                  href={"/studios/" + s._id}
                  className="icon"
                  aria-label={"View " + s.title}
                >
                  <Eye size={16} />
                </Link>
                <Link
                  href={"/studios/edit/" + s._id}
                  className="button outline"
                >
                  Edit
                </Link>
                <Button variant="ghost" onClick={() => setTarget(s)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="pagination reference-pagination">
        <span>
          Showing {filtered.length ? (page - 1) * 6 + 1 : 0}–
          {Math.min(page * 6, filtered.length)} of {filtered.length} Stages
          Listed
        </span>
        <div>
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <button className="active">{page}</button>
          <Button
            variant="outline"
            disabled={page * 6 >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <Modal
        open={!!target}
        onOpenChange={(v) => !v && setTarget(null)}
        title="Delete this studio?"
      >
        <p>
          {target?.title} will be permanently removed. Studios with booking
          history are protected from deletion.
        </p>
        <div className="button-row">
          <Button disabled={busy} onClick={remove}>
            {busy ? "Deleting…" : "Delete Studio"}
          </Button>
          <Button variant="outline" onClick={() => setTarget(null)}>
            Keep Studio
          </Button>
        </div>
      </Modal>
    </>
  );
}
function Bookings({ host = false }: { host?: boolean }) {
  const q = useQuery<Booking[]>({
    queryKey: ["bookings", host],
    queryFn: () => api("/bookings/" + (host ? "host" : "mine")),
  });
  const qc = useQueryClient();
  const [action, setAction] = useState<{ id: string; status: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const all = q.data || [];
  const booked = all.filter((b) =>
    ["Confirmed", "Completed"].includes(b.status),
  );
  const visible = all.filter(
    (b) =>
      (tab === "All" || b.status === tab) &&
      (!month || b.startTime.startsWith(month)) &&
      (!category || b.studioId?.category === category) &&
      ((b.studioId?.title || "") + " " + b.userEmail)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function update() {
    setBusy(true);
    try {
      await api(
        "/bookings/" + action!.id + (host ? "/status" : "/cancel"),
        "PATCH",
        host ? { status: action!.status } : {},
      );
      await qc.invalidateQueries({ queryKey: ["bookings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      setAction(null);
      toast.success("Booking updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            CREATOR WORKSPACE / RESERVATIONS & CALL SHEETS
          </div>
          <h1>
            {host
              ? "Booking Requests & Stage Holds"
              : "My Reservations & Stage Holds"}
          </h1>
          <p>
            {host
              ? "Review production requests, confirm studio availability, and manage your stage calendar."
              : "Track confirmed bookings, upcoming shoot call times, stage holds, and historical booking summaries."}
          </p>
        </div>
        <div className="stack-actions">
          <a className="button outline" href="/api/bookings/summary.pdf">
            <FileText size={17} />
            Download All Booking Summaries (PDF)
          </a>
          <Button onClick={() => downloadCalendar(all)}>
            <CalendarDays size={17} />
            Export Production Calendar
          </Button>
        </div>
      </div>
      <div className="stats reference-stats reservation-stats">
        <Metric
          label="CONFIRMED SHOOTS"
          value={
            String(all.filter((b) => b.status === "Confirmed").length) +
            " Active"
          }
          detail="Host-confirmed reservations"
          icon={ShieldCheck}
        />
        <Metric
          label="PENDING STAGE HOLDS"
          value={String(all.filter((b) => b.status === "Pending").length)}
          detail="Awaiting host review"
          icon={Clock}
          accent
        />
        <Metric
          label="RESERVED PRODUCTION VALUE"
          value={money(booked.reduce((v, b) => v + b.totalPrice, 0))}
          detail="Includes deposits · no payment collected"
          icon={Wallet}
        />
        <Metric
          label="STUDIO HOURS BOOKED"
          value={
            booked.reduce((v, b) => v + bookingHours(b), 0).toFixed(1) + " Hrs"
          }
          detail={
            "Across " +
            new Set(booked.map((b) => b.studioId?._id)).size +
            " studio spaces"
          }
          icon={Timer}
        />
      </div>
      <StatusTabs items={all} value={tab} onChange={setTab} />
      <div className="reservation-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            placeholder="Search by studio name or production creator…"
            aria-label="Search bookings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="month-filter">
          <CalendarDays size={17} />
          <input
            type="month"
            aria-label="Production month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          {month && (
            <button
              aria-label="Clear month filter"
              onClick={() => setMonth("")}
            >
              <X size={13} />
            </button>
          )}
        </label>
        <select
          aria-label="Booking production category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Production Units</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <State
        loading={q.isPending}
        error={q.error}
        empty={!q.isPending && !q.error && visible.length === 0}
      />
      <div className="booking-list reference-booking-list">
        {visible.map((b) => (
          <article
            className="booking-row panel production-reservation"
            data-booking-id={b._id}
            key={b._id}
          >
            <img
              src={b.studioId?.images[0]}
              alt={b.studioId?.title || "Studio"}
            />
            <div className="reservation-identity">
              <div className="eyebrow">
                {b.studioId?.city} · {b.studioId?.category}
              </div>
              <Link href={"/studios/" + b.studioId?._id}>
                <h3>{b.studioId?.title || "Unavailable studio"}</h3>
              </Link>
              <p>{host ? b.userEmail : "Hosted by " + b.studioId?.ownerName}</p>
              <small>REF / {b._id.slice(-8).toUpperCase()}</small>
            </div>
            <div className="reservation-time">
              <strong>
                <CalendarDays size={16} />
                {new Date(b.startTime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
              <p>
                {timeRange(b)} ({bookingHours(b)} hrs call time)
              </p>
              <small
                className={b.status === "Cancelled" ? "muted" : "positive"}
              >
                {b.status === "Pending"
                  ? "Awaiting host confirmation"
                  : b.status === "Confirmed"
                    ? "Session confirmed"
                    : b.status === "Completed"
                      ? "Session wrapped"
                      : "Reservation cancelled"}
              </small>
            </div>
            <div className="reservation-value">
              <strong>
                {money(b.totalPrice)}
                <small> TOTAL</small>
              </strong>
              <p>
                {money(b.hourlyRateSnapshot || b.studioId?.hourlyRate || 0)}/hr
                + {money(b.securityDeposit ?? b.studioId?.securityDeposit ?? 0)}{" "}
                deposit
              </p>
              <span className={"badge status-" + b.status}>● {b.status}</span>
            </div>
            <div className="booking-actions">
              {b.status === "Pending" &&
                (host ? (
                  <>
                    <Button
                      onClick={() =>
                        setAction({ id: b._id, status: "Confirmed" })
                      }
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setAction({ id: b._id, status: "Cancelled" })
                      }
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setAction({ id: b._id, status: "Cancelled" })
                    }
                  >
                    <X size={14} />
                    Cancel request
                  </Button>
                ))}
              {host &&
                b.status === "Confirmed" &&
                new Date(b.endTime) < new Date() && (
                  <Button
                    onClick={() =>
                      setAction({ id: b._id, status: "Completed" })
                    }
                  >
                    Mark completed
                  </Button>
                )}
              {["Confirmed", "Completed"].includes(b.status) && (
                <a
                  className="button outline"
                  href={"/api/bookings/" + b._id + "/invoice"}
                >
                  <FileText size={15} />
                  Booking Summary
                </a>
              )}
              {b.status === "Completed" && (
                <Link
                  className="button outline"
                  href={"/studios/" + b.studioId?._id + "#reviews"}
                >
                  <Star size={14} />
                  Leave Review
                </Link>
              )}
              <Link
                className="button outline"
                href={"/studios/" + b.studioId?._id}
              >
                Studio Details
              </Link>
            </div>
          </article>
        ))}
      </div>
      <Modal
        open={!!action}
        onOpenChange={(v) => !v && setAction(null)}
        title={
          action?.status === "Confirmed"
            ? "Confirm this reservation?"
            : action?.status === "Completed"
              ? "Mark this session completed?"
              : "Cancel this request?"
        }
      >
        <p>
          The updated status is saved to the database. Confirmations recheck
          availability.
        </p>
        <div className="button-row">
          <Button onClick={update} disabled={busy}>
            {busy ? "Updating…" : "Confirm Change"}
          </Button>
          <Button variant="outline" onClick={() => setAction(null)}>
            Go Back
          </Button>
        </div>
      </Modal>
    </>
  );
}
function Dashboard() {
  const { data: user } = useUser();
  const stats = useQuery<{
    listings: number;
    totalBookings: number;
    upcoming: number;
    pending: number;
    recent: Booking[];
  }>({ queryKey: ["dashboard"], queryFn: () => api("/dashboard") });
  const mine = useQuery<Booking[]>({
    queryKey: ["bookings", false],
    queryFn: () => api("/bookings/mine"),
  });
  const hosted = useQuery<Booking[]>({
    queryKey: ["bookings", true],
    queryFn: () => api("/bookings/host"),
  });
  const [period, setPeriod] = useState(7);
  const [tab, setTab] = useState("All");
  const [busy, setBusy] = useState("");
  const qc = useQueryClient();
  const all = Array.from(
    new Map(
      [...(mine.data || []), ...(hosted.data || [])].map((b) => [b._id, b]),
    ).values(),
  ).sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));
  const pending = (hosted.data || []).filter((b) => b.status === "Pending");
  const confirmed = all.filter((b) =>
    ["Confirmed", "Completed"].includes(b.status),
  );
  const value = confirmed.reduce((v, b) => v + b.totalPrice, 0);
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - Math.round(((6 - i) * period) / 7));
    const start = new Date(end);
    start.setDate(start.getDate() - Math.max(1, Math.round(period / 7)));
    return {
      label: end.toLocaleDateString(undefined, {
        month: period > 7 ? "short" : undefined,
        day: period > 7 ? "numeric" : undefined,
        weekday: period === 7 ? "short" : undefined,
      }),
      hours: confirmed
        .filter(
          (b) => new Date(b.startTime) > start && new Date(b.startTime) <= end,
        )
        .reduce(
          (v, b) =>
            v +
            (b.totalHours ||
              (+new Date(b.endTime) - +new Date(b.startTime)) / 3600000),
          0,
        ),
    };
  });
  const max = Math.max(1, ...buckets.map((b) => b.hours));
  async function status(b: Booking, next: string) {
    setBusy(b._id);
    try {
      await api("/bookings/" + b._id + "/status", "PATCH", { status: next });
      await qc.invalidateQueries({ queryKey: ["bookings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Booking updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <section className="workspace-welcome">
        <div>
          <span className="eyebrow pill">
            <span className="tiny-dot" />
            CREATOR WORKSPACE · PRODUCTION OVERVIEW
          </span>
          <h1>
            Welcome back,{" "}
            <span className="accent">{user?.name.split(" ")[0]}.</span>
          </h1>
          <p>
            Here is your production schedule, active stage holds, and
            <br className="desktop-break" /> booking summary for{" "}
            {new Date().toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>
        <div>
          <div className="button-row">
            <Link href="/studios" className="button outline">
              <Film size={16} />
              Explore Stages
            </Link>
            <a href="/api/bookings/summary.pdf" className="button outline">
              <FileText size={16} />
              Export Booking Summary
            </a>
          </div>
          <Link href="/add-studio" className="button primary">
            <Plus size={17} />
            New Studio Listing
          </Link>
        </div>
      </section>
      <State loading={stats.isPending} error={stats.error} />
      <div className="stats reference-stats">
        <Metric
          label="SOUNDSTAGES"
          value={String(stats.data?.listings ?? 0) + " Stages"}
          detail="Total Studios Listed"
          icon={Film}
          footer="Your owned studio inventory"
        />
        <Metric
          label="BOOKINGS RUN"
          value={String(stats.data?.totalBookings ?? 0) + " Sessions"}
          detail="Total Productions Requested"
          icon={CalendarDays}
          footer={
            String(stats.data?.upcoming ?? 0) + " upcoming confirmed sessions"
          }
        />
        <Metric
          label="HOLD QUEUE"
          value={String(pending.length) + " Requests"}
          detail="Pending Stage Holds"
          icon={Clock}
          footer="Host review required"
          accent
        />
        <Metric
          label="RESERVED VALUE"
          value={money(value)}
          detail="Confirmed & Completed Booking Value"
          icon={Wallet}
          footer="Includes deposits · no payments collected"
        />
      </div>
      <div className="analytics-layout">
        <section className="panel analytics-panel">
          <div className="section-heading">
            <div>
              <h2>Booking & Shoot Hours Analytics</h2>
              <p>Confirmed and completed studio hours</p>
            </div>
            <div className="segmented">
              {[7, 30, 90, 365].map((n) => (
                <button
                  className={period === n ? "active" : ""}
                  onClick={() => setPeriod(n)}
                  key={n}
                >
                  {n === 365 ? "1Y" : n + "D"}
                </button>
              ))}
            </div>
          </div>
          <div className="hours-chart">
            <svg
              viewBox="0 0 560 220"
              role="img"
              aria-label={
                "Booked studio hours over the last " + period + " days"
              }
            >
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="15"
                  x2="545"
                  y1={30 + i * 52}
                  y2={30 + i * 52}
                  stroke="var(--line)"
                  strokeDasharray="3 5"
                />
              ))}
              {buckets.map((b, i) => (
                <rect
                  key={i}
                  x={27 + i * 78}
                  y={190 - (b.hours / max) * 145}
                  width="18"
                  height={(b.hours / max) * 145}
                  rx="4"
                  fill={i === 5 ? "#ff7043" : "#ff704355"}
                />
              ))}
              <polyline
                points={buckets
                  .map(
                    (b, i) => 36 + i * 78 + "," + (190 - (b.hours / max) * 145),
                  )
                  .join(" ")}
                fill="none"
                stroke="#ff7043"
                strokeWidth="3"
              />
            </svg>
            <div className="chart-labels">
              {buckets.map((b, i) => (
                <span key={i}>
                  {b.label}
                  <small>{b.hours.toFixed(1)}h</small>
                </span>
              ))}
            </div>
            {!confirmed.length && (
              <p className="chart-empty">
                Confirmed sessions will populate this chart.
              </p>
            )}
          </div>
          <div className="analytics-footer">
            <div>
              <small>BOOKED HOURS</small>
              <strong>
                {confirmed
                  .reduce((v, b) => v + (b.totalHours || 0), 0)
                  .toFixed(1)}{" "}
                hrs
              </strong>
            </div>
            <div>
              <small>AVG HOURLY RATE</small>
              <strong>
                {confirmed.length
                  ? money(
                      confirmed.reduce(
                        (v, b) =>
                          v +
                          (b.hourlyRateSnapshot || b.studioId?.hourlyRate || 0),
                        0,
                      ) / confirmed.length,
                    )
                  : "—"}
              </strong>
            </div>
            <div>
              <small>UPCOMING BOOKINGS</small>
              <strong className="positive">
                {stats.data?.upcoming ?? 0} sessions
              </strong>
            </div>
          </div>
        </section>
        <section className="panel stage-activity">
          <h2>Stage Activity & Alerts</h2>
          <p>Booking requests and production dispatch</p>
          <State loading={hosted.isPending} error={hosted.error} />
          {pending.length ? (
            pending.slice(0, 3).map((b) => (
              <article key={b._id}>
                <span className="activity-symbol">
                  <Film size={18} />
                </span>
                <div>
                  <strong>Stage Hold Request</strong>
                  <p>
                    {b.userEmail} requested {b.studioId?.title} for{" "}
                    {new Date(b.startTime).toLocaleDateString()}.
                  </p>
                  <div className="button-row">
                    <Button
                      disabled={busy === b._id}
                      onClick={() => status(b, "Confirmed")}
                    >
                      Accept Hold
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy === b._id}
                      onClick={() => status(b, "Cancelled")}
                    >
                      Decline
                    </Button>
                    <Link href={"/studios/" + b.studioId?._id}>
                      Inspect Space
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article>
              <span className="activity-symbol positive">
                <Check size={20} />
              </span>
              <div>
                <strong>Your hold queue is clear</strong>
                <p>New requests for your studios will appear here.</p>
                <Link className="text-link" href="/host-bookings">
                  Review booking requests
                  <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          )}
          <div className="activity-note">
            <ShieldCheck size={17} />
            Only host-confirmed reservations lock a studio’s schedule.
          </div>
        </section>
      </div>
      <section className="panel dashboard-bookings">
        <div className="section-heading">
          <div>
            <h2>Active & Upcoming Production Bookings</h2>
            <p>Studio reservations, call times, and confirmed stage holds</p>
          </div>
          <StatusTabs items={all} value={tab} onChange={setTab} compact />
        </div>
        <div className="booking-table">
          <div className="booking-table-head">
            <span>STUDIO & STAGE</span>
            <span>PRODUCTION / CREATOR</span>
            <span>DATE & CALL TIME</span>
            <span>DURATION</span>
            <span>TOTAL VALUE</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {all
            .filter((b) => tab === "All" || b.status === tab)
            .slice(0, 6)
            .map((b) => (
              <div className="booking-table-row" key={b._id}>
                <div>
                  <img src={b.studioId?.images[0]} alt={b.studioId?.title} />
                  <strong>{b.studioId?.title}</strong>
                </div>
                <span>
                  {b.userEmail}
                  <small>{b.studioId?.category}</small>
                </span>
                <span>
                  {new Date(b.startTime).toLocaleDateString()}
                  <small className="accent">{timeRange(b)}</small>
                </span>
                <span>
                  {bookingHours(b)} hrs<small>Host confirmed schedule</small>
                </span>
                <span>
                  <strong>{money(b.totalPrice)}</strong>
                  <small>No payment collected</small>
                </span>
                <span className={"badge status-" + b.status}>{b.status}</span>
                {["Confirmed", "Completed"].includes(b.status) ? (
                  <a
                    className="icon"
                    href={"/api/bookings/" + b._id + "/invoice"}
                    aria-label="Download booking summary"
                  >
                    <FileText size={16} />
                  </a>
                ) : (
                  <Link
                    href={
                      pending.some((p) => p._id === b._id)
                        ? "/host-bookings"
                        : "/my-bookings"
                    }
                    className="button outline"
                  >
                    Review
                  </Link>
                )}
              </div>
            ))}
        </div>
        {!all.length && <State empty />}
        <div className="table-footer">
          <span>
            Showing {Math.min(all.length, 6)} of {all.length} studio bookings
          </span>
          <a href="/api/bookings/summary.pdf">
            DOWNLOAD BOOKING SUMMARY PDF
            <Download size={13} />
          </a>
        </div>
      </section>
    </>
  );
}
function Profile() {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const stats = useQuery<{
    listings: number;
    totalBookings: number;
    upcoming: number;
    pending: number;
  }>({ queryKey: ["dashboard"], queryFn: () => api("/dashboard") });
  const [tab, setTab] = useState("Personal Info & Bio");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(0);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(
        "/users/me",
        "PATCH",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      await qc.invalidateQueries({ queryKey: ["me"] });
      setDirty(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">IDENTITY // CREATOR WORKSPACE</div>
          <h1>Profile & Production Identity</h1>
          <p>
            Manage your public creative persona, contact details, and studio
            booking preferences.
          </p>
        </div>
        <span className="badge status-Confirmed">● ACCOUNT PROFILE</span>
      </div>
      <section className="profile-cover panel">
        <div
          className="profile-cover-image"
          style={{
            backgroundImage:
              "linear-gradient(0deg,var(--surface),#13131320),url(/images/hero-soundstage.png)",
          }}
        />
        <div className="profile-cover-content">
          <div className="large-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name} />
            ) : (
              user?.name.slice(0, 1)
            )}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <span className="badge status-Confirmed">
              Registered StudioSpace Member
            </span>
            <p>{user?.professionalTitle || "Creator & Studio Host"}</p>
            <small>
              {user?.createdAt
                ? "Member since " +
                  new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })
                : "Account-based production identity"}
            </small>
          </div>
          <div className="profile-shortcuts">
            <Link href="/my-listings" className="button outline">
              <Film size={15} />
              Stages <strong>{stats.data?.listings ?? 0}</strong>
            </Link>
            <Link href="/my-bookings" className="button outline">
              <CalendarDays size={15} />
              Bookings <strong>{stats.data?.totalBookings ?? 0}</strong>
            </Link>
          </div>
        </div>
        <div className="profile-metric-strip">
          <div>
            <small>STUDIOS LISTED</small>
            <strong>{stats.data?.listings ?? 0}</strong>
          </div>
          <div>
            <small>PRODUCTION BOOKINGS</small>
            <strong>{stats.data?.totalBookings ?? 0}</strong>
          </div>
          <div>
            <small>UPCOMING SESSIONS</small>
            <strong>{stats.data?.upcoming ?? 0}</strong>
          </div>
          <div>
            <small>INSURANCE STATUS</small>
            <strong>Not verified</strong>
          </div>
        </div>
      </section>
      <div className="profile-tabs segmented">
        {[
          "Personal Info & Bio",
          "Production Credentials",
          "Booking Preferences",
          "Security & Password",
        ].map((t, i) => {
          const Icon = [Users, ShieldCheck, CalendarDays, LockKeyhole][i];
          return (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              <Icon size={16} />
              {t}
            </button>
          );
        })}
      </div>
      <form
        className="reference-profile-form"
        noValidate
        key={user?._id + "-" + version}
        onSubmit={submit}
        onChange={() => setDirty(true)}
      >
        <section
          className="form-module panel"
          hidden={tab !== "Personal Info & Bio"}
        >
          <ModuleTitle
            index="01"
            code="PUBLIC DOSSIER"
            title="Public Creative Bio"
          />
          <p>
            Visible identity and production details for your studio community.
          </p>
          <div className="profile-fields three">
            <label>
              Full name
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={user?.name}
              />
            </label>
            <label>
              Industry display title
              <input
                name="professionalTitle"
                defaultValue={user?.professionalTitle}
                maxLength={100}
                placeholder="Producer / photographer / studio host"
              />
            </label>
            <label>
              Profile photo URL
              <input
                name="photoURL"
                type="url"
                defaultValue={user?.photoURL || ""}
              />
            </label>
            <label>
              Production inquiries email
              <input readOnly value={user?.email || ""} />
            </label>
            <label>
              Direct dispatch line
              <input
                name="phone"
                defaultValue={user?.phone}
                maxLength={40}
                placeholder="Phone (optional)"
              />
            </label>
            <label>
              Studio / production house URL
              <input
                name="website"
                type="url"
                defaultValue={user?.website}
                placeholder="https://your-studio.com"
              />
            </label>
          </div>
          <label>
            Official portfolio reel
            <input
              name="portfolio"
              type="url"
              defaultValue={user?.portfolio}
              placeholder="https://your-portfolio.com"
            />
          </label>
          <label>
            Director & host statement
            <textarea
              name="bio"
              maxLength={1200}
              rows={5}
              defaultValue={user?.bio}
              placeholder="Tell creators about your work, production approach, and studio experience."
            />
          </label>
          <small className="muted">
            Your email address cannot be changed in this edition.
          </small>
        </section>
        <section
          className="form-module panel"
          hidden={
            tab !== "Personal Info & Bio" && tab !== "Production Credentials"
          }
        >
          <ModuleTitle
            index="02"
            code="RESPONSIBILITY & SAFETY"
            title="Production Insurance & Verification"
          />
          <p>
            Review your own coverage and permit requirements before arranging a
            studio session.
          </p>
          <div className="insurance-disclosure">
            <div>
              <span className="eyebrow">PLATFORM STATUS</span>
              <h3>Insurance verification is not enabled.</h3>
              <p>
                StudioSpace does not supply insurance, verify policy documents,
                or certify union credentials. Hosts and creators should agree on
                coverage and production safety directly.
              </p>
            </div>
            <div>
              <p>
                <ShieldCheck size={16} />
                Equipment conditions: Confirm with host
              </p>
              <p>
                <Film size={16} />
                Specialist permits: Arrange independently
              </p>
              <p>
                <Users size={16} />
                Crew safety: Shared responsibility
              </p>
              <Link href="/terms" className="text-link">
                Read studio use information
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
        <section
          className="form-module panel"
          hidden={
            tab !== "Personal Info & Bio" && tab !== "Booking Preferences"
          }
        >
          <ModuleTitle
            index="03"
            code="DISPATCH DETAILS"
            title="Account Shortcuts & Production Preferences"
          />
          <p>
            Save your planning preferences. These do not reserve time or modify
            studio rates.
          </p>
          <div className="three">
            <label>
              Default production call block
              <select
                name="bookingPreference"
                defaultValue={user?.bookingPreference || "Hourly session"}
              >
                {[
                  "Hourly session",
                  "Half-day production",
                  "Full-day production",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <small>
                Planning preference; each booking requires selected hours.
              </small>
            </label>
            <label>
              Crew capacity preference
              <select
                name="crewPreference"
                defaultValue={user?.crewPreference || "1–5 people"}
              >
                {[
                  "1–5 people",
                  "6–10 people",
                  "11–25 people",
                  "26+ people",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="field-label">PAYMENT SERVICES</span>
              <p>No settlement card is stored and no payment is collected.</p>
              <Link href="/my-bookings" className="text-link">
                View your booking records
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
        {tab === "Security & Password" && (
          <section className="form-module panel">
            <ModuleTitle
              index="04"
              code="ACCOUNT SECURITY"
              title="Security & Password"
            />
            <p>
              Your session uses an HTTPOnly authentication cookie. Password
              changes and recovery are not available in this edition. Google
              accounts sign in through Google’s authorization flow.
            </p>
            <Link href="/privacy" className="button outline">
              Read Privacy Information
            </Link>
          </section>
        )}
        <div className="save-bar">
          <span>
            <Clock size={15} />
            {dirty
              ? "Unsaved profile adjustments"
              : "Your profile details are up to date."}
          </span>
          <div className="button-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setVersion((v) => v + 1);
                setDirty(false);
              }}
            >
              Discard Changes
            </Button>
            <Button disabled={busy}>
              {busy ? "Saving…" : "Save Profile Changes"}
              <Check size={15} />
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
function WishlistPage() {
  const q = useQuery<{ studioId: Studio }[]>({
    queryKey: ["wishlist"],
    queryFn: () => api("/wishlist"),
  });
  return (
    <>
      <div className="eyebrow">KEEP THE INSPIRATION CLOSE</div>
      <h1>Saved spaces.</h1>
      <p className="lead">A shortlist of places for your next big idea.</p>
      <State
        loading={q.isPending}
        error={q.error}
        empty={q.data?.length === 0}
      />
      <div className="studio-grid">
        {q.data
          ?.filter((w) => w.studioId)
          .map((w) => (
            <Card key={w.studioId._id} studio={w.studioId} />
          ))}
      </div>
    </>
  );
}
function About() {
  const network = useQuery<{
    total: number;
    cities: { city: string; country: string; count: number }[];
    categories: string[];
  }>({ queryKey: ["network"], queryFn: () => api("/studios/network") });
  return (
    <div className="reference-about">
      <div className="container">
        <section className="about-introduction">
          <div>
            <div className="eyebrow pill">
              <span className="tiny-dot" />
              APERTURE INFRASTRUCTURE FOR CREATIVE WORK
            </div>
            <span className="eyebrow">MISSION & PRODUCTION</span>
            <h1>
              Making Creative Spaces
              <br />
              Accessible to Everyone.
            </h1>
          </div>
          <p>
            Built around the needs of filmmakers, photographers, musicians and
            artists. StudioSpace bridges the gap between specialist spaces and
            independent creators.
          </p>
        </section>
        <section className="about-stage">
          <img
            src="/images/reference-stage-main.png"
            alt="Cinematic production soundstage"
          />
          <span className="photo-caption">
            <Film size={13} />
            PRODUCTION SPACE / ROOM FOR YOUR NEXT IDEA
          </span>
          <div>
            <div>
              <small>PRODUCTION READINESS</small>
              <strong>Host-listed equipment</strong>
            </div>
            <div>
              <small>BOOKING RULES</small>
              <strong>Host confirmation required</strong>
            </div>
            <Link href="/studios" className="button primary">
              Explore All {network.data?.total ?? "…"} Spaces
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <div className="about-statistics">
          {[
            [
              "PRODUCTION SPACES",
              String(network.data?.total ?? "…"),
              "Studios in the current local collection",
            ],
            [
              "CREATIVE LOCATIONS",
              String(network.data?.cities.length ?? "…"),
              "Host-listed cities",
            ],
            [
              "CREATIVE DISCIPLINES",
              String(network.data?.categories.length ?? "…"),
              "Production categories represented",
            ],
            [
              "RESERVATION MODEL",
              "Host Reviewed",
              "No payment is collected by StudioSpace",
            ],
          ].map(([label, value, detail]) => (
            <div className="panel" key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
        <section className="section legacy-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CRAFTED BY CREATIVE NEEDS</span>
              <h2>
                The Friction of Legacy
                <br />
                Production
              </h2>
            </div>
            <p>
              Finding a space should give your project momentum,
              <br className="desktop-break" /> with clear details and a schedule
              you can trust.
            </p>
          </div>
          <div className="legacy-layout">
            <div>
              <img
                src="/images/studio-art.png"
                alt="Light-filled workshop and creative production space"
              />
              <div className="production-note">
                <span className="eyebrow">PRODUCTION NOTES</span>
                <p>
                  “The right room brings the practical details together: light,
                  acoustics, equipment, space, and the time to make something.”
                </p>
                <small>THE STUDIO SPACE APPROACH</small>
              </div>
            </div>
            <div>
              <article className="comparison-panel panel">
                <span className="eyebrow">THE FRAGMENTED MODEL</span>
                <div>
                  {[
                    [
                      "Scattered Listings",
                      "Technical details spread across messages and directories.",
                    ],
                    [
                      "Unclear Specifications",
                      "Equipment and access questions answered late.",
                    ],
                    [
                      "Disconnected Schedules",
                      "Separate calendars and uncertainty about availability.",
                    ],
                    [
                      "Missing Booking Records",
                      "Production details buried in old conversations.",
                    ],
                  ].map(([a, b]) => (
                    <section key={a}>
                      <h3>{a}</h3>
                      <p>{b}</p>
                    </section>
                  ))}
                </div>
              </article>
              <article className="comparison-panel panel good">
                <span className="eyebrow">THE STUDIOSPACE PLATFORM</span>
                <div>
                  {[
                    [
                      "One Studio Collection",
                      "Compare rates, locations, galleries and equipment.",
                    ],
                    [
                      "Structured Studio Details",
                      "Hosts publish their facilities and production conditions.",
                    ],
                    [
                      "Host-Confirmed Bookings",
                      "Confirmed sessions cannot overlap in the studio schedule.",
                    ],
                    [
                      "Workspace Records",
                      "Track reservations, statuses and booking summaries.",
                    ],
                  ].map(([a, b]) => (
                    <section key={a}>
                      <h3>{a}</h3>
                      <p>{b}</p>
                    </section>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="section rigor-section">
          <span className="eyebrow">PRODUCTION PROTOCOLS</span>
          <h2>Engineered for Production Rigor</h2>
          <p>
            From independent films to commercial creative projects, keep the
            essentials in one workspace.
          </p>
          <div className="rigor-grid">
            {[
              [
                Users,
                "Registered Identity",
                "Listings belong to authenticated hosts. Booking requests link to a registered creator.",
                "ACCOUNT OWNERSHIP",
              ],
              [
                CalendarDays,
                "Clear Scheduling",
                "Hosts review time requests. Confirmed reservations are checked for conflicts.",
                "DATABASE-BACKED AVAILABILITY",
              ],
              [
                ShieldCheck,
                "Documented Details",
                "View prices and deposits before requesting hours. No online payment is taken.",
                "TRANSPARENT ESTIMATES",
              ],
              [
                MapPin,
                "Practical Load-In",
                "Hosts can document access, parking, equipment, capacity and stage rules.",
                "HOST-PROVIDED LOGISTICS",
              ],
            ].map(([Icon, title, text, label]) => {
              const I = Icon as typeof Film;
              return (
                <article className="panel" key={String(title)}>
                  <I size={25} />
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                  <small>{String(label)}</small>
                </article>
              );
            })}
          </div>
          <div className="pipeline-strip">
            <span className="tiny-dot" />
            <span>Creative studio collection</span>
            <span>
              {network.data?.total ?? "…"} spaces ·{" "}
              {network.data?.cities.length ?? "…"} host-listed locations
            </span>
          </div>
        </section>
        <section className="section network-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">REGIONAL INFRASTRUCTURE</span>
              <h2>{network.data?.cities.length ?? "…"} Creative Locations</h2>
            </div>
            <Link href="/studios" className="text-link">
              Browse studio locations
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="network-layout">
            <div className="network-map">
              <svg
                viewBox="0 0 720 390"
                role="img"
                aria-label="Illustrative world location diagram"
              >
                <defs>
                  <pattern
                    id="mapGrid"
                    width="30"
                    height="30"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth=".5"
                    />
                  </pattern>
                </defs>
                <rect width="720" height="390" fill="url(#mapGrid)" />
                <g fill="var(--raised)" stroke="var(--line)" strokeWidth="2">
                  <path d="m55 85 65-40 85 15 35 45-35 25-15 50-45 10-30-40-40-10Z" />
                  <path d="m165 205 50-10 35 45-20 60-30 50-20-60Z" />
                  <path d="m320 90 40-30 70 10 40-20 115 30 55 50-45 30-60-5-45 40-50-10-20-55-50-15-35 35-30-20Z" />
                  <path d="m340 170 70-15 35 60-35 80-35 10-30-60Z" />
                  <path d="m540 285 65-20 45 30-15 35-80 5Z" />
                </g>
                {network.data?.cities
                  .filter((c) =>
                    /brooklyn|dhaka|london|los angeles/i.test(c.city),
                  )
                  .map((c) => {
                    const [x, y] = /dhaka/i.test(c.city)
                      ? [523, 174]
                      : /brooklyn/i.test(c.city)
                        ? [195, 112]
                        : /london/i.test(c.city)
                          ? [355, 98]
                          : [118, 130];
                    return (
                      <g key={c.city}>
                        <circle cx={x} cy={y} r="14" fill="#ff704333" />
                        <circle cx={x} cy={y} r="5" fill="#ff7043" />
                        <text
                          x={x + 12}
                          y={y - 10}
                          fill="var(--text)"
                          fontSize="13"
                        >
                          {c.city}
                        </text>
                      </g>
                    );
                  })}
              </svg>
              <small>
                ILLUSTRATIVE LOCATION DIAGRAM · USE LISTING ADDRESSES FOR
                DIRECTIONS
              </small>
            </div>
            <div className="network-cities panel">
              {network.data?.cities.map((c) => (
                <Link
                  key={c.city + c.country}
                  href={"/studios?location=" + encodeURIComponent(c.city)}
                >
                  <span>{c.city.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <h3>{c.city}</h3>
                    <p>{c.country}</p>
                  </div>
                  <strong>{c.count} spaces</strong>
                  <ArrowRight size={14} />
                </Link>
              ))}
              <State loading={network.isPending} error={network.error} />
            </div>
          </div>
        </section>
        <section className="section" id="community">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR COMMUNITY</span>
              <h2>Filmmakers, Not Real Estate Suits</h2>
            </div>
            <p>
              Built around the people who create productions,
              <br className="desktop-break" /> record new ideas, and open their
              studio doors.
            </p>
          </div>
          <div className="community-grid">
            {[
              [
                "studio-film",
                "Filmmakers & Photographers",
                "A production needs room for crew, lighting, framing, and the detail that brings each shot to life.",
              ],
              [
                "studio-podcast",
                "Musicians & Storytellers",
                "A dedicated recording environment helps voices, instruments and ideas find their own sound.",
              ],
              [
                "host-portrait",
                "Studio Hosts & Makers",
                "Hosts bring the space, technical context and local knowledge that make a session possible.",
              ],
            ].map(([img, title, text]) => (
              <article className="panel" key={title}>
                <img
                  src={"/images/" + img + ".png"}
                  alt={title + " — illustrative creative community imagery"}
                />
                <div>
                  <span className="eyebrow">CREATIVE PRODUCTION COMMUNITY</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="small muted">
            Community imagery illustrates the platform’s audiences; these are
            not staff biographies or endorsements.
          </p>
        </section>
        <section className="about-host-cta panel">
          <span className="eyebrow pill">
            <span className="tiny-dot" />
            YOUR SPACE. THEIR NEXT GREAT IDEA.
          </span>
          <h2>
            Have an idle soundstage or daylight loft?
            <br />
            Turn your square footage into creative opportunity.
          </h2>
          <p>
            Share the details that make your studio special and review requests
            from creators looking for their next setting.
          </p>
          <div className="button-row">
            <Link href="/add-studio" className="button primary">
              Host Your Space
            </Link>
            <Link href="/studios" className="button outline">
              Explore Studios
            </Link>
          </div>
          <div className="cta-facts">
            <span>
              <ShieldCheck size={14} />
              Account-based host identity
            </span>
            <span>
              <CalendarDays size={14} />
              Host-confirmed sessions
            </span>
            <span>
              <FileText size={14} />
              Saved booking records
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
function Info({ type }: { type: string }) {
  return (
    <div className="container page prose">
      <div className="eyebrow">STUDIOSPACE / LOCAL EDITION</div>
      <h1>{type === "terms" ? "Terms of use." : "Your privacy matters."}</h1>
      {type === "terms" ? (
        <>
          <p>
            This local project lets account holders publish studio listings and
            request bookings. A booking is a scheduling request until its host
            confirms it.
          </p>
          <h2>Clear expectations</h2>
          <p>
            No online payment is collected. Booking summaries are not proof of
            payment. Security deposits are estimates to be arranged directly
            with the host. StudioSpace does not supply insurance, equipment
            guarantees or staffed customer assistance.
          </p>
          <h2>Host responsibilities</h2>
          <p>
            Provide accurate descriptions, safe access and clear equipment
            conditions. Listings with booking history cannot be deleted, so
            reservation records remain intact. Agree on liability and
            cancellation terms before a session.
          </p>
        </>
      ) : (
        <>
          <p>
            Account details, password hashes, studio listings, bookings, saved
            spaces, reviews and newsletter interest are stored in your
            configured MongoDB database. Authentication uses an HTTPOnly session
            cookie.
          </p>
          <h2>Local data</h2>
          <p>
            Uploaded images are stored locally as PNG files. Newsletter interest
            is saved locally; no newsletter emails are sent. Google sign-in
            exchanges identity information with Google only when configured and
            initiated by you.
          </p>
          <h2>Your choices</h2>
          <p>
            Edit your name and photo in profile settings, remove saved spaces
            and cancel pending booking requests. The project operator manages
            database retention and deletion. Do not put sensitive personal data
            into this development application.
          </p>
        </>
      )}
    </div>
  );
}
function ModuleTitle({
  index,
  code,
  title,
}: {
  index: string;
  code: string;
  title: string;
}) {
  return (
    <div className="module-heading">
      <div>
        <span className="eyebrow">MODULE {index}</span>
        <h2>{title}</h2>
      </div>
      <small>{code}</small>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  footer,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  footer?: string;
  icon: typeof Film;
  accent?: boolean;
}) {
  return (
    <article className={"panel stat metric " + (accent ? "metric-accent" : "")}>
      <div>
        <span>{label}</span>
        <Icon size={20} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
      {footer && <small>{footer}</small>}
      <div className="metric-rule" />
    </article>
  );
}

function StatusTabs({
  items,
  value,
  onChange,
  compact = false,
}: {
  items: Booking[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={"status-tabs " + (compact ? "compact" : "")}>
      {[
        "All",
        "Confirmed",
        "Pending",
        "Completed",
        ...(compact ? [] : ["Cancelled"]),
      ].map((s) => (
        <button
          key={s}
          className={value === s ? "active" : ""}
          onClick={() => onChange(s)}
        >
          {s === "All" ? "All Bookings" : s === "Pending" ? "Pending Hold" : s}
          <span>
            {s === "All"
              ? items.length
              : items.filter((b) => b.status === s).length}
          </span>
        </button>
      ))}
    </div>
  );
}

function bookingHours(b: Booking) {
  return (
    Math.round(
      (b.totalHours ||
        (+new Date(b.endTime) - +new Date(b.startTime)) / 3600000) * 10,
    ) / 10
  );
}

function timeRange(b: Booking) {
  const fmt = { hour: "2-digit", minute: "2-digit" } as const;
  return (
    new Date(b.startTime).toLocaleTimeString(undefined, fmt) +
    " – " +
    new Date(b.endTime).toLocaleTimeString(undefined, fmt)
  );
}

function downloadText(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCSV(
  name: string,
  head: string[],
  rows: (string | number)[][],
) {
  const cell = (v: string | number) =>
    '"' +
    String(
      typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v,
    ).replaceAll('"', '""') +
    '"';
  downloadText(
    name,
    "\ufeff" +
      [head, ...rows].map((row) => row.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
}

function downloadCalendar(bookings: Booking[]) {
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudioSpace//Booking Calendar//EN",
    "CALSCALE:GREGORIAN",
    ...bookings
      .filter((b) => ["Pending", "Confirmed"].includes(b.status))
      .flatMap((b) => [
        "BEGIN:VEVENT",
        "UID:" + b._id + "@studiospace.local",
        "DTSTAMP:" + stamp(new Date().toISOString()),
        "DTSTART:" + stamp(b.startTime),
        "DTEND:" + stamp(b.endTime),
        "SUMMARY:" + esc(b.studioId?.title || "Studio session"),
        "LOCATION:" + esc(b.studioId?.address || ""),
        "DESCRIPTION:" + esc(b.status + " / StudioSpace booking " + b._id),
        "STATUS:" + (b.status === "Confirmed" ? "CONFIRMED" : "TENTATIVE"),
        "END:VEVENT",
      ]),
    "END:VCALENDAR",
  ];
  downloadText(
    "StudioSpace-production-calendar.ics",
    lines.join("\r\n"),
    "text/calendar;charset=utf-8",
  );
}

function MissingFrame() {
  const q = useQuery<Studio[]>({
    queryKey: ["featured", ""],
    queryFn: () => api("/studios/featured"),
  });
  return (
    <div className="missing-frame">
      <div className="frame-metadata">
        <span>
          <span className="dot" />
          REC LOCK :: OFFLINE
        </span>
        <span>ASPECT: 2.39:1 · FPS: 24.000</span>
        <span>REEL: #X04 · SCENE: NULL · TAKE: 01</span>
      </div>
      <section className="missing-hero">
        <span className="timecode">
          <Film size={18} />
          TC: 04:04:00:00 // CUT <strong>FRAME OUT OF BOUNDS</strong>
        </span>
        <h1>
          Looks Like This Frame
          <br />
          <span className="accent">Is Missing.</span>
        </h1>
        <p>
          The creative space, soundstage, or booking page you are looking for
          <br className="desktop-break" /> has moved out of frame or does not
          exist.
        </p>
        <div className="button-row">
          <Link href="/" className="button primary">
            <ArrowRight size={17} />
            Return to Home
          </Link>
          <Link href="/studios" className="button outline">
            <LayoutDashboard size={17} />
            Explore Studios
          </Link>
        </div>
        <div className="missing-search panel">
          <form action="/studios">
            <Search size={21} />
            <input
              name="search"
              aria-label="Find another studio"
              placeholder="Search soundstages, daylight lofts, cyc walls…"
            />
            <Button variant="outline">Locate</Button>
          </form>
          <div>
            <small>QUICK CUE:</small>
            {[
              "Film Stages",
              "Photo Studios",
              "Music Suites",
              "Podcast Rooms",
            ].map((c) => (
              <Link key={c} href={"/studios?category=" + encodeURIComponent(c)}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container alternative-spaces">
        <div className="section-heading">
          <span className="eyebrow">ALTERNATIVE CREATIVE SPACES</span>
          <Link className="text-link" href="/studios">
            View All Roster
            <ArrowRight size={15} />
          </Link>
        </div>
        <div>
          {q.data?.slice(0, 3).map((s) => (
            <Link className="panel" href={"/studios/" + s._id} key={s._id}>
              <Film size={26} />
              <section>
                <span className="eyebrow">
                  <span className="tiny-dot" />
                  OPEN FOR REQUESTS
                </span>
                <h3>{s.title}</h3>
                <p>
                  {s.category} · {s.maxCapacity} people
                </p>
              </section>
            </Link>
          ))}
        </div>
      </section>
      <div className="frame-metadata frame-status">
        <span>ERR_CODE: 404 · STATUS: HTTP_FRAME_NOT_FOUND</span>
        <span>STUDIO_ROUTER / CREATIVE SPACE NETWORK</span>
      </div>
    </div>
  );
}

function WorkspaceSidebar({ path }: { path: string }) {
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

function PrecisionFields({ params }: { params: URLSearchParams }) {
  return (
    <>
      <fieldset>
        <legend>LOCATION & CREW</legend>
        <label>
          Production location
          <input
            name="location"
            placeholder="City or neighborhood"
            defaultValue={params.get("location") || ""}
          />
        </label>
        <label>
          Crew size
          <input
            name="crew"
            type="number"
            min="1"
            placeholder="Number of people"
            defaultValue={params.get("crew") || ""}
          />
        </label>
        <label>
          Production date
          <input
            name="availableDate"
            type="date"
            defaultValue={params.get("availableDate") || ""}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>ARCHITECTURAL SPECS</legend>
        <label>
          Minimum grid height (ft)
          <input
            name="minHeight"
            type="number"
            min="0"
            defaultValue={params.get("minHeight") || ""}
          />
        </label>
        <label>
          Minimum hourly price
          <input
            name="min"
            type="number"
            min="0"
            defaultValue={params.get("min") || ""}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>MINIMUM RATING</legend>
        <select
          name="minRating"
          aria-label="Minimum rating"
          defaultValue={params.get("minRating") || ""}
        >
          <option value="">Any rating</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </select>
      </fieldset>
      <fieldset>
        <legend>AMENITIES INCLUDED</legend>
        {[
          "Lighting kit",
          "High-speed Wi-Fi",
          "Climate control",
          "Equipment storage",
          "Changing room",
          "Ground-floor access",
        ].map((a) => (
          <label className="check-label" key={a}>
            <input
              name="amenity"
              type="checkbox"
              value={a}
              defaultChecked={params.get("amenities")?.split(",").includes(a)}
            />
            {a}
          </label>
        ))}
      </fieldset>
    </>
  );
}
function MobileDock() {
  const path = usePathname();
  return (
    <nav className="mobile-dock" aria-label="Creator mobile navigation">
      {[
        ["/", "Home", Aperture],
        ["/studios", "Explore", Search],
        ["/wishlist", "Saved", Heart],
        ["/my-bookings", "Bookings", CalendarDays],
        ["/profile-settings", "Profile", Settings],
      ].map(([href, label, Icon]) => {
        const I = Icon as typeof Film;
        return (
          <Link
            key={String(href)}
            href={String(href)}
            className={path === href ? "active" : ""}
          >
            <I size={18} />
            <span>{String(label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function StudioApp() {
  const path = usePathname();
  const { data: user, isPending, error } = useUser();
  const router = useRouter();
  const reduce = useReducedMotion();
  const needsAuth =
    privateRoutes.includes(path) || path.startsWith("/studios/edit/");
  useEffect(() => {
    if (needsAuth && !isPending && !user && !error)
      router.replace("/login?next=" + encodeURIComponent(path));
  }, [needsAuth, isPending, user, error, path, router]);
  let page: React.ReactNode;
  if (needsAuth && (isPending || !user))
    page = (
      <div className="container page">
        <State loading={!error} error={error} />
      </div>
    );
  else if (path === "/") page = <Home />;
  else if (path === "/studios") page = <Explore />;
  else if (path === "/login" || path === "/register")
    page = <Auth register={path === "/register"} />;
  else if (path === "/about") page = <About />;
  else if (path === "/how-it-works")
    page = (
      <div className="container page">
        <h1>
          Less searching.
          <br />
          <span className="accent">More creating.</span>
        </h1>
        <Steps />
        <section className="panel prose">
          <h2>A request, then a confirmation.</h2>
          <p>
            Choose your space and future session times. The host reviews your
            request and confirms if available. Pending requests can overlap;
            confirmed reservations cannot. Cancel your pending request from My
            Bookings.
          </p>
          <p>
            No payment is collected. Discuss equipment, arrival and deposit
            arrangements with the host before your session.
          </p>
          <Link className="button primary" href="/studios">
            Find a Studio
          </Link>
        </section>
      </div>
    );
  else if (path === "/terms" || path === "/privacy")
    page = <Info type={path.slice(1)} />;
  else if (needsAuth) {
    let inner;
    if (path === "/dashboard") inner = <Dashboard />;
    else if (path === "/add-studio") inner = <StudioForm />;
    else if (path.startsWith("/studios/edit/"))
      inner = <StudioForm id={path.split("/")[3]} />;
    else if (path === "/my-listings") inner = <Listings />;
    else if (path === "/my-bookings") inner = <Bookings />;
    else if (path === "/host-bookings") inner = <Bookings host />;
    else if (path === "/profile-settings") inner = <Profile />;
    else inner = <WishlistPage />;
    page = (
      <div className="dashboard-layout">
        <WorkspaceSidebar path={path} />
        <main className="dashboard-content">{inner}</main>
      </div>
    );
  } else if (/^\/studios\/[^/]+$/.test(path))
    page = <Details id={path.split("/")[2]} />;
  else page = <MissingFrame />;
  return (
    <>
      <Header />
      <motion.div
        data-page-transition={path}
        key={path}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {page}
      </motion.div>
      {!needsAuth && <Footer />}
      {path === "/studios" && <MobileDock />}
    </>
  );
}

