import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { heartRateData } from "../data/astronautData";

export default function HealthChart() {

  const rates = heartRateData.map((item) => item.rate);

  const average = Math.round(
    rates.reduce((total, rate) => total + rate, 0) / rates.length
  );

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
          <AreaChart
            data={heartRateData}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="heartRateFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#e9eef6"
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fill: "#93a0b3", fontSize: 11.5 }}
            />

            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tickMargin={6}
              tick={{ fill: "#93a0b3", fontSize: 11.5 }}
            />

            <Tooltip
              cursor={{ stroke: "#c7d9ff", strokeWidth: 1.5 }}
              contentStyle={{
                padding: "9px 12px",
                borderRadius: 10,
                border: "1px solid #e6ebf3",
                boxShadow: "0 12px 30px -12px rgba(15, 23, 42, 0.2)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#6d7a8f", fontSize: 10.5, marginBottom: 2 }}
              formatter={(value) => [`${value} BPM`, "Heart rate"]}
            />

            <Area
              type="monotone"
              dataKey="rate"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#heartRateFill)"
              isAnimationActive={false}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#2563eb",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-stats">
        <div>
          <span>Average</span>
          <strong>{average} BPM</strong>
        </div>
        <div>
          <span>Lowest</span>
          <strong>{Math.min(...rates)} BPM</strong>
        </div>
        <div>
          <span>Highest</span>
          <strong>{Math.max(...rates)} BPM</strong>
        </div>
      </div>
    </div>
  );
}
