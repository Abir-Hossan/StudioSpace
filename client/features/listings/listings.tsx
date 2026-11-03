import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Booking, Studio, api, categories } from "../../lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Modal } from "../../components/ui";
import { downloadCSV } from "../../lib/download";
import { Clock, Download, Eye, Film, LayoutDashboard, MapPin, Menu, Plus, Search, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { Metric } from "../../components/shared/workspace";
import { bookingHours } from "../bookings/format";
import { money } from "../../lib/currency";
import { State } from "../../components/shared/state";
import { Card } from "../studios/card";
export function Listings() {
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
