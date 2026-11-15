
import { useEffect, useMemo, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  BrainCircuit,
  Activity,
  HeartPulse,
  Wind,
  Thermometer,
  Moon,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  ShieldCheck,
  Lightbulb,
  ClipboardCheck
} from "lucide-react";

const METRICS = [
  {
    key: "heartRate",
    name: "Heart Rate",
    unit: "BPM",
    icon: HeartPulse
  },
  {
    key: "systolicBP",
    name: "Systolic Blood Pressure",
    unit: "mmHg",
    icon: Activity
  },
  {
    key: "diastolicBP",
    name: "Diastolic Blood Pressure",
    unit: "mmHg",
    icon: Activity
  },
  {
    key: "spo2",
    name: "Blood Oxygen",
    unit: "%",
    icon: Wind
  },
  {
    key: "glucose",
    name: "Blood Glucose",
    unit: "mg/dL",
    icon: Activity
  },
  {
    key: "temperature",
    name: "Body Temperature",
    unit: "°C",
    icon: Thermometer
  },
  {
    key: "sleepHours",
    name: "Sleep Duration",
    unit: "hours",
    icon: Moon
  },
  {
    key: "exerciseMinutes",
    name: "Exercise Duration",
    unit: "minutes",
    icon: Footprints
  },
  {
    key: "weight",
    name: "Body Weight",
    unit: "kg",
    icon: Activity
  }
];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);

  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;

  const mean =
    values.reduce((sum, value) => sum + value, 0) /
    values.length;

  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - mean, 2),
      0
    ) / values.length;

  return Math.sqrt(variance);
}

function assessMetric(key, name, unit, current, history) {
  const previousValues = history
    .map((record) => record.measurements?.[key])
    .filter(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    );

  if (
    typeof current !== "number" ||
    !Number.isFinite(current)
  ) {
    return {
      key,
      name,
      unit,
      current: null,
      status: "Missing",
      explanation: "No valid current measurement is available."
    };
  }

  if (previousValues.length < 5) {
    return {
      key,
      name,
      unit,
      current,
      status: "Insufficient baseline",
      baseline: previousValues.length
        ? median(previousValues)
        : null,
      explanation:
        `Only ${previousValues.length} earlier measurements are available. ` +
        "At least five are required for this prototype's statistical screening."
    };
  }

  const baseline = median(previousValues);

  const deviations = previousValues.map(
    (value) => Math.abs(value - baseline)
  );

  const mad = median(deviations);

  let score = null;
  let method = "";

  if (mad > 0) {
    score = 0.6745 * (current - baseline) / mad;
    method = "Robust median/MAD score";
  } else {
    const sd = standardDeviation(previousValues);

    if (sd > 0) {
      score = (current - baseline) / sd;
      method = "Standard deviation fallback";
    }
  }

  if (score === null) {
    return {
      key,
      name,
      unit,
      current,
      baseline,
      status: "Stable baseline",
      explanation:
        "Previous readings show no measurable variation. " +
        "An anomaly score cannot be reliably calculated."
    };
  }

  const flagged = Math.abs(score) >= 3;

  return {
    key,
    name,
    unit,
    current,
    baseline,
    score,
    method,
    status: flagged
      ? "Statistical outlier"
      : "No statistical outlier detected",
    explanation: flagged
      ? `Current reading differs substantially from the personal historical baseline of ${baseline.toFixed(2)} ${unit}. ${method}: ${score.toFixed(2)}.`
      : `Current reading is not a statistical outlier relative to the personal historical baseline of ${baseline.toFixed(2)} ${unit}.`
  };
}

