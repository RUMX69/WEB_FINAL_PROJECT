// ============================================================
// HomePage.jsx
// The main landing page of the EduLearn app after login.
// Fetches all available videos (optionally filtered by a search
// query from the URL) and displays them in a responsive grid
// of VideoCard components. It also fetches the user's saved
// videos to pass the correct "saved" state to each card.
// ============================================================

// useEffect – runs the data fetch logic after the component mounts
//             and whenever the search query changes.
// useState  – manages the videos list, saved set, and loading flag.
import { useEffect, useState } from "react";

// useSearchParams – reads the current URL query string.
// e.g. /home?search=React → searchParams.get("search") === "React"
import { useSearchParams } from "react-router-dom";

// Shared navigation / page shell wrapper.
import AppLayout from "../components/AppLayout";

// Reusable video card component that renders a single video with
// its thumbnail, title, and save/unsave functionality.
import VideoCard from "../components/VideoCard";

// Pre-configured Axios instance with JWT auth header injection.
import api from "../utils/api";

// CSS styles for the video grid layout and empty-state display.
import "./HomePage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: HomePage
// ──────────────────────────────────────────────────────────────
export default function HomePage() {
  // Array of video objects returned from the backend API.
  const [videos, setVideos] = useState([]);

  // A JavaScript Set of video IDs that the current user has saved.
  // Using a Set gives O(1) lookup when checking if a video is saved.
  const [saved, setSaved] = useState(new Set());

  // True while the API requests are in-flight; controls the spinner.
  const [loading, setLoading] = useState(true);

  // Read the ?search= query parameter from the current URL.
  // useSearchParams returns a URLSearchParams-like object.
  const [searchParams] = useSearchParams();

  // Extract the search term, defaulting to an empty string if absent.
  const search = searchParams.get("search") || "";

  // ── SIDE EFFECT: Fetch Videos + Saved List ────────────────
  // Re-runs whenever `search` changes (i.e., the user types in the
  // search bar and the URL query string updates).
  useEffect(() => {
    // Inner async function so we can use await inside useEffect.
    const fetchAll = async () => {
      setLoading(true); // Show the spinner before starting the requests

      try {
        // Fire both API requests in parallel with Promise.all for efficiency.
        // vRes – all videos, optionally filtered by the search term.
        // sRes – the user's current saved videos list.
        const [vRes, sRes] = await Promise.all([
          // Append ?search=... to the URL only when the user has typed something.
          api.get(`/videos${search ? `?search=${search}` : ""}`),
          api.get("/saved"),
        ]);

        // Store the fetched videos array.
        setVideos(vRes.data.videos);

        // Build a Set of saved video IDs for fast membership testing.
        // Each saved entry is { video: { _id, ... }, ... }, so we map
        // through the saved array to extract just the _id strings.
        setSaved(new Set(sRes.data.saved.map((s) => s.video._id)));

      } catch (e) {
        // Log any network/API error to the console for debugging.
        console.error(e);
        // State is left unchanged on error (keeps showing previous data or empty).
      } finally {
        setLoading(false); // Always hide the spinner when done
      }
    };

    fetchAll(); // Invoke the async fetch function
  }, [search]); // Re-run only when the search term changes

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="page-inner">

        {/* ── SEARCH RESULT LABEL ───────────────────────────── */}
        {/* Conditionally renders a "Results for: '...'" label
            only when the user has an active search query.        */}
        {search && (
          <p className="search-result-label">
            Results for: <strong>"{search}"</strong>
          </p>
        )}

        {/* ── CONTENT: Loading / Empty / Grid ──────────────── */}
        {loading ? (
          // CSS spinner while fetching data
          <div className="spinner-wrap"><div className="spinner" /></div>

        ) : videos.length === 0 ? (
          // Empty state when no videos match the query or none exist yet
          <div className="empty-state">
            {/* Rounded-rectangle with a play triangle icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="4"/>
              <path d="M10 8l6 4-6 4V8z"/>
            </svg>
            <h3>No videos found</h3>
            {/* Contextual hint: different message for search vs empty catalogue */}
            <p>{search ? "Try a different search term." : "No videos have been added yet."}</p>
          </div>

        ) : (
          // Responsive CSS grid of VideoCard components
          <div className="video-grid">
            {videos.map((v) => (
              <VideoCard
                key={v._id}           // Unique React key for list reconciliation

                video={v}             // Full video object (title, thumbnail, etc.)

                // Boolean: true if this video's ID is in the saved Set.
                isSaved={saved.has(v._id)}

                // Callback: called when the user saves a video.
                // Adds the new video ID to the Set (spread + new Set to keep immutability).
                onSave={(id) => setSaved((p) => new Set([...p, id]))}

                // Callback: called when the user unsaves a video.
                // Creates a new Set without the removed ID.
                onUnsave={(id) => setSaved((p) => {
                  const s = new Set(p); // Clone the existing Set
                  s.delete(id);         // Remove the unsaved video ID
                  return s;             // Return the updated Set
                })}
              />
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
