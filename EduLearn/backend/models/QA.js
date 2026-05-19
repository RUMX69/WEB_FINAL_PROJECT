// ─── models/QA.js ────────────────────────────────────────────────────────────
// Mongoose model for the Q&A feature.
// One QA document represents a single question posted on a video.
// Answers to that question are stored as an embedded array of subdocuments
// rather than a separate collection, keeping related data together.

// Import Mongoose to define schemas and create the model
const mongoose = require("mongoose");

// ── Answer subdocument schema ─────────────────────────────────────────────────
// Defines the shape of each individual answer object inside the QA.answers array.
// It is a sub-schema (not a top-level model), so it lives embedded in QA documents.
const answerSchema = new mongoose.Schema(
  {
    // The text body of the answer
    text: {
      type: String,
      required: true, // an answer must have content
    },

    // Reference to the User who wrote this answer.
    // Stored as an ObjectId; use .populate("answers.user") to expand it.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every answer must have an author
    },
  },
  {
    // Add `createdAt` and `updatedAt` to each answer subdocument automatically
    timestamps: true,
  }
);

// ── Main QA schema ────────────────────────────────────────────────────────────
// Defines the shape of a top-level QA (question) document.
const qaSchema = new mongoose.Schema(
  {
    // Reference to the Video this question was asked on.
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true, // a question must always belong to a specific video
    },

    // Reference to the User who asked the question.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // a question must always have an author
    },

    // The text of the question itself.
    question: {
      type: String,
      required: true, // a QA document without a question text is invalid
    },

    // Embedded array of answer subdocuments.
    // Stored directly inside the QA document (denormalised).
    // Each element matches the answerSchema defined above.
    // Defaults to an empty array so a newly posted question starts with no answers.
    answers: {
      type: [answerSchema],
      default: [], // empty array until someone posts an answer
    },
  },
  {
    // Automatically add `createdAt` and `updatedAt` to every QA document
    timestamps: true,
  }
);

// Compile the schema into a Mongoose model named "QA" and export it
module.exports = mongoose.model("QA", qaSchema);
