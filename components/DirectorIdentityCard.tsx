"use client";

import { memo, useMemo } from "react";
import { useDirectorProfile, useIsClient } from "@/lib/clientHooks";

const TONE_LABELS: Record<string, string> = {
  cinematic: "Cinematic poet",
  luxury: "Luxury sensory",
  street: "Street documentary",
  emotional: "Emotional storyteller",
};

const HOOK_LABELS: Record<string, string> = {
  soft: "Soft pull",
  balanced: "Balanced intrigue",
  viral: "High-energy hooks",
};

function DirectorIdentityCard() {
  const isClient = useIsClient();
  const profile = useDirectorProfile();

  const summary = useMemo(() => {
    if (!isClient) return null;
    const topAngle = profile.favoriteNarrativeAngles[0] ?? "Still observing";
    const learning =
      profile.sessionCount < 2
        ? "Your AI director is learning your style"
        : "Your AI director knows your rhythm";
    return {
      learning,
      tone: TONE_LABELS[profile.storytellingTone] ?? profile.storytellingTone,
      hook: HOOK_LABELS[profile.hookIntensity] ?? profile.hookIntensity,
      pacing: profile.pacingStyle.replace("-", " "),
      topAngle,
      sessions: profile.sessionCount,
    };
  }, [isClient, profile]);

  if (!isClient || !summary) {
    return (
      <section
        className="mb-4 h-24 animate-pulse rounded-2xl border border-zinc-800/80 bg-black/30"
        aria-hidden
      />
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-black/50 via-[#0b0f1a] to-black/40 px-4 py-3 ring-1 ring-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]/80">
        Director identity
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-300">{summary.learning}</p>
      <ul className="mt-2 grid gap-1 text-[11px] text-zinc-500 sm:grid-cols-2">
        <li>
          <span className="text-zinc-600">Story mode · </span>
          {summary.tone}
        </li>
        <li>
          <span className="text-zinc-600">Hook energy · </span>
          {summary.hook}
        </li>
        <li>
          <span className="text-zinc-600">Pacing · </span>
          {summary.pacing}
        </li>
        <li>
          <span className="text-zinc-600">Top angle · </span>
          {summary.topAngle}
        </li>
        <li className="sm:col-span-2">
          <span className="text-zinc-600">Sessions studied · </span>
          {summary.sessions}
        </li>
      </ul>
    </section>
  );
}

export default memo(DirectorIdentityCard);
