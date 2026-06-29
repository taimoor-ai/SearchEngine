// // controllers/search.controller.js

// import documents from "../data/documents.js";

// export const searchDocuments = async (req, res) => {
//   try {
//     const query = String(req.query.q || "").trim();

//     // Validate query
//     if (!query) {
//       return res.status(400).json({
//         success: false,
//         message: "Search query is required",
//         data: [],
//       });
//     }

//     // Check documents availability
//     if (!Array.isArray(documents)) {
//       throw new Error("Documents data is not valid");
//     }

//     const searchQuery = query.toLowerCase();

//     const results = documents.filter((doc) => {
//       return (
//         doc.title.toLowerCase().includes(searchQuery) ||
//         doc.content.toLowerCase().includes(searchQuery)
//       );
//     });

//     return res.status(200).json({
//       success: true,
//       count: results.length,
//       data: results,
//     });
//   } catch (error) {
//     console.error("Search Error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// controllers/search.controller.js

import searchService from "../search/search.service.js";

export const search = async (req, res, next) => {
  try {
    const { q } = req.query;

    const results = await searchService.search(q);

    res.json({
      success: true,
      query: q,
      total: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};
