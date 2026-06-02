import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/home", icon: "ti-home", label: "Home" },
    { path: "/analytics", icon: "ti-chart-bar", label: "Analytics" },
    { path: "/habits", icon: "ti-list-check", label: "Habits" },
    { path: "/reviews", icon: "ti-sparkles", label: "Reviews" },
  ];

  return (
    <div className="navbar">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`nav-item ${location.pathname === tab.path ? "active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
          <i className={`ti ${tab.icon} nav-icon`} aria-hidden="true"></i>
          <span className="nav-label">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export default Navbar;
