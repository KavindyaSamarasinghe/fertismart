# FertiSmart SL — Full Stack

A web-based Fertilizer Decision Support System for up-country vegetable farmers in
Nuwara Eliya and Bandarawela, Sri Lanka. It uses a Simplex Linear Programming solver to
generate cost-minimized, weather- and soil-adjusted NPK fertilizer recommendations, which
are then reviewed by an Agricultural Officer before a farmer acts on them.

## Features

**Optimization engine**
- Simplex LP solver (`javascript-lp-solver`) finds the cheapest fertilizer mix that meets the N, P and K requirement
- Live rainfall from Open-Meteo (past 5 days) with a nitrogen-leaching multiplier: low (≤ 50 mm) ×1.00, moderate (≤ 150 mm) ×1.10, heavy (> 150 mm) ×1.20
- Fallback of 60 mm if the weather service is unavailable (clearly flagged in the UI as "Default value used")
- Soil-type adjustment of N/P/K requirements and soil-based fertilizer exclusion
- Savings comparison against a conventional flat-rate compound fertilizer baseline

**Farmer portal**
- Register farms (optional GPS coordinates for location-specific rainfall)
- Generate recommendations and track review status
- Savings dashboard (current season or all time) with charts
- Download approved recommendations as PDF
- Officer feedback shown on each recommendation

**Agricultural Officer portal**
- Pending review queue with cost comparison charts and soil basis
- Approve or reject (notes required when rejecting)
- Review history with search, decision and date filters
- Farms overview with search, region filter and pagination

**Administrator portal**
- System overview analytics (totals, savings, breakdown by crop and region)
- Manage crops, fertilizers and staff accounts (activate / deactivate)
- Review audit trail across all officers
- CSV export for crops, fertilizers and users

**Platform**
- JWT authentication with role-based access control (farmer / officer / admin)
- Password reset by email (hashed, 15-minute, single-use token)
- In-app notification bell (30-second polling)
- Sinhala, Tamil and English interface (i18next)
- Toast notifications, confirmation dialogs and client-side pagination
- Swagger API documentation at `/api-docs`

## Project Structure

```
fertismart/
├── backend/          Node.js + Express + MongoDB + LP/Simplex optimization engine
│   ├── config/        db.js (MongoDB connection), swagger.js (OpenAPI spec)
│   ├── models/        User, Crop, Fertilizer, Farm, Recommendation
│   ├── middleware/    auth.js (JWT protect + role authorize)
│   ├── controllers/   auth, farm, crop, fertilizer, recommendation, notification, admin
│   ├── routes/        Express route definitions with Swagger annotations
│   ├── utils/
│   │   ├── lpSolver.js             Simplex engine wrapper
│   │   ├── rainfall.js             Open-Meteo fetch + leaching multiplier bands
│   │   ├── soilAdjustment.js       Soil profiles and fertilizer exclusions
│   │   ├── baselineComparison.js   Straight/compound baselines and savings
│   │   ├── sendEmail.js            Nodemailer (SMTP, or Ethereal in development)
│   │   ├── seedData.js             Shared crop/fertilizer reference data
│   │   ├── verify-export.js        Exports test scenarios to scenarios.json
│   │   ├── verify_scipy.py         Cross-checks the JS solver against SciPy
│   │   └── test-*.js               Standalone baseline and soil tests
│   ├── seed.js        Seeds 10 crops, 7 fertilizers and 3 demo accounts
│   └── server.js      Express app entry point
└── frontend/         React 18 + Vite + Tailwind, three role-based portals
    └── src/
        ├── pages/            Landing, Login, Register, ForgotPassword, ResetPassword
        ├── pages/farmer/     FarmerDashboard, Recommendations
        ├── pages/officer/    OfficerDashboard, FarmsOverview, ReviewHistory
        ├── pages/admin/      AdminOverview, CropsAdmin, FertilizersAdmin, UsersAdmin
        ├── components/       DashboardLayout, Sidebar, NotificationBell, LanguageSwitcher,
        │                     SavingsSummary, SoilBasis, RainfallSourceBadge, PdfButton,
        │                     ExportCsvButton, ConfirmDialog, Pagination, ProtectedRoute
        ├── context/          AuthContext (JWT), ToastContext
        ├── hooks/            usePagination
        ├── utils/            exportCsv, downloadRecommendationPdf
        ├── i18n/             English, Sinhala and Tamil translations
        └── api/              Axios client with token interceptor
```

## 1. Database Setup (MongoDB Atlas)

