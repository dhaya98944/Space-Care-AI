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
  Rocket
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

        <div className="login-brand">

          <div className="login-logo">
            <Orbit size={35} />
          </div>

          <h1>SPACECARE AI</h1>

          <p>Astronaut Health Monitoring System</p>

        </div>

        <h2>
          {mode === "login"
            ? "Astronaut Login"
            : "Astronaut Registration"}
        </h2>

        <p className="login-description">
          Secure access to your mission health monitoring system.
        </p>

        <form onSubmit={handleSubmit}>

          {mode === "register" && (

            <>
              <label>Full Name</label>

              <div className="login-input">
                <UserRound size={17} />
                <input
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <label>Astronaut ID</label>

              <div className="login-input">
                <Rocket size={17} />
                <input
                  name="astronautId"
                  value={form.astronautId}
                  onChange={update}
                  placeholder="AST-1001"
                  required
                />
              </div>

              <label>Mission</label>

              <select
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

          <label>Email Address</label>

          <div className="login-input">
            <Mail size={17} />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="astronaut@example.com"
              required
            />
          </div>

          <label>Password</label>

          <div className="login-input">
            <Lock size={17} />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              placeholder="Enter password"
              minLength={6}
              required
            />
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
  );
}