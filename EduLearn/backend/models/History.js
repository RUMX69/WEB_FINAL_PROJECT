// ─── models/History.js ───────────────────────────────────────────────────────
// Mongoose model for tracking which videos a user has watched.
// One History document = one user + one video.
// A compound unique index ensures no duplicate entries; re-watching a video
// simply updates the `watchedAt` timestamp (via the upsert in the controller).

// Import Mongoose to define the schema and create the model
const mongoose = require("mongoose");

// Define the shape of a History document
const historySchema = new mongoose.Schema(
  {
    // Reference to the User who watched the video.
    // ObjectId links this document to a User document.
    // `required: true` means this field must always be present.
    user: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId type
      ref: "User",                          // tells Mongoose to populate from the User collection
      required: true,
    },

    // Reference to the Video that was watched.
    video: {
      type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId type
      ref: "Video",                         // tells Mongoose to populate from the Video collection
      required: true,
    },

    // The exact date/time when the user (last) watched this video.
    // Defaults to the current time when the document is first created.
    watchedAt: {
      type: Date,
      default: Date.now, // function reference – called at document creation time
    },
  },
  {
    // `timestamps: true` automatically adds two managed fields:
    //   `createdAt` – when the document was first inserted
    //   `updatedAt` – whenever the document is modified
    timestamps: true,
  }
);

// ── Index ─────────────────────────────────────────────────────────────────────
// Create a compound unique index on { user, video }.
// This enforces that each user can only have ONE history entry per video.
// Attempting to insert a duplicate triggers a MongoDB error code 11000,
// which is handled in the controller with an upsert instead of an insert.
historySchema.index({ user: 1, video: 1 }, { unique: true });
//                            ^       ^
//  1 = ascending index direction (standard for equality lookups)

// Compile the schema into a Mongoose model named "History"
// and export it so controllers can import and use it
module.exports = mongoose.model("History", historySchema);
