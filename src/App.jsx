import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

import { auth, db, authPersistence } from "./firebase/firebase";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HealthCard from "./components/HealthCard";
import HealthChart from "./components/HealthChart";
import Login from "./components/Login";
import HealthAssessment from "./components/HealthAssessment";
import HealthHistory from "./components/HealthHistory";
import HealthAnalytics from "./components/HealthAnalytics";
import AIHealthAssessment from "./components/AIHealthAssessment";
import HealthRecommendations from "./components/HealthRecommendations";
import EmergencyAlerts from "./components/EmergencyAlerts";
import AstronautProfile from "./components/AstronautProfile";

import {
  //astronaut,
  healthMetrics,
  healthAlerts
} from "./data/astronautData";

import {
  Activity,
  Moon,
  Footprints,
  AlertCircle,
  Smile
} from "lucide-react";

import "./App.css";

function Dashboard({ setActivePage, astronaut }) {

  return (

    <>

      <section className="welcome-section">

        <div>

          <span className="eyebrow">
            SPACE MISSION OVERVIEW
          </span>

          <h1>
            Welcome back, {astronaut.name.split(" ")[0]}!
          </h1>

          <p>
            Your mission health monitoring dashboard.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() => setActivePage("Health Assessment")}
        >
          + New Assessment
        </button>

      </section>

      <section className="mission-overview">

        <div className="overview-item accent-blue">
          <Activity size={22} />
          <div>
            <span>MISSION</span>
            <strong>{astronaut.mission}</strong>
          </div>
        </div>

        <div className="overview-item accent-indigo">
          <Footprints size={22} />
          <div>
            <span>ASTRONAUT ID</span>
            <strong>{astronaut.astronautId}</strong>
          </div>
        </div>

        <div className="overview-item accent-teal">
          <Moon size={22} />
          <div>
            <span>MISSION DAY</span>
            <strong>{astronaut.missionDay ?? "Not configured"}</strong>
          </div>
        </div>

      </section>

      <section className="section-block">

        <div className="section-heading">
          <div>
            <h3>Health Overview</h3>
            <p>Sample measurements from the Stage 1 dashboard</p>
          </div>
          <span className="updated-label">DEMO DATA</span>
        </div>

        <div className="health-grid">

          {healthMetrics.map((metric) => (
            <HealthCard
              key={metric.title}
              metric={metric}
            />
          ))}

        </div>

      </section>

      <section className="charts-grid">

        <HealthChart />

        <div className="panel">

          <div className="panel-heading">
            <div>
              <h3>Mission Wellness</h3>
              <p>Demonstration data</p>
            </div>
            <Activity size={21} />
          </div>

          <div className="wellness-item">
            <div className="wellness-icon sleep">
              <Moon size={20} />
            </div>
            <div className="wellness-details">
              <div className="wellness-label">
                <span>Sleep</span>
                <strong>7.5 <small>hours</small></strong>
              </div>
              <div className="wellness-bar sleep">
                <span style={{ width: "78%" }}></span>
              </div>
            </div>
          </div>

          <div className="wellness-item">
            <div className="wellness-icon exercise">
              <Footprints size={20} />
            </div>
            <div className="wellness-details">
              <div className="wellness-label">
                <span>Physical Activity</span>
                <strong>74 <small>minutes</small></strong>
              </div>
              <div className="wellness-bar exercise">
                <span style={{ width: "62%" }}></span>
              </div>
            </div>
          </div>

          <div className="wellness-item">
            <div className="wellness-icon mood">
              <Smile size={20} />
            </div>
            <div className="wellness-details">
              <div className="wellness-label">
                <span>Stress Level</span>
                <strong>Low</strong>
              </div>
              <div className="wellness-bar mood">
                <span style={{ width: "28%" }}></span>
              </div>
            </div>
          </div>

          <button
            className="text-button"
            onClick={() => setActivePage("Health Assessment")}
          >
            Enter today's health data →
          </button>

        </div>

      </section>

      <section className="panel alerts-panel">

        <div className="panel-heading">
          <div>
            <h3>Health Reminders</h3>
            <p>Demonstration notifications</p>
          </div>
          <AlertCircle size={21} />
        </div>

        {healthAlerts.map((alert, i) => (

          <div className="alert-item" key={i}>
            <div className={`alert-icon ${alert.type}`}>
              <AlertCircle size={18} />
            </div>
            <div className="alert-content">
              <div className="alert-title-row">
                <strong>{alert.title}</strong>
                <span className="alert-time">{alert.time}</span>
              </div>
              <p>{alert.description}</p>
            </div>
          </div>

        ))}

      </section>

    </>

  );

}

