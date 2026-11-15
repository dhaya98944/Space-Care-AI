import { useState } from "react";
import {
  createEmergencyAlertsForAssessment
} from "../utils/emergencyEngine";

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
//import "./App.css";

import { db } from "../firebase/firebase";

import {
  Activity,
  HeartPulse,
  //Thermometer,
  //Wind,
  Moon,
  Brain,
  Utensils,
  Save,
  RotateCcw,
  Watch,
  ClipboardList
} from "lucide-react";

const initialForm = {
  systolicBP: "",
  diastolicBP: "",
  heartRate: "",
  spo2: "",
  glucose: "",
  temperature: "",
  respiratoryRate: "",
  weight: "",

  sleepHours: "",
  sleepQuality: "Good",

  activityLevel: "Moderate",
  exerciseMinutes: "",

  mood: "Normal",
  stress: "Low",
  anxiety: "No",

  nutrition: "Normal",
  hydration: "Adequate",
  urineColor: "",

  symptoms: [],
  medications: "",
  observations: "",

  dataSource: "Manual",
  deviceName: ""
};

const symptomOptions = [
  "Fatigue",
  "Headache",
  "Dizziness",
  "Nausea",
  "Muscle weakness",
  "Bone or joint pain",
  "Breathing difficulty",
  "Sleep disturbance",
  "Loss of appetite",
  "Anxiety",
  "Vision changes",
  "None"
];

/*
 * Urine colour chart (1 = very dilute, 8 = highly concentrated).
 * Used as a general wellness hydration indicator, not a diagnosis.
 */
