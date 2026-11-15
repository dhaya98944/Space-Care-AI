
import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import { createManualSOS } from "../utils/emergencyEngine";

import {
  Siren,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
  Radio,
  History,
  BellRing
} from "lucide-react";

export default function EmergencyAlerts({ user }) {

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sosLoading, setSosLoading] = useState(false);
  const [sosMessage, setSosMessage] = useState("");

  useEffect(() => {

    if (!db || !user) {
      return;
    }

    const alertsQuery = query(
      collection(
        db,
        "astronauts",
        user.uid,
        "emergencyAlerts"
      ),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {

        const data = snapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }));

        setAlerts(data);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error(err);
        setError("Unable to load emergency records.");
        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, [user]);

  const activeAlerts = alerts.filter(
    alert => alert.status === "ACTIVE"
  );

  const acknowledgedAlerts = alerts.filter(
    alert => alert.status === "ACKNOWLEDGED"
  );

  const resolvedAlerts = alerts.filter(
    alert => alert.status === "RESOLVED"
  );

  async function activateSOS() {

    const confirmed = window.confirm(
      "ACTIVATE EMERGENCY SOS?\n\n" +
      "This will create a critical emergency record. " +
      "Use only when emergency assistance is required."
    );

    if (!confirmed) return;

    try {
      setSosLoading(true);
      setSosMessage("");

      await createManualSOS(user.uid);

      setSosMessage(
        "SOS emergency record created successfully."
      );

    } catch (err) {
      console.error(err);
      setError(
        "Unable to save SOS. Follow the mission emergency procedure immediately."
      );
    } finally {
      setSosLoading(false);
    }
  }

  async function acknowledgeAlert(alertId) {

    try {
      await updateDoc(
        doc(
          db,
          "astronauts",
          user.uid,
          "emergencyAlerts",
          alertId
        ),
        {
          status: "ACKNOWLEDGED",
          acknowledgedAt: serverTimestamp()
        }
      );
    } catch (err) {
      console.error(err);
      setError("Unable to acknowledge this alert.");
    }
  }

  async function resolveAlert(alertId) {

    const confirmed = window.confirm(
      "Confirm that this emergency record has been reviewed and resolved?"
    );

    if (!confirmed) return;

    try {
      await updateDoc(
        doc(
          db,
          "astronauts",
          user.uid,
          "emergencyAlerts",
          alertId
        ),
        {
          status: "RESOLVED",
          resolvedAt: serverTimestamp()
        }
      );
    } catch (err) {
      console.error(err);
      setError("Unable to update emergency status.");
    }
  }

  function formatDate(timestamp) {

    if (!timestamp) return "Date unavailable";

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return date.toLocaleString();
  }

  const authenticationUnavailable = !db || !user;

  if (loading && !authenticationUnavailable) {
    return (
      <div className="emergency-empty">
        <RefreshCw size={25} />
        Loading emergency records...
      </div>
    );
  }

  return (

    <div className="emergency-page">

      <div className="assessment-title">

        <div>
          <span className="eyebrow">
            <Siren size={15} />
            MISSION EMERGENCY RESPONSE
          </span>

          <h1>Emergency Alert Center</h1>

          <p>
            Monitor emergency alerts and manage astronaut
            emergency response records.
          </p>
        </div>

        <div className="emergency-status-indicator">
          <Radio size={17} />
          Firebase monitoring
        </div>

      </div>

      {(error || authenticationUnavailable) && (
        <div className="emergency-error">
          <AlertTriangle size={19} />
          {authenticationUnavailable
            ? "Astronaut authentication is unavailable."
            : error}
        </div>
      )}

      <div className="emergency-sos-panel">

        <div className="sos-content">
          <div className="sos-icon">
            <Siren size={36} />
          </div>

          <div>
            <h2>Emergency SOS</h2>

            <p>
              Activate this button to create an immediate
              emergency record for the astronaut.
            </p>
          </div>
        </div>

        <button
          className="sos-button"
          onClick={activateSOS}
          disabled={sosLoading || authenticationUnavailable}
        >
          {sosLoading ? (
            <RefreshCw size={19} />
          ) : (
            <BellRing size={19} />
          )}

          {sosLoading ? "ACTIVATING..." : "ACTIVATE SOS"}
        </button>

        <small>
          This creates a Firebase emergency record. It does not
          independently contact a medical officer or emergency service.
        </small>

      </div>

      {sosMessage && (
        <div className="emergency-success">
          <CheckCircle2 size={18} />
          {sosMessage}
        </div>
      )}

      <div className="emergency-summary-grid">

        <div className="emergency-summary-card">
          <AlertTriangle size={23} />
          <span>Active Alerts</span>
          <strong>{activeAlerts.length}</strong>
        </div>

        <div className="emergency-summary-card">
          <Clock size={23} />
          <span>Acknowledged</span>
          <strong>{acknowledgedAlerts.length}</strong>
        </div>

        <div className="emergency-summary-card">
          <CheckCircle2 size={23} />
          <span>Resolved</span>
          <strong>{resolvedAlerts.length}</strong>
        </div>

        <div className="emergency-summary-card">
          <History size={23} />
          <span>Total Records</span>
          <strong>{alerts.length}</strong>
        </div>

      </div>

      <div className="emergency-section-heading">
        <div>
          <h3>Active Emergency Alerts</h3>
          <p>Emergency records requiring acknowledgement or response.</p>
        </div>
      </div>

      {activeAlerts.length === 0 ? (

        <div className="emergency-empty">
          <ShieldAlert size={38} />
          <h3>No Active Emergency Records</h3>
          <p>
            No active emergency records are currently stored
            for this astronaut.
          </p>
        </div>

      ) : (

        activeAlerts.map(alert => (

          <article className="emergency-alert-card" key={alert.id}>

            <div className="emergency-alert-header">

              <div className="emergency-alert-icon">
                <AlertTriangle size={23} />
              </div>

              <div className="emergency-alert-title">
                <span>{alert.category}</span>
                <h3>{alert.title}</h3>
              </div>

              <span className="emergency-critical-tag">
                {alert.severity}
              </span>

            </div>

            <p className="emergency-alert-message">
              {alert.message}
            </p>

            <div className="emergency-action-box">
              <strong>Required action</strong>
              <p>{alert.recommendedAction}</p>
            </div>

            <div className="emergency-alert-meta">

              <span>
                <Clock size={14} />
                {formatDate(alert.createdAt)}
              </span>

              <span>
                {alert.alertType === "MANUAL"
                  ? "Manual SOS"
                  : "Automatic detection"}
              </span>

            </div>

            <div className="emergency-action-buttons">

              <button
                className="acknowledge-button"
                onClick={() => acknowledgeAlert(alert.id)}
              >
                <CheckCircle2 size={16} />
                Acknowledge
              </button>

              <button
                className="resolve-button"
                onClick={() => resolveAlert(alert.id)}
              >
                Mark Resolved
              </button>

            </div>

          </article>

        ))

      )}

      <div className="emergency-section-heading">
        <div>
          <h3>Emergency History</h3>
          <p>Previously acknowledged and resolved emergency records.</p>
        </div>
      </div>

      {alerts.filter(
        alert => alert.status !== "ACTIVE"
      ).length === 0 ? (

        <div className="emergency-empty">
          No previous emergency records.
        </div>

      ) : (

        alerts
          .filter(alert => alert.status !== "ACTIVE")
          .map(alert => (

            <div className="emergency-history-card" key={alert.id}>

              <div>
                <strong>{alert.title}</strong>
                <p>{formatDate(alert.createdAt)}</p>
                <small>
                  {alert.alertType === "MANUAL"
                    ? "Manual SOS"
                    : "Automatic detection"}
                </small>
              </div>

              <span className={
                alert.status === "RESOLVED"
                  ? "resolved-tag"
                  : "acknowledged-tag"
              }>
                {alert.status}
              </span>

              {alert.status === "ACKNOWLEDGED" && (
                <button
                  className="resolve-button"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Mark Resolved
                </button>
              )}

            </div>

          ))

      )}

      <div className="emergency-safety-note">
        <ShieldAlert size={21} />

        <p>
          This application is a prototype emergency-recording
          and alerting tool. It does not replace onboard emergency
          communication, medical personnel or mission emergency
          procedures. Never wait for an application notification
          when immediate assistance is required.
        </p>
      </div>

    </div>
  );
}
