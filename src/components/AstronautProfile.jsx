
import { useEffect, useState } from "react";

import {
  doc,
  onSnapshot,
  setDoc
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  UserRound,
  Mail,
  ShieldCheck,
  Rocket,
  Fingerprint,
  Save,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays
} from "lucide-react";

export default function AstronautProfile({ user }) {

  const [profile, setProfile] = useState({
    astronautId: "",
    name: "",
    email: "",
    mission: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdAt, setCreatedAt] = useState(null);

  useEffect(() => {

    if (!user || !db) {
      setError("User authentication unavailable.");
      setLoading(false);
      return;
    }

    const profileRef = doc(
      db,
      "astronauts",
      user.uid
    );

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {

        if (snapshot.exists()) {

          const data = snapshot.data();

          setProfile({
            astronautId: data.astronautId || "",
            name: data.name || "",
            email: data.email || user.email || "",
            mission: data.mission || ""
          });

          setCreatedAt(data.createdAt || null);

        } else {

          setProfile({
            astronautId: "",
            name: user.displayName || "",
            email: user.email || "",
            mission: ""
          });

        }

        setLoading(false);
        setError("");

      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve astronaut profile.");
        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, [user]);

  function handleChange(e) {

    const { name, value } = e.target;

    setProfile(prev => ({
      ...prev,
      [name]: value
    }));

  }

  async function handleSave(e) {

    e.preventDefault();

    if (!profile.name.trim()) {
      setError("Please enter the astronaut name.");
      return;
    }

    if (!profile.astronautId.trim()) {
      setError("Please enter the astronaut ID.");
      return;
    }

    try {

      setSaving(true);
      setError("");
      setSuccess("");

      const profileRef = doc(
        db,
        "astronauts",
        user.uid
      );

      await setDoc(
        profileRef,
        {
          astronautId: profile.astronautId.trim(),
          name: profile.name.trim(),
          email: profile.email,
          mission: profile.mission.trim(),
          uid: user.uid,
          updatedAt: new Date()
        },
        { merge: true }
      );

      setSuccess("Astronaut profile updated successfully.");
      setEditing(false);

    } catch (err) {

      console.error(err);
      setError("Unable to save profile. Please try again.");

    } finally {

      setSaving(false);

    }

  }

  if (loading) {
    return (
      <div className="profile-loading">
        <Loader2 className="spin" size={28} />
        Loading astronaut profile...
      </div>
    );
  }

  return (

    <div className="astronaut-profile-page">

      {/* PAGE HEADER */}

      <div className="assessment-title">

        <div>
          <span className="eyebrow">
            <UserRound size={15} />
            ASTRONAUT ACCOUNT
          </span>

          <h1>Astronaut Profile</h1>

          <p>
            Manage your astronaut identity and mission information.
          </p>
        </div>

        <div className="profile-verified">
          <ShieldCheck size={17} />
          Firebase Account
        </div>

      </div>

      {/* PROFILE CARD */}

      <div className="profile-main-card">

        <div className="profile-banner">

          <div className="profile-avatar">
            <UserRound size={45} />
          </div>

          <div className="profile-banner-details">

            <h2>{profile.name || "Astronaut"}</h2>

            <p>
              {profile.astronautId || "Astronaut ID not assigned"}
            </p>

            <span className="profile-active-tag">
              <span className="profile-dot"></span>
              Authenticated Account
            </span>

          </div>

          <button
            className="profile-edit-button"
            onClick={() => {
              setEditing(!editing);
              setError("");
              setSuccess("");
            }}
          >
            <Edit3 size={16} />
            {editing ? "Cancel Editing" : "Edit Profile"}
          </button>

        </div>

        {error && (
          <div className="profile-error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {success && (
          <div className="profile-success">
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        <form onSubmit={handleSave}>

          <div className="profile-section-title">
            <UserRound size={19} />
            <div>
              <h3>Personal Information</h3>
              <p>Your registered astronaut information.</p>
            </div>
          </div>

          <div className="profile-form-grid">

            <div className="profile-field">
              <label>Astronaut Name</label>

              <div className="profile-input-wrapper">
                <UserRound size={17} />

                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter astronaut name"
                />
              </div>
            </div>

            <div className="profile-field">
              <label>Astronaut ID</label>

              <div className="profile-input-wrapper">
                <Fingerprint size={17} />

                <input
                  name="astronautId"
                  value={profile.astronautId}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter astronaut ID"
                />
              </div>
            </div>

            <div className="profile-field">
              <label>Email Address</label>

              <div className="profile-input-wrapper">
                <Mail size={17} />

                <input
                  name="email"
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>
            </div>

            <div className="profile-field">
              <label>Mission Name</label>

              <div className="profile-input-wrapper">
                <Rocket size={17} />

                <input
                  name="mission"
                  value={profile.mission}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter mission name"
                />
              </div>
            </div>

          </div>

          <div className="profile-section-title account-section">
            <ShieldCheck size={19} />

            <div>
              <h3>Account Information</h3>
              <p>Firebase authentication details.</p>
            </div>
          </div>

          <div className="profile-account-grid">

            <div className="profile-account-item">
              <span>Firebase User ID</span>
              <strong>{user?.uid || "Unavailable"}</strong>
            </div>

            <div className="profile-account-item">
              <span>Account Email</span>
              <strong>{user?.email || "Unavailable"}</strong>
            </div>

            <div className="profile-account-item">
              <span>Account Status</span>
              <strong className="account-status">
                <CheckCircle2 size={15} />
                Authenticated
              </strong>
            </div>

            <div className="profile-account-item">
              <span>Profile Created</span>
              <strong>
                {createdAt?.toDate
                  ? createdAt.toDate().toLocaleDateString()
                  : "Not available"}
              </strong>
            </div>

          </div>

          {editing && (

            <div className="profile-save-section">

              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >

                {saving ? (
                  <Loader2 className="spin" size={17} />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Saving..." : "Save Profile"}

              </button>

            </div>

          )}

        </form>

      </div>

      <div className="profile-information-note">
        <ShieldCheck size={20} />

        <p>
          Your astronaut profile is stored in Firebase Firestore
          and associated with your authenticated account.
          Your individual astronaut ID is used to identify
          your health assessment records.
        </p>
      </div>

    </div>

  );

}
