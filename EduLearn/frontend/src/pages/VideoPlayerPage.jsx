// ============================================================
// VideoPlayerPage.jsx
// The core video-watching experience in EduLearn. Renders:
//   LEFT COLUMN
//     • Embedded YouTube player (via react-youtube)
//     • Video title, description, Save/Unsave button
//     • Q&A Forum: post questions, read and post answers
//   RIGHT COLUMN
//     • Smart Notes panel: timestamped notes tied to the
//       current playback position; supports adding and deleting
//
// Data loaded in parallel on mount:
//   • Video metadata  GET /videos/:id
//   • User's notes    GET /notes/:id
//   • Q&A entries     GET /qa/:id
//   • Saved status    GET /saved
//
// Watch history is logged automatically on open (POST /history).
// ============================================================

// useEffect – fetches all page data after mount.
// useState  – manages video, notes, Q&A, UI form states, etc.
// useRef    – holds a reference to the YouTube player instance so we
//             can call playerRef.current.getCurrentTime() at any moment.
import { useEffect, useState, useRef } from "react";

// useParams – reads the :id segment from the current route URL
// (e.g., /video/abc123 → id === "abc123").
import { useParams } from "react-router-dom";

// react-youtube – a React wrapper around the YouTube IFrame Player API.
// It renders an <iframe> and exposes the player instance via onReady.
import YouTube from "react-youtube";

// Shared page shell with nav bar and sidebar.
import AppLayout from "../components/AppLayout";

// Pre-configured Axios instance with JWT auth header.
import api from "../utils/api";

