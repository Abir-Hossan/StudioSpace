import { useQuery } from "@tanstack/react-query";
import { Studio, api } from "../../lib/api";
import { ArrowRight, CalendarDays, Film, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
export function Steps() {
  const q = useQuery<{ items: Studio[]; total: number }>({
    queryKey: ["studio-count"],
    queryFn: () => api("/studios"),
  });
  return (
    <section className="section reference-steps">
      <div className="eyebrow">PRODUCTION PIPELINE</div>
      <h2>How Booking Works</h2>
      <p>
        Designed around real call sheets. Lock your shooting location in minutes
        <br className="desktop-break" /> without lengthy broker paperwork.
      </p>
      <div className="steps">
        {[
          "Discover Spaces",
          "Select Shoot Hours",
          "Request Your Session",
          "Create & Produce",
        ].map((s, i) => {
          const Icon = [Search, CalendarDays, ShieldCheck, Film][i];
          return (
            <article key={s}>
              <div>
                <span className="step-num">0{i + 1}</span>
                <Icon size={21} />
              </div>
              <h3>{s}</h3>
              <p>
                {
                  [
                    "Filter by precise technical requirements, capacity and location.",
                    "Reserve hourly blocks and review your session estimate.",
                    "The host reviews availability and confirms your request.",
                    "Show up with your crew and focus on what you came to make.",
                  ][i]
                }
              </p>
            </article>
          );
        })}
      </div>
      <div className="pipeline-strip">
        <span>
          <span className="tiny-dot" />
          Active studios today
        </span>
        <span>
          {q.data?.total ?? "…"} spaces in the local studio collection
        </span>
        <Link href="/studios">
          View current inventory
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
