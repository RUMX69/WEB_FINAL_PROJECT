// ─── routes/saved.routes.js ──────────────────────────────────────────────────
// Defines the HTTP endpoints for managing a user's saved (bookmarked) videos.
// All routes here are prefixed with /api/saved (set in server.js).
// All routes require authentication – saved lists are private per user.

// Create a new Express Router instance
const express = require("express");
const r = express.Router();

// Import all saved controller functions
const c = require("../controllers/saved.controller");

// Import the `protect` middleware to enforce JWT authentication on every route
const { protect } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// GET /api/saved
// Returns all videos saved by the logged-in user, most recently saved first.
r.get("/", protect, c.getSaved);

// POST /api/saved
// Saves a video to the user's list.
// Body must include: { videoId }
// Returns 400 "Already saved" if the same video is saved twice (unique index).
r.post("/", protect, c.saveVideo);

// DELETE /api/saved/:videoId
// Removes a specific video from the user's saved list.
// The video's MongoDB _id is supplied as a URL parameter, not in the body.
r.delete("/:videoId", protect, c.unsaveVideo);

// Export the router so server.js can mount it at /api/saved
module.exports = r;
