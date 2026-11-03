import { useQuery } from "@tanstack/react-query";
import { Studio, api } from "../../lib/api";
import { State } from "../../components/shared/state";
import { Card } from "../studios/card";
export function WishlistPage() {
  const q = useQuery<{ studioId: Studio }[]>({
    queryKey: ["wishlist"],
    queryFn: () => api("/wishlist"),
  });
  return (
    <>
      <div className="eyebrow">KEEP THE INSPIRATION CLOSE</div>
      <h1>Saved spaces.</h1>
      <p className="lead">A shortlist of places for your next big idea.</p>
      <State
        loading={q.isPending}
        error={q.error}
        empty={q.data?.length === 0}
      />
      <div className="studio-grid">
        {q.data
          ?.filter((w) => w.studioId)
          .map((w) => (
            <Card key={w.studioId._id} studio={w.studioId} />
          ))}
      </div>
    </>
  );
}
