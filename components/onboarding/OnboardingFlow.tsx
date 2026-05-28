"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeOnboarding,
  saveCreatorMemory,
  type CreatorType,
  type StorytellingStyle,
} from "@/lib/creatorMemory";
import { TEMPLATE_LIST, type TemplateId } from "@/lib/templates";
import { MOTION } from "@/lib/motion";

const CREATOR_TYPES: { id: CreatorType; label: string; hint: string }[] = [
  { id: "food-blogger", label: "Food blogger", hint: "Reviews, guides, city eats" },
  { id: "restaurant", label: "Restaurant", hint: "Menus, ambiance, reservations" },
  { id: "content-creator", label: "Content creator", hint: "Reels, carousels, growth" },
  { id: "brand", label: "Brand / chef", hint: "Products, launches, story" },
];

const STYLES: { id: StorytellingStyle; label: string }[] = [
  { id: "carousel", label: "Carousel arcs" },
  { id: "reel", label: "Reel-first hooks" },
  { id: "founder", label: "Founder journey" },
  { id: "editorial", label: "Editorial slow" },
];

type OnboardingFlowProps = {
  onComplete: () => void;
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [creatorType, setCreatorType] = useState<CreatorType>("food-blogger");
  const [style, setStyle] = useState<StorytellingStyle>("carousel");
  const [templateId, setTemplateId] = useState<TemplateId>("luxury-dining");

  const finish = () => {
    completeOnboarding({
      creatorType,
      storytellingStyle: style,
      templateId,
      captionTone: style === "founder" ? "founder" : "cinematic",
      nichePreference:
        creatorType === "restaurant" ? "fine-dining" : "street-food",
    });
    onComplete();
    router.push("/dashboard/demo");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Creator onboarding"
    >
      <div
        className="w-full max-w-lg rounded-[32px] bg-[#0b0f1a] p-6 ring-1 ring-[#f7c600]/25 md:p-8"
        style={{ animation: `toast-in ${MOTION.durationEnter}ms ${MOTION.easingStandard}` }}
      >
        {step === 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#f7c600]">
              Welcome
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Your food stories deserve cinema.
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Table Tales Studio turns plates into scroll-stopping carousels — with
              AI pacing, templates, and retina export.
            </p>
            <button
              type="button"
              onClick={() => {
                saveCreatorMemory({ onboardingStep: 1 });
                setStep(1);
              }}
              className="btn-press mt-6 w-full rounded-2xl bg-[#f7c600] py-4 text-sm font-bold text-black"
            >
              Let&apos;s set up your studio
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Step 1 · Creator type
            </p>
            <div className="mt-4 grid gap-2">
              {CREATOR_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCreatorType(t.id)}
                  className={`btn-press rounded-xl border p-3 text-left transition ${
                    creatorType === t.id
                      ? "border-[#f7c600] bg-[#f7c600]/10"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span className="text-sm font-bold text-white">{t.label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{t.hint}</span>
                </button>
              ))}
            </div>
            <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Step 2 · Storytelling style
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`btn-press rounded-full px-4 py-2 text-xs font-semibold ${
                    style === s.id
                      ? "bg-[#f7c600] text-black"
                      : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Step 3 · Favorite template
            </p>
            <div className="mt-4 grid gap-2">
              {TEMPLATE_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`btn-press rounded-xl border p-3 text-left ${
                    templateId === t.id
                      ? "border-[#f7c600] bg-[#f7c600]/10"
                      : "border-zinc-800"
                  }`}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: t.accentColor }}
                  >
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
            <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Step 4 · Sample carousel
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              We&apos;ll open a cinematic restaurant demo — edit captions, preview,
              and export when you&apos;re ready.
            </p>
            <button
              type="button"
              onClick={finish}
              className="btn-press mt-6 w-full rounded-2xl bg-[#f7c600] py-4 text-sm font-bold text-black"
            >
              Open sample project
            </button>
            <button
              type="button"
              onClick={() => {
                completeOnboarding({
                  creatorType,
                  storytellingStyle: style,
                  templateId,
                });
                onComplete();
              }}
              className="btn-press mt-3 w-full py-2 text-xs text-zinc-500 hover:text-white"
            >
              Skip to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex gap-2">
      <button
        type="button"
        onClick={onBack}
        className="btn-press flex-1 rounded-xl border border-zinc-800 py-3 text-xs font-semibold text-zinc-400"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="btn-press flex-1 rounded-xl bg-white py-3 text-xs font-bold text-black"
      >
        Continue
      </button>
    </div>
  );
}
