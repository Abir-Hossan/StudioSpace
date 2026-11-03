import { z } from "zod";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, categories } from "../../lib/api";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, Camera, Check, Eye, EyeOff, Film, LockKeyhole, Mail, ShieldCheck, Users } from "lucide-react";
import { Brand } from "../../components/layout/header";
import Link from "next/link";
import { Button, Modal } from "../../components/ui";
const authFields = {
  remember: z.boolean().optional(),
  accepted: z.boolean().optional(),
  accountIntent: z.enum(["creator", "host"]).optional(),
  name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  photoURL: z
    .union([z.string().url("Enter a valid photo URL"), z.literal("")])
    .optional(),
  confirm: z.string().optional(),
};

const signInSchema = z.object({
  ...authFields,
  password: z.string().max(128),
});

const registrationSchema = z.object({
  ...authFields,
  password: z
    .string()
    .min(6, "Use at least six characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter"),
});

type AuthValues = z.infer<typeof registrationSchema>;

export function Auth({ register: signup }: { register: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<AuthValues>({
    resolver: zodResolver(signup ? registrationSchema : signInSchema),
    defaultValues: { remember: true, accountIntent: "creator" },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [forgot, setForgot] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();
  const count = useQuery<{ total: number }>({
    queryKey: ["studio-count"],
    queryFn: () => api("/studios"),
  });
  const intent = watch("accountIntent");
  const pass = watch("password") || "";
  useEffect(() => {
    const err = new URLSearchParams(location.search).get("error");
    if (err) toast.error(err);
  }, []);
  async function submit(d: AuthValues) {
    if (signup && (!d.name || d.name.trim().length < 2)) {
      setError("name", { message: "Enter your full name" });
      return;
    }
    if (signup && d.password !== d.confirm) {
      setError("confirm", { message: "Passwords do not match" });
      return;
    }
    if (signup && !d.accepted) {
      setError("accepted", {
        message: "Please agree to the terms and privacy policy",
      });
      return;
    }
    try {
      await api("/auth/" + (signup ? "register" : "login"), "POST", d);
      toast.success(
        signup ? "Account created. Sign in to get started." : "Welcome back",
      );
      await qc.invalidateQueries({ queryKey: ["me"] });
      const next = new URLSearchParams(location.search).get("next");
      const destination = next?.startsWith("/") && URL.canParse(next, location.origin)
        ? new URL(next, location.origin)
        : null;
      const returnPath = destination?.origin === location.origin && !destination.pathname.startsWith("//")
        ? destination.pathname + destination.search + destination.hash
        : "/dashboard";
      router.push(signup ? "/login" : returnPath);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <div
      className={
        "auth-layout reference-auth " +
        (signup ? "registration-page" : "login-page")
      }
    >
      <section className="auth-art">
        <img
          src={
            "/images/" + (signup ? "hero-music" : "reference-login") + ".png"
          }
          alt={
            signup
              ? "Creative music production studio"
              : "Cinematic film production studio"
          }
        />
        <div className="auth-network">
          <span className="pill">
            <span className="tiny-dot" />
            LIVE CREATIVE NETWORK
          </span>
          <small>{count.data?.total ?? "…"} studio spaces</small>
          <small>{categories.length} creative disciplines</small>
        </div>
        <div className="auth-art-copy">
          <span className="eyebrow">
            {signup ? "SOUNDSTAGE & SPACE EXCHANGE" : "ARCHITECTURE OF CINEMA"}
          </span>
          <h1>
            {signup ? (
              <>
                Join the Creative
                <br />
                <span className="accent">Workspace</span> Network.
              </>
            ) : (
              <>
                Find Your Space.
                <br />
                <span className="accent">Create Your Story.</span>
              </>
            )}
          </h1>
          {signup ? (
            <>
              <p>
                Discover creative spaces for film production, commercial stills,
                podcasting, music, and hands-on artistry.
              </p>
              <div className="signup-benefits">
                {[
                  [
                    ShieldCheck,
                    "Find your production setting",
                    "Compare equipment, location and hourly rates in one place.",
                  ],
                  [
                    Users,
                    "Share your space with creators",
                    "List your studio and stay in control of booking requests.",
                  ],
                  [
                    CalendarDays,
                    "Plan a session with clarity",
                    "Save spaces, request hours and track host-confirmed reservations.",
                  ],
                ].map(([Icon, title, text]) => {
                  const I = Icon as typeof Film;
                  return (
                    <div key={String(title)}>
                      <I size={23} />
                      <section>
                        <h3>{String(title)}</h3>
                        <p>{String(text)}</p>
                      </section>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
          <div className="production-note">
            <p>
              {signup
                ? "“Make room for what comes next. A great space gives a new idea somewhere to begin.”"
                : "“Every frame begins with the room you build around it. Find the environment that lets your production take shape.”"}
            </p>
            <small>STUDIOSPACE · CREATIVE PRODUCTION</small>
          </div>
          {!signup && (
            <div className="auth-fact-tiles">
              <div>
                <small>CREATIVE SPACES</small>
                <strong>{count.data?.total ?? "…"}</strong>
              </div>
              <div>
                <small>STUDIO TYPES</small>
                <strong className="accent">
                  {categories.length} Categories
                </strong>
              </div>
              <div>
                <small>RESERVATIONS</small>
                <strong className="positive">Host Confirmed</strong>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <Brand />
          <small className="eyebrow">
            {signup
              ? "PORTAL TERMINAL / CREATIVE COMMUNITY"
              : "YOUR PRODUCTION WORKSPACE"}
          </small>
          <h1>{signup ? "Create Creator Account" : "Welcome Back"}</h1>
          <p>
            {signup
              ? "Book creative stages or list your facilities today."
              : "Sign in to access your soundstage bookings, studio listings, and production schedule."}
          </p>
          {signup && (
            <div className="intent-selector segmented">
              <button
                type="button"
                className={intent === "creator" ? "active" : ""}
                onClick={() => setValue("accountIntent", "creator")}
              >
                <Camera size={17} />
                I’m a Creator / Renter
              </button>
              <button
                type="button"
                className={intent === "host" ? "active" : ""}
                onClick={() => setValue("accountIntent", "host")}
              >
                <Film size={17} />
                I’m a Studio Host / Owner
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit(submit)} noValidate>
            {signup && (
              <label>
                Full name
                <input
                  {...register("name")}
                  autoComplete="name"
                  placeholder="Alex Rivera"
                />
                {errors.name && (
                  <small className="error">{errors.name.message}</small>
                )}
              </label>
            )}
            <label>
              {signup ? "Professional production email" : "Email address"}
              <div className="input-icon">
                <Mail size={17} />
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  aria-label="Email address"
                  placeholder="director@production.co"
                />
              </div>
              {errors.email && (
                <small className="error">{errors.email.message}</small>
              )}
            </label>
            {signup && (
              <label>
                Profile photo URL (optional)
                <div className="input-icon">
                  <Camera size={18} />
                  <input
                    {...register("photoURL")}
                    type="url"
                    placeholder="https://your-image-url"
                  />
                </div>
                {errors.photoURL && (
                  <small className="error">{errors.photoURL.message}</small>
                )}
              </label>
            )}
            <label>
              <span className="password-label">
                Password
                {!signup && (
                  <button type="button" onClick={() => setForgot(true)}>
                    Forgot Password?
                  </button>
                )}
              </span>
              <div className="password-input input-icon">
                <LockKeyhole size={17} />
                <input
                  {...register("password")}
                  aria-label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <small className="error">{errors.password.message}</small>
              )}
            </label>
            {signup ? (
              <>
                <div className="password-checks">
                  <span className={pass.length >= 6 ? "positive" : ""}>
                    <Check size={14} />
                    Min 6 characters
                  </span>
                  <span className={/[A-Z]/.test(pass) ? "positive" : ""}>
                    <Check size={14} />
                    Uppercase letter
                  </span>
                  <span className={/[a-z]/.test(pass) ? "positive" : ""}>
                    <Check size={14} />
                    Lowercase letter
                  </span>
                </div>
                <label>
                  Confirm password
                  <input
                    {...register("confirm")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                  />
                  {errors.confirm && (
                    <small className="error">{errors.confirm.message}</small>
                  )}
                </label>
                <label className="check-label terms-agreement">
                  <input type="checkbox" {...register("accepted")} />
                  <span>
                    I agree to the StudioSpace{" "}
                    <Link href="/terms">Terms of Use</Link> and{" "}
                    <Link href="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.accepted && (
                  <small className="error">{errors.accepted.message}</small>
                )}
              </>
            ) : (
              <label className="check-label remember">
                <input type="checkbox" {...register("remember")} />
                Keep me signed in for 7 days
              </label>
            )}
            <Button
              aria-label={signup ? "Create Account" : "Sign In"}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait…"
                : signup
                  ? "Complete Registration"
                  : "Sign In to StudioSpace"}
              <ArrowRight size={19} />
            </Button>
          </form>
          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>
          <a href="/api/auth/google" className="button outline google-signin">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285f4"
                d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.4c2-1.9 2.8-4.4 2.8-7.9Z"
              />
              <path
                fill="#34a853"
                d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.9-1.8-5.7-4.2H2.9v2.7A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#fbbc05"
                d="M6.3 13.7A6 6 0 0 1 6 12c0-.6.1-1.2.3-1.7V7.6H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.4l3.3-2.7Z"
              />
              <path
                fill="#ea4335"
                d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.9 9.9 0 0 0 12 2a10 10 0 0 0-9.1 5.6l3.4 2.7C7.1 7.9 9.4 6.1 12 6.1Z"
              />
            </svg>
            Continue with Google Workspace
          </a>
          <p className="auth-switch">
            {signup
              ? "Already have an active account?"
              : "Don’t have a studio production account?"}
            <Link href={signup ? "/login" : "/register"}>
              {signup
                ? "Sign in to StudioSpace"
                : "Create an Account / Register"}
              <ArrowRight size={14} />
            </Link>
          </p>
          <div className="auth-security">
            <ShieldCheck size={16} />
            HTTPOnly authentication cookies<span>•</span>
            <LockKeyhole size={16} />
            Private workspace access
          </div>
        </div>
      </section>
      <Modal open={forgot} onOpenChange={setForgot} title="Password recovery">
        <p>
          Password recovery is not available in this local edition. Use your
          existing account password or Google sign-in if your account was
          registered with Google.
        </p>
        <Button onClick={() => setForgot(false)}>Back to Sign In</Button>
      </Modal>
    </div>
  );
}
