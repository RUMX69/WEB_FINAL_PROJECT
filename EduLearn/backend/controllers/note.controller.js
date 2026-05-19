// ─── controllers/note.controller.js ──────────────────────────────────────────
// CRUD operations for user notes.
// Notes are tied to both a user and a specific video, with an optional timestamp
// (seconds into the video) so users can annotate particular moments.

// Import the Note Mongoose model to query the notes collection
const Note = require("../models/Note");

/**
 * GET /api/notes
 * Returns every note created by the logged-in user across ALL videos,
 * sorted by creation date (newest first), with basic video info attached.
 */
exports.getMyNotes = async (req, res) => {
  try {
    const notes = await Note
      // Filter: only notes belonging to the currently authenticated user
      .find({ user: req.user._id })

      // Populate the `video` reference with three fields so the client knows
      // which video each note belongs to without a separate API call
      .populate("video", "title youtubeId thumbnail")

      // Sort descending by creation date ("-createdAt" = newest first)
      .sort("-createdAt");

    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/notes/:videoId
 * Returns all notes written by the logged-in user for ONE specific video,
 * sorted by timestamp ascending so they appear in video order.
 */
exports.getNotesByVideo = async (req, res) => {
  try {
    const notes = await Note
      .find({
        user: req.user._id,           // must belong to this user
        video: req.params.videoId,    // must be for this specific video (from URL)
      })
      .sort("timestamp"); // ascending: note at 0s appears before note at 60s

    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/notes
 * Creates a new note linked to a video at an optional video timestamp.
 */
exports.createNote = async (req, res) => {
  try {
    // Extract the three fields sent by the client in the request body
    const { videoId, content, timestamp } = req.body;
    //  videoId   – MongoDB _id of the video being annotated
    //  content   – the actual note text
    //  timestamp – playback position in seconds when the note was taken

    // Create and persist the new Note document
    const note = await Note.create({
      user: req.user._id, // owner: the currently logged-in user
      video: videoId,     // reference to the Video document
      content,            // note body text
      timestamp,          // seconds into the video (defaults to 0 in the schema)
    });

    // Respond with 201 Created and the newly created note
    res.status(201).json({ success: true, note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/notes/:id
 * Updates the text content of an existing note.
 * Only the owner of the note can update it (enforced via the user filter).
 */
exports.updateNote = async (req, res) => {
  try {
    // Look up the note by its _id AND by the logged-in user.
    // The dual filter ensures a user can't modify someone else's note
    // even if they know its _id.
    const note = await Note.findOne({
      _id: req.params.id,    // note ID from URL parameter
      user: req.user._id,    // must be owned by the requesting user
    });

    // If no matching note is found, return 404
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Update the content field if a new value was provided;
    // the `??` (nullish coalescing) operator keeps the old value if undefined/null
    note.content = req.body.content ?? note.content;

    // Persist the updated document to MongoDB
    await note.save();

    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/notes/:id
 * Permanently deletes a note owned by the logged-in user.
 */
exports.deleteNote = async (req, res) => {
  try {
    // Delete the note only if it matches BOTH the _id and the owner.
    // This prevents users from deleting each other's notes.
    await Note.findOneAndDelete({
      _id: req.params.id,   // note ID from URL parameter
      user: req.user._id,   // must belong to the requesting user
    });

    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
