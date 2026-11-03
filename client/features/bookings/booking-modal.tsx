import { Studio, api } from "../../lib/api";
import { FormEvent, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Modal } from "../../components/ui";
import { money } from "../../lib/currency";
export function BookingModal({
  studio: s,
  open,
  close,
  initialDate = "",
  initialStart = "09:00",
  initialEnd = "12:00",
}: {
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  studio: Studio;
  open: boolean;
  close: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setStart(initialStart);
      setEnd(initialEnd);
    }
  }, [open, initialDate, initialStart, initialEnd]);
  const duration =
    (+new Date(`${date}T${end}`) - +new Date(`${date}T${start}`)) / 3600000;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("End time must be after start time");
      return;
    }
    setBusy(true);
    try {
      await api("/bookings", "POST", {
        studioId: s._id,
        startTime: new Date(date + "T" + start).toISOString(),
        endTime: new Date(date + "T" + end).toISOString(),
      });
      await qc.invalidateQueries({ queryKey: ["bookings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Booking request saved. Awaiting host confirmation.");
      close();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title="Make room for your next idea"
    >
      <h3>{s.title}</h3>
      <form onSubmit={submit}>
        <label>
          Booking date
          <input
            type="date"
            required
            min={new Date().toLocaleDateString("en-CA")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="two">
          <label>
            Start time
            <input
              type="time"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            End time
            <input
              type="time"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <div className="summary">
          <p>
            <span>
              {Number.isFinite(duration) && duration > 0 ? duration : 0} hours ×{" "}
              {money(s.hourlyRate)}
            </span>
            <span>{money(duration > 0 ? duration * s.hourlyRate : 0)}</span>
          </p>
          <p>
            <span>Security deposit</span>
            <span>{money(s.securityDeposit)}</span>
          </p>
          <hr />
          <p>
            <strong>Estimated total</strong>
            <strong>
              {money(
                (duration > 0 ? duration * s.hourlyRate : 0) +
                  s.securityDeposit,
              )}
            </strong>
          </p>
        </div>
        <p className="small muted">
          Times use your device’s local timezone. No payment is collected.
          Overlapping pending requests may coexist; only one can be confirmed.
        </p>
        <Button disabled={busy}>
          {busy ? "Saving request…" : "Request Booking"}
        </Button>
      </form>
    </Modal>
  );
}
