import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/home", icon: "🏠", label: "Home" },
    { path: "/analytics", icon: "📊", label: "Analytics" },
    { path: "/habits", icon: "⚙️", label: "Habits" },
    { path: "/reviews", icon: "🤖", label: "Reviews" },
  ];

  return (
    <div className="navbar">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`nav-item ${location.pathname === tab.path ? "active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export default Navbar;
