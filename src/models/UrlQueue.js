import mongoose from "mongoose";

const UrlQueueSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    domain: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    priority: {
      type: Number,
      default: 1,
      index: true,
    },

    depth: {
      type: Number,
      default: 0,
    },

    discoveredFrom: {
      type: String,
      default: null,
    },

    // -----------------------------
    // Retry Information
    // -----------------------------

    retries: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
    },

    lastError: {
      type: String,
      default: null,
    },

    lastTriedAt: {
      type: Date,
      default: null,
    },

    // Next time this URL can be crawled
    nextCrawlAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // -----------------------------
    // Crawl Metadata
    // -----------------------------

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    processingWorker: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Fast lookup for next job
UrlQueueSchema.index({
  status: 1,
  priority: -1,
  nextCrawlAt: 1,
});

// Domain scheduling
UrlQueueSchema.index({
  domain: 1,
  status: 1,
});

// Retry lookup
UrlQueueSchema.index({
  retries: 1,
  nextCrawlAt: 1,
});

const UrlQueue =
  mongoose.models.UrlQueue ||
  mongoose.model("UrlQueue", UrlQueueSchema);

export default UrlQueue;