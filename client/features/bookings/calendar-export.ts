import { Booking } from "../../lib/api";
import { downloadText } from "../../lib/download";
export function downloadCalendar(bookings: Booking[]) {
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudioSpace//Booking Calendar//EN",
    "CALSCALE:GREGORIAN",
    ...bookings
      .filter((b) => ["Pending", "Confirmed"].includes(b.status))
      .flatMap((b) => [
        "BEGIN:VEVENT",
        "UID:" + b._id + "@studiospace.local",
        "DTSTAMP:" + stamp(new Date().toISOString()),
        "DTSTART:" + stamp(b.startTime),
        "DTEND:" + stamp(b.endTime),
        "SUMMARY:" + esc(b.studioId?.title || "Studio session"),
        "LOCATION:" + esc(b.studioId?.address || ""),
        "DESCRIPTION:" + esc(b.status + " / StudioSpace booking " + b._id),
        "STATUS:" + (b.status === "Confirmed" ? "CONFIRMED" : "TENTATIVE"),
        "END:VEVENT",
      ]),
    "END:VCALENDAR",
  ];
  downloadText(
    "StudioSpace-production-calendar.ics",
    lines.join("\r\n"),
    "text/calendar;charset=utf-8",
  );
}
