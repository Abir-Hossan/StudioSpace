"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container">
      <h1>Something interrupted your session.</h1>
      <p>Please try again.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
