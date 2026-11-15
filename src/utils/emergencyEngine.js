
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase/firebase";

// Initial demonstration thresholds.
// Obtain mission medical approval before operational use.

export function detectEmergencyConditions(assessment) {
  const measurements = assessment?.measurements || {};
  const symptoms = assessment?.symptoms || [];

  const alerts = [];

  // Breathing difficulty
  if (symptoms.includes("Breathing difficulty")) {
    alerts.push({
      code: "breathing-difficulty",
      title: "Breathing Difficulty Reported",
      category: "Respiratory Emergency",
      severity: "CRITICAL",
      message:
        "The astronaut has reported breathing difficulty. Immediate medical assessment is required.",
      recommendedAction:
        "Activate the mission emergency medical protocol and contact the medical officer immediately."
    });
  }

  // Oxygen saturation
  if (
    Number.isFinite(measurements.spo2) &&
    measurements.spo2 <= 92
  ) {
    alerts.push({
      code: "critical-spo2",
      title: "Low Oxygen Saturation",
      category: "Respiratory Emergency",
      severity: "CRITICAL",
      message:
        `Recorded SpO2 is ${measurements.spo2}%.`,
      recommendedAction:
        "Follow the approved mission oxygenation and emergency assessment protocol."
    });
  }

  // Blood pressure
  if (
    Number.isFinite(measurements.systolicBP) &&
    Number.isFinite(measurements.diastolicBP) &&
    (
      measurements.systolicBP >= 180 ||
      measurements.diastolicBP >= 120
    )
  ) {
    alerts.push({
      code: "critical-blood-pressure",
      title: "Severely Elevated Blood Pressure",
      category: "Cardiovascular Emergency",
      severity: "CRITICAL",
      message:
        `Recorded blood pressure is ${measurements.systolicBP}/${measurements.diastolicBP} mmHg.`,
      recommendedAction:
        "Follow the mission medical emergency protocol and obtain immediate medical officer assessment."
    });
  }

  return alerts;
}


// Automatically create emergency records
// when a health assessment is submitted.

export async function createEmergencyAlertsForAssessment(
  userId,
  assessmentId,
  assessment
) {
  if (!userId || !assessmentId || !db) {
    throw new Error("Missing astronaut or assessment information.");
  }

  const detectedAlerts = detectEmergencyConditions(assessment);

  const createdAlerts = [];

  for (const alert of detectedAlerts) {
    const alertId = `auto-${assessmentId}-${alert.code}`;

    const alertRef = doc(
      db,
      "astronauts",
      userId,
      "emergencyAlerts",
      alertId
    );

    const created = await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(alertRef);

      if (existing.exists()) {
        return false;
      }

      transaction.set(alertRef, {
        ...alert,
        astronautId: userId,
        assessmentId,
        alertType: "AUTOMATIC",
        status: "ACTIVE",
        createdAt: serverTimestamp(),
        acknowledgedAt: null,
        resolvedAt: null
      });

      return true;
    });

    if (created) {
      createdAlerts.push({
        id: alertId,
        ...alert
      });
    }
  }

  return createdAlerts;
}


// Manual SOS activation

export async function createManualSOS(userId, details = "") {
  if (!userId || !db) {
    throw new Error("Astronaut account is not available.");
  }

  const alertRef = doc(
    collection(
      db,
      "astronauts",
      userId,
      "emergencyAlerts"
    )
  );

  await runTransaction(db, async (transaction) => {
    transaction.set(alertRef, {
      title: "Manual SOS Emergency",
      category: "Astronaut SOS",
      code: "manual-sos",
      severity: "CRITICAL",
      message:
        details.trim() ||
        "The astronaut has manually activated the emergency SOS button.",
      recommendedAction:
        "Immediately initiate the approved mission emergency response procedure.",
      astronautId: userId,
      alertType: "MANUAL",
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      acknowledgedAt: null,
      resolvedAt: null
    });
  });

  return alertRef.id;
}
