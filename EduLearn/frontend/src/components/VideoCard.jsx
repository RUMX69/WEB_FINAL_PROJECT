// ─── VideoCard.jsx ───────────────────────────────────────────────────────────
// A reusable card component that displays a single video in a grid.
//
// Features:
//   - Thumbnail image with a play-button overlay that appears on hover.
//   - Title and category badge below the thumbnail.
//   - A three-dot (⋮) context menu with a Save / Unsave toggle button.
//   - Clicking the card (anywhere except the menu) navigates to the video page.
//   - The context menu closes automatically when the user clicks elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
// useState   → tracks whether the three-dot context menu is open or closed.
// useRef     → holds a reference to the menu DOM element so we can detect
//              clicks outside it (to auto-close the menu).
// useEffect  → registers and cleans up the global click listener.

import { useNavigate } from "react-router-dom";
// useNavigate → programmatically changes the URL when the card is clicked.

import api from "../utils/api";
// api → pre-configured HTTP client (Axios instance) that automatically
//       attaches the Authorization header with the stored JWT token.

import "./VideoCard.css";
// Scoped CSS for the card layout, thumbnail aspect ratio, menu, and badges.


export default function VideoCard({ video, onSave, onUnsave, isSaved }) {
  // Props:
  //   video   → the video object from the database, containing:
  //               _id, title, thumbnail, youtubeId, category, ...
  //   onSave  → optional callback fired after a video is saved successfully.
  //             The parent (HomePage, SavedPage, etc.) uses this to update
  //             its own list without needing to refetch from the API.
  //   onUnsave → optional callback fired after a video is un-saved.
  //   isSaved → boolean — true if this video is already in the user's saved list.
  //             Determines whether the menu shows "Save" or "Unsave".

  const [menuOpen, setMenuOpen] = useState(false);
  // menuOpen → tracks visibility of the three-dot dropdown menu.
  // false = hidden (default), true = visible.

  const navigate = useNavigate();
  // navigate(`/video/${id}`) → go to the video player page.

  const menuRef = useRef();
  // menuRef → a ref attached to the menu container <div>.
  // Refs give direct access to DOM elements without re-rendering.
  // We use it in the click-outside handler to check if a click landed
  // inside or outside the menu.


  // ─── Click-Outside Handler ──────────────────────────────────────────────
  useEffect(() => {
    const close = (e) => {
      // This function is called on EVERY mousedown event on the document.
      if (!menuRef.current?.contains(e.target)) {
        // menuRef.current → the actual DOM node of the menu container.
        // .contains(e.target) → returns true if the clicked element is
        //   inside the menu container (or IS the container itself).
        // So: if the click was OUTSIDE the menu → close it.
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    // Attach the listener to the entire document so clicks anywhere trigger it.
    // "mousedown" fires before "click", which prevents race conditions with
    // button onClick handlers.

    return () => document.removeEventListener("mousedown", close);
    // Cleanup function: removes the listener when the component unmounts.
    // Without cleanup, the listener would pile up every time a card re-renders,
    // causing memory leaks and stale-closure bugs.
  }, []);
  // [] → run this effect once on mount (and clean up on unmount).


  // ─── Thumbnail URL ───────────────────────────────────────────────────────
  const thumbnail =
    video.thumbnail ||
    `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  // Use the custom thumbnail URL stored in the database if one exists.
  // If not, fall back to YouTube's auto-generated high-quality thumbnail.
  // hqdefault.jpg → 480×360px "high quality default" thumbnail from YouTube.
  // This works for any YouTube video given its ID (no API key needed).


  // ─── Event Handlers ──────────────────────────────────────────────────────

  const handleClick = () => navigate(`/video/${video._id}`);
  // Navigate to the video player page when the card is clicked.
  // video._id → MongoDB document ID, used as the URL parameter.
  // The VideoPlayerPage reads this with useParams() and fetches the video.

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    // IMPORTANT: stop the click event from bubbling up to the parent <div>.
    // Without this, clicking "Save" in the menu would ALSO trigger handleClick
    // and navigate to the video page — not what we want.

    setMenuOpen(false);
    // Close the menu immediately after a menu action, regardless of outcome.

    if (isSaved) {
      // Video is currently saved → unsave it.
      await api.delete(`/saved/${video._id}`);
      // DELETE /saved/:videoId → server removes this video from the user's saved list.

      onUnsave?.(video._id);
      // onUnsave?.() → optional chaining: call onUnsave only if it was provided.
      // Passes the video ID so the parent can remove it from its local state.
    } else {
      // Video is not saved → save it.
      await api.post("/saved", { videoId: video._id });
      // POST /saved → server adds this video to the user's saved list.

      onSave?.(video._id);
      // Same pattern — notify the parent that this video is now saved.
    }
  };


  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="video-card" onClick={handleClick}>
      {/* video-card (VideoCard.css):
            - White card with border and rounded corners.
            - cursor: pointer — whole card is clickable.
            - hover: shadow deepens and card lifts slightly (translateY(-2px)). */}

      {/* ── Thumbnail Section ─────────────────────────────────────────────── */}
      <div className="video-card-thumb">
        {/* video-card-thumb → aspect-ratio: 16/9 — always maintains the 16:9
            widescreen proportion regardless of the card's width. */}

        <img src={thumbnail} alt={video.title} loading="lazy" />
        {/* loading="lazy" → the browser defers loading this image until it
            is about to scroll into the viewport. This is a performance
            optimisation — images off-screen aren't downloaded immediately,
            reducing initial page load bandwidth. */}

        <div className="play-overlay">
          {/* play-overlay → absolutely positioned over the thumbnail.
              opacity: 0 by default, transitions to 1 on .video-card:hover.
              This creates the "reveal play button on hover" effect. */}

          <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.5)" />
            {/* Semi-transparent black circle as the play button background. */}
            <polygon points="10 8 16 12 10 16 10 8" fill="white" />
            {/* White triangle (play icon) inside the circle.
                Points: top-left (10,8), right (16,12), bottom-left (10,16).
                Slightly offset to the right to look visually centred in the circle. */}
          </svg>
        </div>
      </div>

      {/* ── Info Section (below thumbnail) ───────────────────────────────── */}
      <div className="video-card-info">

        <div className="video-card-meta">
          {/* Flex row containing the title and the three-dot menu. */}

          <p className="video-card-title">{video.title}</p>
          {/* video-card-title → multi-line text clamped to 2 lines with:
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              Long titles are truncated with "…" after the second line. */}

          {/* ── Three-Dot Context Menu ───────────────────────────────────── */}
          <div className="video-card-menu" ref={menuRef}>
            {/* ref={menuRef} → attaches the DOM reference so the click-outside
                useEffect can check if clicks land inside this div. */}

            <button
              className="menu-dots"
              onClick={(e) => {
                e.stopPropagation();
                // Stop the click from bubbling to the card's onClick (handleClick).
                setMenuOpen((p) => !p);
                // Toggle the menu: if open → close, if closed → open.
                // Using the functional form (p) => !p reads the current state
                // reliably rather than relying on the captured value.
              }}
              aria-label="More options"
            >
              ⋮
              {/* The vertical three-dots character (Unicode U+22EE: VERTICAL ELLIPSIS).
                  A common convention for "more options" / context menus. */}
            </button>

            {menuOpen && (
              // Conditionally render the dropdown only when menuOpen is true.
              // When false, the element is completely removed from the DOM
              // (not just hidden), so it can't be tabbed to or interacted with.
              <div className="menu-dropdown">
                <button onClick={handleSaveToggle}>
                  {isSaved ? "Unsave" : "Save"}
                  {/* Toggle label: "Unsave" if already saved, "Save" if not. */}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Category Badge ───────────────────────────────────────────────── */}
        {video.category && (
          // Only render the badge if the video has a category set.
          <span className="video-category">{video.category}</span>
          // video-category → small pill badge with a light blue background,
          // showing the video's subject area (e.g. "Mathematics", "Science").
        )}

      </div>
    </div>
  );
}
