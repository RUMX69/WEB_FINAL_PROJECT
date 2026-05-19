// ─── controllers/saved.controller.js ─────────────────────────────────────────
// Manages a user's personal "saved videos" (watch-later / bookmarks) list.
// Each Saved document links one user to one video.
// A compound unique index on the model prevents duplicate saves.

// Import the Saved Mongoose model to query the saved collection
const Saved = require("../models/Saved");

/**
 * GET /api/saved
 * Returns all videos the logged-in user has saved, newest first.
 */
exports.getSaved = async (req, res) => {
  try {
    const saved = await Saved
      // Find all Saved documents that belong to the authenticated user
      .find({ user: req.user._id })

      // Replace the `video` ObjectId with a partial Video document so the
      // client has enough data to render a video card without extra requests
      .populate("video", "title youtubeId thumbnail category")

      // Sort descending by save date ("-createdAt" = most recently saved first)
      .sort("-createdAt");

    res.json({ success: true, saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/saved
 * Saves a video to the logged-in user's saved list.
 * Returns 400 if the video is already saved (MongoDB unique-index violation).
 */
exports.saveVideo = async (req, res) => {
  try {
    // Extract the target video's MongoDB _id from the request body
    const { videoId } = req.body;

    // Create a new Saved document linking the user to the video
    const saved = await Saved.create({
      user: req.user._id, // owner: the currently authenticated user
      video: videoId,     // reference to the Video document
    });

    // Respond with 201 Created and the new Saved document
    res.status(201).json({ success: true, saved });
  } catch (err) {
    // MongoDB error code 11000 means a duplicate-key constraint was violated.
    // This happens when the user tries to save the same video a second time,
    // caught by the compound unique index on { user, video }.
    if (err.code === 11000)
      return res.status(400).json({ message: "Already saved" });

    // Any other error is a generic server error
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/saved/:videoId
 * Removes a specific video from the logged-in user's saved list.
 * The videoId is taken from the URL parameter (not the body).
 */
exports.unsaveVideo = async (req, res) => {
  try {
    // Find and delete the Saved document that matches BOTH the user AND
    // the video ID supplied in the URL path (:videoId)
    await Saved.findOneAndDelete({
      user: req.user._id,
      video: req.params.videoId, // comes from the route parameter
    });

    res.json({ success: true, message: "Removed from saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
