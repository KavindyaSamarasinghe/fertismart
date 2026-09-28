const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FertiSmart SL API",
      version: "1.0.0",
      description:
        "Fertilizer Decision Support System API — Simplex LP-based, weather-adjusted NPK fertilizer recommendations for up-country vegetable farmers in Nuwara Eliya and Bandarawela, Sri Lanka.",
    },
    servers: [{ url: "http://localhost:5000/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);