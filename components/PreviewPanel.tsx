import CarouselSlide from "@/components/CarouselSlide";

const SLIDE_KEYS = [
  "hook",
  "slide1",
  "slide2",
  "slide3",
  "slide4",
  "cta",
] as const;

type Captions = Record<(typeof SLIDE_KEYS)[number], string>;

type PreviewPanelProps = {
  images: string[];
  captions: Captions;
  template?: string;
};

export default function PreviewPanel({
  images,
  captions,
  template = "Street Food",
}: PreviewPanelProps) {
  return (
    <section className="flex h-full min-h-[900px] flex-col rounded-[40px] bg-[#0b0f1a] p-6 ring-1 ring-white/5">
      <header className="mb-5 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Stitched Preview
        </p>
        <h2 className="mt-1 text-3xl font-bold leading-tight text-white">
          Carousel
          <br />
          Preview
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {SLIDE_KEYS.length} slides · 4:5 Instagram
        </p>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          className="flex h-full gap-4 overflow-x-auto overflow-y-hidden pb-4 pr-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:#f7c600_#1a1f2e]"
          style={{
            scrollbarGutter: "stable",
          }}
        >
          {SLIDE_KEYS.map((key, i) => {
            const image =
              images[i] ?? images[images.length - 1] ?? images[0] ?? "";

            return (
              <div key={key} className="snap-center snap-always">
                <CarouselSlide
                  image={image}
                  text={captions[key]}
                  index={i + 1}
                  template={template}
                />
              </div>
            );
          })}
        </div>

        {/* Fade hint for horizontal scroll */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0b0f1a] to-transparent"
          aria-hidden
        />
      </div>
    </section>
  );
}
