import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Studio, api } from "../../lib/api";
import { FormEvent, useState } from "react";
import { useUser } from "../../hooks/use-user";
import { useRouter } from "next/navigation";
import { State } from "../../components/shared/state";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, CalendarDays, Camera, Film, Heart, MapPin, Music, Share2, ShieldCheck, SlidersHorizontal, Star, Users, Wifi } from "lucide-react";
import { Button, Modal } from "../../components/ui";
import { money } from "../../lib/currency";
import { BookingModal } from "../bookings/booking-modal";
export function Details({ id }: { id: string }) {
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
