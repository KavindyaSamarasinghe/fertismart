import React from "react";

export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  // Nothing to paginate when everything fits on one page
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={btn}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
