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
  "https://www.wikipedia.org/",
  "https://developer.mozilla.org/",
  "https://nodejs.org/",
  "https://react.dev/",
  "https://expressjs.com/",
  "https://www.python.org/",
  "https://go.dev/",
  "https://www.rust-lang.org/",
  "https://kotlinlang.org/",
  "https://www.java.com/",
  "https://developer.chrome.com/",
  "https://github.com/",
  "https://gitlab.com/",
  "https://docs.github.com/",
  "https://docs.docker.com/",
  "https://kubernetes.io/",
  "https://www.gnu.org/",
  "https://opensource.org/",
  "https://www.nasa.gov/",
  "https://www.nih.gov/",
  "https://www.noaa.gov/",
  "https://www.nature.com/",
  "https://www.scientificamerican.com/",
  "https://www.who.int/",
  "https://medlineplus.gov/",
  "https://www.mayoclinic.org/",
  "https://www.bbc.com/",
  "https://www.reuters.com/",
  "https://apnews.com/",
  "https://www.aljazeera.com/",
  "https://www.cnn.com/",
  "https://www.theguardian.com/",
  "https://www.nytimes.com/",
  "https://www.harvard.edu/",
  "https://www.stanford.edu/",
  "https://www.mit.edu/",
  "https://ocw.mit.edu/",
  "https://www.khanacademy.org/",
  "https://www.coursera.org/",
  "https://www.edx.org/",
  "https://www.usa.gov/",
  "https://www.gov.uk/",
  "https://www.canada.ca/",
  "https://pakistan.gov.pk/",
  "https://www.un.org/",
  "https://www.worldbank.org/",
  "https://www.imdb.com/",
  "https://www.rottentomatoes.com/",
  "https://www.espn.com/",
  "https://www.fifa.com/",
  "https://www.icc-cricket.com/",
  "https://www.nationalgeographic.com/",
  "https://www.britannica.com/",
  "https://www.mozilla.org/",
  "https://www.apache.org/",
  "https://www.postgresql.org/",
  "https://www.mongodb.com/",
  "https://redis.io/",
  "https://nginx.org/",
  "https://www.cloudflare.com/"
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