// Real professional athletes who built notable careers AFTER sport, for the home
// "Built beyond the game" section.
//
// These are FACTUAL, publicly-documented transitions of public figures (compiled
// from public reporting) — no fabricated quotes, no implied endorsement of
// Playbook. Shared for inspiration only; not financial advice. Before any
// production/marketing use, get legal review and ideally the athletes' permission.

export type RoleModel = {
  initials: string;
  name: string;
  past: string; // their playing career
  now: string; // what they built after
  fact: string; // a factual, sourced highlight (no invented quotes)
  source?: string; // publication name
  sourceUrl?: string; // real link only
  accent: "green" | "brass" | "blue" | "red";
};

export const ROLE_MODELS: RoleModel[] = [
  {
    initials: "RS",
    name: "Roger Staubach",
    past: "Cowboys quarterback",
    now: "Commercial real estate founder",
    fact: "Built The Staubach Company into a real estate powerhouse, reportedly sold for around $600M.",
    source: "Forbes",
    sourceUrl:
      "https://www.forbes.com/sites/kurtbadenhausen/2014/02/27/roger-staubach-from-cowboys-qb-to-real-estate-mogul/",
    accent: "green",
  },
  {
    initials: "MJ",
    name: "Magic Johnson",
    past: "Lakers point guard",
    now: "Investor & entrepreneur",
    fact: "Built a business empire spanning real estate, franchises, and pro-sports ownership.",
    source: "Entrepreneur",
    sourceUrl:
      "https://www.entrepreneur.com/business-news/magic-johnson-is-a-billionaire-see-net-worth-investments/464533",
    accent: "brass",
  },
  {
    initials: "JB",
    name: "Junior Bridgeman",
    past: "NBA forward",
    now: "Franchise & bottling magnate",
    fact: "Turned life after the NBA into a fast-food franchise and Coca-Cola bottling empire.",
    source: "ESPN",
    sourceUrl: "https://www.espn.com/nba/story/_/id/40625836/how-nba-sixth-man-built-600m-empire",
    accent: "blue",
  },
  {
    initials: "VW",
    name: "Venus Williams",
    past: "Tennis champion",
    now: "Founder, EleVen & V Starr",
    fact: "Runs an activewear brand and an interior-design firm alongside her tennis career.",
    source: "Racked",
    sourceUrl: "https://www.racked.com/2016/8/11/12439870/venus-williams-fashion",
    accent: "red",
  },
];
