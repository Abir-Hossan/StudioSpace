import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ArrowRight, CalendarDays, FileText, Film, MapPin, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { State } from "../../components/shared/state";
export function About() {
  const network = useQuery<{
    total: number;
    cities: { city: string; country: string; count: number }[];
    categories: string[];
  }>({ queryKey: ["network"], queryFn: () => api("/studios/network") });
  return (
    <div className="reference-about">
      <div className="container">
        <section className="about-introduction">
          <div>
            <div className="eyebrow pill">
              <span className="tiny-dot" />
              APERTURE INFRASTRUCTURE FOR CREATIVE WORK
            </div>
            <span className="eyebrow">MISSION & PRODUCTION</span>
            <h1>
              Making Creative Spaces
              <br />
              Accessible to Everyone.
            </h1>
          </div>
          <p>
            Built around the needs of filmmakers, photographers, musicians and
            artists. StudioSpace bridges the gap between specialist spaces and
            independent creators.
          </p>
        </section>
        <section className="about-stage">
          <img
            src="/images/reference-stage-main.png"
            alt="Cinematic production soundstage"
          />
          <span className="photo-caption">
            <Film size={13} />
            PRODUCTION SPACE / ROOM FOR YOUR NEXT IDEA
          </span>
          <div>
            <div>
              <small>PRODUCTION READINESS</small>
              <strong>Host-listed equipment</strong>
            </div>
            <div>
              <small>BOOKING RULES</small>
              <strong>Host confirmation required</strong>
            </div>
            <Link href="/studios" className="button primary">
              Explore All {network.data?.total ?? "…"} Spaces
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <div className="about-statistics">
          {[
            [
              "PRODUCTION SPACES",
              String(network.data?.total ?? "…"),
              "Studios in the current local collection",
            ],
            [
              "CREATIVE LOCATIONS",
              String(network.data?.cities.length ?? "…"),
              "Host-listed cities",
            ],
            [
              "CREATIVE DISCIPLINES",
              String(network.data?.categories.length ?? "…"),
              "Production categories represented",
            ],
            [
              "RESERVATION MODEL",
              "Host Reviewed",
              "No payment is collected by StudioSpace",
            ],
          ].map(([label, value, detail]) => (
            <div className="panel" key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
        <section className="section legacy-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CRAFTED BY CREATIVE NEEDS</span>
              <h2>
                The Friction of Legacy
                <br />
                Production
              </h2>
            </div>
            <p>
              Finding a space should give your project momentum,
              <br className="desktop-break" /> with clear details and a schedule
              you can trust.
            </p>
          </div>
          <div className="legacy-layout">
            <div>
              <img
                src="/images/studio-art.png"
                alt="Light-filled workshop and creative production space"
              />
              <div className="production-note">
                <span className="eyebrow">PRODUCTION NOTES</span>
                <p>
                  “The right room brings the practical details together: light,
                  acoustics, equipment, space, and the time to make something.”
                </p>
                <small>THE STUDIO SPACE APPROACH</small>
              </div>
            </div>
            <div>
              <article className="comparison-panel panel">
                <span className="eyebrow">THE FRAGMENTED MODEL</span>
                <div>
                  {[
                    [
                      "Scattered Listings",
                      "Technical details spread across messages and directories.",
                    ],
                    [
                      "Unclear Specifications",
                      "Equipment and access questions answered late.",
                    ],
                    [
                      "Disconnected Schedules",
                      "Separate calendars and uncertainty about availability.",
                    ],
                    [
                      "Missing Booking Records",
                      "Production details buried in old conversations.",
                    ],
                  ].map(([a, b]) => (
                    <section key={a}>
                      <h3>{a}</h3>
                      <p>{b}</p>
                    </section>
                  ))}
                </div>
              </article>
              <article className="comparison-panel panel good">
                <span className="eyebrow">THE STUDIOSPACE PLATFORM</span>
                <div>
                  {[
                    [
                      "One Studio Collection",
                      "Compare rates, locations, galleries and equipment.",
                    ],
                    [
                      "Structured Studio Details",
                      "Hosts publish their facilities and production conditions.",
                    ],
                    [
                      "Host-Confirmed Bookings",
                      "Confirmed sessions cannot overlap in the studio schedule.",
                    ],
                    [
                      "Workspace Records",
                      "Track reservations, statuses and booking summaries.",
                    ],
                  ].map(([a, b]) => (
                    <section key={a}>
                      <h3>{a}</h3>
                      <p>{b}</p>
                    </section>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="section rigor-section">
          <span className="eyebrow">PRODUCTION PROTOCOLS</span>
          <h2>Engineered for Production Rigor</h2>
          <p>
            From independent films to commercial creative projects, keep the
            essentials in one workspace.
          </p>
          <div className="rigor-grid">
            {[
              [
                Users,
                "Registered Identity",
                "Listings belong to authenticated hosts. Booking requests link to a registered creator.",
                "ACCOUNT OWNERSHIP",
              ],
              [
                CalendarDays,
                "Clear Scheduling",
                "Hosts review time requests. Confirmed reservations are checked for conflicts.",
                "DATABASE-BACKED AVAILABILITY",
              ],
              [
                ShieldCheck,
                "Documented Details",
                "View prices and deposits before requesting hours. No online payment is taken.",
                "TRANSPARENT ESTIMATES",
              ],
              [
                MapPin,
                "Practical Load-In",
                "Hosts can document access, parking, equipment, capacity and stage rules.",
                "HOST-PROVIDED LOGISTICS",
              ],
            ].map(([Icon, title, text, label]) => {
              const I = Icon as typeof Film;
              return (
                <article className="panel" key={String(title)}>
                  <I size={25} />
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                  <small>{String(label)}</small>
                </article>
              );
            })}
          </div>
          <div className="pipeline-strip">
            <span className="tiny-dot" />
            <span>Creative studio collection</span>
            <span>
              {network.data?.total ?? "…"} spaces ·{" "}
              {network.data?.cities.length ?? "…"} host-listed locations
            </span>
          </div>
        </section>
        <section className="section network-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">REGIONAL INFRASTRUCTURE</span>
              <h2>{network.data?.cities.length ?? "…"} Creative Locations</h2>
            </div>
            <Link href="/studios" className="text-link">
              Browse studio locations
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="network-layout">
            <div className="network-map">
              <svg
                viewBox="0 0 720 390"
                role="img"
                aria-label="Illustrative world location diagram"
              >
                <defs>
                  <pattern
                    id="mapGrid"
                    width="30"
                    height="30"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth=".5"
                    />
                  </pattern>
                </defs>
                <rect width="720" height="390" fill="url(#mapGrid)" />
                <g fill="var(--raised)" stroke="var(--line)" strokeWidth="2">
                  <path d="m55 85 65-40 85 15 35 45-35 25-15 50-45 10-30-40-40-10Z" />
                  <path d="m165 205 50-10 35 45-20 60-30 50-20-60Z" />
                  <path d="m320 90 40-30 70 10 40-20 115 30 55 50-45 30-60-5-45 40-50-10-20-55-50-15-35 35-30-20Z" />
                  <path d="m340 170 70-15 35 60-35 80-35 10-30-60Z" />
                  <path d="m540 285 65-20 45 30-15 35-80 5Z" />
                </g>
                {network.data?.cities
                  .filter((c) =>
                    /brooklyn|dhaka|london|los angeles/i.test(c.city),
                  )
                  .map((c) => {
                    const [x, y] = /dhaka/i.test(c.city)
                      ? [523, 174]
                      : /brooklyn/i.test(c.city)
                        ? [195, 112]
                        : /london/i.test(c.city)
                          ? [355, 98]
                          : [118, 130];
                    return (
                      <g key={c.city}>
                        <circle cx={x} cy={y} r="14" fill="#ff704333" />
                        <circle cx={x} cy={y} r="5" fill="#ff7043" />
                        <text
                          x={x + 12}
                          y={y - 10}
                          fill="var(--text)"
                          fontSize="13"
                        >
                          {c.city}
                        </text>
                      </g>
                    );
                  })}
              </svg>
              <small>
                ILLUSTRATIVE LOCATION DIAGRAM · USE LISTING ADDRESSES FOR
                DIRECTIONS
              </small>
            </div>
            <div className="network-cities panel">
              {network.data?.cities.map((c) => (
                <Link
                  key={c.city + c.country}
                  href={"/studios?location=" + encodeURIComponent(c.city)}
                >
                  <span>{c.city.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <h3>{c.city}</h3>
                    <p>{c.country}</p>
                  </div>
                  <strong>{c.count} spaces</strong>
                  <ArrowRight size={14} />
                </Link>
              ))}
              <State loading={network.isPending} error={network.error} />
            </div>
          </div>
        </section>
        <section className="section" id="community">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR COMMUNITY</span>
              <h2>Filmmakers, Not Real Estate Suits</h2>
            </div>
            <p>
              Built around the people who create productions,
              <br className="desktop-break" /> record new ideas, and open their
              studio doors.
            </p>
          </div>
          <div className="community-grid">
            {[
              [
                "studio-film",
                "Filmmakers & Photographers",
                "A production needs room for crew, lighting, framing, and the detail that brings each shot to life.",
              ],
              [
                "studio-podcast",
                "Musicians & Storytellers",
                "A dedicated recording environment helps voices, instruments and ideas find their own sound.",
              ],
              [
                "host-portrait",
                "Studio Hosts & Makers",
                "Hosts bring the space, technical context and local knowledge that make a session possible.",
              ],
            ].map(([img, title, text]) => (
              <article className="panel" key={title}>
                <img
                  src={"/images/" + img + ".png"}
                  alt={title + " — illustrative creative community imagery"}
                />
                <div>
                  <span className="eyebrow">CREATIVE PRODUCTION COMMUNITY</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="small muted">
            Community imagery illustrates the platform’s audiences; these are
            not staff biographies or endorsements.
          </p>
        </section>
        <section className="about-host-cta panel">
          <span className="eyebrow pill">
            <span className="tiny-dot" />
            YOUR SPACE. THEIR NEXT GREAT IDEA.
          </span>
          <h2>
            Have an idle soundstage or daylight loft?
            <br />
            Turn your square footage into creative opportunity.
          </h2>
          <p>
            Share the details that make your studio special and review requests
            from creators looking for their next setting.
          </p>
          <div className="button-row">
            <Link href="/add-studio" className="button primary">
              Host Your Space
            </Link>
            <Link href="/studios" className="button outline">
              Explore Studios
            </Link>
          </div>
          <div className="cta-facts">
            <span>
              <ShieldCheck size={14} />
              Account-based host identity
            </span>
            <span>
              <CalendarDays size={14} />
              Host-confirmed sessions
            </span>
            <span>
              <FileText size={14} />
              Saved booking records
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
