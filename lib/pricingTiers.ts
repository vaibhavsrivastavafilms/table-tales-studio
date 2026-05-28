import type { PlanId } from "@/lib/plans";

export type PricingTierId = "free" | "creator" | "studio";

export type PricingFeatureRow = {
  label: string;
  free: string | boolean;
  creator: string | boolean;
  studio: string | boolean;
};

export type PricingTier = {
  id: PricingTierId;
  name: string;
  priceLabel: string;
  description: string;
  highlighted?: boolean;
  cta: string;
  mapsToPlan: PlanId;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    description: "Start storytelling with core templates and exports.",
    cta: "Start free",
    mapsToPlan: "free",
  },
  {
    id: "creator",
    name: "Creator",
    priceLabel: "$19/mo",
    description: "For food creators posting weekly carousels.",
    highlighted: true,
    cta: "Join waitlist",
    mapsToPlan: "premium",
  },
  {
    id: "studio",
    name: "Studio",
    priceLabel: "$49/mo",
    description: "Teams and brands with premium templates & volume.",
    cta: "Contact sales",
    mapsToPlan: "premium",
  },
];

export const PRICING_FEATURE_MATRIX: PricingFeatureRow[] = [
  {
    label: "Daily exports",
    free: "10",
    creator: "Unlimited",
    studio: "Unlimited",
  },
  {
    label: "Watermark",
    free: "Subtle",
    creator: "None",
    studio: "None",
  },
  {
    label: "Cloud projects",
    free: "3",
    creator: "Unlimited",
    studio: "Unlimited",
  },
  {
    label: "Premium templates",
    free: false,
    creator: true,
    studio: true,
  },
  {
    label: "AI story generations",
    free: "20 / day",
    creator: "200 / day",
    studio: "Unlimited",
  },
  {
    label: "Brand kit",
    free: "Basic",
    creator: "Full",
    studio: "Full + team",
  },
];
