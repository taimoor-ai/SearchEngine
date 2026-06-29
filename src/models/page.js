import mongoose from "mongoose";

const PageSchema = new mongoose.Schema(
  {
    // =========================
    // PAGE IDENTITY
    // =========================

    url: {
      type: String,
      required: [true, "URL is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator(value) {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: "Invalid URL",
      },
    },

    domain: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    canonicalUrl: {
      type: String,
      default: null,
    },

    isHttps: {
      type: Boolean,
      default: true,
    },

    // =========================
    // PAGE CONTENT
    // =========================

    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    headings: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],

    content: {
      type: String,
      default: "",
    },

    contentLength: {
      type: Number,
      default: 0,
    },

    detectedLanguage: {
      type: String,
      default: "unknown",
    },

    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // =========================
    // LINK ANALYSIS
    // =========================

    outgoingLinks: [
      {
        type: String,
        trim: true,
      },
    ],

    incomingLinks: [
      {
        type: String,
        trim: true,
      },
    ],

    outgoingLinksCount: {
      type: Number,
      default: 0,
    },

    incomingLinksCount: {
      type: Number,
      default: 0,
    },

    // =========================
    // CRAWLER
    // =========================

    crawlStatus: {
      type: String,
      enum: ["pending", "crawling", "completed", "failed"],
      default: "pending",
      index: true,
    },

    statusCode: {
      type: Number,
      default: 200,
    },

    responseTime: {
      type: Number,
      default: 0,
    },

    crawlCount: {
      type: Number,
      default: 1,
    },

    priority: {
      type: Number,
      default: 1,
      index: true,
    },

    depth: {
      type: Number,
      default: 0,
      index: true,
    },

    lastCrawledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    nextCrawlAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastError: {
      type: String,
      default: null,
    },

    // =========================
    // CONTENT VERSIONING
    // =========================

    hash: {
      type: String,
      default: null,
      index: true,
    },
    aliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    contentChanged: {
      type: Boolean,
      default: true,
    },

    // =========================
    // SEARCH ENGINE
    // =========================

    pageRank: {
      type: Number,
      default: 0,
    },

    searchScore: {
      type: Number,
      default: 0,
    },

    indexedAt: {
      type: Date,
      default: null,
    },

    isIndexed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // =========================
    // HTTP INFO
    // =========================

    contentType: {
      type: String,
      default: "text/html",
    },

    // =========================
    // META DATA
    // =========================

    metadata: {
      robots: {
        type: String,
        default: "",
      },

      canonicalUrl: {
        type: String,
        default: null,
        index: true,
      },

      author: {
        type: String,
        default: "",
      },

      generator: {
        type: String,
        default: "",
      },

      viewport: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// =========================
// TEXT SEARCH INDEX
// =========================

PageSchema.index(
  {
    title: "text",
    description: "text",
    content: "text",
    headings: "text",
  },
  {
    default_language: "english",
  },
);

// =========================
// COMPOUND INDEXES
// =========================

PageSchema.index({
  domain: 1,
  crawlStatus: 1,
});

PageSchema.index({
  priority: -1,
  nextCrawlAt: 1,
});

PageSchema.index({
  pageRank: -1,
});

PageSchema.index({
  lastCrawledAt: -1,
});

// =========================
// PRE VALIDATE
// =========================
PageSchema.pre("validate", function () {
  if (!this.url) return;

  try {
    const parsed = new URL(this.url);

    this.domain = parsed.hostname.toLowerCase();
    this.isHttps = parsed.protocol === "https:";

    if (!this.canonicalUrl) {
      this.canonicalUrl = this.url;
    }
  } catch (err) {
    // Ignore invalid URL
  }
});

// =========================
// PRE SAVE
// =========================

PageSchema.pre("save", function () {
  this.contentLength = this.content?.length || 0;
  this.outgoingLinksCount = this.outgoingLinks?.length || 0;
  this.incomingLinksCount = this.incomingLinks?.length || 0;
});

const Page =
  mongoose.models.Page ||
  mongoose.model("Page", PageSchema);

export default Page;
