import { Booking } from "../../lib/api";
export function bookingHours(b: Booking) {
  return (
    Math.round(
      (b.totalHours ||
        (+new Date(b.endTime) - +new Date(b.startTime)) / 3600000) * 10,
    ) / 10
  );
}

export function timeRange(b: Booking) {
  const fmt = { hour: "2-digit", minute: "2-digit" } as const;
  return (
    new Date(b.startTime).toLocaleTimeString(undefined, fmt) +
    " – " +
    new Date(b.endTime).toLocaleTimeString(undefined, fmt)
  );
}
