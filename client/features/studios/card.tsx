import { Studio, api } from "../../lib/api";
import { useUser } from "../../hooks/use-user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Star } from "lucide-react";
import { money } from "../../lib/currency";
export function Card({ studio: s }: { studio: Studio }) {
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