const urineColorOptions = [
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

const hydrationStatusForScore = (score) => {
  if (score <= 4) return "Adequate";
  if (score <= 6) return "Reduced Intake";
  return "Possible Dehydration";
};

function FormSection({ icon: Icon, title, description, children }) {
  return (
    <section className="assessment-section">

      <div className="assessment-section-heading">

        <div className="assessment-section-icon">
          <Icon size={21} />
        </div>

        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

      </div>

      <div className="assessment-fields">
        {children}
      </div>

    </section>
  );
}

function Field({ label, unit, wide = false, children }) {
  return (
    <div className={`assessment-field ${wide ? "wide" : ""}`}>

      <label>{label}</label>

      {children}

      {unit && (
        <small>{unit}</small>
      )}

    </div>
  );
}

export default function HealthAssessment({ user, astronaut }) {

  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedUrineColor = urineColorOptions.find(
    (option) => option.value === form.urineColor
  );

  const selectUrineColor = (option) => {

    setForm((previous) => ({
      ...previous,
      urineColor: option.value,
      hydration: hydrationStatusForScore(option.score)
    }));

  };

  const update = (name, value) => {

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

  };

  const updateNumber = (name, value) => {

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      update(name, value);
    }

  };

  const toggleSymptom = (symptom) => {

    setForm((previous) => {

      let current = previous.symptoms;

      if (symptom === "None") {
        return {
          ...previous,
          symptoms: current.includes("None") ? [] : ["None"]
        };
      }

      current = current.filter((s) => s !== "None");

      return {
        ...previous,
        symptoms: current.includes(symptom)
          ? current.filter((s) => s !== symptom)
          : [...current, symptom]
      };

    });

  };

  const validate = () => {

    const requiredFields = [
      ["systolicBP", "Systolic blood pressure"],
      ["diastolicBP", "Diastolic blood pressure"],
      ["heartRate", "Heart rate"],
      ["spo2", "Blood oxygen"],
      ["temperature", "Body temperature"],
      ["sleepHours", "Sleep duration"]
    ];

    for (const [key, label] of requiredFields) {

      if (form[key] === "") {
        return `${label} is required.`;
      }

    }

    const ranges = [
      ["systolicBP", 40, 300, "Systolic BP"],
      ["diastolicBP", 20, 200, "Diastolic BP"],
      ["heartRate", 1, 300, "Heart rate"],
      ["spo2", 1, 100, "SpO2"],
      ["glucose", 1, 1000, "Blood glucose"],
      ["temperature", 25, 45, "Temperature"],
      ["respiratoryRate", 1, 100, "Respiratory rate"],
      ["weight", 1, 500, "Weight"],
      ["sleepHours", 0, 24, "Sleep hours"],
      ["exerciseMinutes", 0, 1440, "Exercise duration"]
    ];

    for (const [key, min, max, label] of ranges) {

      if (form[key] === "") continue;

      const value = Number(form[key]);

      if (!Number.isFinite(value) || value < min || value > max) {
        return `${label} must be between ${min} and ${max}.`;
      }

    }

    if (Number(form.diastolicBP) >= Number(form.systolicBP)) {
      return "Diastolic BP must be lower than systolic BP.";
    }

    if (form.dataSource === "Wearable" && !form.deviceName.trim()) {
      return "Enter the wearable device name.";
    }

    return "";
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user || !db || !astronaut) {
      setError("Login and Firebase connection are required.");
      return;
    }

    setSaving(true);

    try {

      const numericFields = [
        "systolicBP",
        "diastolicBP",
        "heartRate",
        "spo2",
        "glucose",
        "temperature",
        "respiratoryRate",
        "weight",
        "sleepHours",
        "exerciseMinutes"
      ];

      const measurements = {};

      numericFields.forEach((key) => {

        measurements[key] =
          form[key] === "" ? null : Number(form[key]);

      });

      const assessment = {

        astronautUid: user.uid,

        astronautId: astronaut.astronautId,

        astronautName: astronaut.name,

        mission: astronaut.mission,

        missionDay: astronaut.missionDay ?? null,

        measurements,

        lifestyle: {
          sleepQuality: form.sleepQuality,
          activityLevel: form.activityLevel
        },

        psychological: {
          mood: form.mood,
          stress: form.stress,
          anxiety: form.anxiety
        },

        nutrition: {
          status: form.nutrition,
          hydration: form.hydration
        },

        urine: selectedUrineColor
          ? {
              color: selectedUrineColor.value,
              label: selectedUrineColor.label,
              hex: selectedUrineColor.hex,
              colorScore: selectedUrineColor.score,
              hydrationEstimate: selectedUrineColor.estimate,
              method: "urine-color-chart"
            }
          : null,

        symptoms: form.symptoms,

        medications: form.medications.trim(),

        observations: form.observations.trim(),

        source: {
          type: form.dataSource,
          deviceName:
            form.dataSource === "Wearable"
              ? form.deviceName.trim()
              : null
        },

        createdAt: serverTimestamp(),

        recordedAt: new Date().toISOString(),

        schemaVersion: 2

      };

      const assessmentRef = await addDoc(
        collection(
          db,
          "astronauts",
          user.uid,
          "assessments"
        ),
        assessment
      );

      const emergencyAlerts =
        await createEmergencyAlertsForAssessment(
          user.uid,
          assessmentRef.id,
          {
            measurements,
            psychological: assessment.psychological,
            nutrition: assessment.nutrition,
            symptoms: assessment.symptoms
          }
        );

      if (emergencyAlerts.length > 0) {
        console.warn(
          "Emergency conditions detected:",
          emergencyAlerts
        );
      }

      setMessage(
        "Health assessment successfully saved to Firebase!"
      );

      setForm(initialForm);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to save assessment. Please check Firebase configuration and try again."
      );

    } finally {

      setSaving(false);

    }

  };

  return (

    <div className="assessment-page">

      <div className="assessment-title">

        <div>
          <span className="eyebrow">
            <ClipboardList size={15} />
            HEALTH MONITORING
          </span>

          <h1>Daily Health Assessment</h1>

          <p>
            Record your health indicators and mission wellness data.
          </p>
        </div>

        <div className="assessment-id">
          <strong>{astronaut?.astronautId}</strong>
          <span>Astronaut ID</span>
        </div>

      </div>

      <form onSubmit={handleSubmit}>

        <div className="assessment-banner">

          <div>
            <strong>{astronaut?.name}</strong>
            <p>
              {astronaut?.mission} · {astronaut?.missionDay
                ? `Mission Day ${astronaut.missionDay}`
                : "Mission day not configured"}
            </p>
          </div>

          <div className="recording-status">
            <span className="status-dot"></span>
            Assessment ready
          </div>

        </div>

        <FormSection
          icon={Activity}
          title="Physiological Health"
          description="Enter measurements from medical monitoring devices."
        >

          <Field label="Systolic Blood Pressure" unit="mmHg">
            <input
              type="number"
              min="40"
              max="300"
              value={form.systolicBP}
              onChange={(e) =>
                updateNumber("systolicBP", e.target.value)
              }
              placeholder="e.g. 120"
              required
            />
          </Field>

          <Field label="Diastolic Blood Pressure" unit="mmHg">
            <input
              type="number"
              min="20"
              max="200"
              value={form.diastolicBP}
              onChange={(e) =>
                updateNumber("diastolicBP", e.target.value)
              }
              placeholder="e.g. 80"
              required
            />
          </Field>

          <Field label="Heart Rate" unit="BPM">
            <input
              type="number"
              min="1"
              max="300"
              value={form.heartRate}
              onChange={(e) =>
                updateNumber("heartRate", e.target.value)
              }
              placeholder="e.g. 72"
              required
            />
          </Field>

          <Field label="Blood Oxygen (SpO2)" unit="%">
            <input
              type="number"
              min="1"
              max="100"
              value={form.spo2}
              onChange={(e) =>
                updateNumber("spo2", e.target.value)
              }
              placeholder="e.g. 98"
              required
            />
          </Field>

          <Field label="Blood Glucose" unit="mg/dL">
            <input
              type="number"
              value={form.glucose}
              onChange={(e) =>
                updateNumber("glucose", e.target.value)
              }
              placeholder="e.g. 95"
            />
          </Field>

          <Field label="Body Temperature" unit="°C">
            <input
              type="number"
              step="0.1"
              min="25"
              max="45"
              value={form.temperature}
              onChange={(e) =>
                updateNumber("temperature", e.target.value)
              }
              placeholder="e.g. 36.8"
              required
            />
          </Field>

          <Field label="Respiratory Rate" unit="Breaths/min">
            <input
              type="number"
              value={form.respiratoryRate}
              onChange={(e) =>
                updateNumber("respiratoryRate", e.target.value)
              }
              placeholder="e.g. 16"
            />
          </Field>

          <Field label="Body Weight" unit="kg">
            <input
              type="number"
              step="0.1"
              value={form.weight}
              onChange={(e) =>
                updateNumber("weight", e.target.value)
              }
              placeholder="e.g. 70"
            />
          </Field>

        </FormSection>

        <FormSection
          icon={Watch}
          title="Data Collection Source"
          description="Select how the health measurements were collected."
        >

          <Field label="Measurement Source">

            <select
              value={form.dataSource}
              onChange={(e) =>
                update("dataSource", e.target.value)
              }
            >
              <option value="Manual">Manual Data Entry</option>
              <option value="Wearable">Wearable Device</option>
            </select>

          </Field>

          {form.dataSource === "Wearable" && (

            <Field label="Device Name">

              <input
                value={form.deviceName}
                onChange={(e) =>
                  update("deviceName", e.target.value)
                }
                placeholder="e.g. Wearable Health Monitor"
              />

            </Field>

          )}

          <p className="sensor-note">
            Wearable device selection currently records the data source.
            Live Bluetooth or sensor connectivity will be implemented
            in Stage 6.
          </p>

        </FormSection>

        <FormSection
          icon={Moon}
          title="Sleep and Physical Activity"
          description="Monitor rest and exercise during the mission."
        >

          <Field label="Daily Sleep Duration" unit="Hours">

            <input
              type="number"
              min="0"
              max="24"
              step="0.1"
              value={form.sleepHours}
              onChange={(e) =>
                updateNumber("sleepHours", e.target.value)
              }
              placeholder="e.g. 7.5"
              required
            />

          </Field>

          <Field label="Sleep Quality">

            <select
              value={form.sleepQuality}
              onChange={(e) =>
                update("sleepQuality", e.target.value)
              }
            >
              <option>Very Good</option>
              <option>Good</option>
              <option>Average</option>
              <option>Poor</option>
              <option>Very Poor</option>
            </select>

          </Field>

          <Field label="Physical Activity Level">

            <select
              value={form.activityLevel}
              onChange={(e) =>
                update("activityLevel", e.target.value)
              }
            >
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
              <option>No Exercise</option>
            </select>

          </Field>

          <Field label="Exercise Duration" unit="Minutes/day">

            <input
              type="number"
              min="0"
              max="1440"
              value={form.exerciseMinutes}
              onChange={(e) =>
                updateNumber("exerciseMinutes", e.target.value)
              }
              placeholder="e.g. 60"
            />

          </Field>

        </FormSection>

        <FormSection
          icon={Brain}
          title="Psychological and Behavioral Health"
          description="Record your emotional and psychological condition."
        >

          <Field label="Current Mood">

            <select
              value={form.mood}
              onChange={(e) =>
                update("mood", e.target.value)
              }
            >
              <option>Very Good</option>
              <option>Normal</option>
              <option>Happy</option>
              <option>Anxious</option>
              <option>Sad</option>
              <option>Irritated</option>
            </select>

          </Field>

          <Field label="Stress Level">

            <select
              value={form.stress}
              onChange={(e) =>
                update("stress", e.target.value)
              }
            >
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>

          </Field>

          <Field label="Anxiety">

            <select
              value={form.anxiety}
              onChange={(e) =>
                update("anxiety", e.target.value)
              }
            >
              <option>No</option>
              <option>Mild</option>
              <option>Moderate</option>
              <option>High</option>
            </select>

          </Field>

        </FormSection>

        <FormSection
          icon={Utensils}
          title="Nutrition and Hydration"
          description="Record dietary and hydration status."
        >

          <Field label="Nutrition Status">

            <select
              value={form.nutrition}
              onChange={(e) =>
                update("nutrition", e.target.value)
              }
            >
              <option>Normal</option>
              <option>Reduced Appetite</option>
              <option>Poor Nutrition</option>
              <option>Inadequate Intake</option>
            </select>

          </Field>

          <Field label="Hydration Status">

            <select
              value={form.hydration}
              onChange={(e) =>
                update("hydration", e.target.value)
              }
            >
              <option>Adequate</option>
              <option>Reduced Intake</option>
              <option>Possible Dehydration</option>
            </select>

          </Field>

          <Field label="Urine Color (Hydration Indicator)" wide>

            <div
              className="urine-swatches"
              role="radiogroup"
              aria-label="Urine color"
            >

              {urineColorOptions.map((option) => {

                const selected = form.urineColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`urine-swatch ${selected ? "selected" : ""}`}
                    onClick={() => selectUrineColor(option)}
                  >
                    <span
                      className="urine-swatch-dot"
                      style={{ backgroundColor: option.hex }}
                      aria-hidden="true"
                    ></span>

                    <span className="urine-swatch-text">
                      <strong>{option.label}</strong>
                      <small>{option.hint}</small>
                    </span>
                  </button>
                );
              })}

            </div>

            {selectedUrineColor ? (
              <div className={`hydration-estimate ${selectedUrineColor.severity}`}>
                <span className="hydration-dot" aria-hidden="true"></span>
                <div>
                  <strong>
                    Estimated hydration: {selectedUrineColor.estimate}
                  </strong>
                  <small>
                    Based on colour {selectedUrineColor.score} of 8 ·
                    Hydration status set to “{form.hydration}”. You can still
                    adjust it above.
                  </small>
                </div>
              </div>
            ) : (
              <small className="urine-hint">
                Select the closest colour to estimate hydration from urine
                concentration. Colour is a general wellness indicator, not a
                medical diagnosis.
              </small>
            )}

          </Field>

        </FormSection>

        <FormSection
          icon={HeartPulse}
          title="Symptoms and Medical Observations"
          description="Select symptoms and enter additional information."
        >

          <div className="symptom-grid">

            {symptomOptions.map((symptom) => (

              <label className="symptom-option" key={symptom}>

                <input
                  type="checkbox"
                  checked={form.symptoms.includes(symptom)}
                  onChange={() => toggleSymptom(symptom)}
                />

                <span>{symptom}</span>

              </label>

            ))}

          </div>

          <Field label="Current Medications">

            <textarea
              value={form.medications}
              onChange={(e) =>
                update("medications", e.target.value)
              }
              placeholder="Medication name, dosage and timing..."
              rows={3}
            />

          </Field>

          <Field label="Additional Observations">

            <textarea
              value={form.observations}
              onChange={(e) =>
                update("observations", e.target.value)
              }
              placeholder="Enter additional health observations..."
              rows={4}
            />

          </Field>

        </FormSection>

        {error && (
          <div className="assessment-error">
            {error}
          </div>
        )}

        {message && (
          <div className="assessment-success">
            {message}
          </div>
        )}

        <div className="assessment-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setForm(initialForm);
              setMessage("");
              setError("");
            }}
          >
            <RotateCcw size={17} />
            Clear Form
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={17} />
            {saving
              ? "Saving Assessment..."
              : "Save Health Assessment"}
          </button>

        </div>

        <p className="assessment-disclaimer">
          Health information is collected for prototype monitoring.
          Medical assessment and treatment decisions must be made by
          authorized medical personnel using approved mission protocols.
        </p>

      </form>

    </div>
  );
}