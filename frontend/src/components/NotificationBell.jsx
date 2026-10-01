import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axiosClient.js";

const POLL_MS = 30000;

const getSeenKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("fertismart_user") || "{}");
    return `fertismart_notif_seen_${user.id || user._id || "anon"}`;
  } catch {
    return "fertismart_notif_seen_anon";
  }
};

const timeAgo = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const DOT_STYLES = {
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  pending_review: "bg-amber-500",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => Number(localStorage.getItem(getSeenKey())) || 0);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/notifications");
      setItems(data.notifications || []);
    } catch {
      /* keep the previous list if a poll fails */
    }
  }, []);

  // Poll every 30 seconds; clean up on unmount
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unreadCount = items.filter((n) => new Date(n.createdAt).getTime() > lastSeen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      const now = Date.now();
      localStorage.setItem(getSeenKey(), String(now));
      // Keep the badge until the dropdown closes, so the unread items stay highlighted
      setTimeout(() => setLastSeen(now), 0);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-[#1C2D35]">
            Notifications
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate(n.link);
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_STYLES[n.type] || "bg-slate-400"}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">{n.message}</span>
                      {n.detail && <span className="block text-xs text-slate-500">{n.detail}</span>}
                      <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}