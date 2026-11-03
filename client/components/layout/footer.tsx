"use client";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, categories } from "../../lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { Brand } from "./header";
import { SocialLinks } from "../social-links";
import { Button } from "../ui";
export function Footer() {
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  async function subscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ message: string }>("/newsletter", "POST", {
        email: new FormData(e.currentTarget).get("email"),
      });
      toast.success(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (path === "/login" || path === "/register")
    return (
      <footer className="auth-footer">
        <span>
          © {new Date().getFullYear()} StudioSpace. All rights reserved.
        </span>
        <div>
          <Link href="/terms">Production Use Terms</Link>
          <Link href="/privacy">Privacy & Safety</Link>
          <Link href="/studios">Soundstage Network</Link>
        </div>
      </footer>
    );
  return (
    <footer
      className={
        "reference-footer " +
        (path === "/studios"
          ? "explore-footer"
          : /^\/studios\/[^/]+$/.test(path)
            ? "detail-footer"
            : "")
      }
    >
      <div className="footer-grid">
        <div>
          <Brand />
          <p>
            Cinematic soundstages, cyclorama rooms, and audio suites for
            creative crews, directors, and artists.
          </p>
          <SocialLinks />
        </div>
        <div>
          <h4>CATEGORIES</h4>
          {categories.map((c) => (
            <Link key={c} href={"/studios?category=" + encodeURIComponent(c)}>
              {c}
            </Link>
          ))}
        </div>
        <div>
          <h4>PLATFORM</h4>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/about">About StudioSpace</Link>
          <Link href="/terms">Host Guidelines</Link>
          <Link href="/privacy">Privacy & Safety</Link>
          <Link href="/add-studio">Host Your Space</Link>
        </div>
        <div>
          <h4>PRODUCTION CALL SHEET</h4>
          <p>
            Receive future space updates and production news.
            <br />
            Interest is saved; email delivery is not enabled.
          </p>
          <form onSubmit={subscribe} className="newsletter">
            <input
              name="email"
              type="email"
              aria-label="Newsletter email"
              placeholder="director@production.co"
              required
            />
            <Button
              variant="outline"
              disabled={busy}
              aria-label="Save newsletter interest"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} StudioSpace. Designed for analog
          tactility and digital speed.
        </span>
        <div>
          <span>CREATIVE SPACE NETWORK</span>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/terms">Studio Regulations</Link>
        </div>
      </div>
    </footer>
  );
}
