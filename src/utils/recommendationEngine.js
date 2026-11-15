
import { getUrineInsight } from "./hydration";

const createRecommendation = (
  category,
  title,
  priority,
  reason,
  action,
  source
) => ({
  id: `${category}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  category,
  title,
  priority,
  reason,
  action,
  source,
  status: "Pending"
});

export function generateRecommendations(records) {
  if (!records || records.length === 0) {
    return {
      recommendations: [],
      summary: "No health assessment records available."
    };
  }

  const latest = records[records.length - 1];
  const previous = records.slice(0, -1);

  const m = latest.measurements || {};
  const psychological = latest.psychological || {};
  const nutrition = latest.nutrition || {};
  const symptoms = latest.symptoms || [];

  const recommendations = [];

  // 1. Heart rate
  if (typeof m.heartRate === "number") {
    const previousHeartRates = previous
      .map(r => r.measurements?.heartRate)
      .filter(Number.isFinite);

    const baseline = previousHeartRates.length >= 5
      ? previousHeartRates.reduce((a, b) => a + b, 0) /
        previousHeartRates.length
      : null;

    if (
      baseline !== null &&
      Math.abs(m.heartRate - baseline) >
        Math.max(15, baseline * 0.2)
    ) {
      recommendations.push(createRecommendation(
        "Cardiovascular",
        "Review heart-rate variation",
        "Prompt review",
        `The latest heart rate is ${m.heartRate} BPM compared with a historical average of ${baseline.toFixed(1)} BPM.`,
        "Repeat the measurement under the approved monitoring conditions, review activity and symptoms, and contact the mission medical team for interpretation.",
        "Heart-rate history"
      ));
    }
  }

  // 2. Blood pressure
  if (
    Number.isFinite(m.systolicBP) &&
    Number.isFinite(m.diastolicBP)
  ) {
    if (
      m.systolicBP >= 180 ||
      m.diastolicBP >= 120
    ) {
      recommendations.push(createRecommendation(
        "Cardiovascular",
        "Urgent blood-pressure reassessment",
        "Urgent medical review",
        "The recorded blood pressure is in a range that requires immediate clinical assessment.",
        "Repeat the measurement promptly if this does not delay care. Follow the mission medical emergency protocol and seek immediate medical officer assessment. Do not wait for this application.",
        "Blood-pressure measurement"
      ));
    } else if (
      m.systolicBP >= 140 ||
      m.diastolicBP >= 90
    ) {
      recommendations.push(createRecommendation(
        "Cardiovascular",
        "Blood-pressure follow-up",
        "Medical review",
        "The latest blood-pressure reading is elevated relative to commonly used adult screening thresholds.",
        "Repeat the measurement using the approved technique and arrange medical officer review. A single reading is not a diagnosis.",
        "Blood-pressure measurement"
      ));
    }
  }

  // 3. Oxygen saturation
  if (Number.isFinite(m.spo2)) {
    if (m.spo2 <= 92) {
      recommendations.push(createRecommendation(
        "Respiratory",
        "Immediate oxygenation assessment",
        "Urgent medical review",
        `Recorded SpO2 is ${m.spo2}%. This requires prompt assessment in the mission context.`,
        "Check sensor placement and repeat only if doing so does not delay care. Follow the mission medical emergency protocol and notify the medical officer immediately.",
        "SpO2 measurement"
      ));
    } else if (m.spo2 < 95) {
      recommendations.push(createRecommendation(
        "Respiratory",
        "Oxygen saturation follow-up",
        "Prompt review",
        `Recorded SpO2 is ${m.spo2}%.`,
        "Verify the measurement and review associated symptoms and mission-specific oxygenation guidance with the medical team.",
        "SpO2 measurement"
      ));
    }
  }

  // 4. Glucose
  if (Number.isFinite(m.glucose)) {
    if (m.glucose < 70 || m.glucose >= 200) {
      recommendations.push(createRecommendation(
        "Metabolic Health",
        "Blood glucose assessment",
        "Medical review",
        `Recorded glucose is ${m.glucose} mg/dL. Meal timing and measurement context are not available.`,
        "Verify the reading and document whether it was fasting, pre-meal or post-meal. Follow the astronaut's approved medical glucose protocol and contact the medical team.",
        "Blood glucose measurement"
      ));
    }
  }

  // 5. Sleep
  if (Number.isFinite(m.sleepHours)) {
    if (m.sleepHours < 6) {
      recommendations.push(createRecommendation(
        "Sleep",
        "Improve sleep opportunity",
        "Wellness",
        `The latest recorded sleep duration is ${m.sleepHours} hours.`,
        "Review sleep opportunity, cabin environment and mission schedule. Consider a consistent sleep routine and report persistent sleep difficulties to the medical team.",
        "Sleep assessment"
      ));
    }
  }

  // 6. Exercise
  if (
    Number.isFinite(m.exerciseMinutes) &&
    m.exerciseMinutes === 0
  ) {
    recommendations.push(createRecommendation(
      "Physical Fitness",
      "Review physical activity schedule",
      "Wellness",
      "No exercise duration was recorded in the latest assessment.",
      "Confirm whether exercise was missed or simply not recorded. Follow the mission-approved exercise and resistance-training schedule.",
      "Exercise assessment"
    ));
  }

  // 7. Nutrition
  if (
    ["Poor Nutrition", "Inadequate Intake", "Reduced Appetite"]
      .includes(nutrition.status)
  ) {
    recommendations.push(createRecommendation(
      "Nutrition",
      "Nutrition follow-up",
      "Review",
      `Reported nutrition status: ${nutrition.status}.`,
      "Review food intake and appetite with the mission nutrition team. Follow the approved dietary plan.",
      "Nutrition assessment"
    ));
  }

  // 8. Hydration — urine colour is treated as an assessment factor,
  // not just a stored observation.
  const urineInsight = getUrineInsight(latest.urine);

  let hydrationRecommendationAdded = false;

  if (urineInsight && urineInsight.score >= 7) {
    recommendations.push(createRecommendation(
      "Hydration",
      "Significant dehydration indicator",
      "Prompt review",
      `Urine colour is ${urineInsight.label} (${urineInsight.score}/8), suggesting ${urineInsight.estimate.toLowerCase()}.`,
      "Begin controlled oral rehydration if safe to drink, review fluid balance and associated symptoms, and contact the mission medical officer.",
      "Urine colour chart"
    ));

    hydrationRecommendationAdded = true;
  } else if (urineInsight && urineInsight.score >= 5) {
    recommendations.push(createRecommendation(
      "Hydration",
      "Hydration review",
      "Review",
      `Urine colour is ${urineInsight.label} (${urineInsight.score}/8), suggesting ${urineInsight.estimate.toLowerCase()}.`,
      "Increase fluid intake across the duty cycle, reduce avoidable fluid losses and recheck urine colour at the next assessment.",
      "Urine colour chart"
    ));

    hydrationRecommendationAdded = true;
  }

  if (
    !hydrationRecommendationAdded &&
    ["Reduced Intake", "Possible Dehydration"]
      .includes(nutrition.hydration)
  ) {
    recommendations.push(createRecommendation(
      "Hydration",
      "Hydration status review",
      "Review",
      `Reported hydration status: ${nutrition.hydration}.`,
      "Review fluid intake, fluid balance and associated symptoms with the mission medical team. Follow the approved hydration protocol.",
      "Hydration assessment"
    ));
  }

  if (!urineInsight) {
    recommendations.push(createRecommendation(
      "Hydration",
      "Record urine colour",
      "Data review",
      "No urine colour was recorded in the latest assessment, so hydration could not be estimated from urine concentration.",
      "Capture urine colour at the next assessment to improve hydration tracking. Continue following the approved hydration schedule.",
      "Urine colour chart"
    ));
  }

  // 9. Psychological health
  if (psychological.stress === "High") {
    recommendations.push(createRecommendation(
      "Mental Wellness",
      "Stress management support",
      "Confidential support",
      "The astronaut has reported a high stress level.",
      "Consider approved relaxation exercises, structured rest and a confidential discussion with the mission behavioral health team.",
      "Psychological assessment"
    ));
  }

  if (
    ["Sad", "Anxious", "Irritated"].includes(
      psychological.mood
    )
  ) {
    recommendations.push(createRecommendation(
      "Mental Wellness",
      "Behavioral wellness check-in",
      "Confidential support",
      `The latest reported mood is ${psychological.mood}.`,
      "Consider a confidential check-in with the behavioral health team and review any mission-related stressors.",
      "Mood assessment"
    ));
  }

  // 10. Symptoms
  const urgentSymptoms = [
    "Breathing difficulty"
  ];

  const reviewSymptoms = symptoms.filter(
    symptom =>
      symptom !== "None" &&
      symptom !== "Breathing difficulty"
  );

  if (symptoms.some(s => urgentSymptoms.includes(s))) {
    recommendations.push(createRecommendation(
      "Medical Safety",
      "Immediate symptom escalation",
      "Urgent medical review",
      "Breathing difficulty was reported.",
      "Follow the mission medical emergency procedure and obtain immediate medical officer assistance. Do not rely on this application for emergency triage.",
      "Reported symptoms"
    ));
  }

  if (reviewSymptoms.length > 0) {
    recommendations.push(createRecommendation(
      "Medical Safety",
      "Review reported symptoms",
      "Medical review",
      `Reported symptoms: ${reviewSymptoms.join(", ")}.`,
      "Document the onset, duration and severity of symptoms and contact the mission medical officer according to mission protocols.",
      "Reported symptoms"
    ));
  }

  // 11. Missing information
  const essentialFields = [
    "heartRate",
    "systolicBP",
    "diastolicBP",
    "spo2",
    "temperature",
    "sleepHours"
  ];

  const missing = essentialFields.filter(
    key => !Number.isFinite(m[key])
  );

  if (missing.length > 0) {
    recommendations.push(createRecommendation(
      "Data Quality",
      "Complete health measurements",
      "Data review",
      `Missing measurements: ${missing.join(", ")}.`,
      "Complete the missing measurements when possible. Do not interpret missing measurements as normal.",
      "Assessment completeness"
    ));
  }

  if (recommendations.length === 0) {
    recommendations.push(createRecommendation(
      "General Wellness",
      "Continue routine monitoring",
      "Wellness",
      "No recommendation-triggering conditions were identified by the configured prototype rules.",
      "Continue the approved mission health monitoring, exercise, nutrition and sleep schedule. This result does not establish that the astronaut is medically healthy.",
      "Latest health assessment"
    ));
  }

  return {
    recommendations,
    summary:
      `${recommendations.length} guidance item(s) generated from the latest assessment.`,
    generatedAt: new Date().toISOString()
  };
}
