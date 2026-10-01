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
    <aside className="flex h-full w-64 flex-col bg-[#1C3D20] text-white">
      <div className="shrink-0 border-b border-white/10 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight">FertiSmart SL</h1>
        <p className="mt-1 text-xs capitalize text-white/60">{user?.role} Portal</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 py-4">
        <div className="truncate px-3 py-2 text-sm text-white/70">{user?.name}</div>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/70 transition hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}