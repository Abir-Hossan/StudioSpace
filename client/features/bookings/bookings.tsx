import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Booking, api, categories } from "../../lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, FileText, Search, ShieldCheck, Star, Timer, Wallet, X } from "lucide-react";
import { Button, Modal } from "../../components/ui";
import { downloadCalendar } from "./calendar-export";
import { Metric, StatusTabs } from "../../components/shared/workspace";
import { money } from "../../lib/currency";
import { bookingHours, timeRange } from "./format";
import { State } from "../../components/shared/state";
import Link from "next/link";
export function Bookings({ host = false }: { host?: boolean }) {
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
        empty={!q.isPending && !q.error && all.length === 0}
      />
      <State
        empty={!q.isPending && !q.error && all.length > 0 && visible.length === 0}
        emptyTitle="No bookings match your filters."
        emptyDescription="Adjust your search or clear the selected filters to view other bookings."
        emptyActionLabel="Clear filters"
        onEmptyAction={() => {
          setTab("All");
          setSearch("");
          setMonth("");
          setCategory("");
        }}
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
