import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Studio, api, categories } from "../../lib/api";
import { useReducedMotion } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import Link from "next/link";
import { ArrowRight, CalendarDays, Camera, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "../../components/ui";
import { State } from "../../components/shared/state";
import { Card } from "../studios/card";
import { Steps } from "./steps";
export function Home() {
  const [category, setCategory] = useState("");
  const q = useQuery<Studio[]>({
    queryKey: ["featured", category],
    queryFn: () =>
      api(
        "/studios/featured" +
          (category ? "?category=" + encodeURIComponent(category) : ""),
      ),
  });
  const reduce = useReducedMotion();
  const slides = [
    [
      "hero-production",
      "Find Your Space.",
      "Create Your Story.",
      "Discover extraordinary creative spaces and cinematic soundstages tailored for your next breakthrough production.",
    ],
    [
      "hero-soundstage",
      "Your Vision Deserves",
      "The Perfect Studio.",
      "From professional daylight photography lofts to acoustic-damped post-production recording suites.",
    ],
    [
      "hero-music",
      "Your Space.",
      "Our Creative Community.",
      "Open your studio doors to the filmmakers, artists and musicians creating what comes next.",
    ],
  ];
  return (
    <>
      <section className="hero reference-hero">
        <Swiper
          modules={[Autoplay, Navigation, Pagination, A11y]}
          navigation
          pagination={{ clickable: true }}
          autoplay={
            reduce
              ? false
              : {
                  delay: 6500,
                  disableOnInteraction: true,
                  pauseOnMouseEnter: true,
                }
          }
          loop
        >
          {slides.map(([image, a, b, text], i) => (
            <SwiperSlide key={image}>
              <div
                className="hero-slide"
                style={{
                  backgroundImage: `linear-gradient(90deg,rgba(8,8,8,.75),rgba(8,8,8,.18)),linear-gradient(0deg,#101010dc,transparent),url(/images/${image}.png)`,
                }}
              >
                <div className="hero-copy">
                  <span className="eyebrow pill">
                    <span className="dot" />
                    {i === 1
                      ? "ARCHITECTURAL SOUNDSTAGES"
                      : "CURATED FOR CREATIVE PRODUCTION"}
                  </span>
                  <h1>
                    {a}
                    <br />
                    <span>{b}</span>
                  </h1>
                  <p>{text}</p>
                  <Link
                    className="button primary"
                    href={i === 2 ? "/add-studio" : "/studios"}
                  >
                    {i === 2 ? "Host Your Space" : "Discover Spaces"}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <form className="hero-search" action="/studios">
          <label>
            Category
            <select name="category">
              <option value="">All Production Types</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input name="location" placeholder="City or neighborhood" />
          </label>
          <label>
            Production date
            <input
              name="availableDate"
              type="date"
              aria-label="Production date"
            />
          </label>
          <label>
            Crew size
            <select name="crew">
              <option value="">Any crew size</option>
              {[5, 10, 20, 40].map((n) => (
                <option key={n} value={n}>
                  {n}+ persons
                </option>
              ))}
            </select>
          </label>
          <Button>
            <Search size={15} />
            Find Stage
          </Button>
        </form>
      </section>
      <div className="container">
        <section className="section category-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ROOM FOR EVERY VISION</div>
              <h2>Browse Studio Types</h2>
            </div>
            <p>
              Engineered spaces by acoustical spec, power
              <br className="desktop-break" /> supply, and spatial height.
            </p>
          </div>
          <div className="categories photo-categories">
            {categories.map((c, i) => (
              <Link key={c} href={"/studios?category=" + encodeURIComponent(c)}>
                <img
                  src={
                    "/images/" +
                    [
                      "studio-photo",
                      "studio-film",
                      "studio-podcast",
                      "hero-music",
                      "studio-art",
                    ][i] +
                    ".png"
                  }
                  alt={c}
                />
                <div>
                  <span className="eyebrow">
                    {
                      [
                        "CYC & DAYLIGHT",
                        "LIGHTS · CAMERA",
                        "VOICE · BROADCAST",
                        "TRACK · MIX",
                        "MAKE · BUILD",
                      ][i]
                    }
                  </span>
                  <h3>
                    {
                      [
                        "Photo Studios",
                        "Film Stages",
                        "Podcast Lounges",
                        "Music Suites",
                        "Art Workshops",
                      ][i]
                    }
                  </h3>
                  <p>
                    {
                      [
                        "Cycloramas, photo grids & daylight lofts.",
                        "Film production stages and flexible sets.",
                        "Recording rooms made for conversation.",
                        "Sound-treated rooms for your next record.",
                        "Room for hands-on ideas and artistry.",
                      ][i]
                    }
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="section featured-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                CURATED STAGES · REAL-TIME INVENTORY
              </div>
              <h2>Spaces Worth Creating In</h2>
              <p>
                Handpicked spaces with production-ready lighting and acoustical
                treatment.
              </p>
            </div>
            <div className="segmented">
              {["", ...categories.slice(0, 4)].map((c, i) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {
                    ["All", "Photography", "Film Stages", "Podcasts", "Music"][
                      i
                    ]
                  }
                </button>
              ))}
            </div>
          </div>
          <State
            loading={q.isPending}
            error={q.error}
            empty={q.data?.length === 0}
          />
          <div className="studio-grid home-cards">
            {q.data?.map((s) => (
              <Card key={s._id} studio={s} />
            ))}
          </div>
          <Link className="text-link collection-link" href="/studios">
            View the complete collection <ArrowRight size={15} />
          </Link>
        </section>
        <Steps />
        <section className="protection-panel">
          <div>
            <div className="eyebrow pill">
              <ShieldCheck size={12} />
              PRODUCTION INFRASTRUCTURE
            </div>
            <h2>
              Your Space.
              <br />
              <span className="accent">
                Our Creative
                <br />
                Community.
              </span>
            </h2>
            <p>
              Host with confidence. Clear studio details, account-based profiles
              and a booking schedule you control.
            </p>
            <Link className="button primary" href="/add-studio">
              Host Your Space
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="protection-grid">
            {[
              [
                "Verified Profiles",
                "Registered accounts link each request to a creator and each space to its host.",
                "ACCOUNT-BASED IDENTITY",
                Users,
              ],
              [
                "Equipment Safety",
                "Document your equipment and agree on safe use before a studio session.",
                "HOST-DEFINED CONDITIONS",
                Camera,
              ],
              [
                "Liability Information",
                "Discuss deposits, responsibilities and any required coverage directly with the host.",
                "NO PLATFORM INSURANCE",
                ShieldCheck,
              ],
              [
                "Host & Creator Assistance",
                "Review booking information, manage requests and keep your schedule in one place.",
                "SELF-SERVICE WORKSPACE",
                CalendarDays,
              ],
            ].map(([title, text, label, Icon]) => {
              const I = Icon as typeof Camera;
              return (
                <article key={String(title)}>
                  <I size={23} />
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                  <small>{String(label)}</small>
                </article>
              );
            })}
          </div>
        </section>
        <section
          className="closing-cta"
          style={{
            backgroundImage:
              "linear-gradient(#131313c9,#131313ef),url(/images/hero-production.png)",
          }}
        >
          <div className="eyebrow">START YOUR NEXT PROJECT</div>
          <h2>Great Ideas Need Great Spaces.</h2>
          <p>
            Find your setting. Bring your crew. Create something that matters.
          </p>
          <div className="button-row">
            <Link href="/studios" className="button primary">
              Explore the Collection
            </Link>
            <Link href="/add-studio" className="button outline">
              List Your Studio
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
