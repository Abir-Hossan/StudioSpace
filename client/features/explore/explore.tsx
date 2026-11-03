import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Studio, api, categories } from "../../lib/api";
import { LayoutDashboard, Menu, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { money } from "../../lib/currency";
import { PrecisionFields } from "./precision-fields";
import { Button, Modal } from "../../components/ui";
import { State } from "../../components/shared/state";
import { Card } from "../studios/card";
import Link from "next/link";
export function Explore() {
  const router = useRouter();
  const urlParams = useSearchParams();
  const search = urlParams.size ? "?" + urlParams.toString() : "";
  const params = new URLSearchParams(search);
  const [maxRate, setMaxRate] = useState(params.get("max") || "");
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = useQuery<{
    items: Studio[];
    total: number;
    page: number;
    pages: number;
  }>({
    queryKey: ["studios", search],
    queryFn: () => api("/studios" + search),
  });
  useEffect(() => setMaxRate(params.get("max") || ""), [search]);
  function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    for (const [k, v] of f) {
      if (v && k !== "amenity") p.set(k, String(v));
    }
    const amenities = f.getAll("amenity");
    if (amenities.length) p.set("amenities", amenities.join(","));
    router.push("/studios" + (p.size ? "?" + p.toString() : ""));
  }
  function page(n: number) {
    params.set("page", String(n));
    router.push("/studios?" + params.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function remove(k: string) {
    params.delete(k);
    params.delete("page");
    router.push("/studios?" + params.toString());
  }
  return (
    <div className="explore-page">
      <div className="container">
        <section className="explore-intro">
          <div>
            <span className="eyebrow pill">
              <span className="tiny-dot" />
              LIVE INVENTORY MATRIX
            </span>
            <h1>
              Find the Space Behind Your
              <br className="desktop-break" />
              Next Masterpiece.
            </h1>
            <p>
              Discover production stages, sound suites, and creative warehouses
              <br className="desktop-break" /> for your next project.
            </p>
          </div>
          <div className="segmented view-switch">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <LayoutDashboard size={14} />
              Grid View
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <Menu size={14} />
              List View
            </button>
          </div>
        </section>
        <form
          onSubmit={apply}
          key={search}
          className="explore-form"
          id="explore-filters"
        >
          <div className="explore-toolbar">
            <div className="toolbar-fields">
              <div className="mobile-search-group">
                <label className="search-field">
                  <Search size={16} />
                  <input
                    name="search"
                    aria-label="Studio name"
                    placeholder="Search by stage name"
                    defaultValue={params.get("search") || ""}
                  />
                </label>
                <button
                  type="button"
                  className="mobile-filter-trigger"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
              </div>
              <select
                name="category"
                aria-label="Category"
                defaultValue={params.get("category") || ""}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="rate-slider">
                <span>
                  Max Rate
                  <strong>
                    {maxRate ? money(Number(maxRate)) + " / hr" : "Any rate"}
                  </strong>
                </span>
                <input
                  name={maxRate ? "max" : undefined}
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={maxRate || "500"}
                  onChange={(e) => setMaxRate(e.target.value)}
                />
              </label>
              <select
                name="sort"
                aria-label="Sort by"
                defaultValue={params.get("sort") || "newest"}
              >
                <option value="newest">Newest Spaces</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div className="mobile-category-bar">
              {["", ...categories].map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className={
                    (params.get("category") || "") === c ? "active" : ""
                  }
                  onClick={() => {
                    params.delete("page");
                    if (c) params.set("category", c);
                    else params.delete("category");
                    router.push("/studios?" + params.toString());
                  }}
                >
                  {
                    [
                      "All Stages",
                      "Photo Cyc",
                      "Film Stage",
                      "Podcast",
                      "Music",
                      "Art",
                    ][i]
                  }
                </button>
              ))}
            </div>
            <div className="active-filters">
              <small>ACTIVE FILTERS:</small>
              {Array.from(params.entries())
                .filter(([k]) => !["page", "sort"].includes(k))
                .map(([k, v]) => (
                  <button type="button" key={k} onClick={() => remove(k)}>
                    {v.replaceAll(",", " · ")}
                    <X size={11} />
                  </button>
                ))}
              <button
                type="button"
                className="clear-link"
                onClick={() => router.push("/studios")}
              >
                Clear All Filters
              </button>
            </div>
            <div className="inventory-caption">
              <span className="tiny-dot" />
              {q.data?.total ?? "…"} creative spaces · database inventory
              <div className="mobile-inventory-view segmented">
                <button
                  type="button"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => setView("grid")}
                >
                  <LayoutDashboard size={12} />
                  GRID
                </button>
                <button
                  type="button"
                  className={view === "list" ? "active" : ""}
                  onClick={() => setView("list")}
                >
                  <Menu size={12} />
                  LIST
                </button>
              </div>
            </div>
          </div>
          <div className="explore-layout">
            <aside className="filters precision-filters">
              <div className="precision-title">
                <h3>
                  <SlidersHorizontal size={16} />
                  Precision Filters
                </h3>
                <button type="button" onClick={() => router.push("/studios")}>
                  Reset
                </button>
              </div>
              <PrecisionFields params={params} />
              <Button>Apply filters</Button>
              <div className="filter-guarantee">
                <ShieldCheck size={15} />
                <h4>HOST INFORMATION</h4>
                <p>
                  Check listed equipment, technical specifications and access
                  details before requesting your session.
                </p>
              </div>
            </aside>
            <section
              className={"results " + (view === "list" ? "list-results" : "")}
            >
              <State
                loading={q.isPending}
                error={q.error}
                empty={q.data?.items.length === 0}
              />
              <div className="studio-grid explore-grid">
                {q.data?.items.map((s) => (
                  <Card key={s._id} studio={s} />
                ))}
              </div>
              <div className="pagination reference-pagination">
                <span>
                  Showing {q.data?.total ? (q.data.page - 1) * 9 + 1 : 0}–
                  {q.data ? Math.min(q.data.page * 9, q.data.total) : 0} of{" "}
                  {q.data?.total ?? 0} studios
                </span>
                {q.data && q.data.pages > 1 && (
                  <div>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={q.data.page === 1}
                      onClick={() => page(q.data!.page - 1)}
                    >
                      ‹
                    </Button>
                    {Array.from(
                      { length: Math.min(q.data.pages, 8) },
                      (_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={q.data!.page === i + 1 ? "active" : ""}
                          onClick={() => page(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ),
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={q.data.page === q.data.pages}
                      onClick={() => page(q.data!.page + 1)}
                    >
                      ›
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </form>
        <section className="concierge-panel">
          <div>
            <span className="eyebrow">CREATIVE SPACE NETWORK</span>
            <h2>
              Need a turnkey production stage
              <br />
              with camera package & crew?
            </h2>
            <p>
              Compare equipment and studio specifications, then confirm your
              <br className="desktop-break" /> requirements directly with your
              host before the shoot.
            </p>
            <div className="button-row">
              <Link href="/how-it-works" className="button primary">
                Plan Your Production
              </Link>
              <a href="/api/studios/catalog.pdf" className="button outline">
                Download Studio Spec Catalog (PDF)
              </a>
            </div>
          </div>
          <div className="dispatch-panel">
            <h4>
              LOCAL INVENTORY STATUS <span className="tiny-dot" />
            </h4>
            <p>
              <span>Matching spaces</span>
              <strong>{q.data?.total ?? 0}</strong>
            </p>
            <div className="progress-track">
              <i style={{ width: q.data?.total ? "100%" : "0%" }} />
            </div>
            <p>
              <span>Booking confirmation</span>
              <strong>Host reviewed</strong>
            </p>
            <p>
              <span>Equipment requirements</span>
              <strong>Check listing</strong>
            </p>
            <small>LIVE DATA · NO PAYMENTS COLLECTED</small>
          </div>
        </section>
      </div>
      <Modal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Precision Filters"
      >
        <form
          className="mobile-precision-form"
          onSubmit={(e) => {
            apply(e);
            setFiltersOpen(false);
          }}
        >
          {["search", "category", "sort"].map((k) => (
            <input key={k} type="hidden" name={k} value={params.get(k) || ""} />
          ))}
          {maxRate && <input type="hidden" name="max" value={maxRate} />}
          <PrecisionFields params={params} />
          <Button>Apply filters</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              router.push("/studios");
              setFiltersOpen(false);
            }}
          >
            Clear filters
          </Button>
        </form>
      </Modal>
    </div>
  );
}
