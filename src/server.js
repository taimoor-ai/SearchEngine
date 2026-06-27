// server.js

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import indexWorker from "./indexer/indexWorker.js";


import connectDb from "./database/db.js";
import searchRoutes from "./routes/searchRoutes.js";

import urlQueueService from "./services/urlQueue.service.js";
import crawlerWorker from "./crawler/crawlerWorker.js";

// Load Environment Variables
dotenv.config();

const app = express();

// =====================================
// Middlewares
// =====================================

app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// =====================================
// Routes
// =====================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mini Search Engine API Running",
  });
});

app.use("/api", searchRoutes);

// =====================================
// 404 Handler
// =====================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// =====================================
// Global Error Handler
// =====================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// =====================================
// Start Server
// =====================================

const PORT = process.env.PORT || 3000;

let server;

const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDb();

    console.log("✅ MongoDB Connected");

    // ---------------------------------
    // Seed URLs
    // ---------------------------------

    const seedUrls = [
      "https://react.dev",
      "https://nodejs.org",
      "https://expressjs.com"
    ];

    for (const url of seedUrls) {
      await urlQueueService.add(url);
    }

    console.log(`✅ ${seedUrls.length} seed URL(s) added.`);

    // ---------------------------------
    // Start Express
    // ---------------------------------

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // ---------------------------------
    // Start Worker
    // ---------------------------------

    crawlerWorker.start();
    console.log("✅ Crawler Worker Started");
    indexWorker.start();
    console.log("✅ Index Worker Started");

    
  } catch (error) {
    console.error("Server startup failed");
    console.error(error);

    process.exit(1);
  }
};

startServer();

// =====================================
// Graceful Shutdown
// =====================================

const shutdown = async (signal) => {
  console.log(`\n${signal} received...`);

  crawlerWorker.stop();

  server.close(() => {
    console.log("Express Server Closed");

    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));