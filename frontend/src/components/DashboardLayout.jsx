import React from "react";
import Sidebar from "./Sidebar.jsx";

export default function DashboardLayout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
