
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import apiClient from "../../api/axiosClient.js";

const GREEN = "#145C3B";

function FarmIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 20h18" />
      <path d="m5 20 1.5-9L12 7l5.5 4L19 20" />
      <path d="M9 20v-5h6v5" />
      <path d="M12 7V3" />
      <path d="M12 5c-3 0-4-2-4-3 3 0 4 1 4 3Z" />
      <path d="M12 4c0-2 2-3 4-3 0 2-1 3-4 3Z" />
    </svg>
  );
}

function AreaIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 20h18" />
      <path d="M4 16c4-4 12-4 16 0" />
      <path d="M6 12c3-3 9-3 12 0" />
      <path d="M9 8c2-2 4-2 6 0" />
      <path d="M12 4v2" />
    </svg>
  );
}

function LeafIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 4C10 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-8 11-16Z" />
      <path d="M3 21c3-6 7-9 12-12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SummaryCard({ icon, label, value, description }) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F3EB] text-[#176344] sm:h-14 sm:w-14">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <p className="mt-1 truncate text-2xl font-bold tracking-tight text-[#1C2D35] sm:text-3xl">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({
    farmName: "",
    region: "Nuwara Eliya",
    areaHectares: "",
    soilType: "",
  });

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await apiClient.get("/farms/mine");
      setFarms(Array.isArray(data.farms) ? data.farms : []);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "Unable to load your farms. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await apiClient.post("/farms", {
        ...form,
        areaHectares: Number(form.areaHectares),
      });

      setShowForm(false);
      setForm({
        farmName: "",
        region: "Nuwara Eliya",
        areaHectares: "",
        soilType: "",
      });

      await loadFarms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add farm.");
    } finally {
      setSaving(false);
    }
  };

  const totalArea = farms.reduce(
    (total, farm) => total + (Number(farm.areaHectares) || 0),
    0
  );

  const farmsWithSoilDetails = farms.filter(
    (farm) => farm.soilType?.trim()
  ).length;

  const formatArea = (area) =>
    Number(area.toFixed(2)).toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    });

  return (
    <DashboardLayout
      title="My Farms"
      subtitle="Manage your registered plots and get tailored fertilizer advice."
      actions={
        <button
          type="button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10492F] focus:outline-none focus:ring-4 focus:ring-[#145C3B]/20"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <PlusIcon />
              Add farm
            </>
          )}
        </button>
      }
    >
      <div className="space-y-8">
        {/* ================= SUMMARY CARDS ================= */}
        <section
          aria-label="Farm summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <SummaryCard
            icon={<FarmIcon className="h-6 w-6" />}
            label="Registered farms"
            value={loading ? "—" : farms.length}
            description="Your registered properties"
          />

          <SummaryCard
            icon={<AreaIcon className="h-6 w-6" />}
            label="Total cultivated area"
            value={loading ? "—" : `${formatArea(totalArea)} ha`}
            description="Combined area of your farms"
          />

          <SummaryCard
            icon={<LeafIcon className="h-6 w-6" />}
            label="Soil details added"
            value={
              loading
                ? "—"
                : `${farmsWithSoilDetails} / ${farms.length}`
            }
            description="Farms with soil type recorded"
          />
        </section>

        {/* ================= ADD FARM FORM ================= */}
        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#176344]">
                  <FarmIcon />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#1C2D35]">
                    Register a new farm
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your farm details to get started.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-7">
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="farmName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Farm name <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="farmName"
                    name="farmName"
                    type="text"
                    required
                    value={form.farmName}
                    onChange={handleChange}
                    placeholder="e.g. Green Valley Farm"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#287650] focus:ring-4 focus:ring-[#287650]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="region"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Region <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="region"
                    name="region"
                    required
                    value={form.region}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#287650] focus:ring-4 focus:ring-[#287650]/10"
                  >
                    <option value="Nuwara Eliya">Nuwara Eliya</option>
                    <option value="Bandarawela">Bandarawela</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="areaHectares"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Area (hectares){" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="areaHectares"
                    name="areaHectares"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.areaHectares}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#287650] focus:ring-4 focus:ring-[#287650]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="soilType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Soil type
                  </label>

                  <input
                    id="soilType"
                    name="soilType"
                    type="text"
                    value={form.soilType}
                    onChange={handleChange}
                    placeholder="e.g. Red-yellow podzolic"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#287650] focus:ring-4 focus:ring-[#287650]/10"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#145C3B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#10492F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving farm..." : "Save farm"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ================= MY FARMS SECTION ================= */}
        <section>
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1C2D35] sm:text-2xl">
                My Farms
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View your registered farms and manage recommendations.
              </p>
            </div>

            {!loading && (
              <span className="text-sm text-slate-500">
                {farms.length} {farms.length === 1 ? "farm" : "farms"}{" "}
                registered
              </span>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="space-y-4" aria-live="polite">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex gap-5">
                    <div className="h-28 w-32 rounded-xl bg-slate-100" />

                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-5 w-40 rounded bg-slate-100" />
                      <div className="h-4 w-28 rounded bg-slate-100" />
                      <div className="h-4 w-20 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            /* Loading error */
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="text-sm text-red-600">{loadError}</p>

              <button
                type="button"
                onClick={loadFarms}
                className="mt-4 rounded-lg bg-[#145C3B] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#10492F]"
              >
                Try again
              </button>
            </div>
          ) : farms.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl border border-dashed border-[#C9DCCF] bg-white px-6 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3EB] text-[#176344]">
                <FarmIcon className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#1C2D35]">
                Start by adding your first farm
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Register your farm location and cultivated area to start
                managing your plots and requesting fertilizer recommendations.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10492F]"
              >
                <PlusIcon />
                Add your first farm
              </button>
            </div>
          ) : (
            /* Farm cards */
            <div className="space-y-4">
              {farms.map((farm) => (
                <article
                  key={farm._id}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:border-[#C9DCCF] hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                    {/* Farm visual */}
                    <div className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#E5F1E7] via-[#D5E8D8] to-[#B8D5BC] text-[#176344] sm:h-32 sm:w-40 xl:h-32">
                      <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-white/20" />
                      <div className="absolute -bottom-8 -left-5 h-24 w-24 rounded-full bg-[#145C3B]/10" />

                      <FarmIcon className="relative h-14 w-14" />

                      <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-widest text-[#176344]/75">
                        FertiSmart
                      </span>
                    </div>

                    {/* Farm information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-[#1C2D35] sm:text-xl">
                          {farm.farmName || "Unnamed farm"}
                        </h3>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Registered
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <LocationIcon />
                        {farm.region || "Region not specified"}, Sri Lanka
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[#F0F6F0] px-3 py-2 text-xs font-medium text-[#315E45]">
                          <AreaIcon className="h-4 w-4" />
                          {formatArea(Number(farm.areaHectares) || 0)} ha
                        </span>

                        {farm.soilType?.trim() ? (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            <LeafIcon className="h-4 w-4" />
                            {farm.soilType}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                            Soil type not added
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:justify-end">
                      <Link
                        to={`/farmer/recommendations?farmId=${encodeURIComponent(farm._id)}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10492F] focus:outline-none focus:ring-4 focus:ring-[#145C3B]/15"
                      >
                        <LeafIcon className="h-4 w-4" />
                        Get recommendation
                        <ArrowIcon />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ================= NEXT STEPS ================= */}
        {!loading && !loadError && farms.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-[#D8E8DB] bg-gradient-to-br from-white to-[#F2F8F2] p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1fr_1fr] lg:items-center lg:gap-8">
              {/* Intro */}
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2F0E5] text-[#176344]">
                  <LeafIcon className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-[#1C2D35]">
                  Your next steps
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Follow these steps to get more accurate fertilizer
                  recommendations for your crops.
                </p>
              </div>

              {/* Step 1 */}
              <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEFE1] text-sm font-semibold text-[#176344]">
                    1
                  </span>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#176344] shadow-sm">
                    <AreaIcon />
                  </div>
                </div>

                <h4 className="mt-4 font-semibold text-[#1C2D35]">
                  Complete farm details
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add the soil type and ensure your farm information is
                  up to date.
                </p>
              </div>

              {/* Step 2 */}
              <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEFE1] text-sm font-semibold text-[#176344]">
                    2
                  </span>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#176344] shadow-sm">
                    <LeafIcon />
                  </div>
                </div>

                <h4 className="mt-4 font-semibold text-[#1C2D35]">
                  Get fertilizer advice
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Select a registered farm and request a tailored
                  fertilizer recommendation.
                </p>

                <Link
                  to={`/farmer/recommendations?farmId=${encodeURIComponent(farms[0]._id)}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#176344] hover:text-[#10492F]"
                >
                  Get started <ArrowIcon />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}