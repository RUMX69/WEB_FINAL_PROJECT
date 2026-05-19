// ─── Navbar.jsx ──────────────────────────────────────────────────────────────
// The fixed top navigation bar shown on every authenticated page.
//
// Responsibilities:
//   1. Hamburger button → triggers the sidebar open/close toggle via a prop callback.
//   2. Logo → links back to the Home page.
//   3. Search form → navigates to /home with a ?search= query parameter.
//   4. Avatar button → navigates to the account settings page.
//      Shows the user's profile picture if they have one, or a generic icon.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
// useState → manages the live text typed into the search input field.

import { useNavigate } from "react-router-dom";
// useNavigate → returns a function that programmatically changes the URL,
// used here to navigate to the search results and settings pages.

import { useAuth } from "../context/AuthContext";
// useAuth → reads the current user from global AuthContext so we can
// display their avatar image (or a fallback icon if they have none).

import "./Navbar.css";
// Scoped CSS for this component — layout, hamburger animation, search bar, etc.


export default function Navbar({ onToggleSidebar }) {
  // onToggleSidebar → a callback function passed down from AppLayout.
  // Calling it flips the sidebar open/closed state in AppLayout.

  const [query, setQuery] = useState("");
  // query → the current value of the search text input.
  // Starts as an empty string.
  // Updated on every keystroke via the onChange handler below.

  const navigate = useNavigate();
  // navigate("/path") → changes the browser URL without a full page reload.

  const { user } = useAuth();
  // Destructure just `user` from the auth context.
  // user.avatar → URL of the profile picture (if set).
  // user.name   → used as the alt text on the avatar image.


  // ─── Search Handler ───────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    // Prevent the browser's default form submission behaviour
    // (which would cause a full page reload to the form's action URL).

    if (query.trim()) {
      // Only navigate if the search box isn't empty or just whitespace.
      // .trim() strips leading/trailing spaces before the check.

      navigate(`/home?search=${encodeURIComponent(query.trim())}`);
      // Navigate to /home with the search term in the URL query string.
      // encodeURIComponent → converts special characters so they're safe in URLs.
      //   e.g. "react hooks" → "react%20hooks"
      // The HomePage reads this ?search= parameter with useSearchParams()
      // and filters the video list accordingly.
    }
  };


  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <header className="navbar">
      {/* navbar (Navbar.css) → position:fixed, top:0, z-index:200, full-width.
          Fixed positioning keeps it visible even when the page is scrolled. */}

      {/* ── Left Section: Hamburger + Logo ── */}
      <div className="navbar-left">

        <button
          className="hamburger"
          onClick={onToggleSidebar}
          // Calls the toggle callback from AppLayout to show/hide the sidebar.
          aria-label="Toggle menu"
          // aria-label provides an accessible name for screen readers,
          // since the button has no visible text — only three <span> bars.
        >
          <span />
          <span />
          <span />
          {/* Three empty <span>s styled in CSS to look like a hamburger icon (☰).
              Each span is a horizontal line: width:20px, height:2px. */}
        </button>

        <a href="/home" className="navbar-logo">
          {/* Logo link — clicking it goes back to the Home page.
              Uses a plain <a> instead of <Link> to trigger a full navigation;
              this is acceptable here since the logo is a "home" anchor. */}

          <div className="logo-icon">
            {/* Navy square with rounded corners containing the stacked-layers SVG icon. */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Three stacked chevron lines — resembles a graduation cap or layers icon.
                  fill="white" makes the SVG strokes white against the navy background. */}
            </svg>
          </div>

          <span className="logo-text">EduLearn</span>
          {/* Brand name in the Sora font, navy colour (from Navbar.css). */}
        </a>
      </div>


      {/* ── Centre Section: Search Bar ── */}
      <form className="navbar-search" onSubmit={handleSearch}>
        {/* Using a <form> + onSubmit means the search triggers on both:
              - Pressing Enter in the input field.
              - Clicking the search button.
            Both fire the form's submit event. */}

        <input
          type="text"
          placeholder="Search"
          value={query}
          // Controlled input — its value is always driven by React state.
          onChange={(e) => setQuery(e.target.value)}
          // Update the `query` state on every keystroke.
          // e.target.value → the current text in the input field.
          className="search-input"
        />

        <button type="submit" className="search-btn" aria-label="Search">
          {/* type="submit" → clicking triggers the form's onSubmit handler. */}
          <svg
            width="18" height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            // currentColor inherits the text colour from CSS, making the icon
            // colour automatically update when hovered (see Navbar.css .search-btn:hover).
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            {/* The circle part of the magnifying glass — centred at (11, 11). */}
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            {/* The handle of the magnifying glass — diagonal line from (21,21). */}
          </svg>
        </button>
      </form>


      {/* ── Right Section: Avatar / Profile ── */}
      <div className="navbar-right">

        <button
          className="avatar-btn"
          onClick={() => navigate("/settings/account")}
          // Navigates to the account settings page when clicked.
          aria-label="Profile"
        >
          {user?.avatar ? (
            // Optional chaining: safely checks user?.avatar.
            // If the user has uploaded a profile picture, show it.
            <img src={user.avatar} alt={user.name} className="avatar-img" />
            // alt={user.name} is important for accessibility — describes the image
            // to screen readers and shows as text if the image fails to load.
          ) : (
            // No avatar → show a generic person/user SVG icon.
            <svg
              width="28" height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              {/* The shoulders/body part of the person icon. */}
              <circle cx="12" cy="7" r="4" />
              {/* The head of the person icon — a circle at the top. */}
            </svg>
          )}
        </button>

      </div>
    </header>
  );
}
