// ─── controllers/history.controller.js ───────────────────────────────────────
// Manages the user's video-watch history.
// Each time a user watches a video, a History record is created or updated.

// Import the History Mongoose model to query the history collection
const History = require("../models/History");

/**
 * GET /api/history
 * Returns all watch-history entries for the logged-in user,
 * sorted newest first and with video details populated.
 */
exports.getHistory = async (req, res) => {
  try {
    const history = await History
      // Find every history document that belongs to the authenticated user
      .find({ user: req.user._id })

      // Replace the `video` ObjectId with a partial Video document containing
      // only these four fields (avoids over-fetching the full description/tags)
      .populate("video", "title youtubeId thumbnail category")

      // Sort by watchedAt descending (most recently watched first).
      // The "-" prefix is Mongoose shorthand for descending order.
      .sort("-watchedAt");

    // Respond with the populated history array
    res.json({ success: true, history });
  } catch (err) {
    // Return a 500 with the error detail for debugging
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/history
 * Called when the user starts watching a video.
 * Uses an upsert so that re-watching the same video simply refreshes
 * the watchedAt timestamp instead of creating a duplicate entry.
 */
exports.addToHistory = async (req, res) => {
  try {
    // Extract the video's MongoDB _id from the request body
    const { videoId } = req.body;

    // findOneAndUpdate with upsert:
    //   - If a History document for this user+video already exists → update watchedAt
    //   - If none exists → create a new one (upsert: true)
    // `new: true` means return the document AFTER the update is applied
    const entry = await History.findOneAndUpdate(
      { user: req.user._id, video: videoId }, // filter: match by user AND video
      { watchedAt: new Date() },               // update: set watchedAt to right now
      { upsert: true, new: true }              // options: create if missing, return new doc
    );

    // Return the created or updated entry
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/history/:videoId
 * Removes a single video from the authenticated user's watch history.
 */
exports.deleteHistoryItem = async (req, res) => {
  try {
    // Delete the one history document that matches BOTH the logged-in user
    // AND the video ID supplied in the URL parameter (:videoId)
    await History.findOneAndDelete({
      user: req.user._id,
      video: req.params.videoId, // videoId comes from the URL path
    });

    // Confirm deletion (even if the document didn't exist, we treat it as success)
    res.json({ success: true, message: "Removed from history" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/history/clear
 * Wipes the entire watch history for the authenticated user.
 */
exports.clearHistory = async (req, res) => {
  try {
    // Delete ALL history documents owned by this user in one operation
    await History.deleteMany({ user: req.user._id });

    res.json({ success: true, message: "History cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
