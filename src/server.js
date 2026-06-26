// server.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import connectDb from "./database/db.js";
import searchRoutes from "./routes/searchRoutes.js";
import crawlManager from "./crawler/crawlerManager.js";
import urlQueueService from "./crawler/urlQueue.service.js";

// Load environment variables
dotenv.config();

const app = express();

// ======================
// Middlewares
// ======================

app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ======================
// Routes
// ======================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mini Search Engine API Running",
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
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ======================
// Start Server
// ======================

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect Database
    await connectDb();

    // Seed URL Queue
    await urlQueueService.add("https://react.dev");

    // Start crawler (optional)
    // await crawlManager.start();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Graceful Shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down...");

      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down...");

      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();