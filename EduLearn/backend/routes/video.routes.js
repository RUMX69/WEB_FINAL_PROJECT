// ─── routes/video.routes.js ──────────────────────────────────────────────────
// Defines the HTTP endpoints for the Video resource.
// All routes here are prefixed with /api/videos (set in server.js).
//
// Access levels:
//   GET  endpoints – PUBLIC (no authentication needed)
//   POST / PUT / DELETE – ADMIN ONLY (protect + adminOnly middleware required)

// Create a new Express Router instance
const express = require("express");
const router = express.Router();

// Import all five video controller functions
const {
  getAllVideos, // list all videos with optional search/category filters
  getVideo,    // get a single video by ID
  addVideo,    // create a new video entry (admin)
  updateVideo, // edit an existing video (admin)
  deleteVideo, // permanently remove a video (admin)
} = require("../controllers/video.controller");

// Import both auth middleware functions:
//   `protect`   – verifies the user is logged in (valid JWT)
//   `adminOnly` – additionally requires the user's role to be "admin"
const { protect, adminOnly } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// GET /api/videos
// Returns all videos. Supports optional query params: ?search=...&category=...
// PUBLIC – no login required so guest users can browse the video catalogue.
router.get("/", getAllVideos);

// GET /api/videos/:id
// Returns a single video by its MongoDB _id (passed as a URL parameter).
// PUBLIC – guest users can view individual video detail pages.
router.get("/:id", getVideo);

// POST /api/videos
// Creates a new video entry.
// ADMIN ONLY: `protect` checks JWT first, then `adminOnly` checks the role.
// Body must include: { title, youtubeId, description?, thumbnail?, category?, tags? }
router.post("/", protect, adminOnly, addVideo);

// PUT /api/videos/:id
// Updates any fields of an existing video by its _id.
// ADMIN ONLY: same two-middleware guard as POST above.
router.put("/:id", protect, adminOnly, updateVideo);

// DELETE /api/videos/:id
// Permanently deletes a video by its _id.
// ADMIN ONLY: same two-middleware guard as POST above.
router.delete("/:id", protect, adminOnly, deleteVideo);

// Export the router so server.js can mount it at /api/videos
module.exports = router;
