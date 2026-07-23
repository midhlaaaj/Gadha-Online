"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1 style={{ color: "#1B3A6B", fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#4A5A7A", fontSize: "14px", maxWidth: "380px", marginBottom: "24px" }}>
            We hit an unexpected error. Please try again — if the problem keeps happening, contact support.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                backgroundColor: "#2F7FE8",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate plain <a>: this is the last-resort fallback for when the root layout itself crashes, so it must not depend on next/link's router context, which could be part of what's broken */}
            <a
              href="/"
              style={{
                padding: "10px 20px",
                backgroundColor: "#fff",
                color: "#1B3A6B",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                border: "1px solid #D0DCF5",
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
