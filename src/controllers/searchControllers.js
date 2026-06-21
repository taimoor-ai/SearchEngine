const documents = require("../data/documents");

const searchDocuments = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    // Validate query
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
        data: [],
      });
    }

    // Check documents availability
    if (!Array.isArray(documents)) {
      throw new Error("Documents data is not valid");
    }

    const searchQuery = query.toLowerCase();

     const results = documents.filter((doc) => {
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query)
    );
  });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });

  } catch (error) {
    console.error("Search Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = searchDocuments;