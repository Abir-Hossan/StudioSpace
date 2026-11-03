"use client";
import { Button } from "../ui";
import { Aperture } from "lucide-react";
import Link from "next/link";
export function State({
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
