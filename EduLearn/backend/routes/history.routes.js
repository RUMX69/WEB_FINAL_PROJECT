// ─── routes/history.routes.js ────────────────────────────────────────────────
// Defines the HTTP endpoints for managing a user's video watch history.
// All routes here are prefixed with /api/history (set in server.js).
// All routes require authentication – there is no public history access.

// Create a new Express Router instance (named `r` for brevity in this file)
const express = require("express");
const r = express.Router();

// Import all history controller functions (named `c` for conciseness)
const c = require("../controllers/history.controller");

// Import the `protect` middleware that verifies the user's JWT before each request
const { protect } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// GET /api/history
// Returns all watch-history entries for the logged-in user, newest first.
r.get("/", protect, c.getHistory);

// POST /api/history
// Adds a video to the user's history (or refreshes its watchedAt timestamp).
// Called automatically by the frontend when a user starts watching a video.
r.post("/", protect, c.addToHistory);

// DELETE /api/history/clear
// Removes ALL history entries for the logged-in user in one operation.
// IMPORTANT: this route must be defined BEFORE "/:videoId" so Express matches
// the literal string "clear" first and doesn't treat it as a dynamic param.
r.delete("/clear", protect, c.clearHistory);

// DELETE /api/history/:videoId
// Removes a single history entry identified by the video's MongoDB _id.
r.delete("/:videoId", protect, c.deleteHistoryItem);

// Export the router so server.js can mount it at /api/history
module.exports = r;
