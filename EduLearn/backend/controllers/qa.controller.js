// ─── controllers/qa.controller.js ────────────────────────────────────────────
// Handles the Q&A (question-and-answer) feature attached to videos.
// Any authenticated user can ask a question or post an answer.
// Only the question's author or an admin can delete a question.

// Import the QA Mongoose model to query the qa collection
const QA = require("../models/QA");

/**
 * GET /api/qa/:videoId
 * Returns all questions (with their nested answers) for a specific video.
 * This is a PUBLIC route – no authentication required.
 */
exports.getQAByVideo = async (req, res) => {
  try {
    const qas = await QA
      // Filter by the video ID passed in the URL parameter
      .find({ video: req.params.videoId })

      // Replace the `user` ObjectId on each question with the user's name and avatar
      .populate("user", "name avatar")

      // For each answer in the embedded answers array, populate the answer author's name
      .populate("answers.user", "name")

      // Sort newest questions first
      .sort("-createdAt");

    res.json({ success: true, qas });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/qa
 * Creates a new question for a given video.
 * Requires authentication (handled by the `protect` middleware in the router).
 */
exports.postQuestion = async (req, res) => {
  try {
    // Extract the target video's ID and the question text from the request body
    const { videoId, question } = req.body;

    // Create a new QA document linking the question to the video and the logged-in user
    const qa = await QA.create({
      video: videoId,        // which video this question is about
      user: req.user._id,   // who asked the question
      question,              // the question text
      // `answers` defaults to an empty array (defined in the schema)
    });

    // Respond with 201 Created and the new QA document
    res.status(201).json({ success: true, qa });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/qa/:id/answer
 * Appends a new answer to an existing question's `answers` array.
 * Any authenticated user can answer any question.
 */
exports.answerQuestion = async (req, res) => {
  try {
    // Find the QA document by its _id (from the URL parameter)
    const qa = await QA.findById(req.params.id);

    // Return 404 if the question doesn't exist
    if (!qa) return res.status(404).json({ message: "Question not found" });

    // Push a new answer subdocument into the answers array.
    // Each answer stores the text and the ID of the user who wrote it.
    qa.answers.push({
      text: req.body.answer, // answer body from the request
      user: req.user._id,   // who is answering
    });

    // Persist the updated document (including the new answer) to MongoDB
    await qa.save();

    // Populate the answer authors' names before sending the response
    // so the client can display "Answered by [name]" immediately
    await qa.populate("answers.user", "name");

    res.json({ success: true, qa });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/qa/:id
 * Deletes a question (and all its nested answers).
 * Only the question's original author OR an admin may do this.
 */
exports.deleteQuestion = async (req, res) => {
  try {
    // Look up the question by ID
    const qa = await QA.findById(req.params.id);

    // Return 404 if it doesn't exist
    if (!qa) return res.status(404).json({ message: "Not found" });

    // Authorization check:
    // Convert both ObjectIds to strings before comparing because
    // Mongoose ObjectIds are objects, and `===` on objects compares references.
    // The user must be either the question author OR have the "admin" role.
    if (
      qa.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      // Return 403 Forbidden if the user is neither the author nor an admin
      return res.status(403).json({ message: "Not allowed" });
    }

    // Delete the QA document from the collection
    await qa.deleteOne();

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
