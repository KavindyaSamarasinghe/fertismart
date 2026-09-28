require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");
const fertilizerRoutes = require("./routes/fertilizerRoutes");
const farmRoutes = require("./routes/farmRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "FertiSmart SL API", timestamp: new Date().toISOString() });
});

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/fertilizers", fertilizerRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[FertiSmart SL] Backend running on port ${PORT}`);
  console.log(`[FertiSmart SL] API docs available at http://localhost:${PORT}/api-docs`);
});