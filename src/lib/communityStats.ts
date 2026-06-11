// "Athletes like you" community benchmarks for the home screen.
//
// ILLUSTRATIVE aggregates for the MVP — seeded, sensible defaults. Replace with
// real anonymized aggregates computed from the user base as it grows. Social
// proof / motivation only; not financial advice.

export type CommunityStat = {
  value: string;
  label: string;
};

export const COMMUNITY_STATS: CommunityStat[] = [
  { value: "30%", label: "the most common tax set-aside" },
  { value: "62%", label: "have an emergency cushion" },
  { value: "4 in 5", label: "are saving for life after sport" },
];

export const COMMUNITY_HEADLINE = "$1.2M set aside for taxes by Playbook athletes this year.";
