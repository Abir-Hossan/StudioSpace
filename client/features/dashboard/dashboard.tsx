import { useUser } from "../../hooks/use-user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Booking, api } from "../../lib/api";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock, Download, FileText, Film, Plus, ShieldCheck, Wallet } from "lucide-react";
import { State } from "../../components/shared/state";
import { Metric, StatusTabs } from "../../components/shared/workspace";
import { money } from "../../lib/currency";
import { Button } from "../../components/ui";
import { bookingHours, timeRange } from "../bookings/format";
export function Dashboard() {
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
