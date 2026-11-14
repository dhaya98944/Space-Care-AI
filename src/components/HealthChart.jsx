import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { heartRateData } from "../data/astronautData";

export default function HealthChart() {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Heart Rate Monitoring</h3>
          <p>Today's heart rate measurements</p>
        </div>

        <span className="chart-unit">BPM</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={heartRateData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e8edf3"
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8491a5", fontSize: 12 }}
            />

            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8491a5", fontSize: 12 }}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="rate"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}