// Starter goal templates for the "Next Season" section. Steps are educational
// starting points — the ones needing a licensed pro hand off to the (future)
// marketplace, never to in-app advice.

export type GoalCategoryKey =
  | "HOME"
  | "BUSINESS"
  | "EDUCATION"
  | "FAMILY"
  | "INDEPENDENCE"
  | "REAL_ESTATE"
  | "OTHER";

export type GoalTemplate = {
  category: GoalCategoryKey;
  emoji: string;
  label: string;
  blurb: string;
  defaultTarget: number;
  defaultYears: number;
  steps: string[];
};

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    category: "HOME",
    emoji: "🏠",
    label: "Buy a home",
    blurb: "Save a down payment for your first place.",
    defaultTarget: 40000,
    defaultYears: 5,
    steps: [
      "Open a high-yield savings bucket just for your down payment.",
      "Aim for 10–20% down — we'll track you toward it.",
      "When you're close, talk to a vetted mortgage pro about pre-approval.",
    ],
  },
  {
    category: "BUSINESS",
    emoji: "🚀",
    label: "Start a business",
    blurb: "Fund the runway to launch your own thing.",
    defaultTarget: 25000,
    defaultYears: 4,
    steps: [
      "Keep business savings separate from personal now.",
      "Set aside funds for an LLC + first-year runway.",
      "Loop in a CPA on structure before you launch.",
    ],
  },
  {
    category: "EDUCATION",
    emoji: "🎓",
    label: "Grad school / cert",
    blurb: "Pay for the next degree or certification.",
    defaultTarget: 30000,
    defaultYears: 3,
    steps: [
      "Estimate tuition + living costs for your program.",
      "Check if your school offers post-eligibility tuition benefits.",
      "Automate a monthly transfer toward it.",
    ],
  },
  {
    category: "FAMILY",
    emoji: "❤️",
    label: "Support my family",
    blurb: "Set money aside to take care of the people who matter.",
    defaultTarget: 20000,
    defaultYears: 3,
    steps: [
      "Pick a sustainable monthly amount that doesn't derail your plan.",
      "Keep your own tax set-aside funded first.",
      "Use a separate account so it's intentional, not ad hoc.",
    ],
  },
  {
    category: "INDEPENDENCE",
    emoji: "🛡️",
    label: "Financial independence",
    blurb: "Build a cushion so you never have to worry.",
    defaultTarget: 100000,
    defaultYears: 8,
    steps: [
      "Build a 6-month emergency cushion first.",
      "Invest consistently while the income's flowing.",
      "Revisit the number yearly with a vetted advisor.",
    ],
  },
  {
    category: "REAL_ESTATE",
    emoji: "🏢",
    label: "Invest in real estate",
    blurb: "Save toward an income property.",
    defaultTarget: 50000,
    defaultYears: 6,
    steps: [
      "Save a dedicated down-payment fund.",
      "Learn the basics of rental cash flow.",
      "Talk to a pro about financing for irregular income.",
    ],
  },
  {
    category: "OTHER",
    emoji: "🎯",
    label: "Something else",
    blurb: "Name your own goal and put a number on it.",
    defaultTarget: 10000,
    defaultYears: 3,
    steps: [
      "Name it and put a number on it.",
      "Pick a realistic date.",
      "Automate a monthly transfer.",
    ],
  },
];

export function templateFor(category: string): GoalTemplate {
  return GOAL_TEMPLATES.find((t) => t.category === category) ?? GOAL_TEMPLATES[6];
}
