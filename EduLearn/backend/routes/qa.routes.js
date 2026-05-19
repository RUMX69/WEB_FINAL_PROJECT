// ─── routes/qa.routes.js ─────────────────────────────────────────────────────
// Defines the HTTP endpoints for the Q&A feature on videos.
// All routes here are prefixed with /api/qa (set in server.js).
// Access levels vary per route: some are public, some require login,
// and deletion requires ownership or admin role (enforced in the controller).

// Create a new Express Router instance
const express = require("express");
const r = express.Router();

// Import all Q&A controller functions
const c = require("../controllers/qa.controller");

// Import auth middleware:
//   `protect`   – verifies a valid JWT (user must be logged in)
//   `adminOnly` – additionally checks that the user's role is "admin"
//   (adminOnly is imported but the controller handles the owner-or-admin check
//    for deletions internally, so adminOnly is not applied at the route level here)
const { protect, adminOnly } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// GET /api/qa/:videoId
// Returns all questions (with nested answers) for a specific video.
// PUBLIC – no login required; anyone browsing the site can read Q&A.
r.get("/:videoId", c.getQAByVideo);

// POST /api/qa
// Posts a new question on a video.
// PROTECTED – the user must be logged in so the question is attributed to them.
// Body must include: { videoId, question }
r.post("/", protect, c.postQuestion);

// PUT /api/qa/:id/answer
// Appends an answer to the answers array of an existing question.
// PROTECTED – any logged-in user can answer; their identity is recorded.
// Body must include: { answer }
r.put("/:id/answer", protect, c.answerQuestion);

// DELETE /api/qa/:id
// Deletes a question (and all its answers).
// PROTECTED – only the question's original author OR an admin can delete it.
// The ownership/role check is handled inside the deleteQuestion controller,
// not as a separate middleware here.
r.delete("/:id", protect, c.deleteQuestion);

// Export the router so server.js can mount it at /api/qa
module.exports = r;
