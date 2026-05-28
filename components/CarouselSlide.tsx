import { forwardRef } from "react";

export type CarouselSlideProps = {
  image: string;
  text: string;
  index: number;
  template?: string;
};

const CarouselSlide = forwardRef<HTMLElement, CarouselSlideProps>(
  function CarouselSlide(
    { image, text, index, template = "Street Food" },
    ref
  ) {
    return (
      <article
        ref={ref}
        className="relative shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/10 transition-shadow duration-300 hover:shadow-[0_28px_56px_-12px_rgba(247,198,0,0.15)] hover:ring-[#f7c600]/20"
        style={{ width: 320, height: 400 }}
        aria-label={`Slide ${index}`}
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0b0f1a] to-black" />
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.88) 100%)",
          }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/70 to-transparent" />

        <div className="absolute left-3 top-3 z-10">
          <span className="inline-flex items-center rounded-full border border-[#f7c600]/40 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#f7c600] backdrop-blur-sm">
            {template}
          </span>
        </div>

        <div className="absolute right-3 top-3 z-10">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white/90 backdrop-blur-sm ring-1 ring-white/15">
            {index}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-10 pt-16">
          <p
            className="max-w-[260px] text-center text-[17px] font-bold leading-snug tracking-tight text-white"
            style={{
              textShadow:
                "0 2px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {text || (
              <span className="text-sm font-medium text-white/35">
                Caption appears here
              </span>
            )}
          </p>
        </div>

        <div className="absolute bottom-0 left-1/2 z-10 h-0.5 w-12 -translate-x-1/2 rounded-full bg-[#f7c600]/80" />
      </article>
    );
  }
);

export default CarouselSlide;
