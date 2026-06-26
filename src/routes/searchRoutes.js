import express from "express";
const router = express.Router();

import { searchDocuments } from "../controllers/searchControllers.js";

// Optional middleware example
const validateSearchQuery = (req, res, next) => {
  const query = req.query.q;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  next();
};


/**
 * @route   GET /api/v1/search
 * @desc    Search documents
 * @access  Public
 */
router.get(
  "/search",
  validateSearchQuery,
  searchDocuments
);


export default router;