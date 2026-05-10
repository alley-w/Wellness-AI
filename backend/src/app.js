const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const aiRoutes = require("./routes/aiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const mealRoutes = require("./routes/mealRoutes");
const mealsRoutes = require("./routes/mealsRoutes");
const userRoutes = require("./routes/userRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const usersRoutes = require("./routes/usersRoutes");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/users", userRoutes);
app.use("/api/users", dashboardRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportsRoutes);

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON payload." });
  }
  return next(error);
});

module.exports = app;
