const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const searchRoutes = require("./routes/searchRoutes");
const connectDb= require("./database/db")
const app = express();
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// ======================
// Middlewares
// ======================

// Security headers
app.use(helmet());

// Allow frontend access
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Connect to MongoDB
connectDb(); 
// Logger
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}


// ======================
// Routes
// ======================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mini Search Engine API Running ",
  });
});


app.use("/api", searchRoutes);


// ======================
// 404 Handler
// ======================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


// ======================
// Global Error Handler
// ======================

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});


// ======================
// Server
// ======================

const PORT = process.env.PORT || 3000;


const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Graceful Shutdown

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});