src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MRZ Generator — ICAO 9303 Compliant" },
      { name: "description", content: "Generate ICAO 9303 compliant Machine Readable Zone codes for passports, ID cards and visas." },
      { property: "og:title", content: "MRZ Generator — ICAO 9303 Compliant" },
      { property: "og:description", content: "Generate MRZ codes for passports, ID cards and visas. Free, open-source, no backend required." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#fcfbf8" }}
    >
      <img
        data-lovable-blank-page-placeholder="REMOVE_THIS"
        src="https://cdn.gpteng.co/blank-app-v1.svg"
        alt="Your app will live here!"
      />
    </div>
    <iframe
      src="/mrz/index.html"
      title="MRZ Generator"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        display: "block",
      }}
    />
  );
}
