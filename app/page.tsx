import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Tales Studio — AI Visual Storytelling for Food",
  description:
    "Upload food photos and let AI direct cinematic carousel stories — mood, narrative, templates, and export-ready slides.",
  openGraph: {
    title: "Table Tales Studio",
    description: "AI-directed cinematic food storytelling",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7c600] text-black">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/60">
          AI visual storytelling · Food & restaurants
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight md:text-7xl">
          Your AI cinematic creative director for food stories.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-black/80 md:text-xl">
          Upload photos. AI reads the mood, picks the angle, writes the
          narrative, and renders an export-ready carousel — instantly, no
          friction.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="min-h-[48px] rounded-2xl bg-[#0b0f1a] px-8 py-4 text-sm font-bold text-[#f7c600] shadow-lg transition hover:scale-[1.02]"
          >
            Start creating
          </Link>
          <Link
            href="/dashboard/demo"
            className="min-h-[48px] rounded-2xl border-2 border-black/20 bg-white/50 px-8 py-4 text-sm font-bold transition hover:bg-white"
          >
            Try sample demo
          </Link>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Visual analysis",
              body: "AI detects cuisine, mood, lighting, and storytelling angles from your uploads.",
            },
            {
              title: "Directed narrative",
              body: "Hooks, pacing, sensory slides, and CTAs tuned for retention — not blank captions.",
            },
            {
              title: "Cinematic export",
              body: "Template-matched overlays and retina JPG/PNG packs ready to post.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-3xl bg-[#0b0f1a] p-6 text-white ring-1 ring-white/10"
            >
              <h2 className="text-lg font-bold text-[#f7c600]">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 text-center">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[48px] items-center rounded-2xl bg-[#0b0f1a] px-8 py-4 text-sm font-bold text-[#f7c600] ring-1 ring-white/10"
          >
            Upload and direct your story →
          </Link>
        </section>

        <section className="mt-12 text-center text-sm text-black/60">
          <p className="italic">
            “It felt like a creative director walked into my kitchen.”
          </p>
        </section>
      </div>
    </main>
  );
}
