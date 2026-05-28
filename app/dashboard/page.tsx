"use client";

import { useCallback, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import PreviewPanel from "@/components/PreviewPanel";
import ExportPanel from "@/components/ExportPanel";
import ExportToast from "@/components/ExportToast";
import type { Captions } from "@/lib/slides";

const INITIAL_CAPTIONS: Captions = {
  hook: "",
  slide1: "",
  slide2: "",
  slide3: "",
  slide4: "",
  cta: "",
};

export default function DashboardPage() {
  const [images, setImages] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Captions>(INITIAL_CAPTIONS);
  const [template, setTemplate] = useState("Street Food");
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" = "success") => {
      setToast({ message, variant });
      window.setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => URL.createObjectURL(file));
    setImages(urls);
  };

  const generateStory = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          imageCount: images.length || 5,
        }),
      });

      const data = await res.json();
      setCaptions(data);
      showToast("AI story generated");
    } catch (error) {
      console.log(error);
      showToast("Story generation failed", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7c600] p-6 text-white">
      <ExportToast
        message={toast?.message ?? null}
        variant={toast?.variant}
      />

      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-7xl font-bold text-black">
              Table Tales Studio
            </h1>
            <p className="mt-3 text-2xl text-black">
              AI Food Storytelling Carousel Generator
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-2">
            <Sidebar />
          </div>

          {/* CENTER — upload + story */}
          <div className="col-span-5 flex flex-col gap-6">
            <div className="rounded-[40px] bg-[#0b0f1a] p-8 ring-1 ring-white/5 transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(0,0,0,0.2)]">
              <h2 className="mb-8 text-5xl font-bold leading-tight">
                Upload
                <br />
                Carousel
                <br />
                Images
              </h2>

              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="mb-8 w-full rounded-2xl bg-[#1a1f2e] p-5 text-xl transition-colors duration-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#f7c600]/40"
              >
                <option>Street Food</option>
                <option>Cinematic Dark</option>
                <option>Luxury Dining</option>
              </select>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="mb-8 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-[#f7c600] file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-[#ffe033]"
              />

              <div className="grid grid-cols-2 gap-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden rounded-3xl ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.02]"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={generateStory}
                disabled={isGenerating}
                className="mt-8 w-full rounded-3xl bg-white py-5 text-2xl font-bold text-black transition-all duration-200 hover:bg-[#f7c600] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Generating Story…" : "Generate AI Story"}
              </button>
            </div>

            <div className="panel-scroll max-h-[520px] overflow-y-auto rounded-[40px] bg-[#0b0f1a] p-8 ring-1 ring-white/5">
              <h2 className="mb-8 text-4xl font-bold">
                AI Story
                <br />
                Structure
              </h2>

              {Object.entries(captions).map(([key, value]) => (
                <div key={key} className="mb-6">
                  <h3 className="mb-3 text-xl font-bold capitalize text-[#f7c600]">
                    {key}
                  </h3>
                  <textarea
                    value={value}
                    onChange={(e) =>
                      setCaptions((prev) => ({
                        ...prev,
                        [key as keyof Captions]: e.target.value,
                      }))
                    }
                    className="min-h-[120px] w-full rounded-3xl bg-black p-5 text-lg text-white ring-1 ring-zinc-800 transition-all duration-200 focus:outline-none focus:ring-[#f7c600]/40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — preview + export */}
          <div className="col-span-5 flex flex-col gap-6">
            <PreviewPanel
              images={images}
              captions={captions}
              template={template}
              slideRefs={slideRefs}
            />
            <ExportPanel
              images={images}
              captions={captions}
              template={template}
              slideRefs={slideRefs}
              onToast={showToast}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
