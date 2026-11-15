import { useCallback, useEffect, useMemo, useState } from "react";

import {
  collection,
  collectionGroup,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { getUrineInsight, urineScoreColor } from "../utils/hydration";

import {
  Radar,
  RefreshCw,
  Download,
  Search,
  Users,
  ClipboardList,
  Rocket,
  Droplets,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const initialsFor = (name) =>
  (name || "Astronaut")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const average = (values) =>
  values.reduce((total, value) => total + value, 0) / values.length;

function HydrationBadge({ insight }) {
  if (!insight) {
    return (
      <span className="mc-hydration mc-hydration-none">
        <span className="mc-dot" />
        No data
      </span>
    );
  }

  const tone =
    insight.score >= 7
      ? "warning"
      : insight.score >= 5
      ? "caution"
      : "good";

  return (
    <span className={`mc-hydration ${tone}`}>
      <span
        className="mc-dot"
        style={{ background: urineScoreColor(insight.score) }}
      />
      {insight.label}
      <small>{insight.score}/8</small>
    </span>
  );
}

export default function AdminDashboard({ user, astronaut, isAdmin }) {
  const [profiles, setProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [missionFilter, setMissionFilter] = useState("all");
  const [search, setSearch] = useState("");

  const refresh = () => {
    setLoading(true);
    setError("");
    setNotice("");
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    if (!isAdmin || !user) return undefined;

    let cancelled = false;

    async function loadMissionData() {
      try {
        let nextProfiles = [];
        let nextReports = [];
        let isRestricted = false;
        let nextNotice = "";

        try {
          const profileSnapshot = await getDocs(
            collection(db, "astronauts")
          );

          nextProfiles = profileSnapshot.docs.map((item) => ({
            uid: item.id,
            ...item.data()
          }));
        } catch (readError) {
          console.warn(
            "Mission Control: mission-wide profile read denied.",
            readError
          );

          isRestricted = true;
          nextProfiles = [{ uid: user.uid, ...astronaut }];
          nextNotice =
            "Firestore security rules currently block mission-wide reads. Showing your own profile and assessment reports only.";
        }

        if (isRestricted) {
          const ownSnapshot = await getDocs(
            query(
              collection(db, "astronauts", user.uid, "assessments"),
              orderBy("recordedAt", "desc")
            )
          );

          nextReports = ownSnapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            _uid: user.uid
          }));
        } else {
          try {
            const reportSnapshot = await getDocs(
              collectionGroup(db, "assessments")
            );

            nextReports = reportSnapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
              _uid: item.ref.parent.parent?.id
            }));
          } catch (readError) {
            console.warn(
              "Mission Control: collection group read denied, using per-astronaut reads.",
              readError
            );

            const lists = await Promise.all(
              nextProfiles.map(async (profile) => {
                const snapshot = await getDocs(
                  collection(
                    db,
                    "astronauts",
                    profile.uid,
                    "assessments"
                  )
                );

                return snapshot.docs.map((item) => ({
                  id: item.id,
                  ...item.data(),
                  _uid: profile.uid
                }));
              })
            );

            nextReports = lists.flat();
          }
        }

        if (!cancelled) {
          setProfiles(nextProfiles);
          setReports(nextReports);
          setRestricted(isRestricted);
          setNotice(nextNotice);
          setError("");
        }
      } catch (loadError) {
        console.error("Mission Control load failed:", loadError);

        if (!cancelled) {
          setError(
            loadError?.message || "Unable to load mission data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMissionData();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, user, astronaut, reloadKey]);

  const profileByUid = useMemo(() => {
    const map = {};

    profiles.forEach((profile) => {
      map[profile.uid] = profile;
    });

    return map;
  }, [profiles]);

  const enrichedReports = useMemo(() => {
    return reports
      .map((report) => {
        const profile = profileByUid[report._uid] || {};
        const insight = getUrineInsight(report.urine);
        const recordedTime = new Date(report.recordedAt || 0).getTime();

        return {
          ...report,
          _profile: profile,
          _mission: report.mission || profile.mission || "Unassigned",
          _name:
            report.astronautName ||
            profile.name ||
            "Unknown astronaut",
          _astronautId:
            report.astronautId || profile.astronautId || "—",
          _insight: insight,
          _recordedTime: Number.isNaN(recordedTime) ? 0 : recordedTime
        };
      })
      .sort((a, b) => b._recordedTime - a._recordedTime);
  }, [reports, profileByUid]);

  const latestByUid = useMemo(() => {
    const map = {};

    enrichedReports.forEach((report) => {
      if (report._uid && !map[report._uid]) {
        map[report._uid] = report;
      }
    });

    return map;
  }, [enrichedReports]);

  const missions = useMemo(() => {
    const names = new Set();

    profiles.forEach((profile) => {
      if (profile.mission) names.add(profile.mission);
    });

    enrichedReports.forEach((report) => {
      names.add(report._mission);
    });

    return Array.from(names).sort();
  }, [profiles, enrichedReports]);

  const searchTerm = search.trim().toLowerCase();

  const matchesSearch = useCallback(
    (values) =>
      !searchTerm ||
      values.some((value) =>
        String(value || "").toLowerCase().includes(searchTerm)
      ),
    [searchTerm]
  );

  const filteredReports = useMemo(
    () =>
      enrichedReports.filter(
        (report) =>
          (missionFilter === "all" ||
            report._mission === missionFilter) &&
          matchesSearch([
            report._name,
            report._astronautId,
            report._mission
          ])
      ),
    [enrichedReports, missionFilter, matchesSearch]
  );

  const astronautRows = useMemo(
    () =>
      profiles
        .filter(
          (profile) =>
            missionFilter === "all" ||
            (profile.mission || "Unassigned") === missionFilter
        )
        .filter((profile) =>
          matchesSearch([
            profile.name,
            profile.astronautId,
            profile.mission
          ])
        )
        .map((profile) => {
          const personReports = enrichedReports.filter(
            (report) => report._uid === profile.uid
          );

          return {
            profile,
            latest: latestByUid[profile.uid],
            reportCount: personReports.length
          };
        })
        .sort((a, b) =>
          String(a.profile.name || "").localeCompare(
            String(b.profile.name || "")
          )
        ),
    [
      profiles,
      missionFilter,
      enrichedReports,
      latestByUid,
      matchesSearch
    ]
  );

  const missionStats = useMemo(
    () =>
      missions.map((mission) => {
        const missionProfiles = profiles.filter(
          (profile) =>
            (profile.mission || "Unassigned") === mission
        );

        const missionReports = enrichedReports.filter(
          (report) => report._mission === mission
        );

        const scores = missionReports
          .map((report) => report._insight?.score)
          .filter(Number.isFinite);

        const flagged = missionProfiles.filter((profile) => {
          const latest = latestByUid[profile.uid];
          return (latest?._insight?.score ?? 0) >= 5;
        }).length;

        return {
          name: mission,
          astronautCount: missionProfiles.length,
          reportCount: missionReports.length,
          averageScore: scores.length ? average(scores) : null,
          flagged,
          latest: missionReports[0]
        };
      }),
    [missions, profiles, enrichedReports, latestByUid]
  );

  const flaggedAstronauts = profiles.filter(
    (profile) =>
      (latestByUid[profile.uid]?._insight?.score ?? 0) >= 5
  ).length;

  const exportReports = () => {
    if (!filteredReports.length) return;

    const rows = [
      [
        "Recorded at",
        "Astronaut",
        "Astronaut ID",
        "Mission",
        "Heart rate (BPM)",
        "Systolic (mmHg)",
        "Diastolic (mmHg)",
        "SpO2 (%)",
        "Sleep (hours)",
        "Urine colour",
        "Urine score",
        "Hydration estimate",
        "Source"
      ],
      ...filteredReports.map((report) => [
        report.recordedAt || "",
        report._name,
        report._astronautId,
        report._mission,
        report.measurements?.heartRate ?? "",
        report.measurements?.systolicBP ?? "",
        report.measurements?.diastolicBP ?? "",
        report.measurements?.spo2 ?? "",
        report.measurements?.sleepHours ?? "",
        report._insight?.label || "",
        report._insight?.score ?? "",
        report._insight?.estimate || "",
        report.source?.type || ""
      ])
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `mission-control-reports-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="mc-page">
        <div className="mc-denied">
          <ShieldAlert size={38} />
          <h2>Mission Control is restricted</h2>
          <p>
            Admin access is required. Add{" "}
            <code>role: "admin"</code> to the{" "}
            <code>astronauts/&lt;uid&gt;</code> profile to open this
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-page">
      <div className="assessment-title">
        <div>
          <span className="eyebrow">
            <Radar size={15} />
            ADMIN COMMAND
          </span>

          <h1>Mission Control</h1>

          <p>
            Mission-wide health reports, astronaut status and
            hydration indicators.
          </p>
        </div>

        <div className="mc-access-badge">
          <ShieldAlert size={16} />
          {restricted ? "Restricted mode" : "Mission-wide access"}
        </div>
      </div>

      <div className="mc-toolbar">
        <label className="mc-search">
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search astronaut, ID or mission"
          />
        </label>

        <label className="mc-select">
          <span>Mission</span>
          <select
            value={missionFilter}
            onChange={(event) =>
              setMissionFilter(event.target.value)
            }
          >
            <option value="all">All missions</option>
            {missions.map((mission) => (
              <option key={mission} value={mission}>
                {mission}
              </option>
            ))}
          </select>
        </label>

        <div className="mc-toolbar-actions">
          <button
            className="secondary-button mc-action"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? "mc-spin" : ""}
            />
            Refresh
          </button>

          <button
            className="primary-button mc-action"
            onClick={exportReports}
            disabled={!filteredReports.length}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {restricted && (
        <div className="mc-notice">
          <ShieldAlert size={20} />
          <div>
            <strong>Restricted data visibility</strong>
            <p>
              {notice} Deploy the included{" "}
              <code>firestore.rules</code> to enable mission-wide
              read access for administrators.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mc-error">
          <AlertTriangle size={20} />
          <div>
            <strong>Mission data unavailable</strong>
            <p>{error}</p>
          </div>
          <button
            className="secondary-button mc-action"
            onClick={refresh}
          >
            Retry
          </button>
        </div>
      )}

      <div className="mc-kpis">
        <div className="mc-kpi">
          <span className="mc-kpi-icon blue">
            <Rocket size={19} />
          </span>
          <div>
            <span>Missions</span>
            <strong>{missions.length}</strong>
          </div>
        </div>

        <div className="mc-kpi">
          <span className="mc-kpi-icon indigo">
            <Users size={19} />
          </span>
          <div>
            <span>Astronauts</span>
            <strong>{profiles.length}</strong>
          </div>
        </div>

        <div className="mc-kpi">
          <span className="mc-kpi-icon teal">
            <ClipboardList size={19} />
          </span>
          <div>
            <span>Assessment reports</span>
            <strong>{enrichedReports.length}</strong>
          </div>
        </div>

        <div className="mc-kpi">
          <span className="mc-kpi-icon amber">
            <Droplets size={19} />
          </span>
          <div>
            <span>Hydration flags</span>
            <strong>{flaggedAstronauts}</strong>
          </div>
        </div>
      </div>

      <div className="mc-section-heading">
        <div>
          <h3>Mission Overview</h3>
          <p>
            Health reporting coverage and hydration status by mission.
            Select a mission to filter the tables below.
          </p>
        </div>
      </div>

      {missionStats.length === 0 ? (
        <div className="mc-empty">
          <Rocket size={28} />
          <strong>No missions found</strong>
          <p>
            Mission data will appear once astronaut profiles are
            available.
          </p>
        </div>
      ) : (
        <div className="mc-missions">
          {missionStats.map((mission) => (
            <button
              type="button"
              key={mission.name}
              className={`mc-mission-card ${
                missionFilter === mission.name ? "active" : ""
              }`}
              onClick={() => setMissionFilter(mission.name)}
            >
              <div className="mc-mission-top">
                <span className="mc-mission-icon">
                  <Rocket size={17} />
                </span>
                <strong>{mission.name}</strong>
              </div>

              <div className="mc-mission-stats">
                <div>
                  <span>Astronauts</span>
                  <strong>{mission.astronautCount}</strong>
                </div>
                <div>
                  <span>Reports</span>
                  <strong>{mission.reportCount}</strong>
                </div>
                <div>
                  <span>Avg urine score</span>
                  <strong>
                    {mission.averageScore !== null
                      ? `${mission.averageScore.toFixed(1)}/8`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Hydration flags</span>
                  <strong>{mission.flagged}</strong>
                </div>
              </div>

              <small>
                Latest report:{" "}
                {mission.latest
                  ? formatDate(mission.latest.recordedAt)
                  : "No reports yet"}
              </small>
            </button>
          ))}
        </div>
      )}

      <div className="mc-section-heading">
        <div>
          <h3>Astronaut Health Status</h3>
          <p>
            Latest recorded vitals and hydration indicator for each
            astronaut.
          </p>
        </div>
        <span className="mc-count">
          {astronautRows.length} astronaut(s)
        </span>
      </div>

      <div className="mc-table-wrap">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Astronaut</th>
              <th>Mission</th>
              <th>Reports</th>
              <th>Latest report</th>
              <th>Latest vitals</th>
              <th>Hydration</th>
              <th>Hydration flag</th>
            </tr>
          </thead>
          <tbody>
            {astronautRows.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="mc-table-empty">
                    No astronauts match this filter.
                  </div>
                </td>
              </tr>
            ) : (
              astronautRows.map(({ profile, latest, reportCount }) => {
                const measurements = latest?.measurements || {};
                const flagged =
                  (latest?._insight?.score ?? 0) >= 5;

                return (
                  <tr key={profile.uid}>
                    <td>
                      <div className="mc-person">
                        <span className="mc-avatar">
                          {initialsFor(profile.name)}
                        </span>
                        <div>
                          <strong>{profile.name || "Unnamed"}</strong>
                          <small>{profile.astronautId || "—"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mc-mission-chip">
                        {profile.mission || "Unassigned"}
                      </span>
                    </td>
                    <td>{reportCount}</td>
                    <td>
                      {latest
                        ? formatDate(latest.recordedAt)
                        : "—"}
                    </td>
                    <td>
                      <div className="mc-vitals">
                        <span>
                          HR {measurements.heartRate ?? "—"} BPM
                        </span>
                        <span>
                          BP {measurements.systolicBP ?? "—"}/
                          {measurements.diastolicBP ?? "—"} mmHg
                        </span>
                        <span>
                          SpO₂ {measurements.spo2 ?? "—"}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <HydrationBadge insight={latest?._insight} />
                    </td>
                    <td>
                      <span
                        className={`mc-badge ${
                          flagged
                            ? "review"
                            : latest
                            ? "stable"
                            : "nodata"
                        }`}
                      >
                        {flagged
                          ? "Review"
                          : latest
                          ? "Clear"
                          : "No data"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mc-section-heading">
        <div>
          <h3>Assessment Reports</h3>
          <p>
            Mission-wise report feed with urine colour and hydration
            estimate.
          </p>
        </div>
        <span className="mc-count">
          {filteredReports.length} report(s)
        </span>
      </div>

      <div className="mc-table-wrap">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Recorded</th>
              <th>Astronaut</th>
              <th>Mission</th>
              <th>HR</th>
              <th>BP</th>
              <th>SpO₂</th>
              <th>Sleep</th>
              <th>Urine colour</th>
              <th>Hydration</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="10">
                  <div className="mc-table-empty">
                    No assessment reports match this filter.
                  </div>
                </td>
              </tr>
            ) : (
              filteredReports.slice(0, 60).map((report) => (
                <tr key={`${report._uid}-${report.id}`}>
                  <td>{formatDate(report.recordedAt)}</td>
                  <td>
                    <div className="mc-person mc-person-compact">
                      <div>
                        <strong>{report._name}</strong>
                        <small>{report._astronautId}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mc-mission-chip">
                      {report._mission}
                    </span>
                  </td>
                  <td>
                    {report.measurements?.heartRate ?? "—"}
                  </td>
                  <td>
                    {report.measurements?.systolicBP ?? "—"}/
                    {report.measurements?.diastolicBP ?? "—"}
                  </td>
                  <td>
                    {report.measurements?.spo2 ?? "—"}%
                  </td>
                  <td>
                    {report.measurements?.sleepHours ?? "—"} h
                  </td>
                  <td>
                    <HydrationBadge insight={report._insight} />
                  </td>
                  <td>
                    {report._insight?.estimate || "—"}
                  </td>
                  <td>{report.source?.type || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredReports.length > 60 && (
        <p className="mc-table-note">
          Showing the 60 most recent reports. Export CSV for the full
          filtered set.
        </p>
      )}

      <div className="mc-footnote">
        <Radar size={16} />
        <p>
          Mission Control aggregates astronaut profiles and health
          assessment reports. Access is governed by Firestore security
          rules. Urine colour is a wellness hydration indicator, not a
          medical diagnosis.
        </p>
      </div>
    </div>
  );
}
