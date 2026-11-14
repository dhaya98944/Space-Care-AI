import {
  LayoutDashboard,
  UserRound,
  ClipboardList,
  Activity,
  BrainCircuit,
  HeartPulse,
  Bell,
  Database,
  Orbit,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Astronaut Profile", icon: UserRound },
  { name: "Health Assessment", icon: ClipboardList },
  { name: "Health Analytics", icon: Activity },
  { name: "AI Health Assessment", icon: BrainCircuit },
  { name: "Recommendations", icon: HeartPulse },
  { name: "Emergency Alerts", icon: Bell },
  { name: "Health History", icon: Database },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Orbit size={27} />
        </div>
        <div>
          <h2>SPACECARE</h2>
          <span>ASTRONAUT HEALTH AI</span>
        </div>
      </div>

      <div className="menu-heading">WORKSPACE</div>

      <nav className="navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="mission-card">
          <div className="mission-icon">
            <Orbit size={20} />
          </div>
          <strong>Mission Active</strong>
          <span>ISS Expedition 72</span>
          <span>Day 126</span>
        </div>
        <p>SPACECARE AI v1.0</p>
      </div>
    </aside>
  );
}