function analyzePsychological(records) {
  if (!records.length) return [];

  const latest = records[records.length - 1];
  const previous = records.slice(0, -1);

  const findings = [];

  const currentStress = latest.psychological?.stress;

  const previousHighStress = previous.filter(
    (r) => r.psychological?.stress === "High"
  ).length;

  if (currentStress === "High") {
    findings.push({
      title: "High stress reported",
      explanation:
        "The latest self-reported stress level is High. " +
        "Consider a confidential check-in with the mission behavioral health team.",
      priority: "Review"
    });
  }

  if (
    currentStress === "High" &&
    previousHighStress >= 2
  ) {
    findings.push({
      title: "Repeated high stress reports",
      explanation:
        "High stress has also been reported in multiple earlier assessments. " +
        "A behavioral health review may be appropriate.",
      priority: "Review"
    });
  }

  const currentSleep = latest.measurements?.sleepHours;

  if (
    typeof currentSleep === "number" &&
    currentSleep < 6
  ) {
    findings.push({
      title: "Short sleep duration reported",
      explanation:
        "The latest recorded sleep duration is below six hours. " +
        "Review sleep quality, mission schedule and recent sleep history."
    });
  }

  const currentMood = latest.psychological?.mood;

  if (
    ["Sad", "Anxious", "Irritated"].includes(currentMood)
  ) {
    findings.push({
      title: "Mood change reported",
      explanation:
        `The astronaut reported feeling ${currentMood.toLowerCase()}. ` +
        "Consider a confidential behavioral health check-in."
    });
  }

  return findings;
}

function analyzeSymptoms(records) {
  if (!records.length) return [];

  const latest = records[records.length - 1];

  const symptoms = latest.symptoms || [];

  if (
    symptoms.includes("None") ||
    symptoms.length === 0
  ) {
    return [];
  }

  return symptoms.map((symptom) => ({
    title: `Reported symptom: ${symptom}`,
    explanation:
      "This symptom was reported in the latest health assessment. " +
      "Follow the approved mission medical evaluation protocol.",
    priority: [
      "Breathing difficulty",
      "Dizziness"
    ].includes(symptom)
      ? "Prompt review"
      : "Review"
  }));
}

function FindingCard({ finding }) {
  const flagged =
    finding.status === "Statistical outlier";

  const Icon = flagged
    ? AlertTriangle
    : finding.status === "Missing"
    ? Info
    : CheckCircle2;

  return (
    <div className={`ai-finding ${flagged ? "flagged" : ""}`}>
      <div className="ai-finding-icon">
        <Icon size={20} />
      </div>

      <div className="ai-finding-content">
        <strong>{finding.name}</strong>

        <span className="ai-finding-status">
          {finding.status}
        </span>

        <p>{finding.explanation}</p>

        {finding.score !== undefined && (
          <small>
            Statistical score: {finding.score.toFixed(2)}
          </small>
        )}
      </div>
    </div>
  );
}

