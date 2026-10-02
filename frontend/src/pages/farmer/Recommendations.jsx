import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";
import { useToast, errorMessage } from "../../context/ToastContext.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import PdfButton from "../../components/PdfButton";

const STATUS_STYLES = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#287650] focus:ring-4 focus:ring-[#287650]/10";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) =>
  (status || "pending_review")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Mirrors backend/utils/rainfall.js RAINFALL_BANDS exactly, so the slider's
// live label matches what the server will actually classify it as.
const RAINFALL_BANDS = [
  { class: "low", maxMm: 50, multiplier: 1.0, style: "bg-amber-50 text-amber-700 border-amber-200" },
  { class: "moderate", maxMm: 150, multiplier: 1.1, style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { class: "heavy", maxMm: Infinity, multiplier: 1.2, style: "bg-blue-50 text-blue-700 border-blue-200" },
];
const classifyRainfallClient = (mm) =>
  RAINFALL_BANDS.find((b) => mm <= b.maxMm) || RAINFALL_BANDS[RAINFALL_BANDS.length - 1];
const SLIDER_MAX_MM = 250;

function Icon({ name, className = "h-5 w-5" }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    leaf: (
      <>
        <path d="M20 4C10 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-8 11-16Z" />
        <path d="M3 21c3-6 7-9 12-12" />
      </>
    ),
    farm: (
      <>
        <path d="M3 20h18" />
        <path d="m5 20 1.5-9L12 7l5.5 4L19 20" />
        <path d="M9 20v-5h6v5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    flask: (
      <>
        <path d="M9 3h6M10 3v7l-5 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-5-9V3" />
        <path d="M8 15h8" />
      </>
    ),
    cloud: (
      <>
        <path d="M20 16.2A4.5 4.5 0 0 0 18 7.5a6 6 0 0 0-11.5 1.8A4 4 0 0 0 7 17h12" />
        <path d="m8 20 2-2m4 2 2-2" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return <svg {...props}>{icons[name]}</svg>;
}

function SummaryCard({ icon, label, value, description }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#176344]">
        <Icon name={icon} className="h-6 w-6" />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[#1C2D35]">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// Cost-comparison bar chart: LP-optimized mix vs conventional flat-rate
// compound baseline, shown for a freshly generated recommendation result.
function SavingsChart({ optimizedCost, baselineCost }) {
  if (typeof baselineCost !== "number" || baselineCost <= 0) return null;

  const data = [
    { name: "Conventional (flat-rate compound)", cost: Math.round(baselineCost), fill: "#94A3B8" },
    { name: "LP-Optimized (this recommendation)", cost: Math.round(optimizedCost), fill: "#145C3B" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Cost comparison
      </p>
      <div className="mt-2 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => `Rs. ${formatCurrency(value)}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E2E8F0" }}
            />
            <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="cost"
                position="right"
                formatter={(v) => `Rs. ${formatCurrency(v)}`}
                style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const toast = useToast();

  const [searchParams] = useSearchParams();
  const preselectedFarmId = searchParams.get("farmId") || "";

  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // rainfallMode: "auto" uses the server's live Open-Meteo fetch;
  // "manual" sends rainfallMmOverride from the slider below.
  const [form, setForm] = useState({
    farmId: preselectedFarmId,
    cropId: "",
    rainfallMode: "auto",
    rainfallMmOverride: 60,
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [result, setResult] = useState(null);

  // Used by "New plan for this farm": selects the farm and scrolls to the form.
  const formSectionRef = useRef(null);

  const handleNewPlanForFarm = (farmId) => {
    setForm((previous) => ({ ...previous, farmId: farmId || "" }));
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadAll = useCallback(async () => {
    const [farmsRes, cropsRes, recsRes] = await Promise.all([
      apiClient.get("/farms/mine"),
      apiClient.get("/crops"),
      apiClient.get("/recommendations/mine"),
    ]);

    setFarms(farmsRes.data.farms || []);
    setCrops(cropsRes.data.crops || []);
    setRecommendations(recsRes.data.recommendations || []);
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        setPageError("");

        const [farmsRes, cropsRes, recsRes] = await Promise.all([
          apiClient.get("/farms/mine"),
          apiClient.get("/crops"),
          apiClient.get("/recommendations/mine"),
        ]);

        if (!active) return;

        const loadedFarms = farmsRes.data.farms || [];

        setFarms(loadedFarms);
        setCrops(cropsRes.data.crops || []);
        setRecommendations(recsRes.data.recommendations || []);

        // Keep the requested farm selected when it belongs to the farmer.
        if (
          preselectedFarmId &&
          loadedFarms.some((farm) => farm._id === preselectedFarmId)
        ) {
          setForm((previous) => ({
            ...previous,
            farmId: preselectedFarmId,
          }));
        } else if (preselectedFarmId) {
          setForm((previous) => ({
            ...previous,
            farmId: "",
          }));
        }
      } catch (err) {
        if (active) {
          setPageError(
            err.response?.data?.message ||
              "Unable to load recommendation data. Please try again."
          );
        }
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, [preselectedFarmId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        farmId: form.farmId,
        cropId: form.cropId,
        ...(form.rainfallMode === "manual" && {
          rainfallMmOverride: Number(form.rainfallMmOverride),
        }),
      };

      const { data } = await apiClient.post(
        "/recommendations",
        payload
      );

      setResult(data.recommendation);
      toast.success("Recommendation generated and sent for officer review.");

      // Refresh history after a recommendation is generated.
      try {
        await loadAll();
      } catch {
        // Keep the generated result visible if history refresh fails.
      }
    } catch (err) {
      toast.error(
        errorMessage(err, "Failed to generate recommendation. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const totalRecommendations = recommendations.length;

  const pendingCount = recommendations.filter(
    (rec) => rec.status === "pending_review"
  ).length;

  const approvedCount = recommendations.filter(
    (rec) => rec.status === "approved"
  ).length;

  const selectedFarm = farms.find(
    (farm) => farm._id === form.farmId
  );

  const selectedCrop = crops.find(
    (crop) => crop._id === form.cropId
  );

  const liveBand = classifyRainfallClient(Number(form.rainfallMmOverride) || 0);

  return (
    <DashboardLayout
      title="Fertilizer Recommendations"
      subtitle="Generate cost-optimized, weather-adjusted fertilizer plans for your crops."
    >
      <div className="space-y-8">
        {/* Page introduction */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10492F] to-[#20764C] p-6 text-white shadow-sm sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <Icon name="leaf" className="h-4 w-4" />
              SMART FARMING · DATA-DRIVEN DECISIONS
            </div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Grow smarter with the right nutrients.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/90 sm:text-base">
              Generate fertilizer recommendations tailored to
              your farm, crop, and rainfall conditions while
              considering fertilizer costs.
            </p>

            <div className="mt-5 flex flex-wrap gap-4 text-xs text-emerald-50/90 sm:text-sm">
              <span className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4" />
                Cost optimization
              </span>
              <span className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4" />
                Weather adjustment
              </span>
              <span className="flex items-center gap-2">
                <Icon name="check" className="h-4 w-4" />
                Officer review
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-10 -top-16 hidden h-64 w-64 items-center justify-center rounded-full border border-white/10 bg-white/5 lg:flex">
            <Icon name="leaf" className="h-32 w-32 text-white/20" />
          </div>
          <div className="pointer-events-none absolute -bottom-20 right-36 hidden h-44 w-44 rounded-full border border-white/10 lg:block" />
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon="flask"
            label="Total recommendations"
            value={initialLoading ? "—" : totalRecommendations}
            description="All your generated plans"
          />

          <SummaryCard
            icon="calendar"
            label="Pending review"
            value={initialLoading ? "—" : pendingCount}
            description="Awaiting officer review"
          />

          <SummaryCard
            icon="check"
            label="Approved recommendations"
            value={initialLoading ? "—" : approvedCount}
            description="Reviewed by an officer"
          />
        </section>

        {pageError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{pageError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 font-semibold underline"
            >
              Reload page
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5">
          {/* Recommendation request */}
          <section
            ref={formSectionRef}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2"
          >
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#176344]">
                  <Icon name="leaf" className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-semibold text-[#1C2D35]">
                    New recommendation
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Configure your fertilizer plan
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {farms.length === 0 && !initialLoading && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    No registered farms found.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Add a farm before generating a recommendation.
                  </p>
                  <Link
                    to="/farmer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#145C3B]"
                  >
                    Go to My Farms
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Farm */}
              <div>
                <label
                  htmlFor="farmId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Select farm <span className="text-red-500">*</span>
                </label>

                <select
                  id="farmId"
                  name="farmId"
                  required
                  value={form.farmId}
                  onChange={handleChange}
                  disabled={initialLoading || farms.length === 0}
                  className={inputClass}
                >
                  <option value="">Choose your farm</option>
                  {farms.map((farm) => (
                    <option key={farm._id} value={farm._id}>
                      {farm.farmName || farm.region} · {farm.areaHectares} ha
                    </option>
                  ))}
                </select>

                {selectedFarm && (
                  <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#F2F8F2] p-3">
                    <Icon
                      name="farm"
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#176344]"
                    />
                    <div className="text-xs leading-5 text-slate-600">
                      <p className="font-semibold text-[#315E45]">
                        {selectedFarm.farmName || "Your farm"}
                      </p>
                      <p>{selectedFarm.region}</p>
                      <p>
                        Area: {selectedFarm.areaHectares} hectares
                      </p>
                      {selectedFarm.soilType && (
                        <p>Soil type: {selectedFarm.soilType}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Crop */}
              <div>
                <label
                  htmlFor="cropId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Select crop <span className="text-red-500">*</span>
                </label>

                <select
                  id="cropId"
                  name="cropId"
                  required
                  value={form.cropId}
                  onChange={handleChange}
                  disabled={initialLoading || crops.length === 0}
                  className={inputClass}
                >
                  <option value="">Choose your crop</option>
                  {crops.map((crop) => (
                    <option key={crop._id} value={crop._id}>
                      {crop.name}
                    </option>
                  ))}
                </select>

                {selectedCrop && (
                  <p className="mt-2 text-xs text-slate-500">
                    Recommendation will be generated for{" "}
                    <span className="font-medium text-slate-700">
                      {selectedCrop.name}
                    </span>
                    .
                  </p>
                )}
              </div>

              {/* Rainfall */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Rainfall data source
                  </label>
                </div>

                {/* Auto / Manual toggle */}
                <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, rainfallMode: "auto" }))
                    }
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      form.rainfallMode === "auto"
                        ? "bg-white text-[#145C3B] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="cloud" className="h-3.5 w-3.5" />
                      Use live rainfall
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, rainfallMode: "manual" }))
                    }
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      form.rainfallMode === "manual"
                        ? "bg-white text-[#145C3B] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Manual override
                  </button>
                </div>

                {form.rainfallMode === "auto" ? (
                  <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                    <Icon name="cloud" className="mt-0.5 h-4 w-4 shrink-0" />
                    Rainfall for your farm's region is fetched automatically
                    from live weather data (past 5 days) when you generate a
                    recommendation.
                  </p>
                ) : (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        5-day rainfall
                      </span>
                      <span className="text-lg font-bold text-[#1C2D35]">
                        {form.rainfallMmOverride} mm
                      </span>
                    </div>

                    <input
                      type="range"
                      name="rainfallMmOverride"
                      min={0}
                      max={SLIDER_MAX_MM}
                      step={5}
                      value={form.rainfallMmOverride}
                      onChange={handleChange}
                      className="mt-3 w-full accent-[#145C3B]"
                      aria-label="Rainfall override in millimetres"
                    />

                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>0mm</span>
                      <span>{SLIDER_MAX_MM}mm+</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${liveBand.style}`}
                      >
                        {liveBand.class} rainfall
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        N-leaching ×{liveBand.multiplier}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Drag to preview how rainfall affects the nitrogen
                      leaching multiplier, then generate to see the resulting
                      fertilizer mix and cost.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    initialLoading ||
                    farms.length === 0 ||
                    crops.length === 0
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10492F] focus:outline-none focus:ring-4 focus:ring-[#145C3B]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Optimizing fertilizer mix...
                    </>
                  ) : (
                    <>
                      Generate recommendation
                      <Icon name="arrow" className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                  Recommendations are generated using your system's
                  configured optimization model.
                </p>
              </div>
            </form>
          </section>

          {/* Recommendation history */}
          <section className="space-y-5 xl:col-span-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#1C2D35]">
                  Recommendation history
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review your previous fertilizer plans and their status.
                </p>
              </div>

              {!initialLoading && (
                <span className="text-sm text-slate-500">
                  {recommendations.length}{" "}
                  {recommendations.length === 1
                    ? "recommendation"
                    : "recommendations"}
                </span>
              )}
            </div>

            {initialLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-[#145C3B]/20 border-t-[#145C3B]" />
                <p className="mt-4 text-sm text-slate-500">
                  Loading your recommendation history...
                </p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#C9DCCF] bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F3EB] text-[#176344]">
                  <Icon name="flask" className="h-7 w-7" />
                </div>

                <h4 className="mt-4 font-semibold text-[#1C2D35]">
                  No recommendations yet
                </h4>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your generated fertilizer plans will appear here.
                  Select your farm and crop to create your first
                  recommendation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <article
                    key={rec._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#C9DCCF] hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#176344]">
                          <Icon name="leaf" className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-semibold text-[#1C2D35]">
                            {rec.crop?.name || "Crop not available"}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {rec.farm?.farmName ||
                              rec.farm?.region ||
                              "Farm not available"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Generated {formatDate(rec.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium ${
                          STATUS_STYLES[rec.status] ||
                          STATUS_STYLES.pending_review
                        }`}
                      >
                        {formatStatus(rec.status)}
                      </span>
                    </div>

                    {/* Rainfall details */}
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Icon name="cloud" className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            Rainfall classification
                          </span>
                        </div>

                        <p className="mt-2 font-semibold capitalize text-[#1C2D35]">
                          {rec.rainfallClass || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                          Nitrogen leaching multiplier
                        </p>

                        <p className="mt-2 font-semibold text-[#1C2D35]">
                          {rec.nitrogenLeachingMultiplier ?? "—"}
                          {rec.nitrogenLeachingMultiplier != null &&
                            "×"}
                        </p>
                      </div>
                    </div>

                    {/* Fertilizer mix */}
                    {rec.fertilizerMix?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Fertilizer mix
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full min-w-[360px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-2.5 font-medium">Fertilizer</th>
                                <th className="px-4 py-2.5 text-right font-medium">Quantity</th>
                                <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rec.fertilizerMix.map((mix, index) => (
                                <tr key={`${rec._id}-${mix.fertilizerName}-${index}`}>
                                  <td className="px-4 py-2.5 font-medium text-slate-700">
                                    {mix.fertilizerName}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-slate-600">
                                    {mix.quantityKg} kg
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-slate-700">
                                    Rs. {formatCurrency(mix.costLKR)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Total cost + savings + actions */}
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-slate-500">
                          Estimated fertilizer cost
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#145C3B]">
                          Rs. {formatCurrency(rec.totalCostLKR)}
                        </p>
                        {typeof rec.savingsPercent === "number" && rec.savingsPercent > 0 && (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            ↓ {rec.savingsPercent.toFixed(1)}% vs conventional application
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-start gap-2">
                        {/* Renders only when rec.status === "approved" */}
                        <PdfButton rec={rec} />

                        <button
                          type="button"
                          onClick={() => handleNewPlanForFarm(rec.farm?._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9DCCF] px-4 py-2.5 text-sm font-semibold text-[#145C3B] transition hover:bg-[#F0F6F0]"
                        >
                          New plan for this farm
                          <Icon name="arrow" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Generated recommendation result */}
        {result && (
          <section
            aria-live="polite"
            className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-3 bg-gradient-to-r from-[#E8F5EB] to-[#F5FAF5] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#176344] shadow-sm">
                  <Icon name="check" className="h-6 w-6" />
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#287650]">
                    Recommendation generated
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-[#1C2D35]">
                    Your optimized fertilizer mix
                  </h3>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-slate-500">
                  Estimated total cost
                </p>
                <p className="mt-1 text-2xl font-bold text-[#145C3B]">
                  Rs. {formatCurrency(result.totalCostLKR)}
                </p>
                {typeof result.savingsLKR === "number" && result.savingsLKR > 0 && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Saves Rs. {formatCurrency(result.savingsLKR)} ({result.savingsPercent?.toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Rainfall classification
                  </p>
                  <p className="mt-2 font-semibold capitalize text-[#1C2D35]">
                    {result.rainfallClass || "Not available"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Nitrogen leaching multiplier
                  </p>
                  <p className="mt-2 font-semibold text-[#1C2D35]">
                    {result.nitrogenLeachingMultiplier ?? "—"}
                    {result.nitrogenLeachingMultiplier != null && "×"}
                  </p>
                </div>
              </div>

              {/* Cost comparison chart */}
              {typeof result.baselineCostLKR === "number" && result.baselineCostLKR > 0 && (
                <div className="mb-5">
                  <SavingsChart
                    optimizedCost={result.totalCostLKR}
                    baselineCost={result.baselineCostLKR}
                  />
                </div>
              )}

              <h4 className="mb-3 font-semibold text-[#1C2D35]">
                Recommended fertilizer mix
              </h4>

              {result.fertilizerMix?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          Fertilizer
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Cost
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {result.fertilizerMix.map((mix, index) => (
                        <tr key={`${mix.fertilizerName}-${index}`}>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {mix.fertilizerName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {mix.quantityKg} kg
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">
                            Rs. {formatCurrency(mix.costLKR)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  The recommendation was generated, but no fertilizer
                  mix details were returned.
                </p>
              )}

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <span className="mt-0.5 text-amber-700">
                  <Icon name="calendar" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Awaiting Agricultural Officer review
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Your recommendation has been generated and sent
                    for review. Follow the approval status before
                    acting on the proposed fertilizer plan.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}