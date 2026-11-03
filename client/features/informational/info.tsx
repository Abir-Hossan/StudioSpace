export function Info({ type }: { type: string }) {
  return (
    <div className="container page prose">
      <div className="eyebrow">STUDIOSPACE / LOCAL EDITION</div>
      <h1>{type === "terms" ? "Terms of use." : "Your privacy matters."}</h1>
      {type === "terms" ? (
        <>
          <p>
            This local project lets account holders publish studio listings and
            request bookings. A booking is a scheduling request until its host
            confirms it.
          </p>
          <h2>Clear expectations</h2>
          <p>
            No online payment is collected. Booking summaries are not proof of
            payment. Security deposits are estimates to be arranged directly
            with the host. StudioSpace does not supply insurance, equipment
            guarantees or staffed customer assistance.
          </p>
          <h2>Host responsibilities</h2>
          <p>
            Provide accurate descriptions, safe access and clear equipment
            conditions. Listings with booking history cannot be deleted, so
            reservation records remain intact. Agree on liability and
            cancellation terms before a session.
          </p>
        </>
      ) : (
        <>
          <p>
            Account details, password hashes, studio listings, bookings, saved
            spaces, reviews and newsletter interest are stored in your
            configured MongoDB database. Authentication uses an HTTPOnly session
            cookie.
          </p>
          <h2>Local data</h2>
          <p>
            Uploaded images are stored locally as PNG files. Newsletter interest
            is saved locally; no newsletter emails are sent. Google sign-in
            exchanges identity information with Google only when configured and
            initiated by you.
          </p>
          <h2>Your choices</h2>
          <p>
            Edit your name and photo in profile settings, remove saved spaces
            and cancel pending booking requests. The project operator manages
            database retention and deletion. Do not put sensitive personal data
            into this development application.
          </p>
        </>
      )}
    </div>
  );
}
