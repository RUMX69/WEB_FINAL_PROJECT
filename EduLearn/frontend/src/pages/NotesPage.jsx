// ============================================================
// NotesPage.jsx
// Displays all of the current user's timestamped notes,
// grouped by the video they were taken on. Features:
//   • Full-text search across note content and video titles
//   • Accordion-style expand/collapse per video group
//   • Inline editing of individual notes
//   • Delete individual notes
//   • Click a video thumbnail to jump to the video player
// ============================================================

// useEffect – fetches notes from the API when the component mounts.
// useState  – manages notes array, search text, UI state (expanded group,
//             editing note ID, edit text buffer), and the loading flag.
import { useEffect, useState } from "react";

// useNavigate – lets us programmatically go to the video player page
// when the user clicks a video's thumbnail inside a note group.
import { useNavigate } from "react-router-dom";

// Global page shell (nav bar + sidebar wrapper).
import AppLayout from "../components/AppLayout";

// Axios instance that includes the JWT auth token in every request.
import api from "../utils/api";

// Page-specific stylesheet.
import "./NotesPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: NotesPage
// ──────────────────────────────────────────────────────────────
export default function NotesPage() {
  // Full list of note objects fetched from the API.
  // Shape: [{ _id, content, timestamp, video: { _id, title, thumbnail, youtubeId } }]
  const [notes, setNotes] = useState([]);

  // Text the user has typed into the search bar.
  const [search, setSearch] = useState("");

  // ID of the currently expanded video group (or null = all collapsed).
  const [expanded, setExpanded] = useState(null);

  // ID of the note currently being edited (or null = no edit in progress).
  const [editing, setEditing] = useState(null);

  // Live text buffer for the note being edited in the inline textarea.
  const [editText, setEditText] = useState("");

  // True while the initial notes fetch is pending.
  const [loading, setLoading] = useState(true);

  // Programmatic navigation function.
  const navigate = useNavigate();

  // ── SIDE EFFECT: Load Notes ────────────────────────────────
  // Runs once on mount; fetches all of the user's notes.
  useEffect(() => {
    api.get("/notes")
      .then((res) => setNotes(res.data.notes)) // Store notes array on success
      .finally(() => setLoading(false));        // Always stop the spinner
  }, []);

  // ── COMPUTED: Filtered Notes ──────────────────────────────
  // Filter the full notes array client-side using the search text.
  // Matches against the note's content OR the video's title,
  // both compared case-insensitively.
  const filtered = notes.filter((n) =>
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.video?.title?.toLowerCase().includes(search.toLowerCase())
  );

  // ── HANDLER: Delete a Note ────────────────────────────────
  // Sends DELETE /notes/:id, then removes the note from local state.
  const deleteNote = async (id) => {
    await api.delete(`/notes/${id}`);
    // Replace the notes array with a copy that excludes the deleted note.
    setNotes((p) => p.filter((n) => n._id !== id));
  };

  // ── HANDLER: Save Edited Note ─────────────────────────────
  // Sends PUT /notes/:id with the updated content string.
  // On success, replaces the old note object in state with the
  // updated one returned by the server, then exits edit mode.
  const saveEdit = async (id) => {
    const res = await api.put(`/notes/${id}`, { content: editText });
    // Map over notes: replace the matching note, keep all others unchanged.
    setNotes((p) => p.map((n) => n._id === id ? res.data.note : n));
    setEditing(null); // Exit edit mode
  };

  // ── HELPER: Format Seconds to [MM:SS] ────────────────────
  // Converts a raw integer number of seconds into a timestamp string.
  // padStart(2, "0") ensures single-digit minutes/seconds get a leading zero.
  // e.g. 75 → "[01:15]"
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0"); // Minutes
    const s = (secs % 60).toString().padStart(2, "0");           // Remaining seconds
    return `[${m}:${s}]`;
  };

  // ── COMPUTED: Group Notes by Video ────────────────────────
  // Reduce the filtered notes array into an object keyed by video._id.
  // Each value is: { video: {...}, notes: [...] }
  // This allows rendering one accordion section per video.
  const grouped = filtered.reduce((acc, note) => {
    const vId = note.video?._id || "unknown"; // Fall back if video reference is missing
    if (!acc[vId]) {
      // First note for this video: initialise the bucket
      acc[vId] = { video: note.video, notes: [] };
    }
    acc[vId].notes.push(note); // Add this note to the video's bucket
    return acc;
  }, {}); // Start with an empty accumulator object

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="page-inner">

        {/* ── SEARCH BAR ─────────────────────────────────── */}
        <div className="notes-search-wrap">
          <div className="notes-search-bar">
            {/* Controlled text input: updates `search` on every keystroke,
                which re-computes `filtered` and `grouped` automatically.  */}
            <input
              type="text"
              placeholder="Search Notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
            {/* Magnifying-glass SVG icon overlaid on the right of the input */}
            <svg
              className="search-icon"
              width="16" height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/> {/* The magnifying-glass circle */}
              <line x1="21" y1="21" x2="16.65" y2="16.65"/> {/* The handle */}
            </svg>
          </div>
        </div>

        {/* ── CONTENT: Loading / Empty / Groups ────────────── */}
        {loading ? (
          // Spinner while notes are being fetched
          <div className="spinner-wrap"><div className="spinner" /></div>

        ) : Object.keys(grouped).length === 0 ? (
          // Empty state: shown when there are no notes (or search matches nothing)
          <div className="empty-state">
            {/* Pencil/edit SVG icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <h3>No notes yet</h3>
            <p>Start watching videos and take timestamped notes.</p>
          </div>

        ) : (
          // Render one accordion card per video group
          <div className="notes-groups">
            {Object.values(grouped).map(({ video, notes: vNotes }) => (
              <div key={video?._id} className="note-group card">

                {/* ── GROUP HEADER (click to expand/collapse) ── */}
                <div
                  className="note-group-header"
                  // Toggle: if this group is already expanded, collapse it;
                  // otherwise, set it as the expanded group.
                  onClick={() => setExpanded((p) => p === video?._id ? null : video?._id)}
                >
                  <div className="note-group-info">

                    {/* Video thumbnail (only rendered if a thumbnail URL exists) */}
                    {video?.thumbnail && (
                      <img
                        src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/default.jpg`}
                        alt=""
                        className="note-group-thumb"
                        // Clicking the thumbnail navigates to the video player page.
                        // stopPropagation prevents the accordion toggle from firing.
                        onClick={(e) => { e.stopPropagation(); navigate(`/video/${video._id}`); }}
                      />
                    )}

                    {/* Video title, or a fallback if the video reference is missing */}
                    <span className="note-group-title">{video?.title || "Unknown video"}</span>

                    {/* Note count badge: "1 note" vs "3 notes" */}
                    <span className="note-count">
                      {vNotes.length} note{vNotes.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Chevron arrow button: rotates 180° via CSS when the
                      group is expanded (the "open" class is applied).      */}
                  <button className={`collapse-btn ${expanded === video?._id ? "open" : ""}`}>
                    {/* Down-arrow SVG chevron */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                </div>

                {/* ── GROUP BODY (shown only when this group is expanded) ── */}
                {expanded === video?._id && (
                  <div className="note-group-body">
                    {vNotes.map((note) => (
                      <div key={note._id} className="note-row">

                        {editing === note._id ? (
                          // ── EDIT MODE ──────────────────────────────────
                          // Shown when this specific note is being edited.
                          <div className="note-edit-row">
                            {/* Multi-line textarea pre-filled with current note text */}
                            <textarea
                              className="form-input"
                              value={editText}                        // Controlled by editText state
                              onChange={(e) => setEditText(e.target.value)} // Update buffer on change
                              rows={3}
                            />
                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                              {/* Save button: sends the updated text to the API */}
                              <button
                                className="btn btn-primary"
                                style={{ width: "auto", padding: "7px 16px" }}
                                onClick={() => saveEdit(note._id)}
                              >
                                Save
                              </button>
                              {/* Cancel button: exits edit mode without saving */}
                              <button className="btn btn-outline" onClick={() => setEditing(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>

                        ) : (
                          // ── READ MODE ──────────────────────────────────
                          // Normal display: timestamp tag + note text + action buttons
                          <>
                            {/* Green timestamp badge, e.g. "[02:35]" */}
                            <span className="note-ts-tag">{formatTime(note.timestamp)}</span>

                            {/* The note's text content */}
                            <span className="note-body">{note.content}</span>

                            {/* Delete and Edit action buttons for this note */}
                            <div className="note-actions">
                              <button className="btn-danger" onClick={() => deleteNote(note._id)}>
                                Delete
                              </button>
                              <button
                                className="btn-outline"
                                onClick={() => {
                                  setEditing(note._id);     // Mark this note as being edited
                                  setEditText(note.content); // Pre-fill the edit buffer
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
