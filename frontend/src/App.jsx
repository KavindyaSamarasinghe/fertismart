import React from "react";
import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import FarmerDashboard from "./pages/farmer/FarmerDashboard.jsx";
import Recommendations from "./pages/farmer/Recommendations.jsx";

import OfficerDashboard from "./pages/officer/OfficerDashboard.jsx";
import FarmsOverview from "./pages/officer/FarmsOverview.jsx";

import CropsAdmin from "./pages/admin/CropsAdmin.jsx";
import FertilizersAdmin from "./pages/admin/FertilizersAdmin.jsx";
import UsersAdmin from "./pages/admin/UsersAdmin.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <FarmerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/recommendations"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <Recommendations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={["officer"]}>
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/farms"
        element={
          <ProtectedRoute allowedRoles={["officer"]}>
            <FarmsOverview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <CropsAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fertilizers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FertilizersAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UsersAdmin />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
