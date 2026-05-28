import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Tales Studio — AI Food Carousel Creator",
  description:
    "Create cinematic Instagram food storytelling carousels with AI captions, templates, and production-ready export.",
  openGraph: {
    title: "Table Tales Studio",
    description: "AI Food Storytelling Carousel Generator for creators",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7c600] text-black">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/60">
          Creator SaaS · Food storytelling
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight md:text-7xl">
          Cinematic food carousels, powered by AI.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-black/80 md:text-xl">
          Table Tales Studio helps food creators build Instagram-ready
          carousel stories with templates, cloud projects, and retina export —
          without leaving your cinematic brand.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="min-h-[48px] rounded-2xl bg-[#0b0f1a] px-8 py-4 text-sm font-bold text-[#f7c600] shadow-lg transition hover:scale-[1.02]"
          >
            Start creating free
          </Link>
          <Link
            href="/login"
            className="min-h-[48px] rounded-2xl border-2 border-black/20 bg-white/50 px-8 py-4 text-sm font-bold transition hover:bg-white"
          >
            Sign in
          </Link>
          <Link
            href="/pricing"
            className="min-h-[48px] rounded-2xl border-2 border-black/10 px-8 py-4 text-sm font-bold transition hover:bg-white/80"
          >
            View pricing
          </Link>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "AI story engine",
              body: "Hooks, pacing, and CTAs tuned for Instagram food reels and carousels.",
            },
            {
              title: "Creator templates",
              body: "Street food, cinematic dark, founder story, and luxury dining styles.",
            },
            {
              title: "Production export",
              body: "2× retina JPG/PNG slides and ZIP packs ready to post.",
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
            href="/pricing"
            className="inline-flex min-h-[48px] items-center rounded-2xl bg-[#0b0f1a] px-8 py-4 text-sm font-bold text-[#f7c600] ring-1 ring-white/10"
          >
            Compare Free, Creator & Studio plans →
          </Link>
        </section>

        <section className="mt-12 text-center text-sm text-black/60">
          <p className="italic">
            “The fastest way to turn food photos into scroll-stopping stories.”
          </p>
          <p className="mt-2">— Creator testimonial placeholder</p>
        </section>
      </div>
    </main>
  );
}
