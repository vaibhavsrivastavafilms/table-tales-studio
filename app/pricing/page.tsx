import Link from "next/link";
import PricingPlans from "@/components/pricing/PricingPlans";

export const metadata = {
  title: "Pricing — Table Tales Studio",
  description: "Free, Creator, and Studio plans for food storytelling carousels.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f7c600] text-black">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="text-sm font-semibold text-black/70 hover:text-black">
          ← Home
        </Link>
        <h1 className="mt-6 text-4xl font-bold">Plans for every creator</h1>
        <p className="mt-3 max-w-xl text-black/80">
          Stripe checkout coming soon. Join the waitlist on Creator or Studio — your
          workflow stays on Free until then.
        </p>
        <div className="mt-12">
          <PricingPlans />
        </div>
      </div>
    </main>
  );
}