export default function App() {

  const [user, setUser] = useState(null);
  const [astronaut, setAstronaut] = useState(null);

  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {

    if (!auth || !db) {
      //setLoading(false);
      return;
    }

    let cancelled = false;

    let unsubscribe = () => {};

    authPersistence
      .then(() => {

        if (cancelled) return;

        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

          if (cancelled) return;

          setUser(currentUser);
          setAstronaut(null);
          setProfileError("");

          if (!currentUser) {
            setLoading(false);
            return;
          }

          try {

            let profile = null;

for (let attempt = 0; attempt < 5; attempt++) {

  if (cancelled) return;

  profile = await getDoc(
    doc(db, "astronauts", currentUser.uid)
  );

  if (profile.exists()) break;

  await new Promise(resolve => setTimeout(resolve, 300));
}

if (!profile || !profile.exists()) {
  throw new Error("Astronaut profile not found.");
}

            if (!cancelled) {
              setAstronaut(profile.data());
            }

          } catch (err) {

            console.error(err);

            if (!cancelled) {
              setProfileError(err.message);
            }

          } finally {

            if (!cancelled) {
              setLoading(false);
            }

          }

        });

      })
      .catch((err) => {

        console.error(err);
        setProfileError("Unable to initialize authentication.");
        setLoading(false);

      });

    return () => {
      cancelled = true;
      unsubscribe();
    };

  }, []);

  const logout = async () => {

    if (auth) {
      await signOut(auth);
      setActivePage("Dashboard");
    }

  };

  const navigate = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  if (loading) {

    return (
      <div className="loading-screen">
        Loading SPACECARE AI...
      </div>
    );

  }

  if (!auth || !db) {
    return (
      <div className="loading-screen">
        Firebase is not configured. Please check your .env file.
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="loading-screen">
        <p>{profileError}</p>
        <button
          className="primary-button"
          onClick={logout}
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!astronaut) {
    return (
      <div className="loading-screen">
        Loading astronaut profile...
      </div>
    );
  }

  return (

    <div className="app-layout">

      <div className={`sidebar-wrapper ${mobileOpen ? "open" : ""}`}>
        <Sidebar
          activePage={activePage}
          setActivePage={navigate}
        />
      </div>

      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="main-content">

        <Header
          astronaut={astronaut}
          activePage={activePage}
          setMobileOpen={setMobileOpen}
          onLogout={logout}
        />

        <div className="page-content">

          {activePage === "Dashboard" && (

            <Dashboard
              setActivePage={navigate}
              astronaut={astronaut}
            />

          )}

          {activePage === "Health Assessment" && (

            <HealthAssessment
              user={user}
              astronaut={astronaut}
            />

          )}

          {activePage === "Health History" && (

            <HealthHistory user={user} />

          )}

          {activePage === "Health Analytics" && (
  <HealthAnalytics user={user} />
)}

{activePage === "AI Health Assessment" && (
  <AIHealthAssessment user={user} />
)}

{activePage === "Health Recommendations" && (
  <HealthRecommendations user={user} />
)}

{activePage === "Emergency Alerts" && (
  <EmergencyAlerts user={user} />
)}

{activePage === "Astronaut Profile" && (
  <AstronautProfile user={user} />
)}


          {activePage !== "Dashboard" &&
            activePage !== "Health Assessment" &&
            activePage !== "Health History" &&
            activePage !== "Health Analytics" &&
            activePage !== "AI Health Assessment" &&
            activePage !== "Health Recommendations" &&
            activePage !== "Emergency Alerts" &&
             (

              <div className="placeholder-page">
                <Activity size={40} />
                <h2>{activePage}</h2>
                <p>This module will be developed in the next stages.</p>
                <button
                  className="primary-button"
                  onClick={() => navigate("Dashboard")}
                >
                  Back to Dashboard
                </button>
              </div>

            )}

          <footer className="footer">
            SPACECARE AI · Astronaut Health Monitoring System
          </footer>

        </div>

      </main>

    </div>

  );

}