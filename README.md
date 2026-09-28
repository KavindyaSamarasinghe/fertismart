# FertiSmart SL — Full Stack

A web-based Fertilizer Decision Support System for up-country vegetable farmers in
Nuwara Eliya and Bandarawela, Sri Lanka. Uses a Simplex Linear Programming solver to
generate cost-minimized, weather-adjusted NPK fertilizer recommendations.


## Project Structure

```
fertismart/
├── backend/          Node.js + Express + MongoDB + LP/Simplex optimization engine
│   ├── config/        MongoDB connection
│   ├── models/        Mongoose schemas (User, Crop, Fertilizer, Farm, Recommendation)
│   ├── middleware/     JWT auth + role-based access control
│   ├── controllers/    Route handlers
│   ├── routes/         Express route definitions
│   ├── utils/           lpSolver.js (Simplex engine), rainfall.js (leaching multiplier)
│   ├── seed.js           Seeds 10 crops, 7 fertilizers, and 3 demo accounts
│   └── server.js         Express app entry point
└── frontend/         React 18 + Vite + Tailwind, 3 role-based portals (light theme)
    └── src/
        ├── pages/            Landing, Login, Register (light theme)
        ├── pages/farmer/     Farmer portal (farms, recommendations)
        ├── pages/officer/    Agricultural Officer portal (review workflow)
        ├── pages/admin/       Administrator portal (crops, fertilizers, users)
        ├── context/           Auth state (JWT)
        └── api/               Axios client with token interceptor
```

## 1. Database Setup (MongoDB Atlas)

1. Create a free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and allow network access from your IP (or 0.0.0.0/0 for development)
3. Copy your connection string.

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: paste your MONGO_URI, set a real JWT_SECRET
npm run seed     # populates 10 crops, 7 fertilizers, and 3 demo accounts
npm run dev      # starts on http://localhost:5000
```

Demo accounts created by the seed script:

| Role    | Email                    | Password     |
|---------|--------------------------|---------------|
| Admin   | admin@fertismart.lk      | Admin@123     |
| Officer | officer@fertismart.lk    | Officer@123   |
| Farmer  | farmer@fertismart.lk     | Farmer@123    |

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

If your backend runs somewhere other than `http://localhost:5000/api`, create a
`.env` file in `frontend/` with:
```
VITE_API_URL=http://your-backend-url/api
```

## 4. Core Workflow

1. **Farmer** logs in, adds a farm, and requests a recommendation for a crop.
2. **Backend** resolves rainfall → classifies it (low/moderate/heavy) → applies the
   nitrogen-leaching multiplier (×1.00 / ×1.10 / ×1.20) → runs the Simplex solver to
   find the cost-minimized fertilizer mix.
3. **Agricultural Officer** reviews and approves/rejects the recommendation.
4. **Administrator** manages crop/fertilizer reference data and staff accounts.

## 5. Deployment

- **Frontend**: Vercel (`vercel --prod`, framework preset: Vite)
- **Backend**: Render (Web Service, build `npm install`, start `npm start`)
- Update `CLIENT_ORIGIN` (backend) and `VITE_API_URL` (frontend) to match your deployed URLs.

## Verified Working

- Backend: all files pass `node --check` syntax validation
- Backend: LP/Simplex solver verified (120kg N / 60kg P / 60kg K → 260.87kg Urea +
  133.33kg TSP + 100kg MOP)
- Frontend: `npm run build` completes with no errors
