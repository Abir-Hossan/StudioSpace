import { Suspense } from "react";
import { StudioApp } from "../components/studio-app";
export default function NotFound() {
  return (
    <Suspense fallback={<main className="container page">Loading…</main>}>
      <StudioApp />
    </Suspense>
  );
}
