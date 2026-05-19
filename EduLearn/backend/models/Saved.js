// ─── models/Saved.js ─────────────────────────────────────────────────────────
// Mongoose model for a user's "saved" (bookmarked / watch-later) videos.
// Each Saved document is a simple join between one User and one Video.
// A compound unique index prevents the same video from being saved twice
// by the same user.

// Import Mongoose to define the schema and create the model
const mongoose = require("mongoose");

// Define the shape of a Saved document
const savedSchema = new mongoose.Schema(
  {
    // Reference to the User who saved the video.
    user: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId type
      ref: "User",                          // enables .populate("user")
      required: true,                       // a saved entry must have an owner
    },

    // Reference to the Video that was saved.
    video: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId type
      ref: "Video",                         // enables .populate("video")
      required: true,                       // a saved entry must point to a video
    },
  },
  {
    // `timestamps: true` automatically manages:
    //   `createdAt` – when the video was saved (useful for "saved at" display)
    //   `updatedAt` – when the document was last modified
    timestamps: true,
  }
);

// ── Index ─────────────────────────────────────────────────────────────────────
// Compound unique index on { user, video }.
// Guarantees each user can save any given video only once.
// A duplicate insert will throw a MongoDB error with code 11000,
// which the saved.controller catches and converts to a 400 "Already saved" response.
savedSchema.index({ user: 1, video: 1 }, { unique: true });

// Compile the schema into a Mongoose model named "Saved" and export it
module.exports = mongoose.model("Saved", savedSchema);
