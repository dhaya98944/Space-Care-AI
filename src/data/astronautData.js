export const astronaut = {
  id: "AST-2045",
  name: "Alex Morgan",
  mission: "ISS Expedition 72",
  missionDay: 126,
  location: "International Space Station",
  status: "Mission Active",
};

export const healthMetrics = [
  {
    title: "Heart Rate",
    value: "72",
    unit: "BPM",
    status: "Normal",
    icon: "heart",
    change: "Resting measurement",
  },
  {
    title: "Blood Pressure",
    value: "118/78",
    unit: "mmHg",
    status: "Normal",
    icon: "activity",
    change: "Latest measurement",
  },
  {
    title: "Blood Oxygen",
    value: "98",
    unit: "%",
    status: "Normal",
    icon: "wind",
    change: "Latest measurement",
  },
  {
    title: "Body Temperature",
    value: "36.8",
    unit: "°C",
    status: "Normal",
    icon: "thermometer",
    change: "Latest measurement",
  },
];

export const heartRateData = [
  { time: "06:00", rate: 68 },
  { time: "08:00", rate: 72 },
  { time: "10:00", rate: 75 },
  { time: "12:00", rate: 78 },
  { time: "14:00", rate: 73 },
  { time: "16:00", rate: 71 },
  { time: "18:00", rate: 76 },
  { time: "20:00", rate: 70 },
];

export const weeklyData = [
  { day: "Mon", sleep: 7.5, activity: 65 },
  { day: "Tue", sleep: 8, activity: 72 },
  { day: "Wed", sleep: 6.5, activity: 58 },
  { day: "Thu", sleep: 7.8, activity: 80 },
  { day: "Fri", sleep: 8.2, activity: 75 },
  { day: "Sat", sleep: 7, activity: 68 },
  { day: "Sun", sleep: 7.5, activity: 74 },
];

export const healthAlerts = [
  {
    title: "Daily health assessment",
    description: "Daily assessment is pending.",
    time: "Today",
    type: "info",
  },
  {
    title: "Sleep monitoring",
    description: "Review the previous night's sleep record.",
    time: "Today",
    type: "warning",
  },
  {
    title: "Exercise reminder",
    description: "Complete the scheduled physical activity.",
    time: "Today",
    type: "success",
  },
];