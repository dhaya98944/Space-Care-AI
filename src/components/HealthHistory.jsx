import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

import { db } from "../firebase/firebase";
//import "./App.css";

import {
  History,
  HeartPulse,
  Activity,
  Clock,
  RefreshCw
} from "lucide-react";

export default function HealthHistory({ user }) {

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {

    if (!db || !user) return;

    setLoading(true);
    setError("");

    try {

      const historyRef = collection(
        db,
        "astronauts",
        user.uid,
        "assessments"
      );

      const historyQuery = query(
        historyRef,
        orderBy("recordedAt", "desc")
      );

      const snapshot = await getDocs(historyQuery);

      setRecords(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      );

    } catch (err) {

      console.error(err);
      setError("Unable to retrieve assessment history.");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    //loadHistory();
  }, [user]);

  const formatDate = (date) => {

    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString();

  };

  return (

    <div className="history-page">

      <div className="assessment-title">

        <div>
          <span className="eyebrow">
            <History size={15} />
            HEALTH RECORDS
          </span>

          <h1>Assessment History</h1>

          <p>
            Review your previous mission health assessments.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={loadHistory}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      <div className="history-summary">

        <div className="history-summary-card">
          <History size={23} />
          <div>
            <strong>{records.length}</strong>
            <span>Total Assessments</span>
          </div>
        </div>

      </div>

      {loading && (
        <div className="history-empty">
          Loading health records...
        </div>
      )}

      {error && (
        <div className="assessment-error">{error}</div>
      )}

      {!loading && !error && records.length === 0 && (

        <div className="history-empty">
          <History size={40} />
          <h3>No assessment records yet</h3>
          <p>
            Your submitted health assessments will appear here.
          </p>
        </div>

      )}

      {!loading && records.map((record) => {

        const m = record.measurements || {};

        return (

          <div className="history-card" key={record.id}>

            <div className="history-card-heading">

              <div>
                <strong>
                  <Clock size={15} />
                  {formatDate(record.recordedAt)}
                </strong>

                <span>
                  {record.source?.type || "Manual"} data
                </span>
              </div>

              <span className="history-record-id">
                {record.id.slice(0, 8)}
              </span>

            </div>

            <div className="history-metrics">

              <div>
                <HeartPulse size={17} />
                <span>Heart Rate</span>
                <strong>{m.heartRate ?? "—"} BPM</strong>
              </div>

              <div>
                <Activity size={17} />
                <span>Blood Pressure</span>
                <strong>
                  {m.systolicBP ?? "—"}/
                  {m.diastolicBP ?? "—"}
                </strong>
              </div>

              <div>
                <Activity size={17} />
                <span>SpO₂</span>
                <strong>{m.spo2 ?? "—"}%</strong>
              </div>

              <div>
                <Clock size={17} />
                <span>Sleep</span>
                <strong>{m.sleepHours ?? "—"} Hours</strong>
              </div>

            </div>

            <div className="history-extra">

              <span>
                Temperature: {m.temperature ?? "—"} °C
              </span>

              <span>
                Mood: {record.psychological?.mood || "—"}
              </span>

              <span>
                Symptoms: {
                  record.symptoms?.join(", ") || "None recorded"
                }
              </span>

            </div>

          </div>

        );

      })}

    </div>

  );

}