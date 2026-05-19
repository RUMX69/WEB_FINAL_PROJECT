// ─── models/Video.js ─────────────────────────────────────────────────────────
// Mongoose model for Video documents.
// Each video is a YouTube video catalogued in the platform by an admin.
// A virtual field `embedUrl` is computed on the fly from the stored `youtubeId`.

// Import Mongoose to define the schema and create the model
const mongoose = require("mongoose");

// Define the shape of a Video document
const videoSchema = new mongoose.Schema(
  {
    // The human-readable title of the video, shown in listings and headings.
    // `trim: true` strips leading/trailing whitespace from the stored value.
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // An optional longer description of the video's content.
    // Defaults to an empty string if not provided.
    description: {
      type: String,
      default: "",
    },

    // The 11-character YouTube video ID extracted from the video URL.
    // e.g. for https://www.youtube.com/watch?v=dQw4w9WgXcQ the ID is "dQw4w9WgXcQ".
    // This is used to build the embed URL (see virtual below) and thumbnail links.
    youtubeId: {
      type: String,
      required: true,
    },

    // URL of the video's thumbnail image, typically a YouTube thumbnail endpoint.
    // Defaults to an empty string (frontend should handle the missing-thumbnail case).
    thumbnail: {
      type: String,
      default: "",
    },

    // Broad topic category used to group/filter videos in the UI.
    // Defaults to "General" if the admin doesn't specify one.
    category: {
      type: String,
      default: "General",
    },

    // Array of keyword strings used for search filtering.
    // e.g. ["react", "hooks", "frontend"]
    // Each element in the array is a plain String.
    tags: [{ type: String }],

    // Reference to the admin User who added this video to the platform.
    // Stored as an ObjectId; use .populate("addedBy", "name") in queries.
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every video must be attributed to an admin
    },
  },
  {
    // Automatically manage `createdAt` and `updatedAt` timestamps
    timestamps: true,
  }
);

// ── Virtual field: embedUrl ───────────────────────────────────────────────────
// A virtual is a computed property that is NOT stored in MongoDB.
// It is derived from the actual stored `youtubeId` each time it is accessed.
// The frontend can use this URL directly in an <iframe src="..."> tag.
videoSchema.virtual("embedUrl").get(function () {
  // `this` refers to the Video document instance
  return `https://www.youtube.com/embed/${this.youtubeId}`;
});

// ── Enable virtuals in JSON output ────────────────────────────────────────────
// By default, Mongoose omits virtuals when converting a document to JSON.
// `toJSON: { virtuals: true }` ensures `embedUrl` is included in res.json() calls,
// so the client receives it without any extra transformation step.
videoSchema.set("toJSON", { virtuals: true });

// Compile the schema into a Mongoose model named "Video" and export it
module.exports = mongoose.model("Video", videoSchema);