export default function AIHealthAssessment({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !user) {
      return;
    }

    const recordsQuery = query(
      collection(db, "astronauts", user.uid, "assessments"),
      orderBy("recordedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .reverse();

        setRecords(data);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve assessment records.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const results = useMemo(() => {
    if (!records.length) return null;

    const latest = records[records.length - 1];
    const history = records.slice(0, -1);

    const findings = METRICS.map((metric) =>
      assessMetric(
        metric.key,
        metric.name,
        metric.unit,
        latest.measurements?.[metric.key],
        history
      )
    );

    const statisticalOutliers = findings.filter(
      (item) => item.status === "Statistical outlier"
    );

    const psychological = analyzePsychological(records);
    const symptoms = analyzeSymptoms(records);

    const insufficient = findings.filter(
      (item) => item.status === "Insufficient baseline"
    );

    const missing = findings.filter(
      (item) => item.status === "Missing"
    );

    return {
      latest,
      findings,
      statisticalOutliers,
      psychological,
      symptoms,
      insufficient,
      missing
    };
  }, [records]);

  if (!db || !user) {
    return (
      <div className="ai-empty">
        <AlertTriangle size={25} />
        Firebase connection is unavailable.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-empty">
        <RefreshCw size={25} />
        Loading AI health assessment...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-empty">
        <AlertTriangle size={25} />
        {error}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="ai-empty">
        <BrainCircuit size={40} />
        <h3>No health records available</h3>
        <p>
          Submit health assessments before starting AI analysis.
        </p>
      </div>
    );
  }

  const reviewCount =
    results.statisticalOutliers.length +
    results.psychological.length +
    results.symptoms.length;

  return (
    <div className="ai-page">

      <div className="assessment-title">
        <div>
          <span className="eyebrow">
            <BrainCircuit size={15} />
            EXPLAINABLE AI ENGINE
          </span>

          <h1>AI Health Assessment</h1>

          <p>
            Personalized health screening based on historical
            astronaut measurements.
          </p>
        </div>

        <div className="ai-engine-badge">
          <ShieldCheck size={18} />
          Statistical screening
        </div>
      </div>

      <div className="ai-info-banner">
        <Info size={20} />
        <p>
          This prototype uses explainable statistical screening,
          not a trained or clinically validated medical AI model.
          It identifies patterns for medical review and does not
          diagnose diseases.
        </p>
      </div>

      <div className="ai-summary-grid">

        <div className="ai-summary-card">
          <Activity size={23} />
          <span>Assessment Records</span>
          <strong>{records.length}</strong>
        </div>

        <div className="ai-summary-card">
          <AlertTriangle size={23} />
          <span>Statistical Outliers</span>
          <strong>{results.statisticalOutliers.length}</strong>
        </div>

        <div className="ai-summary-card">
          <ClipboardCheck size={23} />
          <span>Observations for Review</span>
          <strong>{reviewCount}</strong>
        </div>

        <div className="ai-summary-card">
          <Info size={23} />
          <span>Insufficient Baselines</span>
          <strong>{results.insufficient.length}</strong>
        </div>

      </div>

      <div className="ai-section-heading">
        <div>
          <h3>Physiological Anomaly Detection</h3>
          <p>
            Current readings compared with previous personal measurements.
          </p>
        </div>
      </div>

      <div className="ai-findings-list">
        {results.findings.map((finding) => (
          <FindingCard
            key={finding.key}
            finding={finding}
          />
        ))}
      </div>

      <div className="ai-section-heading">
        <div>
          <h3>Psychological and Behavioral Observations</h3>
          <p>Self-reported mood, stress and sleep information.</p>
        </div>
      </div>

      {results.psychological.length === 0 ? (
        <div className="ai-empty-small">
          No additional psychological observations identified.
        </div>
      ) : (
        results.psychological.map((item, index) => (
          <div className="ai-observation" key={index}>
            <Moon size={20} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.explanation}</p>
            </div>
          </div>
        ))
      )}

      <div className="ai-section-heading">
        <div>
          <h3>Symptom Review</h3>
          <p>Symptoms reported in the latest assessment.</p>
        </div>
      </div>

      {results.symptoms.length === 0 ? (
        <div className="ai-empty-small">
          No symptoms reported in the latest assessment.
        </div>
      ) : (
        results.symptoms.map((item, index) => (
          <div className="ai-observation" key={index}>
            <AlertTriangle size={20} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.explanation}</p>
              <small>{item.priority}</small>
            </div>
          </div>
        ))
      )}

      <div className="ai-section-heading">
        <div>
          <h3>Explainable AI – Assessment Summary</h3>
          <p>Why the system generated its observations.</p>
        </div>
      </div>

      <div className="ai-explanation-panel">

        <div className="ai-explanation-header">
          <Lightbulb size={23} />
          <strong>Assessment Explanation</strong>
        </div>

        <p>
          The assessment used {records.length} historical records
          including the latest submission.
        </p>

        <ul>
          <li>
            Statistical screening requires at least five earlier
            valid measurements for each indicator.
          </li>

          <li>
            The personal baseline is calculated using the median
            of available historical measurements.
          </li>

          <li>
            A robust deviation score is calculated using median
            absolute deviation where possible.
          </li>

          <li>
            A score with an absolute value of 3 or more is flagged
            as a statistical outlier, not a medical diagnosis.
          </li>

          <li>
            Mood, sleep and symptoms are reviewed separately
            from numerical anomaly detection.
          </li>

          <li>
            Missing and insufficient measurements are not
            automatically considered normal.
          </li>
        </ul>

      </div>

      <div className="ai-medical-note">
        <AlertTriangle size={20} />

        <p>
          Statistical outliers and concerning symptoms should be
          reviewed under approved mission medical protocols.
          Sudden or severe symptoms require immediate action
          according to the onboard emergency procedure. A
          statistically normal result does not rule out a health
          problem.
        </p>
      </div>

    </div>
  );
}
