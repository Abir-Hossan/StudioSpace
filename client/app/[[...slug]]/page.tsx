import { StudioApp } from "../../components/studio-app";
import { Suspense } from "react";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const route = "/" + slug.join("/");
  const routes = [
    "/",
    "/studios",
    "/login",
    "/register",
    "/about",
    "/how-it-works",
    "/terms",
    "/privacy",
    "/dashboard",
    "/add-studio",
    "/my-listings",
    "/my-bookings",
    "/host-bookings",
    "/profile-settings",
    "/wishlist",
  ];
  if (!routes.includes(route) && !/^\/studios\/(edit\/)?[^/]+$/.test(route))
    notFound();
  return (
    <Suspense
      fallback={
        <main className="container page">
          <div className="skeleton" aria-label="Loading page" />
        </main>
      }
    >
      <StudioApp />
    </Suspense>
  );
}
