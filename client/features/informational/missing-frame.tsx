import { useQuery } from "@tanstack/react-query";
import { Studio, api } from "../../lib/api";
import { ArrowRight, Film, LayoutDashboard, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui";
export function MissingFrame() {
  const q = useQuery<Studio[]>({
    queryKey: ["featured", ""],
    queryFn: () => api("/studios/featured"),
  });
  return (
    <div className="missing-frame">
      <div className="frame-metadata">
        <span>
          <span className="dot" />
          REC LOCK :: OFFLINE
        </span>
        <span>ASPECT: 2.39:1 · FPS: 24.000</span>
        <span>REEL: #X04 · SCENE: NULL · TAKE: 01</span>
      </div>
      <section className="missing-hero">
        <span className="timecode">
          <Film size={18} />
          TC: 04:04:00:00 // CUT <strong>FRAME OUT OF BOUNDS</strong>
        </span>
        <h1>
          Looks Like This Frame
          <br />
          <span className="accent">Is Missing.</span>
        </h1>
        <p>
          The creative space, soundstage, or booking page you are looking for
          <br className="desktop-break" /> has moved out of frame or does not
          exist.
        </p>
        <div className="button-row">
          <Link href="/" className="button primary">
            <ArrowRight size={17} />
            Return to Home
          </Link>
          <Link href="/studios" className="button outline">
            <LayoutDashboard size={17} />
            Explore Studios
          </Link>
        </div>
        <div className="missing-search panel">
          <form action="/studios">
            <Search size={21} />
            <input
              name="search"
              aria-label="Find another studio"
              placeholder="Search soundstages, daylight lofts, cyc walls…"
            />
            <Button variant="outline">Locate</Button>
          </form>
          <div>
            <small>QUICK CUE:</small>
            {[
              "Film Stages",
              "Photo Studios",
              "Music Suites",
              "Podcast Rooms",
            ].map((c) => (
              <Link key={c} href={"/studios?category=" + encodeURIComponent(c)}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container alternative-spaces">
        <div className="section-heading">
          <span className="eyebrow">ALTERNATIVE CREATIVE SPACES</span>
          <Link className="text-link" href="/studios">
            View All Roster
            <ArrowRight size={15} />
          </Link>
        </div>
        <div>
          {q.data?.slice(0, 3).map((s) => (
            <Link className="panel" href={"/studios/" + s._id} key={s._id}>
              <Film size={26} />
              <section>
                <span className="eyebrow">
                  <span className="tiny-dot" />
                  OPEN FOR REQUESTS
                </span>
                <h3>{s.title}</h3>
                <p>
                  {s.category} · {s.maxCapacity} people
                </p>
              </section>
            </Link>
          ))}
        </div>
      </section>
      <div className="frame-metadata frame-status">
        <span>ERR_CODE: 404 · STATUS: HTTP_FRAME_NOT_FOUND</span>
        <span>STUDIO_ROUTER / CREATIVE SPACE NETWORK</span>
      </div>
    </div>
  );
}
