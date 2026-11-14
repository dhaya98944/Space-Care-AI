import { useState } from "react";

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

function Field({ label, unit, children }) {
  return (
    <div className="assessment-field">

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

        schemaVersion: 1

      };

      await addDoc(
        collection(
          db,
          "astronauts",
          user.uid,
          "assessments"
        ),
        assessment
      );

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