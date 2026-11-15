
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
  generateRecommendations
} from "../utils/recommendationEngine";

import {
  BrainCircuit,
  HeartPulse,
  Activity,
  Moon,
  Utensils,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  ClipboardList,
  CalendarDays
} from "lucide-react";

const iconMap = {
  Cardiovascular: HeartPulse,
  Respiratory: Activity,
  "Metabolic Health": Activity,
  Sleep: Moon,
  "Physical Fitness": Activity,
  Nutrition: Utensils,
  Hydration: Droplets,
  "Mental Wellness": BrainCircuit,
  "Medical Safety": AlertTriangle,
  "General Wellness": ShieldCheck,
  "Data Quality": Info
};

function RecommendationCard({ item }) {
  const Icon = iconMap[item.category] || Info;

  const priorityClass = item.priority
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <article className={`recommendation-card ${priorityClass}`}>

      <div className="recommendation-card-top">

        <div className="recommendation-icon">
          <Icon size={23} />
        </div>

        <div className="recommendation-category">
          <span>{item.category}</span>
          <strong>{item.title}</strong>
        </div>

        <span className={`priority-tag ${priorityClass}`}>
          {item.priority}
        </span>

      </div>

      <div className="recommendation-reason">
        <strong>Why is this recommended?</strong>
        <p>{item.reason}</p>
      </div>

      <div className="recommendation-action">
        <strong>Suggested action</strong>
        <p>{item.action}</p>
      </div>

      <div className="recommendation-source">
        <Info size={14} />
        Based on: {item.source}
      </div>

    </article>
  );
}

export default function HealthRecommendations({ user }) {

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    if (!db || !user) {
      return;
    }

    const historyQuery = query(
      collection(db, "astronauts", user.uid, "assessments"),
      orderBy("recordedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {

        const data = snapshot.docs
          .map(item => ({
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
        setError("Unable to retrieve health assessment data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, [user]);

  const result = useMemo(
    () => generateRecommendations(records),
    [records]
  );

  if (!db || !user) {
    return (
      <div className="recommendation-empty">
        <AlertTriangle size={25} />
        <p>Firebase connection unavailable.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="recommendation-empty">
        <RefreshCw size={25} />
        Loading personalized recommendations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendation-empty">
        <AlertTriangle size={25} />
        <p>{error}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="recommendation-empty">
        <BrainCircuit size={40} />
        <h3>No assessment records available</h3>
        <p>
          Submit a health assessment to generate personalized guidance.
        </p>
      </div>
    );
  }

  const urgent = result.recommendations.filter(
    item => item.priority === "Urgent medical review"
  );

  const medical = result.recommendations.filter(
    item => [
      "Medical review",
      "Prompt review",
      "Confidential support"
    ].includes(item.priority)
  );

  const wellness = result.recommendations.filter(
    item => [
      "Wellness",
      "Review",
      "Data review"
    ].includes(item.priority)
  );

  return (

    <div className="recommendations-page">

      <div className="assessment-title">

        <div>
          <span className="eyebrow">
            <BrainCircuit size={15} />
            PERSONALIZED HEALTH GUIDANCE
          </span>

          <h1>Health Recommendations</h1>

          <p>
            Health-related guidance generated from your latest
            assessment and historical records.
          </p>
        </div>

        <div className="recommendation-engine-status">
          <ShieldCheck size={18} />
          Rule-based engine
        </div>

      </div>

      <div className="recommendation-welcome">

        <div className="recommendation-welcome-icon">
          <BrainCircuit size={28} />
        </div>

        <div>
          <h3>Your Mission Wellness Report</h3>
          <p>{result.summary}</p>
          <small>
            <CalendarDays size={13} />
            Generated: {new Date(result.generatedAt).toLocaleString()}
          </small>
        </div>

      </div>

      <div className="recommendation-summary-grid">

        <div className="recommendation-summary">
          <ClipboardList size={22} />
          <span>Total Guidance Items</span>
          <strong>{result.recommendations.length}</strong>
        </div>

        <div className="recommendation-summary">
          <AlertTriangle size={22} />
          <span>Urgent Medical Review</span>
          <strong>{urgent.length}</strong>
        </div>

        <div className="recommendation-summary">
          <HeartPulse size={22} />
          <span>Medical / Behavioral Review</span>
          <strong>{medical.length}</strong>
        </div>

        <div className="recommendation-summary">
          <CheckCircle2 size={22} />
          <span>Wellness / Data Guidance</span>
          <strong>{wellness.length}</strong>
        </div>

      </div>

      {urgent.length > 0 && (

        <section className="recommendation-group urgent-group">

          <div className="recommendation-group-heading">
            <AlertTriangle size={21} />
            <div>
              <h3>Urgent Medical Attention</h3>
              <p>
                Follow the approved mission emergency protocol.
                Do not wait for this application.
              </p>
            </div>
          </div>

          {urgent.map(item => (
            <RecommendationCard key={item.id} item={item} />
          ))}

        </section>

      )}

      <section className="recommendation-group">

        <div className="recommendation-group-heading">
          <HeartPulse size={21} />

          <div>
            <h3>Medical and Behavioral Health Review</h3>
            <p>
              Observations that may require professional assessment.
            </p>
          </div>
        </div>

        {medical.length === 0 ? (
          <div className="recommendation-empty-small">
            No additional medical or behavioral review guidance generated.
          </div>
        ) : (
          medical.map(item => (
            <RecommendationCard key={item.id} item={item} />
          ))
        )}

      </section>

      <section className="recommendation-group">

        <div className="recommendation-group-heading">
          <Activity size={21} />

          <div>
            <h3>Personal Wellness Improvements</h3>
            <p>
              Suggestions for maintaining mission health and wellness.
            </p>
          </div>
        </div>

        {wellness.length === 0 ? (
          <div className="recommendation-empty-small">
            No additional wellness or data guidance generated.
          </div>
        ) : (
          wellness.map(item => (
            <RecommendationCard key={item.id} item={item} />
          ))
        )}

      </section>

      <div className="recommendation-disclaimer">

        <ShieldCheck size={21} />

        <div>
          <strong>Medical Safety Notice</strong>

          <p>
            These recommendations are generated using predefined
            prototype rules. They are not medical diagnoses,
            prescriptions or validated clinical decisions.
            Follow approved mission medical protocols and consult
            authorized medical personnel for treatment decisions.
            A result with no recommendations does not establish
            that an astronaut is healthy.
          </p>
        </div>

      </div>

    </div>

  );

}
