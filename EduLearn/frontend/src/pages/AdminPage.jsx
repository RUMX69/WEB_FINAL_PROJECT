// ============================================================
// AdminPage.jsx
// Admin-only page that lets administrators manage the video
// catalogue: add new videos, edit existing ones, and delete them.
// Non-admin users are immediately redirected to /home.
// ============================================================

// useEffect – runs side-effects (data fetching, redirects) after render.
// useState  – creates reactive state variables inside the component.
import { useEffect, useState } from "react";

// useNavigate – returns a function to programmatically navigate
// to a different route without a full page reload.
import { useNavigate } from "react-router-dom";

// Shared page shell: nav bar, sidebar, content area layout.
import AppLayout from "../components/AppLayout";

// Custom hook that provides the currently logged-in user object
// and related auth methods from the global AuthContext.
import { useAuth } from "../context/AuthContext";

// Pre-configured Axios instance that automatically includes the
// JWT auth token in every request header.
import api from "../utils/api";

// Page-scoped CSS styles.
import "./AdminPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: AdminPage
// ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  // Destructure the logged-in user object from authentication context.
  // `user` has properties like user.role, user.name, etc.
  const { user } = useAuth();

  // Function to programmatically redirect the user to a new route.
  const navigate = useNavigate();

  // ── STATE VARIABLES ────────────────────────────────────────
  // Array of video objects fetched from the API.
  const [videos, setVideos] = useState([]);

  // True while the initial list of videos is being fetched.
  const [loading, setLoading] = useState(true);

  // Controls whether the add/edit form card is visible.
  const [showForm, setShowForm] = useState(false);

  // Holds the video object being edited, or null when adding a new video.
  const [editVideo, setEditVideo] = useState(null);

  // True while the form submission request is in flight (prevents double-submit).
  const [saving, setSaving] = useState(false);

  // Stores an error message string to display in the form (empty = no error).
  const [error, setError] = useState("");

  // Stores a transient success message (auto-cleared after 3 seconds).
  const [success, setSuccess] = useState("");

  // ── FORM STATE ─────────────────────────────────────────────
  // Default/blank form field values used when opening the "Add" form.
  const emptyForm = { title: "", description: "", youtubeId: "", category: "", tags: "" };

  // Controlled form state – mirrors the input fields on screen.
  const [form, setForm] = useState(emptyForm);

  // ── SIDE EFFECT: Access Guard ──────────────────────────────
  // Runs whenever `user` or `navigate` changes.
  // If the user is logged in but is NOT an admin, redirect them
  // to the home page so they cannot access this admin panel.
  useEffect(() => {
    if (user && user.role !== "admin") navigate("/home");
  }, [user, navigate]);

  // ── SIDE EFFECT: Fetch Video List ─────────────────────────
  // Runs once when the component mounts (empty dependency array []).
  // Fetches all videos from the backend API and stores them in state.
  useEffect(() => {
    api.get("/videos")
      .then((res) => setVideos(res.data.videos))   // On success, store the videos array
      .catch(() => setVideos([]))                  // On error, default to an empty list
      .finally(() => setLoading(false));           // Always stop the loading spinner
  }, []);

  // ── HELPER: Generic Field Setter ──────────────────────────
  // Returns an onChange handler for a specific form field `f`.
  // Using a factory function avoids writing separate handlers for
  // each input field. Spread (...p) keeps all other fields intact.
  // Usage: <input onChange={set("title")} />
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // ── HELPER: Parse YouTube ID ──────────────────────────────
  // Accepts either a raw YouTube video ID (11 chars) or a full
  // YouTube URL and extracts just the video ID string.
  const parseYoutubeId = (input) => {
    input = input.trim(); // Remove leading/trailing whitespace

    // If the input already looks like a bare 11-character video ID
    // (alphanumeric + underscore + hyphen), return it as-is.
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

    // Otherwise treat it as a full URL and parse it with the URL API.
    try {
      const url = new URL(input);
      // For standard watch URLs: youtube.com/watch?v=ID → get the "v" param.
      // For short URLs: youtu.be/ID → get the last path segment.
      return url.searchParams.get("v") || url.pathname.split("/").pop();
    } catch {
      // If the URL constructor throws (malformed input), return as-is.
      return input;
    }
  };

  // ── HANDLER: Open "Add Video" Form ───────────────────────
  // Resets the form to blank and clears editVideo so the form
  // knows it is in "add" mode (not "edit" mode).
  const openAdd = () => {
    setEditVideo(null);     // No video being edited
    setForm(emptyForm);     // Clear all form fields
    setError("");           // Clear any previous error message
    setShowForm(true);      // Show the form card
  };

  // ── HANDLER: Open "Edit Video" Form ──────────────────────
  // Pre-fills the form with the selected video's current data
  // and sets editVideo so the submit handler knows to PATCH, not POST.
  const openEdit = (video) => {
    setEditVideo(video); // Remember which video is being edited
    setForm({
      title:       video.title,
      description: video.description || "",
      youtubeId:   video.youtubeId,
      category:    video.category || "",
      // Convert the tags array ["React","JS"] → "React, JS" for the text input
      tags:        video.tags?.join(", ") || "",
    });
    setError("");        // Clear previous errors
    setShowForm(true);   // Show the form card
  };

  // ── HANDLER: Form Submit (Add or Update) ─────────────────
  // Async function that either creates a new video (POST) or
  // updates an existing one (PUT) depending on `editVideo`.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default HTML form page-reload
    setError("");        // Clear previous error
    setSaving(true);     // Disable the submit button to prevent double-clicks

    // Normalize the YouTube ID from whatever the user typed.
    const youtubeId = parseYoutubeId(form.youtubeId);

    // Build the high-quality thumbnail URL using YouTube's image CDN.
    const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    // Convert the comma-separated tags string to a cleaned array,
    // filtering out any empty strings that result from trailing commas.
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    // Assemble the final payload to send to the backend.
    // Spread `form` first, then override youtubeId, thumbnail, and tags
    // with the processed values computed above.
    const payload = { ...form, youtubeId, thumbnail, tags };

    try {
      if (editVideo) {
        // ── UPDATE EXISTING VIDEO ──────────────────────────
        // Send a PUT request to the video's specific endpoint.
        const res = await api.put(`/videos/${editVideo._id}`, payload);
        // Replace the old video object in the local state array
        // with the updated version returned by the server.
        setVideos((p) => p.map((v) => v._id === editVideo._id ? res.data.video : v));
        setSuccess("Video updated!"); // Show success banner
      } else {
        // ── ADD NEW VIDEO ──────────────────────────────────
        const res = await api.post("/videos", payload);
        // Prepend the newly created video to the top of the list.
        setVideos((p) => [res.data.video, ...p]);
        setSuccess("Video added!"); // Show success banner
      }
      setShowForm(false); // Hide the form after a successful save
      // Auto-clear the success message after 3 seconds.
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Show the server's error message, or a generic fallback.
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false); // Re-enable the submit button regardless of outcome
    }
  };

  // ── HANDLER: Delete Video ─────────────────────────────────
  // Asks the user to confirm, then sends a DELETE request to the
  // API and removes the video from local state immediately.
  const handleDelete = async (id) => {
    // Native browser confirm dialog — stops accidental deletions.
    if (!window.confirm("Delete this video? This cannot be undone.")) return;
    await api.delete(`/videos/${id}`);
    // Filter the deleted video out of the local state so the UI
    // updates instantly without needing to re-fetch from the server.
    setVideos((p) => p.filter((v) => v._id !== id));
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="page-inner">

        {/* ── PAGE HEADER ───────────────────────────────────── */}
        {/* Flex row: title on the left, "Add Video" button on the right */}
        <div className="admin-header">
          <h1 className="page-title" style={{ textDecoration: "none", marginBottom: 0 }}>
            🎬 Admin — Manage Videos
          </h1>
          {/* Clicking this opens the blank "Add Video" form */}
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={openAdd}>
            + Add Video
          </button>
        </div>

        {/* ── SUCCESS BANNER ───────────────────────────────── */}
        {/* Only rendered when `success` state is non-empty */}
        {success && <div className="success-msg">{success}</div>}

        {/* ── ADD / EDIT FORM ──────────────────────────────── */}
        {/* Conditionally rendered: only shows when showForm is true */}
        {showForm && (
          <div className="admin-form-wrap card">
            {/* Dynamic title depending on mode */}
            <h2 className="admin-form-title">{editVideo ? "Edit Video" : "Add New Video"}</h2>

            {/* Show validation/server error if present */}
            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="admin-form">

              {/* ── ROW: Title + Category ─────────────────── */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Video Title *</label>
                  {/* Required field; set("title") updates form.title */}
                  <input
                    className="form-input"
                    placeholder="e.g. Introduction to React"
                    value={form.title}
                    onChange={set("title")}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  {/* Optional field for classifying the video */}
                  <input
                    className="form-input"
                    placeholder="e.g. Web Development"
                    value={form.category}
                    onChange={set("category")}
                  />
                </div>
              </div>

              {/* ── YouTube URL or ID ─────────────────────── */}
              <div className="form-group">
                <label className="form-label">YouTube URL or Video ID *</label>
                <input
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=xxxxx  or just  xxxxx"
                  value={form.youtubeId}
                  onChange={set("youtubeId")}
                  required
                />
                {/* Helper text below the input */}
                <span className="form-hint">Paste the full YouTube link or just the video ID</span>
              </div>

              {/* ── Description ──────────────────────────── */}
              <div className="form-group">
                <label className="form-label">Description</label>
                {/* Multi-line textarea for the video summary */}
                <textarea
                  className="form-input"
                  placeholder="Short description of the video..."
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                />
              </div>

              {/* ── Tags ─────────────────────────────────── */}
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                {/* Stored as a CSV string in the form; split into array on submit */}
                <input
                  className="form-input"
                  placeholder="e.g. React, JavaScript, Frontend"
                  value={form.tags}
                  onChange={set("tags")}
                />
              </div>

              {/* ── THUMBNAIL PREVIEW ────────────────────── */}
              {/* Only shown when the user has typed something in the YouTube ID field */}
              {form.youtubeId && (
                <div className="admin-preview">
                  <p className="form-label">Preview</p>
                  <img
                    // Construct the thumbnail URL live as the admin types
                    src={`https://img.youtube.com/vi/${parseYoutubeId(form.youtubeId)}/hqdefault.jpg`}
                    alt="thumbnail preview"
                    className="admin-thumb-preview"
                    // If the thumbnail URL is invalid (bad ID), hide the broken image
                    onError={(e) => e.target.style.display = "none"}
                  />
                </div>
              )}

              {/* ── FORM ACTIONS ─────────────────────────── */}
              <div className="admin-form-actions">
                {/* Submit button — label changes based on mode and saving state */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                  disabled={saving} // Disabled while the API call is in flight
                >
                  {saving ? "Saving..." : editVideo ? "Update Video" : "Add Video"}
                </button>
                {/* Cancel hides the form without saving */}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── VIDEO LIST ───────────────────────────────────── */}
        {loading ? (
          // Show a CSS spinner while the initial fetch is in progress
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : videos.length === 0 ? (
          // Empty state illustration when no videos exist yet
          <div className="empty-state">
            {/* Play-button icon inside a rounded rectangle */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="4"/>
              <path d="M10 8l6 4-6 4V8z"/>
            </svg>
            <h3>No videos yet</h3>
            <p>Click "Add Video" to embed your first YouTube video.</p>
          </div>
        ) : (
          // Render the list of existing videos, one row per video
          <div className="admin-video-list">
            {videos.map((video) => (
              // Each row is a card with: thumbnail | info | action buttons
              <div key={video._id} className="admin-video-row card">

                {/* Thumbnail image — falls back to YouTube's default quality
                    if a higher-res thumbnail isn't stored in the database */}
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/default.jpg`}
                  alt={video.title}
                  className="admin-video-thumb"
                />

                {/* Video metadata: title, category badge, YouTube ID, tags */}
                <div className="admin-video-info">
                  <p className="admin-video-title">{video.title}</p>
                  <p className="admin-video-meta">
                    {/* Only render the category span if a category exists */}
                    {video.category && <span className="video-category">{video.category}</span>}
                    <span className="admin-yt-id">ID: {video.youtubeId}</span>
                  </p>
                  {/* Only render tags if the video has at least one tag */}
                  {video.tags?.length > 0 && (
                    <p className="admin-tags">{video.tags.join(", ")}</p>
                  )}
                </div>

                {/* Action buttons for this video row */}
                <div className="admin-video-actions">
                  {/* Edit: pre-fills the form with this video's data */}
                  <button className="btn btn-outline" onClick={() => openEdit(video)}>Edit</button>
                  {/* Delete: confirms then removes from DB and local state */}
                  <button className="btn btn-danger" onClick={() => handleDelete(video._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
