// ─── controllers/video.controller.js ─────────────────────────────────────────
// Full CRUD for the Video resource.
// Public users can list and view videos.
// Only admins can create, update, or delete videos.

// Import the Video Mongoose model to query the videos collection
const Video = require("../models/Video");

// Import History and Saved models so we can clean up their documents
// whenever a video is permanently deleted by an admin.
// Without this, deleted videos leave behind "orphaned" references in these
// collections — documents that point to a Video that no longer exists.
// When Mongoose tries to .populate() those references it returns null,
// which causes the frontend to crash when it reads null.title / null._id etc.
const History = require("../models/History");
const Saved   = require("../models/Saved");

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
 * Permanently removes a video and all related user data from the database.
 * ADMIN ONLY – protected by `protect` + `adminOnly` middleware in the router.
 *
 * Why we clean up History and Saved:
 *   Both collections store a `video` field that references the Video's ObjectId.
 *   If we only delete the Video document and leave those references behind,
 *   Mongoose's .populate("video") will silently return null for each orphaned
 *   entry. The frontend then tries to read null.title, null._id, etc. and
 *   crashes — causing the history/saved pages to go completely blank.
 *   Deleting related documents here keeps the database consistent.
 */
exports.deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id; // the video's MongoDB _id from the URL

    // 1. Delete the Video document itself
    await Video.findByIdAndDelete(videoId);

    // 2. Remove every History entry that references this video.
    //    This covers ALL users who watched it — we don't want any user's
    //    history page to crash because they watched a now-deleted video.
    await History.deleteMany({ video: videoId });

    // 3. Remove every Saved entry that references this video.
    //    Same reason — prevents null-populate crashes on the saved page.
    await Saved.deleteMany({ video: videoId });

    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};