1. Create a free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and allow network access from your IP (or 0.0.0.0/0 for development only)
3. Copy your connection string

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: paste your MONGO_URI and set a real JWT_SECRET
npm run seed     # upserts 10 crops, 7 fertilizers and 3 demo accounts
npm run dev      # starts on http://localhost:5000
```

API docs: http://localhost:5000/api-docs

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `PORT` | No | Server port (default `5000`) |
| `CLIENT_ORIGIN` | Yes | Frontend URL for CORS and password-reset links |
| `ALLOW_MANUAL_RAINFALL` | No | `true` lets farmers override rainfall (demo only; officers can always override) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Production | SMTP settings for password-reset email. If `SMTP_HOST` is not set, an Ethereal test inbox is used and a preview URL is printed in the server console |
| `EMAIL_FROM` | No | Sender address for outgoing email |


### Demo accounts created by the seed script

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@fertismart.lk      | Admin@123    |
| Officer | officer@fertismart.lk    | Officer@123  |
| Farmer  | farmer@fertismart.lk     | Farmer@123   |

The seed script is safe to re-run: crops and fertilizers are upserted by name (existing `_id`s are preserved) and existing accounts are skipped. Change or remove these accounts before any real deployment.

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

If your backend runs somewhere other than `http://localhost:5000/api`, create a `.env` file in `frontend/`:

```
VITE_API_URL=http://your-backend-url/api
```

Optional images: place `hero-plant.jfif` and `register-field.jpg` in `frontend/public/`. The pages fall back to a green gradient if they are missing.

## 4. Core Workflow

1. **Farmer** logs in, registers a farm (region, area, soil type, optional coordinates) and requests a recommendation for a crop.
2. **Backend** resolves rainfall → classifies it (low / moderate / heavy) → applies the nitrogen-leaching multiplier → applies the soil-type factors → filters soil-unsuitable fertilizers → runs the Simplex solver for the cost-minimized mix.
3. **Backend** also computes the conventional compound-fertilizer baseline and stores the savings.
4. **Agricultural Officer** reviews the recommendation and approves or rejects it (with notes). The farmer is notified.
5. **Farmer** downloads the approved plan as a PDF.
6. **Administrator** manages crop/fertilizer reference data and staff accounts, and monitors system-wide analytics and the review audit trail.

## 5. How the Adjustments Work

```
N requirement = crop N × rainfall multiplier × soil N factor
P requirement = crop P × soil P factor
K requirement = crop K × soil K factor
Scaled to the farm = per-hectare requirement × farm area (ha)
```

| 5-day rainfall | Class | N multiplier |
|---|---|---|
| ≤ 50 mm | low | ×1.00 |
| ≤ 150 mm | moderate | ×1.10 |
| > 150 mm | heavy | ×1.20 |

Soil types with a profile: Red-Yellow Podzolic, Reddish Brown Earth, Immature Brown Loam, Alluvial Soil, Sandy Soil, Clay Soil, Loamy Soil. Blank, "Other" or custom soil types stay neutral (all factors ×1.0).

> **Note:** the soil factors in `utils/soilAdjustment.js` are indicative placeholders. Replace them with figures from DOA/HORDI or Natural Resources Management Centre publications and cite the source in the thesis.

## 6. Testing and Verification

```bash
cd backend/utils

node test-soil-standalone.js        # soil adjustment + solver tests
node test-baseline-standalone.js    # baseline comparison and savings

node verify-export.js               # writes scenarios.json (10 crops × 3 rainfall bands + 1 soil case)
pip install numpy scipy
python verify_scipy.py              # cross-checks every JS result against SciPy's linprog
```

Example verified result (Cabbage, low rainfall, 1 ha, 120 / 60 / 60 kg): 260.87 kg Urea + 100 kg MOP + 200 kg Rock Phosphate at Rs. 75,326.09. `verify_scipy.py` confirms each of the 31 scenarios matches SciPy's optimum within Rs. 0.02 and satisfies all nutrient constraints.

## 7. Deployment

- **Frontend:** Vercel (`vercel --prod`, framework preset: Vite)
- **Backend:** Render (Web Service, build `npm install`, start `npm start`)
- Set `CLIENT_ORIGIN` (backend) and `VITE_API_URL` (frontend) to the deployed URLs
- In production: set `ALLOW_MANUAL_RAINFALL=false` (or remove it), configure real SMTP credentials, use a strong `JWT_SECRET`, and restrict MongoDB Atlas network access to your host

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, i18next, Axios |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs, PDFKit, Nodemailer, Swagger |
| Database | MongoDB Atlas |
| Optimization | javascript-lp-solver (Simplex), cross-validated with SciPy |
| Weather | Open-Meteo API (no API key required) |
