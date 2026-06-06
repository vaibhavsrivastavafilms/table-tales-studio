export const ALL_BRANCHES_ID = "all" as const;

export const BRANCH_IDS = {
  PRAHLADNAGAR: "br_prahladnagar",
  SBR: "br_sbr",
  NIKOL: "br_nikol",
  CENTRAL_KITCHEN: "br_central_kitchen",
} as const;

export const ACTIVE_BRANCH_KEY = "tts:os:active_branch";

export const OUTLET_TO_BRANCH: Record<string, string> = {
  "Table Tales": BRANCH_IDS.PRAHLADNAGAR,
  "Table Tales Prahladnagar": BRANCH_IDS.PRAHLADNAGAR,
  "Table Tales SBR": BRANCH_IDS.SBR,
  "Table Tales Nikol": BRANCH_IDS.NIKOL,
  "Pure Foods Central Kitchen": BRANCH_IDS.CENTRAL_KITCHEN,
};
