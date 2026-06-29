import mongoose from "mongoose";

const PostingSchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
    },

    frequency: {
      type: Number,
      default: 1,
    },

    positions: [
      {
        type: Number,
      },
    ],
  },
  {
    _id: false,
  }
);

const InvertedIndexSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    postings: [PostingSchema],

    documentFrequency: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const InvertedIndex =
  mongoose.models.InvertedIndex ||
  mongoose.model("InvertedIndex", InvertedIndexSchema);

export default InvertedIndex;