import { Bell, Menu } from "lucide-react";

export default function Header({ astronaut, setMobileOpen }) {

  const initials = (astronaut?.name || "Astronaut")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (

    <header className="header">

      <div className="header-left">

        <button
          className="mobile-menu"
          onClick={() => setMobileOpen?.(true)}
        >
          <Menu size={22} />
        </button>

        <div>
          <h2>Mission Health Center</h2>
          <p>Monitor your health during your space mission</p>
        </div>

      </div>

      <div className="header-right">

        <div className="mission-badge">
          <span className="status-dot"></span>
          Mission Active
        </div>

        <button className="header-icon" aria-label="Notifications">
          <Bell size={19} />
        </button>

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