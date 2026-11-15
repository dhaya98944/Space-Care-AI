
/*
 * Urine colour hydration indicator.
 * Score 1 = very dilute, 8 = highly concentrated.
 * This is a general wellness indicator, not a medical diagnosis.
 */

export const URINE_COLOR_OPTIONS = [
  {
    value: "clear",
    label: "Clear",
    hint: "Very hydrated",
    hex: "#f2fafd",
    score: 1,
    estimate: "Well hydrated",
    severity: "good"
  },
  {
    value: "pale-straw",
    label: "Pale straw",
    hint: "Hydrated",
    hex: "#f7f1cc",
    score: 2,
    estimate: "Well hydrated",
    severity: "good"
  },
  {
    value: "straw",
    label: "Straw",
    hint: "Hydrated",
    hex: "#f2e6a4",
    score: 3,
    estimate: "Well hydrated",
    severity: "good"
  },
  {
    value: "light-yellow",
    label: "Light yellow",
    hint: "Adequate",
    hex: "#ecd878",
    score: 4,
    estimate: "Adequate hydration",
    severity: "good"
  },
  {
    value: "yellow",
    label: "Yellow",
    hint: "Drink water",
    hex: "#e2c247",
    score: 5,
    estimate: "Mild dehydration",
    severity: "caution"
  },
  {
    value: "dark-yellow",
    label: "Dark yellow",
    hint: "Dehydration",
    hex: "#caa02b",
    score: 6,
    estimate: "Mild dehydration",
    severity: "caution"
  },
  {
    value: "amber",
    label: "Amber",
    hint: "High concentration",
    hex: "#b47a19",
    score: 7,
    estimate: "Dehydration",
    severity: "warning"
  },
  {
    value: "brown",
    label: "Brown",
    hint: "Severe",
    hex: "#8a5a14",
    score: 8,
    estimate: "Dehydration",
    severity: "warning"
  }
];

export const HYDRATION_NOTE =
  "Urine colour is a general wellness hydration indicator, not a medical diagnosis.";

export function hydrationStatusForScore(score) {
  if (score <= 4) return "Adequate";
  if (score <= 6) return "Reduced Intake";
  return "Possible Dehydration";
}

/*
 * Normalises a stored `urine` object from an assessment into a
 * consistent insight used by analytics, AI review and recommendations.
 */
export function getUrineInsight(urine) {
  if (!urine) return null;

  const rawScore = Number(urine.colorScore);

  if (!Number.isFinite(rawScore)) return null;

  const score = Math.min(8, Math.max(1, Math.round(rawScore)));

  const option =
    URINE_COLOR_OPTIONS.find((item) => item.value === urine.color) ||
    URINE_COLOR_OPTIONS.find((item) => item.score === score);

  return {
    score,
    label: urine.label || option?.label || `Colour score ${score}`,
    hex: urine.hex || option?.hex || "#e2c247",
    estimate:
      urine.hydrationEstimate || option?.estimate || "Hydration indicator recorded",
    severity:
      option?.severity ||
      (score >= 7 ? "warning" : score >= 5 ? "caution" : "good"),
    hydrationStatus: hydrationStatusForScore(score)
  };
}

export function urineScoreColor(score) {
  if (!Number.isFinite(score)) return "#e2e8f0";
  if (score >= 7) return "#e11d48";
  if (score >= 5) return "#d97706";
  return "#0d9488";
}
