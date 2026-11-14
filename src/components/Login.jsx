import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db, authPersistence } from "../firebase/firebase";

import {
  Orbit,
  Lock,
  Mail,
  UserRound,
  Rocket,
  Activity,
  HeartPulse,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

export default function Login() {

  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    astronautId: "",
    mission: "ISS",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      if (!auth || !db) {
        throw new Error(
          "Firebase is not configured. Check your .env file."
        );
      }

      await authPersistence;

      const email = form.email.trim().toLowerCase();

      if (mode === "register") {

        if (!form.name.trim() || !form.astronautId.trim()) {
          throw new Error("Complete all astronaut details.");
        }

        const astronautId = form.astronautId
          .trim()
          .toUpperCase();

        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            form.password
          );

        const profileRef = doc(
          db,
          "astronauts",
          userCredential.user.uid
        );

        await setDoc(profileRef, {
          astronautId,
          name: form.name.trim(),
          email,
          mission: form.mission,
          createdAt: serverTimestamp()
        });

      } else {

        const userCredential =
          await signInWithEmailAndPassword(
            auth,
            email,
            form.password
          );

        const profileRef = doc(
          db,
          "astronauts",
          userCredential.user.uid
        );

        const profile = await getDoc(profileRef);

        if (!profile.exists()) {
          await signOut(auth);
          throw new Error(
            "Astronaut profile not found. Contact mission administration."
          );
        }
      }

    } catch (err) {

      setError(
        err.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err.message
      );

    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="login-page">

      <div className="login-card">

        <aside className="login-aside">

          <div className="login-intro">

            <div className="login-aside-brand">

              <div className="login-logo">
                <Orbit size={30} />
              </div>

              <div>
                <strong>SPACECARE AI</strong>
                <span>ASTRONAUT HEALTH MONITORING</span>
              </div>

            </div>

            <h1>
              Health intelligence for every <em>mission</em>.
            </h1>

            <p>
              Track vital signs, sleep, activity and psychological
              wellness from launch readiness to mission completion.
            </p>

          </div>

          <div className="login-features">

            <div className="login-feature">
              <Activity size={18} />
              <div>
                <strong>Live vital monitoring</strong>
                <span>Heart rate, blood pressure, SpO₂ and more</span>
              </div>
            </div>

            <div className="login-feature">
              <HeartPulse size={18} />
              <div>
                <strong>Daily health assessments</strong>
                <span>Structured checks for physiological wellbeing</span>
              </div>
            </div>

            <div className="login-feature">
              <ShieldCheck size={18} />
              <div>
                <strong>Secure mission records</strong>
                <span>Encrypted access to your health history</span>
              </div>
            </div>

          </div>

          <p className="login-aside-footer">
            SPACECARE AI · Secure Mission Access
          </p>

        </aside>

        <div className="login-panel">

          <span className="eyebrow">
            <ShieldCheck size={15} />
            SECURE ACCESS
          </span>

          <h2>
            {mode === "login"
              ? "Astronaut Login"
              : "Astronaut Registration"}
          </h2>

          <p className="login-description">
            {mode === "login"
              ? "Sign in to access your mission health monitoring system."
              : "Create your crew profile to begin health monitoring."}
          </p>

          <form onSubmit={handleSubmit}>

            {mode === "register" && (

              <>
                <label htmlFor="name">Full Name</label>

                <div className="login-input">
                  <UserRound size={17} />
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={update}
                    placeholder="Enter full name"
                    autoComplete="name"
                    required
                  />
                </div>

                <label htmlFor="astronautId">Astronaut ID</label>

                <div className="login-input">
                  <Rocket size={17} />
                  <input
                    id="astronautId"
                    name="astronautId"
                    value={form.astronautId}
                    onChange={update}
                    placeholder="AST-1001"
                    required
                  />
                </div>

                <label htmlFor="mission">Mission</label>

                <select
                  id="mission"
                  name="mission"
                  value={form.mission}
                  onChange={update}
                  className="login-select"
                >
                  <option value="ISS">ISS</option>
                  <option value="Artemis">Artemis</option>
                  <option value="Deep Space">Deep Space</option>
                </select>
              </>
            )}

            <label htmlFor="email">Email Address</label>

            <div className="login-input">
              <Mail size={17} />

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="astronaut@example.com"
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="login-input">
              <Lock size={17} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={update}
                placeholder="Enter password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword
                  ? <EyeOff size={16} />
                  : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="primary-button login-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login to Mission"
                : "Register Astronaut"}
            </button>

          </form>

          <div className="login-switch">

            {mode === "login"
              ? "New astronaut? "
              : "Already registered? "}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login" ? "register" : "login"
                );
                setError("");
              }}
            >
              {mode === "login"
                ? "Register here"
                : "Login here"}
            </button>

          </div>

          <p className="login-footer">
            SPACECARE AI · Secure Mission Access
          </p>

        </div>

      </div>

    </div>
  );
}
