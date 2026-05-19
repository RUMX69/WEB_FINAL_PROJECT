// ─── routes/note.routes.js ───────────────────────────────────────────────────
// Defines the HTTP endpoints for CRUD operations on user notes.
// All routes here are prefixed with /api/notes (set in server.js).
// All routes require authentication – notes are private per user.

// Create a new Express Router instance
const express = require("express");
const r = express.Router();

// Import all note controller functions
const c = require("../controllers/note.controller");

// Import the `protect` middleware to enforce authentication on every route
const { protect } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// GET /api/notes
// Returns all notes created by the logged-in user across every video.
r.get("/", protect, c.getMyNotes);

// GET /api/notes/:videoId
// Returns only the notes for a specific video (by the logged-in user),
// sorted by playback timestamp so they appear in video order.
r.get("/:videoId", protect, c.getNotesByVideo);

// POST /api/notes
// Creates a new note. Body must include: { videoId, content, timestamp? }
r.post("/", protect, c.createNote);

// PUT /api/notes/:id
// Updates the content of an existing note identified by its MongoDB _id.
// Only the note's owner can update it (enforced inside the controller).
r.put("/:id", protect, c.updateNote);

// DELETE /api/notes/:id
// Permanently deletes a note by its MongoDB _id.
// Only the note's owner can delete it (enforced inside the controller).
r.delete("/:id", protect, c.deleteNote);

// Export the router so server.js can mount it at /api/notes
module.exports = r;
