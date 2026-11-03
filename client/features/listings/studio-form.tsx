import { useUser } from "../../hooks/use-user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Studio, api, categories } from "../../lib/api";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { State } from "../../components/shared/state";
import { ModuleTitle } from "../../components/shared/workspace";
import { icons } from "../../config/category-icons";
import { ArrowRight, Clock, ImagePlus, MapPin, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { Button, Modal } from "../../components/ui";
export function StudioForm({ id }: { id?: string }) {
  const { data: user } = useUser();
  const q = useQuery<Studio>({
    queryKey: ["studio", id],
    queryFn: () => api("/studios/" + id),
    enabled: !!id,
  });
  const router = useRouter();
  const qc = useQueryClient();
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState(categories[0]);
  const [amenities, setAmenities] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draftSaved, setDraftSaved] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  useEffect(() => {
    if (q.data) {
      setImages(q.data.images);
      setCategory(q.data.category);
      setAmenities(q.data.amenities.join(", "));
    }
  }, [q.data]);
  useEffect(() => {
    if (id || !user?._id) return;
    try {
      const raw = localStorage.getItem("studiospace-studio-draft:" + user._id);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft.fields || !Array.isArray(draft.images)) return;
      setImages(
        draft.images
          .filter(
            (src: unknown) =>
              typeof src === "string" &&
              /^\/images\/[a-zA-Z0-9_-]+\.png$/.test(src),
          )
          .slice(0, 12),
      );
      if (categories.includes(draft.category)) setCategory(draft.category);
      setAmenities(String(draft.amenities || ""));
      for (const [name, value] of Object.entries(draft.fields)) {
        const control = (
          document.getElementById("studio-editor") as HTMLFormElement
        )?.elements.namedItem(name);
        if (
          control instanceof HTMLInputElement ||
          control instanceof HTMLTextAreaElement ||
          control instanceof HTMLSelectElement
        ) {
          if (!(control instanceof HTMLInputElement && control.type === "file"))
            control.value = String(value);
        }
      }
      setDraftSaved("Draft restored from this device.");
    } catch {
      toast.error("The saved draft could not be restored.");
    }
  }, [id, user?._id]);
  function saveDraft() {
    if (!user) return;
    const form = document.getElementById("studio-editor") as HTMLFormElement;
    try {
      localStorage.setItem(
        "studiospace-studio-draft:" + user._id,
        JSON.stringify({
          fields: Object.fromEntries(new FormData(form)),
          images,
          category,
          amenities,
          savedAt: new Date().toISOString(),
        }),
      );
      setDraftSaved(
        "Draft saved on this device at " + new Date().toLocaleTimeString(),
      );
      toast.success("Draft saved on this device");
    } catch {
      toast.error("Could not save the draft on this device.");
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.set("image", file);
      const r = await api<{ url: string }>("/uploads", "POST", data);
      setImages((a) => [...a, r.url].slice(0, 12));
      toast.success("Image uploaded and converted to PNG");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!images.length) {
      toast.error("Upload at least one studio image");
      return;
    }
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    setBusy(true);
    try {
      const data = Object.fromEntries(f);
      await api("/studios" + (id ? "/" + id : ""), id ? "PATCH" : "POST", {
        ...data,
        category,
        status:
          submitter?.name === "listingStatus"
            ? submitter.value
            : q.data?.status || "active",
        hourlyRate: Number(data.hourlyRate),
        securityDeposit: Number(data.securityDeposit),
        maxCapacity: Number(data.maxCapacity),
        images,
        amenities: amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        specs: {
          usableArea: data.usableArea ? Number(data.usableArea) : undefined,
          gridHeight: data.gridHeight ? Number(data.gridHeight) : undefined,
          powerSupply: String(data.powerSupply || ""),
          soundproofRating: String(data.soundproofRating || ""),
          access: String(data.access || ""),
          parking: String(data.parking || ""),
        },
        rules: String(data.rules || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["listings"] }),
        qc.invalidateQueries({ queryKey: ["studio", id] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["studios"] }),
        qc.invalidateQueries({ queryKey: ["featured"] }),
      ]);
      if (!id && user)
        localStorage.removeItem("studiospace-studio-draft:" + user._id);
      toast.success(id ? "Studio updated" : "Studio published");
      router.push("/my-listings");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setDeleting(true);
    try {
      await api("/studios/" + id, "DELETE");
      await qc.invalidateQueries({ queryKey: ["listings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Studio deleted");
      router.push("/my-listings");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  function toggleAmenity(a: string) {
    const list = amenities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setAmenities(
      (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]).join(
        ", ",
      ),
    );
  }
  if (id && q.isPending) return <State loading />;
  if (id && (q.error || q.data?.ownerId !== user?._id))
    return (
      <State
        error={q.error || new Error("Only the host may edit this studio")}
      />
    );
  const s = q.data;
  const sp = s?.specs || {};
  const identity = (
    <section className="form-module panel">
      <ModuleTitle
        index="01"
        code="STAGE-META"
        title={
          id
            ? "Stage Identification & Classification"
            : "Basic Information & Archetype"
        }
      />
      <label>
        Studio title
        <input
          name="title"
          required
          minLength={3}
          maxLength={150}
          defaultValue={s?.title}
          placeholder="The Obsidian Cyc & Volume Stage"
        />
      </label>
      <label className="field-label">Primary Production Classification</label>
      <div className="category-choices">
        {categories.map((c, i) => {
          const Icon = icons[i];
          return (
            <button
              key={c}
              type="button"
              className={category === c ? "selected" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              <Icon size={23} />
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      <label>
        Tell the story of your space
        <textarea
          name="overview"
          required
          minLength={20}
          maxLength={10000}
          rows={6}
          defaultValue={s?.overview}
          placeholder="Describe the studio, acoustics, lighting and what makes it suitable for your next production."
        />
      </label>
      <div className="two">
        <label>
          Usable floor area (sq ft)
          <input
            name="usableArea"
            type="number"
            min="1"
            defaultValue={sp.usableArea}
            placeholder="Optional"
          />
        </label>
        <label>
          Grid / ceiling height (ft)
          <input
            name="gridHeight"
            type="number"
            min="1"
            step="0.1"
            defaultValue={sp.gridHeight}
            placeholder="Optional"
          />
        </label>
      </div>
    </section>
  );
  const pricing = (
    <section className="form-module panel">
      <ModuleTitle
        index="02"
        code="FINANCIAL-CLEARANCE"
        title={id ? "Pricing Envelope" : "Commercial Terms & Personnel Limits"}
      />
      <div className={id ? "" : "three"}>
        <label>
          Hourly rate (USD)
          <input
            name="hourlyRate"
            type="number"
            min="1"
            max="100000"
            step="0.01"
            required
            defaultValue={s?.hourlyRate}
          />
          <small>Standard production rate / hour</small>
        </label>
        <label>
          Security deposit (USD)
          <input
            name="securityDeposit"
            type="number"
            min="0"
            max="100000"
            step="0.01"
            required
            defaultValue={s?.securityDeposit ?? 0}
          />
          <small>Arrange directly with your host</small>
        </label>
        <label>
          Maximum capacity
          <input
            name="maxCapacity"
            type="number"
            min="1"
            max="10000"
            required
            defaultValue={s?.maxCapacity || 6}
          />
          <small>Maximum crew and cast / persons</small>
        </label>
      </div>
      <div className="booking-assurance">
        <ShieldCheck size={18} />
        <span>
          Reservations require host confirmation. No online payment or escrow
          service is provided.
        </span>
      </div>
    </section>
  );
  const logistics = (
    <section className="form-module panel">
      <ModuleTitle
        index={id ? "04" : "03"}
        code="LOGISTICS-GPS"
        title={
          id
            ? "Logistics, Access & Dispatch"
            : "Physical Dispatch & Load-In Vector"
        }
      />
      <label>
        Street address
        <input
          name="address"
          required
          minLength={3}
          maxLength={300}
          defaultValue={s?.address}
        />
      </label>
      <div className="two">
        <label>
          City
          <input
            name="city"
            required
            minLength={2}
            maxLength={100}
            defaultValue={s?.city}
          />
        </label>
        <label>
          Country
          <input
            name="country"
            required
            minLength={2}
            maxLength={100}
            defaultValue={s?.country}
          />
        </label>
      </div>
      <div className="location-blueprint">
        <MapPin size={30} />
        <strong>
          {s
            ? s.address + ", " + s.city
            : "Your production address appears on your studio listing."}
        </strong>
        <span>Host-provided location · Confirm access before arrival</span>
      </div>
      <div className="two">
        <label>
          Truck & crew entry / access
          <input
            name="access"
            defaultValue={sp.access}
            placeholder="Ground-floor access, freight lift, entry instructions"
            maxLength={300}
          />
        </label>
        <label>
          Production vehicle parking
          <input
            name="parking"
            defaultValue={sp.parking}
            placeholder="Parking spaces and loading conditions"
            maxLength={150}
          />
        </label>
      </div>
    </section>
  );
  const media = (
    <section className="form-module panel">
      <ModuleTitle
        index={id ? "02" : "04"}
        code="LOCAL PNG ASSETS"
        title={
          id ? "Production Asset Gallery" : "High-Res Media Asset Ingestion"
        }
      />
      <div
        className="upload media-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          for (const f of Array.from(e.dataTransfer.files).slice(
            0,
            12 - images.length,
          ))
            await upload(f);
        }}
      >
        <ImagePlus size={35} />
        <h3>
          {uploading
            ? "Converting and uploading…"
            : "Drop production photos or studio stills here"}
        </h3>
        <p>
          PNG, JPG and WebP · Maximum 10 MB each
          <br />
          Saved locally as optimized PNG · Up to 12 images
        </p>
        <label className="button outline file-picker">
          Browse Computer Files
          <input
            aria-label="Upload studio photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading || images.length >= 12}
            multiple
            onChange={async (e) => {
              for (const file of Array.from(e.target.files || []).slice(
                0,
                12 - images.length,
              ))
                await upload(file);
            }}
          />
        </label>
      </div>
      <div className="upload-previews">
        {images.map((src, i) => (
          <div key={src + i}>
            <img src={src} alt={"Studio upload " + (i + 1)} />
            <span>{i === 0 ? "COVER PHOTO" : "STUDIO STILL " + i}</span>
            <button
              type="button"
              aria-label={"Remove image " + (i + 1)}
              onClick={() => setImages((a) => a.filter((_, n) => n !== i))}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
  const utilities = (
    <section className="form-module panel">
      <ModuleTitle
        index={id ? "03" : "05"}
        code="POWER-GRID"
        title={
          id
            ? "Production Spec Matrix & Utilities"
            : "Technical Amenities & Electrical Distribution"
        }
      />
      <div className="two">
        <label>
          Power supply
          <input
            name="powerSupply"
            defaultValue={sp.powerSupply}
            maxLength={150}
            placeholder="Power rating, outlets and distribution"
          />
        </label>
        <label>
          Acoustics / sound isolation
          <input
            name="soundproofRating"
            defaultValue={sp.soundproofRating}
            maxLength={150}
            placeholder="Host-supplied rating or description"
          />
        </label>
      </div>
      <div className="amenity-picker">
        {[
          "High-speed Wi-Fi",
          "Lighting kit",
          "Climate control",
          "Equipment storage",
          "Changing room",
          "Ground-floor access",
          "Green room",
          "Freight lift",
          "Parking",
          "Restroom",
        ].map((a) => (
          <label className="check-label" key={a}>
            <input
              type="checkbox"
              checked={amenities
                .split(",")
                .map((s) => s.trim())
                .includes(a)}
              onChange={() => toggleAmenity(a)}
            />
            {a}
          </label>
        ))}
      </div>
      <label>
        Additional amenities (comma separated)
        <input
          name="amenities"
          value={amenities}
          onChange={(e) => setAmenities(e.target.value)}
          placeholder="Add your specific equipment and facilities"
        />
      </label>
      <label>
        Production policies & stage rules (one per line)
        <textarea
          name="rules"
          rows={4}
          maxLength={6000}
          defaultValue={s?.rules?.join("\n")}
          placeholder="Noise and working hours&#10;Equipment and clean-up conditions&#10;Specialist activities requiring prior agreement"
        />
      </label>
    </section>
  );
  const host = (
    <section className="form-module panel host-dossier">
      <ModuleTitle
        index="06"
        code="ACCOUNT IDENTITY"
        title={id ? "Host Credential Vault" : "Host & Guarantor Dossier"}
      />
      <div className={id ? "" : "two"}>
        <label>
          Host name
          <input value={user?.name || ""} readOnly />
        </label>
        <label>
          Host email
          <input value={user?.email || ""} readOnly />
        </label>
      </div>
      <p className="small muted">
        <ShieldCheck size={15} />
        Host identity is derived from your signed-in account and cannot be
        overridden in this form. Insurance and permit verification are not
        provided by StudioSpace.
      </p>
      <Link href="/profile-settings" className="text-link">
        Manage profile identity
        <ArrowRight size={14} />
      </Link>
    </section>
  );
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">
            CREATOR WORKSPACE /{" "}
            {id ? "INVENTORY / EDIT STAGE" : "STAGE ONBOARDING / SPECS"}
          </div>
          <h1>
            {id ? "Update Studio Specifications" : "Onboard New Creative Space"}
          </h1>
          <p>
            {id
              ? "Modify technical power drops, acoustics, hourly rates, and operational logistics for " +
                s?.title +
                "."
              : "Register your soundstage, daylight loft, audio suite, or production workshop in the StudioSpace network."}
          </p>
        </div>
        <div className="button-row">
          {!id && (
            <Button
              variant="outline"
              onClick={() => {
                const form = document.getElementById(
                  "studio-editor",
                ) as HTMLFormElement;
                setPreviewTitle(
                  (form.elements.namedItem("title") as HTMLInputElement).value,
                );
                setPreview(true);
              }}
            >
              Preview Listing
            </Button>
          )}
          <Link href="/my-listings" className="button outline">
            Discard Changes
          </Link>
          <Button form="studio-editor" disabled={busy || uploading}>
            {busy ? "Saving…" : id ? "Save Changes" : "Publish Studio"}
          </Button>
        </div>
      </div>
      <form
        id="studio-editor"
        className={
          "studio-form reference-studio-form " + (id ? "edit-studio-form" : "")
        }
        onSubmit={submit}
        key={s?._id || "new"}
      >
        {id ? (
          <>
            <div className="edit-main">
              {identity}
              {media}
              {utilities}
              {logistics}
            </div>
            <aside className="edit-aside">
              {pricing}
              {host}
              <section className="panel decommission">
                <h3>Decommission or Pause Listing</h3>
                <p>
                  Paused spaces are hidden from search and stop accepting new
                  booking requests. Booking history is preserved.
                </p>
                <Button
                  name="listingStatus"
                  value={s?.status === "paused" ? "active" : "paused"}
                  variant="outline"
                  disabled={busy}
                >
                  {s?.status === "paused" ? "Resume Listing" : "Pause Listing"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDelete(true)}
                >
                  Delete Studio…
                </Button>
              </section>
            </aside>
          </>
        ) : (
          <>
            {identity}
            {pricing}
            {logistics}
            {media}
            {utilities}
            {host}
          </>
        )}
        <div className="save-bar">
          <span>
            <Clock size={15} />
            {id
              ? "Changes are published only when you save."
              : draftSaved ||
                "Complete your production details before publishing."}
          </span>
          <div className="button-row">
            <Link href="/my-listings" className="button outline">
              Discard Changes
            </Link>
            {!id && (
              <Button type="button" variant="outline" onClick={saveDraft}>
                Save Draft
              </Button>
            )}
            <Button disabled={busy || uploading}>
              {busy ? "Saving…" : id ? "Save Changes" : "Publish Studio"}
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </form>
      <Modal
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete this studio?"
      >
        <p>
          Studios with booking history cannot be deleted. Pausing preserves all
          records and removes the studio from search.
        </p>
        <Button onClick={remove} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete Studio"}
        </Button>
      </Modal>
      <Modal open={preview} onOpenChange={setPreview} title="Listing preview">
        <p>
          Your studio will appear in the marketplace’s card layout. Uploaded
          images, pricing, technical details and amenities are saved only when
          you publish.
        </p>
        {images[0] && (
          <img
            className="lightbox-main"
            src={images[0]}
            alt="New studio cover preview"
          />
        )}
        <p>
          <strong>{previewTitle || "Your new studio"}</strong>
        </p>
        <span className="badge">{category}</span>
      </Modal>
    </>
  );
}
