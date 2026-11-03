import { useUser } from "../../hooks/use-user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock, Film, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { ModuleTitle } from "../../components/shared/workspace";
import { Button } from "../../components/ui";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(100),
  photoURL: z.union([z.string().url("Enter a valid photo URL"), z.literal("")]),
  professionalTitle: z.string().max(100),
  bio: z.string().max(1200),
  phone: z.string().max(40),
  website: z.union([z.string().url("Enter a valid website URL"), z.literal("")]),
  portfolio: z.union([
    z.string().url("Enter a valid portfolio URL"),
    z.literal(""),
  ]),
  bookingPreference: z.string().max(100),
  crewPreference: z.string().max(100),
});

type ProfileField = keyof z.infer<typeof profileSchema>;

export function Profile() {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const stats = useQuery<{
    listings: number;
    totalBookings: number;
    upcoming: number;
    pending: number;
  }>({ queryKey: ["dashboard"], queryFn: () => api("/dashboard") });
  const [tab, setTab] = useState("Personal Info & Bio");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>(
    {},
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = profileSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    if (!result.success) {
      const nextErrors: Partial<Record<ProfileField, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          typeof field === "string" &&
          field in profileSchema.shape &&
          !nextErrors[field as ProfileField]
        )
          nextErrors[field as ProfileField] = issue.message;
      }
      setErrors(nextErrors);
      e.currentTarget
        .querySelector<HTMLElement>(
          `[name="${Object.keys(nextErrors)[0]}"]`,
        )
        ?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await api(
        "/users/me",
        "PATCH",
        result.data,
      );
      await qc.invalidateQueries({ queryKey: ["me"] });
      setDirty(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function fieldError(field: ProfileField) {
    return errors[field] ? (
      <small id={`${field}-error`} className="error" role="alert">
        {errors[field]}
      </small>
    ) : null;
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">IDENTITY // CREATOR WORKSPACE</div>
          <h1>Profile & Production Identity</h1>
          <p>
            Manage your public creative persona, contact details, and studio
            booking preferences.
          </p>
        </div>
        <span className="badge status-Confirmed">● ACCOUNT PROFILE</span>
      </div>
      <section className="profile-cover panel">
        <div
          className="profile-cover-image"
          style={{
            backgroundImage:
              "linear-gradient(0deg,var(--surface),#13131320),url(/images/hero-soundstage.png)",
          }}
        />
        <div className="profile-cover-content">
          <div className="large-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name} />
            ) : (
              user?.name.slice(0, 1)
            )}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <span className="badge status-Confirmed">
              Registered StudioSpace Member
            </span>
            <p>{user?.professionalTitle || "Creator & Studio Host"}</p>
            <small>
              {user?.createdAt
                ? "Member since " +
                  new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })
                : "Account-based production identity"}
            </small>
          </div>
          <div className="profile-shortcuts">
            <Link href="/my-listings" className="button outline">
              <Film size={15} />
              Stages <strong>{stats.data?.listings ?? 0}</strong>
            </Link>
            <Link href="/my-bookings" className="button outline">
              <CalendarDays size={15} />
              Bookings <strong>{stats.data?.totalBookings ?? 0}</strong>
            </Link>
          </div>
        </div>
        <div className="profile-metric-strip">
          <div>
            <small>STUDIOS LISTED</small>
            <strong>{stats.data?.listings ?? 0}</strong>
          </div>
          <div>
            <small>PRODUCTION BOOKINGS</small>
            <strong>{stats.data?.totalBookings ?? 0}</strong>
          </div>
          <div>
            <small>UPCOMING SESSIONS</small>
            <strong>{stats.data?.upcoming ?? 0}</strong>
          </div>
          <div>
            <small>INSURANCE STATUS</small>
            <strong>Not verified</strong>
          </div>
        </div>
      </section>
      <div className="profile-tabs segmented">
        {[
          "Personal Info & Bio",
          "Production Credentials",
          "Booking Preferences",
          "Security & Password",
        ].map((t, i) => {
          const Icon = [Users, ShieldCheck, CalendarDays, LockKeyhole][i];
          return (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              <Icon size={16} />
              {t}
            </button>
          );
        })}
      </div>
      <form
        className="reference-profile-form"
        noValidate
        key={user?._id + "-" + version}
        onSubmit={submit}
        onChange={(e) => {
          setDirty(true);
          const field = e.target.name as ProfileField;
          if (field in profileSchema.shape && errors[field])
            setErrors((current) => ({ ...current, [field]: undefined }));
        }}
      >
        <section
          className="form-module panel"
          hidden={tab !== "Personal Info & Bio"}
        >
          <ModuleTitle
            index="01"
            code="PUBLIC DOSSIER"
            title="Public Creative Bio"
          />
          <p>
            Visible identity and production details for your studio community.
          </p>
          <div className="profile-fields three">
            <label>
              Full name
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={user?.name}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {fieldError("name")}
            </label>
            <label>
              Industry display title
              <input
                name="professionalTitle"
                defaultValue={user?.professionalTitle}
                maxLength={100}
                placeholder="Producer / photographer / studio host"
                aria-invalid={!!errors.professionalTitle}
                aria-describedby={
                  errors.professionalTitle ? "professionalTitle-error" : undefined
                }
              />
              {fieldError("professionalTitle")}
            </label>
            <label>
              Profile photo URL
              <input
                name="photoURL"
                type="url"
                defaultValue={user?.photoURL || ""}
                aria-invalid={!!errors.photoURL}
                aria-describedby={errors.photoURL ? "photoURL-error" : undefined}
              />
              {fieldError("photoURL")}
            </label>
            <label>
              Production inquiries email
              <input readOnly value={user?.email || ""} />
            </label>
            <label>
              Direct dispatch line
              <input
                name="phone"
                defaultValue={user?.phone}
                maxLength={40}
                placeholder="Phone (optional)"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {fieldError("phone")}
            </label>
            <label>
              Studio / production house URL
              <input
                name="website"
                type="url"
                defaultValue={user?.website}
                placeholder="https://your-studio.com"
                aria-invalid={!!errors.website}
                aria-describedby={errors.website ? "website-error" : undefined}
              />
              {fieldError("website")}
            </label>
          </div>
          <label>
            Official portfolio reel
            <input
              name="portfolio"
              type="url"
              defaultValue={user?.portfolio}
              placeholder="https://your-portfolio.com"
              aria-invalid={!!errors.portfolio}
              aria-describedby={errors.portfolio ? "portfolio-error" : undefined}
            />
            {fieldError("portfolio")}
          </label>
          <label>
            Director & host statement
            <textarea
              name="bio"
              maxLength={1200}
              rows={5}
              defaultValue={user?.bio}
              placeholder="Tell creators about your work, production approach, and studio experience."
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? "bio-error" : undefined}
            />
            {fieldError("bio")}
          </label>
          <small className="muted">
            Your email address cannot be changed in this edition.
          </small>
        </section>
        <section
          className="form-module panel"
          hidden={
            tab !== "Personal Info & Bio" && tab !== "Production Credentials"
          }
        >
          <ModuleTitle
            index="02"
            code="RESPONSIBILITY & SAFETY"
            title="Production Insurance & Verification"
          />
          <p>
            Review your own coverage and permit requirements before arranging a
            studio session.
          </p>
          <div className="insurance-disclosure">
            <div>
              <span className="eyebrow">PLATFORM STATUS</span>
              <h3>Insurance verification is not enabled.</h3>
              <p>
                StudioSpace does not supply insurance, verify policy documents,
                or certify union credentials. Hosts and creators should agree on
                coverage and production safety directly.
              </p>
            </div>
            <div>
              <p>
                <ShieldCheck size={16} />
                Equipment conditions: Confirm with host
              </p>
              <p>
                <Film size={16} />
                Specialist permits: Arrange independently
              </p>
              <p>
                <Users size={16} />
                Crew safety: Shared responsibility
              </p>
              <Link href="/terms" className="text-link">
                Read studio use information
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
        <section
          className="form-module panel"
          hidden={
            tab !== "Personal Info & Bio" && tab !== "Booking Preferences"
          }
        >
          <ModuleTitle
            index="03"
            code="DISPATCH DETAILS"
            title="Account Shortcuts & Production Preferences"
          />
          <p>
            Save your planning preferences. These do not reserve time or modify
            studio rates.
          </p>
          <div className="three">
            <label>
              Default production call block
              <select
                name="bookingPreference"
                defaultValue={user?.bookingPreference || "Hourly session"}
              >
                {[
                  "Hourly session",
                  "Half-day production",
                  "Full-day production",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              {fieldError("bookingPreference")}
              <small>
                Planning preference; each booking requires selected hours.
              </small>
            </label>
            <label>
              Crew capacity preference
              <select
                name="crewPreference"
                defaultValue={user?.crewPreference || "1–5 people"}
              >
                {[
                  "1–5 people",
                  "6–10 people",
                  "11–25 people",
                  "26+ people",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              {fieldError("crewPreference")}
            </label>
            <div>
              <span className="field-label">PAYMENT SERVICES</span>
              <p>No settlement card is stored and no payment is collected.</p>
              <Link href="/my-bookings" className="text-link">
                View your booking records
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>
        {tab === "Security & Password" && (
          <section className="form-module panel">
            <ModuleTitle
              index="04"
              code="ACCOUNT SECURITY"
              title="Security & Password"
            />
            <p>
              Your session uses an HTTPOnly authentication cookie. Password
              changes and recovery are not available in this edition. Google
              accounts sign in through Google’s authorization flow.
            </p>
            <Link href="/privacy" className="button outline">
              Read Privacy Information
            </Link>
          </section>
        )}
        <div className="save-bar">
          <span>
            <Clock size={15} />
            {dirty
              ? "Unsaved profile adjustments"
              : "Your profile details are up to date."}
          </span>
          <div className="button-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setVersion((v) => v + 1);
                setDirty(false);
              }}
            >
              Discard Changes
            </Button>
            <Button disabled={busy}>
              {busy ? "Saving…" : "Save Profile Changes"}
              <Check size={15} />
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
