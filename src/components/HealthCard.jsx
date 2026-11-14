import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  ArrowUpRight,
} from "lucide-react";

const icons = {
  heart: Heart,
  activity: Activity,
  wind: Wind,
  thermometer: Thermometer,
};

export default function HealthCard({ metric }) {
  const Icon = icons[metric.icon];

  return (
    <div className="health-card">
      <div className="metric-top">
        <div className={`metric-icon ${metric.icon}`}>
          <Icon size={22} />
        </div>

        <span className="normal-status">
          <span className="status-dot"></span>
          {metric.status}
        </span>
      </div>

      <p className="metric-title">{metric.title}</p>

      <div className="metric-value">
        {metric.value}
        <span>{metric.unit}</span>
      </div>

      <div className="metric-footer">
        <span>{metric.change}</span>
        <ArrowUpRight size={16} />
      </div>
    </div>
  );
}