"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="error-state">
      <h1>Something failed</h1>
      <p>{error.message}</p>
      <button className="button" type="button" onClick={reset}>Try again</button>
    </section>
  );
}
