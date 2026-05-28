"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);

  const [story, setStory] = useState({
    hook: "",
    slide1: "",
    slide2: "",
    slide3: "",
    slide4: "",
    slide5: "",
    cta: "",
  });

  const [loading, setLoading] = useState(false);

  const [template, setTemplate] = useState("Street Food");

  const carouselRef = useRef<HTMLDivElement>(null);

  // TEMPLATE STYLES

  const templateStyles: Record<
    string,
    {
      badge: string;
      overlay: string;
      text: string;
    }
  > = {
    "Street Food": {
      badge: "bg-yellow-400 text-black",
      overlay:
        "bg-gradient-to-t from-black via-black/50 to-transparent",
      text: "text-white",
    },

    "Luxury Dining": {
      badge:
        "bg-white/20 backdrop-blur-md text-white border border-white/30",
      overlay:
        "bg-gradient-to-t from-black via-black/40 to-transparent",
      text: "text-white",
    },

    "Coffee Aesthetic": {
      badge: "bg-[#d8c3a5] text-black",
      overlay:
        "bg-gradient-to-t from-[#3d2b1f] via-black/40 to-transparent",
      text: "text-[#fff8f0]",
    },

    "Emotional Story": {
      badge: "bg-red-500 text-white",
      overlay:
        "bg-gradient-to-t from-black via-black/60 to-transparent",
      text: "text-white",
    },
  };

  // IMAGE UPLOAD

  const handleImages = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files) return;

    const imageArray = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );

    setImages(imageArray);
  };

  // AI GENERATION

  const generateCaption = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          template,
        }),
      });

      const data = await response.json();

      setStory({
        hook: data.hook || "",
        slide1: data.slide1 || "",
        slide2: data.slide2 || "",
        slide3: data.slide3 || "",
        slide4: data.slide4 || "",
        slide5: data.slide5 || "",
        cta: data.cta || "",
      });
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  // EXPORT PNGS

  const exportCarousel = async () => {
    if (!carouselRef.current) return;

    const slides =
      carouselRef.current.querySelectorAll(".carousel-slide");

    slides.forEach(async (slide, index) => {
      const dataUrl = await toPng(slide as HTMLElement, {
        cacheBust: true,
        pixelRatio: 3,
      });

      const link = document.createElement("a");

      link.download = `table-tales-slide-${
        index + 1
      }.png`;

      link.href = dataUrl;

      link.click();
    });
  };

  // CAPTION ARRAY

  const captions = [
    story.hook,
    story.slide1,
    story.slide2,
    story.slide3,
    story.slide4,
    story.slide5,
    story.cta,
  ];

  return (
    <main className="min-h-screen bg-[#f7c600] text-white p-8 overflow-hidden">
      <div className="max-w-[1800px] mx-auto">
        {/* HEADER */}

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-7xl font-black text-black">
              Table Tales Studio
            </h1>

            <p className="text-black text-2xl mt-3">
              AI Food Storytelling Carousel Generator
            </p>
          </div>

          <button
            onClick={exportCarousel}
            className="bg-white text-black px-10 py-5 rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition"
          >
            Export Carousel PNG
          </button>
        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-12 gap-6">
          {/* SIDEBAR */}

          <div className="col-span-2 bg-[#12131a] rounded-[40px] p-8">
            <h2 className="text-5xl font-black mb-10">
              Workspace
            </h2>

            <div className="space-y-8 text-2xl text-zinc-400">
              <p>Dashboard</p>
              <p>Templates</p>
              <p>Story Ideas</p>
              <p>Exports</p>
              <p>Settings</p>
            </div>
          </div>

          {/* UPLOAD SECTION */}

          <div className="col-span-4 bg-[#12131a] rounded-[40px] p-8">
            <h2 className="text-6xl font-black mb-8">
              Upload Carousel Images
            </h2>

            {/* TEMPLATE SELECT */}

            <select
              value={template}
              onChange={(e) =>
                setTemplate(e.target.value)
              }
              className="w-full bg-[#1d1f29] p-5 rounded-3xl text-2xl mb-8 outline-none"
            >
              <option>Street Food</option>
              <option>Luxury Dining</option>
              <option>Coffee Aesthetic</option>
              <option>Emotional Story</option>
            </select>

            {/* FILE INPUT */}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImages}
              className="mb-8 text-xl"
            />

            {/* IMAGE GRID */}

            <div className="grid grid-cols-2 gap-5">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-[30px] overflow-hidden"
                >
                  <Image
                    src={img}
                    alt="food"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* GENERATE BUTTON */}

            <button
              onClick={generateCaption}
              className="w-full bg-white text-black py-6 rounded-[30px] text-2xl font-black mt-8 hover:scale-[1.02] transition"
            >
              {loading
                ? "Generating AI Story..."
                : "Generate AI Story"}
            </button>
          </div>

          {/* STORY PANEL */}

          <div className="col-span-3 bg-[#12131a] rounded-[40px] p-8 overflow-y-auto h-[88vh]">
            <h2 className="text-5xl font-black mb-8">
              AI Story Structure
            </h2>

            <div className="space-y-6">
              {/* HOOK */}

              <div>
                <h3 className="text-2xl font-bold mb-3">
                  Hook
                </h3>

                <textarea
                  value={story.hook}
                  onChange={(e) =>
                    setStory({
                      ...story,
                      hook: e.target.value,
                    })
                  }
                  className="w-full h-40 bg-black rounded-[30px] p-5 text-xl outline-none"
                />
              </div>

              {/* SLIDES */}

              {[
                "slide1",
                "slide2",
                "slide3",
                "slide4",
                "slide5",
              ].map((slide, index) => (
                <div key={slide}>
                  <h3 className="text-2xl font-bold mb-3">
                    Slide {index + 1}
                  </h3>

                  <textarea
                    value={
                      story[
                        slide as keyof typeof story
                      ] as string
                    }
                    onChange={(e) =>
                      setStory({
                        ...story,
                        [slide]: e.target.value,
                      })
                    }
                    className="w-full h-36 bg-black rounded-[30px] p-5 text-xl outline-none"
                  />
                </div>
              ))}

              {/* CTA */}

              <div>
                <h3 className="text-2xl font-bold mb-3">
                  CTA
                </h3>

                <textarea
                  value={story.cta}
                  onChange={(e) =>
                    setStory({
                      ...story,
                      cta: e.target.value,
                    })
                  }
                  className="w-full h-40 bg-black rounded-[30px] p-5 text-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW */}

          <div className="col-span-3 bg-[#12131a] rounded-[40px] p-8 overflow-hidden">
            <h2 className="text-5xl font-black mb-8">
              Carousel Preview
            </h2>

            {/* STITCHED PREVIEW */}

            <div className="overflow-x-auto overflow-y-hidden">
              <div
                ref={carouselRef}
                className="flex gap-8 w-max scale-[0.25] origin-top-left"
              >
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="carousel-slide relative w-[1080px] h-[1350px] rounded-[70px] overflow-hidden flex-shrink-0 shadow-2xl"
                  >
                    {/* IMAGE */}

                    <Image
                      src={img}
                      alt="slide"
                      fill
                      className="object-cover"
                    />

                    {/* OVERLAY */}

                    <div
                      className={`absolute inset-0 ${
                        templateStyles[
                          template
                        ].overlay
                      }`}
                    />

                    {/* BADGE */}

                    <div
                      className={`absolute top-10 left-10 px-6 py-3 rounded-full text-2xl font-black ${
                        templateStyles[
                          template
                        ].badge
                      }`}
                    >
                      {template.toUpperCase()}
                    </div>

                    {/* TEXT CONTENT */}

                    <div className="absolute bottom-0 left-0 w-full p-14">
                      <div className="max-w-[80%]">
                        <p
                          className={`text-6xl font-black leading-tight tracking-tight drop-shadow-2xl ${
                            templateStyles[
                              template
                            ].text
                          }`}
                        >
                          {captions[index]}
                        </p>
                      </div>
                    </div>

                    {/* SLIDE NUMBER */}

                    <div className="absolute top-10 right-10 bg-black/40 backdrop-blur-md text-white px-5 py-3 rounded-full text-2xl font-bold">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INFO */}

            <div className="mt-6 text-zinc-400 text-lg leading-relaxed">
              Stitched Instagram carousel preview.
              <br />
              Export downloads each slide as a
              separate high-quality PNG.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}