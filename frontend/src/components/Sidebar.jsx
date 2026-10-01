import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = {
  farmer: [
    { to: "/farmer", label: "My Farms", icon: "🌱" },
    { to: "/farmer/recommendations", label: "Recommendations", icon: "📋" },
  ],
  officer: [
    { to: "/officer", label: "Pending Reviews", icon: "🧑‍🌾" },
    { to: "/officer/farms", label: "Farms Overview", icon: "🗺️" },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: "📊" },
    { to: "/admin/crops", label: "Crops", icon: "🥬" },
    { to: "/admin/fertilizers", label: "Fertilizers", icon: "🧪" },
    { to: "/admin/users", label: "Users", icon: "👥" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS[user?.role] || [];

  return (
    <aside className="w-64 min-h-screen bg-[#1C3D20] text-white flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">FertiSmart SL</h1>
        <p className="text-xs text-white/60 mt-1 capitalize">{user?.role} Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 text-sm text-white/70 truncate">{user?.name}</div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
