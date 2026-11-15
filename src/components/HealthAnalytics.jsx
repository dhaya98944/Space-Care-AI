
import { useEffect, useMemo,  useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";

import {
  Activity,
  HeartPulse,
  Wind,
  Thermometer,
  Droplets,
  Moon,
  Footprints,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Database
} from "lucide-react";

import { db } from "../firebase/firebase";
import { getUrineInsight, urineScoreColor } from "../utils/hydration";

function MetricCard({ title, value, unit, icon: Icon, description }) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-top">
        <div className="analytics-icon">
          <Icon size={21} />
        </div>
        <span className="analytics-card-label">{title}</span>
      </div>

      <div className="analytics-value">
        {value ?? "—"}
        <small>{unit}</small>
      </div>

      <p>{description}</p>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <div className="analytics-panel">
      <div className="analytics-panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="analytics-chart">
        {children}
      </div>
    </div>
  );
}

function TrendComparison({ title, unit, values }) {
  const valid = values.filter(Number.isFinite);

  if (valid.length < 2) {
    return (
      <div className="trend-card">
        <strong>{title}</strong>
        <p>Insufficient data for comparison.</p>
      </div>
    );
  }

  const first = valid.slice(0, Math.ceil(valid.length / 2));
  const latest = valid.slice(Math.ceil(valid.length / 2));

  const average = (items) =>
    items.reduce((sum, value) => sum + value, 0) / items.length;

  const baseline = average(first);
  const recent = average(latest);
  const difference = recent - baseline;

  const Icon =
    difference > 0.001
      ? TrendingUp
      : difference < -0.001
      ? TrendingDown
      : Minus;

  return (
    <div className="trend-card">
      <span>{title}</span>

      <div className="trend-comparison-value">
        <strong>{baseline.toFixed(1)} {unit}</strong>
        <Icon size={18} />
        <strong>{recent.toFixed(1)} {unit}</strong>
      </div>

      <p>
        Earlier average compared with recent average:
        {" "}
        {difference > 0 ? "+" : ""}
        {difference.toFixed(1)} {unit}
      </p>

      <small>
        Descriptive trend only; not a clinical risk classification.
      </small>
    </div>
  );
}

