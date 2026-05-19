// ============================================================
// SavedPage.jsx
// Displays the list of videos the currently logged-in user has
// bookmarked/saved for later viewing. Fetches saved entries from
// the API on mount and renders them in the same responsive grid
// used by the Home page. Supports unsaving (removing a bookmark)
// via a callback prop passed down to each VideoCard.
// ============================================================

// useEffect – runs the data fetch after the component first renders.
// useState  – manages the saved-videos list and the loading flag.
import { useEffect, useState } from "react";

// Shared navigation shell that wraps every authenticated page.
import AppLayout from "../components/AppLayout";

// Reusable card component that renders a single video with its
// thumbnail, title, save/unsave button, and navigation link.
import VideoCard from "../components/VideoCard";

// Pre-configured Axios instance that automatically attaches the
// user's JWT token to every outgoing request.
import api from "../utils/api";

// Note: No dedicated CSS import — this page reuses global utility
// classes (page-inner, spinner-wrap, empty-state, video-grid, etc.)
// defined in the global stylesheet.

// ──────────────────────────────────────────────────────────────
// COMPONENT: SavedPage
// ──────────────────────────────────────────────────────────────
export default function SavedPage() {
  // Array of saved-video entries fetched from the API.
  // Each entry has the shape: { _id, video: { _id, title, thumbnail, youtubeId, ... } }
  const [saved, setSaved] = useState([]);

  // True while the initial API fetch is in progress; shows the spinner.
  const [loading, setLoading] = useState(true);

  // ── SIDE EFFECT: Fetch Saved Videos ──────────────────────
  // Runs once on mount (empty [] dependency array).
  // GET /saved returns all of the user's bookmarked videos.
  useEffect(() => {
    api.get("/saved")
      .then((res) => setSaved(res.data.saved)) // Store the saved array on success
      .finally(() => setLoading(false));        // Always stop the loading indicator
  }, []);

  // ── HANDLER: Unsave a Video ───────────────────────────────
  // Called by VideoCard's onUnsave prop after the API call succeeds.
  // Filters out the unsaved entry from local state so the grid
  // updates instantly without re-fetching from the server.
  // `videoId` – the _id of the video (not the saved-entry _id).
  const handleUnsave = (videoId) => {
    setSaved((p) => p.filter((s) => s.video._id !== videoId));
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="page-inner">

        {/* Page heading */}
        <h1 className="page-title">Saved</h1>

        {/* ── CONTENT: Loading / Empty / Grid ──────────────── */}
        {loading ? (
          // Spinning loader shown while the fetch is pending
          <div className="spinner-wrap"><div className="spinner" /></div>

        ) : saved.length === 0 ? (
          // Empty state: shown when the user has no saved videos yet
          <div className="empty-state">
            {/* Circle with a play-triangle icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>    {/* Outer circle */}
              <polygon points="10 8 16 12 10 16 10 8"/> {/* Play triangle */}
            </svg>
            <h3>No saved videos</h3>
            <p>Save videos to watch them later.</p>
          </div>

        ) : (
          // Responsive grid of saved video cards
          <div className="video-grid">
            {/* Destructure each saved entry to access just the `video` object */}
            {saved.map(({ video }) => (
              <VideoCard
                key={video._id}   // Unique React key for efficient list diffing

                video={video}     // Full video data (title, thumbnail, youtubeId…)

                isSaved={true}    // All videos on this page are by definition saved

                // When the user unsaves from within VideoCard, update local state.
                // VideoCard is responsible for calling the DELETE /saved/:id API;
                // this callback just handles the local state update.
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
