import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import SavingsSummary from "../../components/SavingsSummary.jsx"; // SAVINGS
import apiClient from "../../api/axiosClient.js";

const SOIL_TYPES = [
  "Red-Yellow Podzolic",
  "Reddish Brown Earth",
  "Immature Brown Loam",
  "Alluvial Soil",
  "Sandy Soil",
  "Clay Soil",
  "Loamy Soil",
  "Other",
];

const INITIAL_FORM = {
  farmName: "",
  region: "Nuwara Eliya",
  areaHectares: "",
  soilType: "",
  customSoilType: "",
};

function Icon({ type, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    farm: (
      <>
        <path d="M3 20h18" />
        <path d="m5 20 1.5-9L12 7l5.5 4L19 20" />
        <path d="M9 20v-5h6v5" />
        <path d="M12 7V3" />
        <path d="M12 5c-3 0-4-2-4-3 3 0 4 1 4 3Z" />
        <path d="M12 4c0-2 2-3 4-3 0 2-1 3-4 3Z" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C10 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-8 11-16Z" />
        <path d="M3 21c3-6 7-9 12-12" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
  };

  return <svg {...common}>{paths[type]}</svg>;
}

function SummaryCard({ icon, label, value, description }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#176344]">
        <Icon type={icon} className="h-6 w-6" />
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

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#287650] focus:ring-4 focus:ring-[#287650]/10";

export default function FarmerDashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ ...INITIAL_FORM });

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

  const handleSoilTypeChange = (e) => {
    const value = e.target.value;

    setForm((previous) => ({
      ...previous,
      soilType: value,
      // Clear custom input when a predefined soil is selected.
      customSoilType:
        value === "Other" ? previous.customSoilType : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const actualSoilType =
      form.soilType === "Other"
        ? form.customSoilType.trim()
        : form.soilType;

    if (
      form.soilType === "Other" &&
      !actualSoilType
    ) {
      setError("Please enter your soil type.");
      return;
    }

    setSaving(true);

    try {
      await apiClient.post("/farms", {
        farmName: form.farmName.trim(),
        region: form.region,
        areaHectares: Number(form.areaHectares),
        soilType: actualSoilType,
      });

      setForm({ ...INITIAL_FORM });
      setShowForm(false);

      await loadFarms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add farm."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalArea = farms.reduce(
    (total, farm) =>
      total + (Number(farm.areaHectares) || 0),
    0
  );

  const farmsWithSoilDetails = farms.filter(
    (farm) => farm.soilType?.trim()
  ).length;

  const formatArea = (area) =>
    Number(area.toFixed(2)).toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    });

  const closeForm = () => {
    setShowForm(false);
    setError("");
    setForm({ ...INITIAL_FORM });
  };

  return (
    <DashboardLayout
      title="My Farms"
      subtitle="Manage your registered plots and get tailored fertilizer advice."
      actions={
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              closeForm();
            } else {
              setError("");
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10492F] focus:outline-none focus:ring-4 focus:ring-[#145C3B]/20"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Icon type="plus" className="h-4 w-4" />
              Add farm
            </>
          )}
        </button>
      }
    >
      <div className="space-y-8">
        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon="farm"
            label="Registered farms"
            value={loading ? "—" : farms.length}
            description="Your registered properties"
          />

          <SummaryCard
            icon="leaf"
            label="Total cultivated area"
            value={loading ? "—" : `${formatArea(totalArea)} ha`}
            description="Combined area of your farms"
          />

          <SummaryCard
            icon="leaf"
            label="Soil details added"
            value={
              loading
                ? "—"
                : `${farmsWithSoilDetails} / ${farms.length}`
            }
            description="Farms with soil type recorded"
          />
        </section>

        {/* Savings dashboard */}
        <SavingsSummary /> {/* SAVINGS */}

        {/* Add farm form */}
        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#176344]">
                  <Icon type="farm" className="h-6 w-6" />
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
                {/* Farm name */}
                <div>
                  <label
                    htmlFor="farmName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Farm name
                  </label>

                  <input
                    id="farmName"
                    name="farmName"
                    type="text"
                    required
                    value={form.farmName}
                    onChange={handleChange}
                    placeholder="e.g. Green Valley Farm"
                    className={inputClass}
                  />
                </div>

                {/* Region */}
                <div>
                  <label
                    htmlFor="region"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Region
                  </label>

                  <select
                    id="region"
                    name="region"
                    required
                    value={form.region}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Nuwara Eliya">
                      Nuwara Eliya
                    </option>
                    <option value="Bandarawela">
                      Bandarawela
                    </option>
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label
                    htmlFor="areaHectares"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Farm area (hectares)
                  </label>

                  <input
                    id="areaHectares"
                    name="areaHectares"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.areaHectares}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    className={inputClass}
                  />
                </div>

                {/* Soil type dropdown */}
                <div>
                  <label
                    htmlFor="soilType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Soil type
                    <span className="ml-1 font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <select
                    id="soilType"
                    name="soilType"
                    value={form.soilType}
                    onChange={handleSoilTypeChange}
                    className={inputClass}
                  >
                    <option value="">
                      Select soil type
                    </option>

                    {SOIL_TYPES.map((soil) => (
                      <option key={soil} value={soil}>
                        {soil}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Choose the soil type identified for your farm.
                    Select Other if it is not listed.
                  </p>
                </div>

                {/* Custom soil input: only visible for Other */}
                {form.soilType === "Other" && (
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="customSoilType"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Specify soil type
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      id="customSoilType"
                      name="customSoilType"
                      type="text"
                      required
                      maxLength={100}
                      value={form.customSoilType}
                      onChange={handleChange}
                      placeholder="Enter your soil type"
                      className={inputClass}
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Enter the soil type as identified by your
                      soil analysis or agricultural adviser.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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

        {/* Farm list */}
        <section>
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1C2D35] sm:text-2xl">
                Your registered farms
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View farm details and request fertilizer recommendations.
              </p>
            </div>

            {!loading && !loadError && (
              <span className="text-sm text-slate-500">
                {farms.length}{" "}
                {farms.length === 1 ? "farm" : "farms"} registered
              </span>
            )}
          </div>

          {loading ? (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500"
              aria-live="polite"
            >
              Loading your farms...
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="text-sm text-red-600">{loadError}</p>

              <button
                type="button"
                onClick={loadFarms}
                className="mt-4 rounded-xl bg-[#145C3B] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#10492F]"
              >
                Try again
              </button>
            </div>
          ) : farms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C9DCCF] bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3EB] text-[#176344]">
                <Icon type="farm" className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-[#1C2D35]">
                Start by adding your first farm
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Register your farm location and cultivated area
                to start managing your plots and requesting
                fertilizer recommendations.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#10492F]"
              >
                <Icon type="plus" className="h-4 w-4" />
                Add your first farm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {farms.map((farm) => (
                <article
                  key={farm._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#C9DCCF] hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    {/* Farm illustration */}
                    <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#E5F1E7] to-[#B8D5BC] text-[#176344] sm:h-32 sm:w-36">
                      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/30" />
                      <Icon
                        type="farm"
                        className="relative h-12 w-12"
                      />
                    </div>

                    {/* Farm details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-[#1C2D35]">
                          {farm.farmName || "Unnamed farm"}
                        </h3>

                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Registered
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <Icon type="location" className="h-4 w-4" />
                        {farm.region || "Region not specified"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[#F0F6F0] px-3 py-2 text-xs font-medium text-[#315E45]">
                          <Icon type="farm" className="h-4 w-4" />
                          {formatArea(Number(farm.areaHectares) || 0)} ha
                        </span>

                        {farm.soilType?.trim() ? (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            <Icon type="leaf" className="h-4 w-4" />
                            {farm.soilType}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                            Soil type not added
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recommendation action */}
                    <div className="shrink-0">
                      <Link
                        to={`/farmer/recommendations?farmId=${encodeURIComponent(farm._id)}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#145C3B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#10492F] sm:w-auto"
                      >
                        Get recommendation
                        <Icon type="arrow" className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Helpful next steps */}
        {!loading && !loadError && farms.length > 0 && (
          <section className="rounded-2xl border border-[#D8E8DB] bg-gradient-to-br from-white to-[#F2F8F2] p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E2F0E5] text-[#176344]">
                <Icon type="leaf" className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1C2D35]">
                  Ready for your fertilizer recommendation?
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Select a registered farm to continue. For more
                  meaningful recommendations, use reliable soil
                  analysis results and accurate crop information
                  where the system requests them.
                </p>

                <Link
                  to={`/farmer/recommendations?farmId=${encodeURIComponent(farms[0]._id)}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#176344] hover:text-[#10492F]"
                >
                  Continue with {farms[0].farmName || "your first farm"}
                  <Icon type="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}