export default function HealthAnalytics({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");

  const isAnalyticsReady = Boolean(db) && Boolean(user);

  useEffect(() => {
    if (!isAnalyticsReady) {
      return;
    }

    const historyRef = collection(
      db,
      "astronauts",
      user.uid,
      "assessments"
    );

    const historyQuery = query(
      historyRef,
      orderBy("recordedAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        setRecords(data.reverse());
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Unable to load health analytics. Check Firestore access.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAnalyticsReady, user]);

  const chartData = useMemo(() => {
    return records.map((record, index) => {
      const m = record.measurements || {};

      const date = new Date(record.recordedAt);

      return {
        index: index + 1,
        date: Number.isNaN(date.getTime())
          ? `Record ${index + 1}`
          : date.toLocaleDateString([], {
              day: "2-digit",
              month: "short"
            }),
        heartRate: m.heartRate ?? null,
        systolic: m.systolicBP ?? null,
        diastolic: m.diastolicBP ?? null,
        spo2: m.spo2 ?? null,
        glucose: m.glucose ?? null,
        temperature: m.temperature ?? null,
        sleep: m.sleepHours ?? null,
        exercise: m.exerciseMinutes ?? null,
        weight: m.weight ?? null,
        urineScore: Number.isFinite(record.urine?.colorScore)
          ? record.urine.colorScore
          : null,
        urineLabel: record.urine?.label || null
      };
    });
  }, [records]);

  const latest = records.length
    ? records[records.length - 1]
    : null;

  const latestMeasurements = latest?.measurements || {};
  const latestUrine = getUrineInsight(latest?.urine);

  const formatValue = (value) =>
    value === null || value === undefined
      ? "—"
      : value;

  const validCount = (key) =>
    chartData.filter((item) => Number.isFinite(item[key])).length;

  const hasData = (key) => validCount(key) > 0;

  if (loading) {
    return (
      <div className="analytics-empty">
        <RefreshCw size={24} />
        <p>Loading astronaut health records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-empty analytics-error">
        <AlertCircle size={26} />
        <h3>Analytics unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="analytics-empty">
        <Database size={35} />
        <h3>No health assessment data available</h3>
        <p>
          Submit at least one health assessment to generate
          your analytics dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      <div className="assessment-title">
        <div>
          <span className="eyebrow">
            <Activity size={15} />
            HEALTH INTELLIGENCE
          </span>

          <h1>Health Analytics</h1>

          <p>
            Historical health measurements and mission wellness trends.
          </p>
        </div>

        <div className="analytics-record-count">
          <Database size={17} />
          {records.length} Records
        </div>
      </div>

      <div className="analytics-latest">
        <div>
          <span>LATEST ASSESSMENT</span>
          <strong>
            {new Date(latest.recordedAt).toLocaleString()}
          </strong>
        </div>

        <span className="record-source">
          Source: {latest.source?.type || "Unknown"}
        </span>
      </div>

      <div className="analytics-section-title">
        <div>
          <h3>Latest Health Measurements</h3>
          <p>Values from the most recent assessment</p>
        </div>
      </div>

      <div className="analytics-grid">
        <MetricCard
          title="Heart Rate"
          value={formatValue(latestMeasurements.heartRate)}
          unit="BPM"
          icon={HeartPulse}
          description="Latest recorded measurement"
        />

        <MetricCard
          title="Blood Pressure"
          value={
            latestMeasurements.systolicBP != null &&
            latestMeasurements.diastolicBP != null
              ? `${latestMeasurements.systolicBP}/${latestMeasurements.diastolicBP}`
              : "—"
          }
          unit="mmHg"
          icon={Activity}
          description="Systolic / Diastolic"
        />

        <MetricCard
          title="Blood Oxygen"
          value={formatValue(latestMeasurements.spo2)}
          unit="%"
          icon={Wind}
          description="Oxygen saturation"
        />

        <MetricCard
          title="Temperature"
          value={formatValue(latestMeasurements.temperature)}
          unit="°C"
          icon={Thermometer}
          description="Body temperature"
        />

        <MetricCard
          title="Blood Glucose"
          value={formatValue(latestMeasurements.glucose)}
          unit="mg/dL"
          icon={Droplets}
          description="Latest recorded measurement"
        />

        <MetricCard
          title="Sleep Duration"
          value={formatValue(latestMeasurements.sleepHours)}
          unit="Hours"
          icon={Moon}
          description="Daily sleep duration"
        />

        <MetricCard
          title="Exercise"
          value={formatValue(latestMeasurements.exerciseMinutes)}
          unit="Minutes"
          icon={Footprints}
          description="Daily exercise duration"
        />

        <MetricCard
          title="Body Weight"
          value={formatValue(latestMeasurements.weight)}
          unit="kg"
          icon={Activity}
          description="Latest recorded measurement"
        />

        <MetricCard
          title="Urine Colour"
          value={latestUrine?.label || "—"}
          unit={latestUrine ? `${latestUrine.score}/8` : ""}
          icon={Droplets}
          description={
            latestUrine ? latestUrine.estimate : "Hydration indicator"
          }
        />
      </div>

      <div className="analytics-section-title">
        <div>
          <h3>Physiological Health Trends</h3>
          <p>Measurements across submitted assessments</p>
        </div>
      </div>

      <div className="analytics-chart-grid">

        <ChartPanel
          title="Heart Rate Trend"
          subtitle={`${validCount("heartRate")} recorded measurements · BPM`}
        >
          {hasData("heartRate") ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="date" tick={{ fontSize: 10 }} />

                <YAxis tick={{ fontSize: 10 }} />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#ef4444"
                  fill="url(#heartGradient)"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No heart-rate measurements recorded.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Blood Pressure Trend"
          subtitle={`${validCount("systolic")} recorded measurements · mmHg`}
        >
          {hasData("systolic") || hasData("diastolic") ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="date" tick={{ fontSize: 10 }} />

                <YAxis tick={{ fontSize: 10 }} />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic"
                  stroke="#2563eb"
                  strokeWidth={2}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic"
                  stroke="#0d9488"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No blood-pressure measurements recorded.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Blood Oxygen Trend"
          subtitle={`${validCount("spo2")} recorded measurements · %`}
        >
          {hasData("spo2") ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="spo2"
                  name="SpO₂"
                  stroke="#0d9488"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No SpO₂ measurements recorded.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Blood Glucose Trend"
          subtitle={`${validCount("glucose")} recorded measurements · mg/dL`}
        >
          {hasData("glucose") ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="glucose"
                  name="Blood Glucose"
                  stroke="#d97706"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No glucose measurements recorded.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Sleep Duration"
          subtitle={`${validCount("sleep")} recorded measurements · Hours`}
        >
          {hasData("sleep") ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />

                <Bar
                  dataKey="sleep"
                  name="Sleep Hours"
                  fill="#7c3aed"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No sleep measurements recorded.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Exercise Duration"
          subtitle={`${validCount("exercise")} recorded measurements · Minutes`}
        >
          {hasData("exercise") ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />

                <Bar
                  dataKey="exercise"
                  name="Exercise Minutes"
                  fill="#16a34a"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No exercise measurements recorded.</p>
          )}
        </ChartPanel>

        <ChartPanel
          title="Hydration Indicator"
          subtitle={`${validCount("urineScore")} urine colour records · Score 1–8`}
        >
          {hasData("urineScore") ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis
                  domain={[0, 8]}
                  ticks={[1, 3, 5, 7, 8]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${props?.payload?.urineLabel || "Urine colour"} · ${value}/8`,
                    "Hydration score"
                  ]}
                />

                <Bar
                  dataKey="urineScore"
                  name="Urine colour score"
                  radius={[5, 5, 0, 0]}
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={`urine-${index}`}
                      fill={urineScoreColor(item.urineScore)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-no-data">No urine colour records.</p>
          )}
        </ChartPanel>

      </div>

      <div className="analytics-section-title">
        <div>
          <h3>Historical Comparison</h3>
          <p>
            Compare earlier and more recent measurements in this record set.
          </p>
        </div>
      </div>

      <div className="trend-grid">

        <TrendComparison
          title="Heart Rate"
          unit="BPM"
          values={chartData.map(item => item.heartRate)}
        />

        <TrendComparison
          title="Blood Oxygen"
          unit="%"
          values={chartData.map(item => item.spo2)}
        />

        <TrendComparison
          title="Sleep"
          unit="Hours"
          values={chartData.map(item => item.sleep)}
        />

        <TrendComparison
          title="Body Weight"
          unit="kg"
          values={chartData.map(item => item.weight)}
        />

      </div>

      <div className="analytics-note">
        <AlertCircle size={19} />

        <p>
          Analytics are descriptive and based on submitted measurements.
          Changes are not diagnoses. Urine colour is a general hydration
          indicator, not a clinical measurement. Missing values are excluded
          from individual calculations. Clinical interpretation, alerts and
          treatment decisions must follow approved mission medical protocols.
        </p>
      </div>

    </div>
  );
}
