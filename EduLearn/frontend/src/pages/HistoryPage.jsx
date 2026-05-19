// ============================================================
// HistoryPage.jsx
// Displays the user's video watch history fetched from the API.
// Each history entry shows a video thumbnail, title, and the
// date it was watched. A per-item "⋮" dropdown menu lets users
// remove an item from history or save the video for later.
// A sidebar panel provides "Clear all History" functionality.
// ============================================================

// useEffect – runs side-effects (data fetching) after the component mounts.
// useState  – manages reactive state (history list, loading flag, open menu).
import { useEffect, useState } from "react";

// useNavigate – provides a function to navigate programmatically to
// a different route (e.g., clicking a history card goes to the video player).
import { useNavigate } from "react-router-dom";

// Shared page shell with nav bar, sidebar, and layout structure.
import AppLayout from "../components/AppLayout";

// Pre-configured Axios instance that sends the JWT auth token automatically.
import api from "../utils/api";

// CSS styles scoped to this page (two-column layout, history cards, etc.).
import "./HistoryPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: HistoryPage
// ──────────────────────────────────────────────────────────────
export default function HistoryPage() {
  // Array of history entry objects: { video: {...}, watchedAt: "ISO date" }
  const [history, setHistory] = useState([]);

  // True while the API fetch is in progress; used to show the spinner.
  const [loading, setLoading] = useState(true);

  // Tracks which video's dropdown menu is currently open.
  // Stores the video._id string, or null when all menus are closed.
  const [menuOpen, setMenuOpen] = useState(null);

  // Function to navigate to a different route.
  const navigate = useNavigate();

  // ── SIDE EFFECT: Load Watch History ──────────────────────
  // Runs once when the component mounts (empty [] dependency array).
  // Calls GET /history to retrieve the user's watch history entries
  // and stores them in state. The spinner is hidden once done.
  useEffect(() => {
    api.get("/history")
      .then((res) => setHistory(res.data.history)) // Store the history array on success
      .finally(() => setLoading(false));           // Always stop the loading indicator
  }, []);

  // ── HANDLER: Remove a single history entry ────────────────
  // Sends DELETE /history/:videoId to the backend, then removes
  // that entry from the local state to update the UI instantly.
  const remove = async (videoId) => {
    await api.delete(`/history/${videoId}`);
    // Filter out the deleted entry; compare by the nested video._id
    setHistory((p) => p.filter((h) => h.video._id !== videoId));
    setMenuOpen(null); // Close the dropdown menu after the action
  };

  // ── HANDLER: Clear all history ────────────────────────────
  // Sends DELETE /history/clear to wipe the user's full history on
  // the server, then empties the local state array to clear the UI.
  const clearAll = async () => {
    await api.delete("/history/clear");
    setHistory([]); // Set to empty array — no need to re-fetch
  };

  // ── HANDLER: Save a video for later ──────────────────────
  // Sends POST /saved with the videoId to add it to the user's
  // saved videos list. Closes the dropdown after saving.
  const saveVideo = async (videoId) => {
    await api.post("/saved", { videoId });
    setMenuOpen(null); // Close the dropdown after the action
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* Two-column layout: left = history list, right = sidebar actions */}
      <div className="history-layout page-inner">

        {/* ── LEFT COLUMN: Video History List ───────────────── */}
        <div className="history-left">
          <h1 className="page-title">History</h1>

          {loading ? (
            // CSS spinner shown while the API request is pending
            <div className="spinner-wrap"><div className="spinner" /></div>

          ) : history.length === 0 ? (
            // Empty state: shown when the user has no watch history yet
            <div className="empty-state">
              {/* Circular-arrow / reload SVG icon */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-.07-2.99"/>
              </svg>
              <h3>No watch history</h3>
              <p>Videos you watch will appear here.</p>
            </div>

          ) : (
            // Render the list of watched videos
            <div className="history-list">
              {/* Destructure each history entry into `video` and `watchedAt` */}
              {history.map(({ video, watchedAt }) => (
                // Clicking the card navigates the user to the video player page.
                // The entire card is clickable except the dropdown menu area.
                <div
                  key={video._id}
                  className="history-item card"
                  onClick={() => navigate(`/video/${video._id}`)} // Navigate on card click
                >
                  {/* Video thumbnail — falls back to YouTube's medium quality */}
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    className="history-thumb"
                  />

                  {/* Video title and the date it was watched */}
                  <div className="history-info">
                    <p className="history-title">{video.title}</p>
                    {/* Convert the ISO date string to a locale-friendly date */}
                    <p className="history-date">{new Date(watchedAt).toLocaleDateString()}</p>
                  </div>

                  {/* ── DROPDOWN MENU (⋮) ───────────────────── */}
                  {/* e.stopPropagation() prevents the card's onClick from
                      firing when the user clicks inside the menu area.     */}
                  <div className="history-menu" onClick={(e) => e.stopPropagation()}>

                    {/* Toggle button: opens or closes this video's dropdown.
                        If the menu is already open for this video, clicking
                        it again closes it (sets menuOpen back to null).    */}
                    <button
                      className="menu-dots"
                      onClick={() => setMenuOpen((p) => p === video._id ? null : video._id)}
                    >
                      ⋮
                    </button>

                    {/* Dropdown panel: only rendered when menuOpen matches this video's ID */}
                    {menuOpen === video._id && (
                      <div className="menu-dropdown">
                        {/* Remove item: deletes this entry from history */}
                        <button
                          style={{ color: "var(--red)" }} // Red text signals a destructive action
                          onClick={() => remove(video._id)}
                        >
                          Remove
                        </button>
                        {/* Save item: adds the video to the saved list */}
                        <button onClick={() => saveVideo(video._id)}>Save</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Sidebar Actions ─────────────────── */}
        <div className="history-right">
          <h3 className="history-side-title">Search History</h3>

          <div className="history-side-actions">

            {/* Clear all history button: wipes the entire history list */}
            <button className="history-action-btn" onClick={clearAll}>
              Clear all History
              {/* Trash-bin SVG icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>     {/* Top horizontal bar of bin */}
                <path d="M19 6l-1 14H6L5 6"/>         {/* Body of the bin */}
                <path d="M10 11v6"/>                   {/* Left inner line */}
                <path d="M14 11v6"/>                   {/* Right inner line */}
                <path d="M9 6V4h6v2"/>                 {/* Lid of the bin */}
              </svg>
            </button>

            {/* Pause Watch History button — currently a UI placeholder
                (no onClick handler is attached yet); future feature hook. */}
            <button className="history-action-btn">
              Pause Watch History
              {/* Two vertical bars (pause symbol) SVG icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6"  y="4" width="4" height="16"/> {/* Left pause bar */}
                <rect x="14" y="4" width="4" height="16"/> {/* Right pause bar */}
              </svg>
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
