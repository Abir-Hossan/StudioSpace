export function PrecisionFields({ params }: { params: URLSearchParams }) {
  return (
    <>
      <fieldset>
        <legend>LOCATION & CREW</legend>
        <label>
          Production location
          <input
            name="location"
            placeholder="City or neighborhood"
            defaultValue={params.get("location") || ""}
          />
        </label>
        <label>
          Crew size
          <input
            name="crew"
            type="number"
            min="1"
            placeholder="Number of people"
            defaultValue={params.get("crew") || ""}
          />
        </label>
        <label>
          Production date
          <input
            name="availableDate"
            type="date"
            defaultValue={params.get("availableDate") || ""}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>ARCHITECTURAL SPECS</legend>
        <label>
          Minimum grid height (ft)
          <input
            name="minHeight"
            type="number"
            min="0"
            defaultValue={params.get("minHeight") || ""}
          />
        </label>
        <label>
          Minimum hourly price
          <input
            name="min"
            type="number"
            min="0"
            defaultValue={params.get("min") || ""}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>MINIMUM RATING</legend>
        <select
          name="minRating"
          aria-label="Minimum rating"
          defaultValue={params.get("minRating") || ""}
        >
          <option value="">Any rating</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </select>
      </fieldset>
      <fieldset>
        <legend>AMENITIES INCLUDED</legend>
        {[
          "Lighting kit",
          "High-speed Wi-Fi",
          "Climate control",
          "Equipment storage",
          "Changing room",
          "Ground-floor access",
        ].map((a) => (
          <label className="check-label" key={a}>
            <input
              name="amenity"
              type="checkbox"
              value={a}
              defaultChecked={params.get("amenities")?.split(",").includes(a)}
            />
            {a}
          </label>
        ))}
      </fieldset>
    </>
  );
}
