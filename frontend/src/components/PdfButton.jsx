import { useState } from "react";
import { downloadRecommendationPdf } from "../utils/downloadRecommendationPdf";

export default function PdfButton({ rec }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // A new recommendation starts as pending_review, so the button stays hidden until approval
  if (rec.status !== "approved") return null;

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      await downloadRecommendationPdf(rec._id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-brand-green px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Preparing…" : "Download PDF"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}