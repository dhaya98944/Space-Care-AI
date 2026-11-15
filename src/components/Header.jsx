import { Bell, Menu, LogOut } from "lucide-react";

const pageMeta = {
  Dashboard: {
    title: "Mission Health Center",
    subtitle: "Monitor your health during your space mission",
  },
  "Health Assessment": {
    title: "Daily Health Assessment",
    subtitle: "Record your physiological and wellness measurements",
  },
  "Health History": {
    title: "Health Records",
    subtitle: "Review your previous mission health assessments",
  },
  "Mission Control": {
    title: "Mission Control",
    subtitle: "Admin command for mission-wide reports and astronaut status",
  },
};

export default function Header({
  astronaut,
  activePage,
  setMobileOpen,
  onLogout,
}) {

  const initials = (astronaut?.name || "Astronaut")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const meta = pageMeta[activePage] || {
    title: activePage || "Mission Health Center",
    subtitle: "SPACECARE AI mission workspace",
  };

  return (

    <header className="header">

      <div className="header-left">

        <button
          className="mobile-menu"
          aria-label="Open navigation"
          onClick={() => setMobileOpen?.(true)}
        >
          <Menu size={20} />
        </button>

        <div>
          <h2>{meta.title}</h2>
          <p>{meta.subtitle}</p>
        </div>

      </div>

      <div className="header-right">

        <div className="mission-badge">
          <span className="status-dot"></span>
          Mission Active
        </div>

        <button className="header-icon" aria-label="Notifications">
          <Bell size={18} />
        </button>

        {onLogout && (
          <button
            className="logout-button"
            onClick={onLogout}
            title="Sign out of the mission workspace"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}

        <div className="user-profile">

          <div className="avatar">{initials}</div>

          <div className="user-details">
            <strong>{astronaut?.name}</strong>
            <span>{astronaut?.astronautId}</span>
          </div>

        </div>

      </div>

    </header>

  );

}
