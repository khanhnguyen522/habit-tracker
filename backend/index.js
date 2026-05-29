const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// db connection
require("./src/db/index");

// routes
const authRoutes = require("./src/routes/auth");
app.use("/auth", authRoutes);

const habitsRoutes = require("./src/routes/habits");
app.use("/habits", habitsRoutes);

const logsRoutes = require("./src/routes/logs");
app.use("/logs", logsRoutes);

const analyticsRoutes = require("./src/routes/analytics");
app.use("/analytics", analyticsRoutes);

// test route
app.get("/", (req, res) => {
  res.json({ message: "Habit Tracker API is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