// Page-specific styles.
import "./VideoPlayerPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: VideoPlayerPage
// ──────────────────────────────────────────────────────────────
export default function VideoPlayerPage() {
  // Extract the video ID from the URL (route: /video/:id)
  const { id } = useParams();

  // The video metadata object: { _id, title, description, youtubeId, thumbnail }
  const [video, setVideo] = useState(null);

  // Array of note objects for this video:
  // [{ _id, content, timestamp, video }]
  const [notes, setNotes] = useState([]);

  // The text the user is currently typing in the "Save Note" textarea.
  const [noteText, setNoteText] = useState("");

  // Array of Q&A thread objects for this video:
  // [{ _id, question, answers: [{ _id, user, text }] }]
  const [qas, setQas] = useState([]);

  // Text the user is typing in the "Ask a question" textarea.
  const [question, setQuestion] = useState("");

  // Map of qaId → answer text for all open answer textareas.
  // Allows multiple answer boxes to be open simultaneously without
  // their text values colliding.
  const [answerInputs, setAnswerInputs] = useState({});

  // ID of the Q&A item whose answer form is currently expanded.
  // Only one answer form is shown at a time.
  const [answeringId, setAnsweringId] = useState(null);

  // True if the user has this video in their saved list.
  const [isSaved, setIsSaved] = useState(false);

  // True while the parallel data fetches are in progress.
  const [loading, setLoading] = useState(true);

  // Ref that holds the YouTube player instance once the <YouTube>
  // component fires its onReady callback. We use a ref (not state)
  // because changing it should NOT cause a re-render.
  const playerRef = useRef(null);

  // ── SIDE EFFECT: Fetch All Page Data ──────────────────────
  // Runs when the component mounts or when `id` changes (navigating
  // directly from one video page to another).
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fire all four requests concurrently for maximum efficiency.
        const [vRes, nRes, qRes, sRes] = await Promise.all([
          api.get(`/videos/${id}`),  // Video metadata
          api.get(`/notes/${id}`),   // This user's notes for the video
          api.get(`/qa/${id}`),      // Q&A threads for the video
          api.get("/saved"),         // Full saved list (to check saved status)
        ]);

        setVideo(vRes.data.video);    // Store video metadata
        setNotes(nRes.data.notes);    // Store notes array
        setQas(qRes.data.qas);        // Store Q&A array

        // Check whether this video's _id appears in the saved list.
        setIsSaved(sRes.data.saved.some((s) => s.video._id === id));

        // Record this video watch in the user's history (fire-and-forget).
        // .catch(() => {}) silences errors — history logging is non-critical.
        api.post("/history", { videoId: id }).catch(() => {});

      } catch (e) {
        console.error(e); // Log any unexpected error for debugging
      } finally {
        setLoading(false); // Stop the spinner regardless of outcome
      }
    };

    fetchData(); // Invoke the async fetcher
  }, [id]); // Re-run if the video ID in the URL changes

  // ── HELPER: Get Current Playback Time ────────────────────
  // Calls the YouTube player API to get the current time in seconds.
  // Returns 0 if the player isn't ready yet or if an error occurs.
  const getCurrentTime = () => {
    try {
      // playerRef.current is the YouTube player instance.
      // getCurrentTime() returns a float; Math.floor converts to integer seconds.
      return Math.floor(playerRef.current?.getCurrentTime() || 0);
    } catch {
      return 0; // Safe fallback if the player throws
    }
  };

  // ── HELPER: Format Seconds as [MM:SS] ────────────────────
  // Converts an integer number of seconds into a "[MM:SS]" string.
  // padStart(2, "0") ensures single-digit values have a leading zero.
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0"); // Minutes
    const s = (secs % 60).toString().padStart(2, "0");           // Remaining seconds
    return `[${m}:${s}]`;
  };

  // ── HANDLER: Save a Note ─────────────────────────────────
  // Captures the current playback timestamp, sends the note to the API,
  // then prepends the returned note object to the local notes array.
  const saveNote = async () => {
    if (!noteText.trim()) return; // Ignore empty or whitespace-only notes

    const timestamp = getCurrentTime(); // Snapshot of where the video is right now

    // POST /notes: body includes the video ID, note text, and timestamp.
    const res = await api.post("/notes", { videoId: id, content: noteText, timestamp });

    // Prepend the new note at the top of the list so the most recent
    // note is always visible without scrolling.
    setNotes((p) => [res.data.note, ...p]);

    setNoteText(""); // Clear the textarea after saving
  };

  // ── HANDLER: Delete a Note ────────────────────────────────
  // Sends DELETE /notes/:noteId, then removes the note from local state.
  const deleteNote = async (noteId) => {
    await api.delete(`/notes/${noteId}`);
    setNotes((p) => p.filter((n) => n._id !== noteId));
  };

  // ── HANDLER: Post a Question ──────────────────────────────
  // Sends the typed question to POST /qa and prepends the new Q&A
  // thread object to the top of the qas list.
  const postQuestion = async () => {
    if (!question.trim()) return; // Ignore empty questions

    const res = await api.post("/qa", { videoId: id, question });
    setQas((p) => [res.data.qa, ...p]); // Prepend the new Q&A thread
    setQuestion("");                     // Clear the question textarea
  };

  // ── HANDLER: Post an Answer ───────────────────────────────
  // Sends the typed answer for a specific Q&A thread to
  // PUT /qa/:qaId/answer. Updates only the matching Q&A item
  // in the local state, leaving all other threads unchanged.
  const postAnswer = async (qaId) => {
    const answer = answerInputs[qaId]; // Get the answer text for this specific thread
    if (!answer?.trim()) return;       // Ignore empty or missing answers

    // PUT /qa/:qaId/answer returns the updated Q&A object with the new answer appended.
    const res = await api.put(`/qa/${qaId}/answer`, { answer });

    // Map over all Q&A threads: replace the matching one with the updated version.
    setQas((p) => p.map((q) => (q._id === qaId ? { ...q, answers: res.data.qa.answers } : q)));

    // Clear only this thread's answer input, keeping others intact.
    setAnswerInputs((p) => ({ ...p, [qaId]: "" }));

    setAnsweringId(null); // Close the answer form
  };

  // ── HANDLER: Toggle Save / Unsave ────────────────────────
  // If the video is currently saved → DELETE /saved/:id (unsave).
  // If not saved → POST /saved (save it).
  // Updates local isSaved state for instant UI feedback.
  const toggleSave = async () => {
    if (isSaved) {
      await api.delete(`/saved/${id}`);
      setIsSaved(false);
    } else {
      await api.post("/saved", { videoId: id });
      setIsSaved(true);
    }
  };

  // ── LOADING / ERROR STATES ────────────────────────────────
  // Show a spinner while data is being fetched.
  if (loading) return <AppLayout><div className="spinner-wrap"><div className="spinner" /></div></AppLayout>;

  // Show a "not found" message if the API returned no video (bad ID, deleted, etc.)
  if (!video) return <AppLayout><div className="page-inner"><p>Video not found.</p></div></AppLayout>;

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* Two-column flex layout: video + Q&A on the left, notes on the right */}
      <div className="player-layout">

        {/* ══════════════════════════════════════════════════
            LEFT COLUMN
        ══════════════════════════════════════════════════ */}
        <div className="player-left">

          {/* ── YOUTUBE PLAYER ────────────────────────────── */}
          <div className="player-embed card">
            <YouTube
              videoId={video.youtubeId}  // The 11-char YouTube video ID
              opts={{
                width: "100%",
                height: "100%",
                playerVars: { rel: 0 },  // rel:0 hides related videos from other channels
              }}
              // onReady fires when the IFrame player is fully initialised.
              // We store the player instance in a ref for later use in getCurrentTime().
              onReady={(e) => { playerRef.current = e.target; }}
              className="yt-player"
            />
          </div>

          {/* ── VIDEO META INFO ───────────────────────────── */}
          <div className="player-meta">
            {/* Video title */}
            <h1 className="player-title">{video.title}</h1>

            {/* Description (only rendered if one exists in the DB) */}
            {video.description && <p className="player-desc">{video.description}</p>}

            {/* Save / Unsave toggle button.
                "saved" CSS class changes the button's appearance (filled icon, colour). */}
            <button className={`save-btn ${isSaved ? "saved" : ""}`} onClick={toggleSave}>
              {/* Circular play icon; fill changes based on saved state */}
              <svg
                width="16" height="16"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"} // Filled when saved
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              {/* Button label changes based on saved state */}
              {isSaved ? "Saved" : "Save Video"}
            </button>
          </div>

          {/* ── Q&A FORUM ─────────────────────────────────── */}
          <div className="qa-section card">
            <div className="qa-header">
              <h2>Q&A Forum</h2>
              <span className="badge">Community</span>
            </div>

            {/* Textarea for typing a new question */}
            <textarea
              className="form-input"
              placeholder="Ask a question about this lesson..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)} // Update question state on input
              rows={3}
            />

            {/* Post Question button: sends the question to the API */}
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: "10px" }}
              onClick={postQuestion}
            >
              Post Question
            </button>

            {/* ── Q&A THREAD LIST ───────────────────────── */}
            <div className="qa-list">
              {qas.map((qa) => (
                <div key={qa._id} className="qa-item">

                  {/* The original question text */}
                  <p className="qa-q"><strong>Q:</strong> {qa.question}</p>

                  {/* ── EXISTING ANSWERS ──────────────────── */}
                  {/* Only rendered when at least one answer exists */}
                  {qa.answers?.length > 0 && (
                    <div className="qa-answers-list">
                      {qa.answers.map((ans) => (
                        <p key={ans._id} className="qa-a">
                          {/* Show the answerer's name, or "User" as fallback */}
                          <strong>{ans.user?.name || "User"}:</strong> {ans.text}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* ── ANSWER FORM ───────────────────────── */}
                  {/* Shows the answer textarea only for the currently active Q&A item */}
                  {answeringId === qa._id ? (
                    <div className="qa-answer-form">
                      <textarea
                        className="form-input"
                        placeholder="Write your answer..."
                        // Controlled by the per-thread answerInputs map
                        value={answerInputs[qa._id] || ""}
                        onChange={(e) =>
                          // Update only this thread's entry in the answerInputs map
                          setAnswerInputs((p) => ({ ...p, [qa._id]: e.target.value }))
                        }
                        rows={2}
                      />
                      <div className="qa-answer-actions">
                        {/* Submit the typed answer to the API */}
                        <button
                          className="btn btn-primary qa-submit-answer"
                          onClick={() => postAnswer(qa._id)}
                        >
                          Submit Answer
                        </button>
                        {/* Cancel: collapse the answer form without submitting */}
                        <button className="btn-ghost" onClick={() => setAnsweringId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // "Answer" link shown when the form is not yet open for this Q.
                    // Clicking it sets answeringId to this qa._id which triggers the
                    // conditional above to render the textarea.
                    <button className="qa-reply-btn" onClick={() => setAnsweringId(qa._id)}>
                      {/* Reply/arrow-left SVG icon */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 17 4 12 9 7"/> {/* Arrow head pointing left */}
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/> {/* Arrow body curving right */}
                      </svg>
                      Answer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT COLUMN — Smart Notes Panel
        ══════════════════════════════════════════════════ */}
        <div className="player-right">
          <div className="notes-panel card">

            {/* Panel header with a "Timestamped" badge */}
            <div className="notes-header">
              <h2>Smart Notes</h2>
              <span className="badge">Timestamped</span>
            </div>

            {/* ── SAVED NOTES LIST ──────────────────────── */}
            <div className="notes-list">
              {notes.map((n) => (
                <div key={n._id} className="note-item">
                  {/* Timestamp badge: e.g. "[01:23]" */}
                  <span className="note-ts">{formatTime(n.timestamp)}</span>

                  {/* The note's text content */}
                  <span className="note-text">{n.content}</span>

                  {/* ✕ button: deletes this note */}
                  <button className="note-del" onClick={() => deleteNote(n._id)}>✕</button>
                </div>
              ))}

              {/* ── NEW NOTE TEXTAREA ──────────────────── */}
              <textarea
                className="form-input"
                placeholder="Write timestamped notes here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                // Keyboard shortcut: Ctrl+Enter saves the note without
                // needing to click the Save Note button.
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) saveNote(); }}
              />
            </div>

            {/* Save Note button: captures timestamp + sends note to API */}
            <button className="btn btn-primary" onClick={saveNote}>
              Save Note
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
