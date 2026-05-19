// ─── models/Note.js ──────────────────────────────────────────────────────────
// Mongoose model for user-created notes on videos.
// A note links a user to a video and optionally stores the playback position
// (in seconds) at which the note was taken, so it can be shown in context.

// Import Mongoose to define the schema and create the model
const mongoose = require("mongoose");

// Define the shape of a Note document
const noteSchema = new mongoose.Schema(
  {
    // Reference to the User who wrote this note.
    user: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId
      ref: "User",                          // enables .populate("user") lookups
      required: true,                       // every note must have an owner
    },

    // Reference to the Video this note is about.
    video: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId
      ref: "Video",                         // enables .populate("video") lookups
      required: true,                       // every note must be tied to a video
    },

    // The actual text content of the note written by the user.
    content: {
      type: String,
      required: true, // a note without text is not meaningful
    },

    // Playback position (in seconds) in the video when the note was taken.
    // e.g. 125 means the note was taken at the 2-minute 5-second mark.
    // Defaults to 0 (start of video) if the client doesn't provide a value.
    timestamp: {
      type: Number,
      default: 0, // seconds
    },
  },
  {
    // Automatically add `createdAt` and `updatedAt` timestamps to every document
    timestamps: true,
  }
);

// Compile the schema into a Mongoose model named "Note" and export it
module.exports = mongoose.model("Note", noteSchema);
