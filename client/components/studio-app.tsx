"use client";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../hooks/use-user";
import { motion, useReducedMotion } from "motion/react";
import { isWorkspacePath } from "../config/navigation";
import { useEffect } from "react";
import { State } from "./shared/state";
import { Home } from "../features/home/home";
import { Explore } from "../features/explore/explore";
import { Auth } from "../features/auth/auth";
import { About } from "../features/informational/about";
import { Steps } from "../features/home/steps";
import Link from "next/link";
import { Info } from "../features/informational/info";
import { Dashboard } from "../features/dashboard/dashboard";
import { StudioForm } from "../features/listings/studio-form";
import { Listings } from "../features/listings/listings";
import { Bookings } from "../features/bookings/bookings";
import { Profile } from "../features/profile/profile";
import { WishlistPage } from "../features/wishlist/wishlist";
import { WorkspaceSidebar } from "./layout/workspace-sidebar";
import { Details } from "../features/studios/details";
import { MissingFrame } from "../features/informational/missing-frame";
import { Header } from "./layout/header";
import { Footer } from "./layout/footer";
import { MobileDock } from "./layout/mobile-dock";


export function StudioApp() {
  const path = usePathname();
  const { data: user, isPending, error } = useUser();
  const router = useRouter();
  const reduce = useReducedMotion();
  const needsAuth =
    isWorkspacePath(path);
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
      <Header user={user} />
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

