import React from "react";
import Sidebar from "./Sidebar.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function DashboardLayout({ title, subtitle, actions, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="h-screen shrink-0">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <NotificationBell />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}