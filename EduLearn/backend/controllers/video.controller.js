// ─── controllers/video.controller.js ─────────────────────────────────────────
// Full CRUD for the Video resource.
// Public users can list and view videos.
// Only admins can create, update, or delete videos.

// Import the Video Mongoose model to query the videos collection
const Video = require("../models/Video");

/**
 * GET /api/videos
 * Returns all videos, with optional search (title or tags) and category filtering.
 * PUBLIC – no authentication required.
 */
exports.getAllVideos = async (req, res) => {
  try {
    // Pull optional filter params from the URL query string
    // e.g. /api/videos?search=react&category=Frontend
    const { search, category } = req.query;

    // Start with an empty filter object – matches everything by default
    const query = {};

    // If a search term was provided, add a MongoDB $or condition that checks
    // both the `title` and `tags` fields using a case-insensitive regex
    if (search) query.$or = [
      { title: { $regex: search, $options: "i" } }, // "i" = case-insensitive
      { tags: { $regex: search, $options: "i" } },
    ];

    // If a category was provided, add an exact-match filter
    if (category) query.category = category;

    // Execute the query, populate the admin who added each video (name only),
    // and sort newest first
    const videos = await Video
      .find(query)
      .populate("addedBy", "name") // replace addedBy ObjectId with the admin's name
      .sort("-createdAt");          // descending creation date

    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/videos/:id
 * Returns a single video by its MongoDB _id.
 * PUBLIC – no authentication required.
 */
exports.getVideo = async (req, res) => {
  try {
    // Find the video by the _id URL parameter and populate the admin's name
    const video = await Video
      .findById(req.params.id)
      .populate("addedBy", "name");

    // Return 404 if no video exists with that ID
    if (!video) return res.status(404).json({ message: "Video not found" });

    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/videos
 * Creates a new video entry.
 * ADMIN ONLY – protected by `protect` + `adminOnly` middleware in the router.
 */
exports.addVideo = async (req, res) => {
  try {
    // Destructure all video fields from the request body
    const { title, description, youtubeId, thumbnail, category, tags } = req.body;
    //  title       – display title of the video
    //  description – optional long-form description
    //  youtubeId   – the 11-character YouTube video ID (e.g. "dQw4w9WgXcQ")
    //  thumbnail   – URL to the preview image
    //  category    – broad topic/section label
    //  tags        – array of keyword strings for search

    // Create and persist the new Video document
    const video = await Video.create({
      title,
      description,
      youtubeId,
      thumbnail,
      category,
      tags,
      addedBy: req.user._id, // record which admin created this entry
    });

    // Respond with 201 Created and the newly saved video document
    res.status(201).json({ success: true, video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/videos/:id
 * Updates any fields of an existing video.
 * ADMIN ONLY – protected by `protect` + `adminOnly` middleware in the router.
 */
exports.updateVideo = async (req, res) => {
  try {
    // Find the video by ID and replace fields with whatever was sent in req.body.
    // `new: true`          → return the document after the update
    // `runValidators: true` → enforce schema validation on the new values
    const video = await Video.findByIdAndUpdate(
      req.params.id, // video _id from the URL parameter
      req.body,      // all provided fields will be updated
      { new: true, runValidators: true }
    );

    // Return 404 if no video with that ID was found
    if (!video) return res.status(404).json({ message: "Video not found" });

    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/videos/:id
 * Permanently removes a video from the database.
 * ADMIN ONLY – protected by `protect` + `adminOnly` middleware in the router.
 */
exports.deleteVideo = async (req, res) => {
  try {
    // Find and delete the video in one atomic operation
    await Video.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
