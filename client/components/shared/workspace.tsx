"use client";
import { Film } from "lucide-react";
import { Booking } from "../../lib/api";
export function ModuleTitle({
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

export function Metric({
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

export function StatusTabs({
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
