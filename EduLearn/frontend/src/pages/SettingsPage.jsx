// ============================================================
// SettingsPage.jsx
// Settings page with two sub-sections accessible via a sidebar:
//   • Account – change username, avatar, bio; logout
//   • Theme   – toggle light/dark mode
//
// Uses React Router nested routes so the URL reflects the active
// settings panel (e.g. /settings/account, /settings/theme).
// Sub-components defined in this file:
//   AvatarPickerModal – modal grid for choosing a profile avatar
//   SettingsLayout    – sidebar nav + content area wrapper
//   AccountPanel      – account form and avatar editing UI
//   ThemePanel        – light/dark toggle
// ============================================================

// useState – manages local form state, avatar URL, modal visibility,
//            saved/error messages, and the theme toggle flag.
import { useState } from "react";

// NavLink  – like <Link> but adds an "active" class when its href
//            matches the current route (used for the sidebar links).
// Routes, Route – define the nested route structure inside the page.
// Navigate – redirects the user to a default sub-route.
import { NavLink, Routes, Route, Navigate } from "react-router-dom";

// Shared page shell with global navigation.
import AppLayout from "../components/AppLayout";

// useAuth – provides the current user object and auth helpers
// (logout, updateUser) from the global AuthContext.
import { useAuth } from "../context/AuthContext";

// Pre-configured Axios instance with JWT auth header.
import api from "../utils/api";

// Page-specific styles.
import "./SettingsPage.css";

// ──────────────────────────────────────────────────────────────
// AVATAR OPTIONS
// A static list of public avatar image paths (served from the
// project's /public/avatars/ folder). Adding more avatars only
// requires dropping files there and extending this array.
// ──────────────────────────────────────────────────────────────
const AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
  "/avatars/avatar9.png",
  "/avatars/avatar10.png",
];

// ──────────────────────────────────────────────────────────────
// SUB-COMPONENT: AvatarPickerModal
// A full-screen modal overlay that shows a grid of avatar options.
// The user clicks one to select it (pending state), then clicks
// "Apply avatar" to confirm and close the modal.
//
// Props:
//   currentAvatar – the URL of the user's current avatar (pre-selected)
//   onSelect(url) – callback invoked with the chosen avatar URL
//   onClose()     – callback to close/unmount the modal
// ──────────────────────────────────────────────────────────────
function AvatarPickerModal({ currentAvatar, onSelect, onClose }) {
  // `pending` tracks which avatar the user has clicked on inside
  // the modal but has not yet confirmed with "Apply avatar".
  // Initialised to the user's current avatar so it's pre-highlighted.
  const [pending, setPending] = useState(currentAvatar || null);

  return (
    // Semi-transparent backdrop: clicking it closes the modal
    <div className="avatar-modal-backdrop" onClick={onClose}>

      {/* Modal card: stopPropagation prevents clicks inside from
          bubbling to the backdrop and accidentally closing the modal */}
      <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>

        {/* Modal header: title + close (✕) button */}
        <div className="avatar-modal-header">
          <h3>Choose your avatar</h3>
          <button className="avatar-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Short instruction text */}
        <p className="avatar-modal-sub">Pick one to use as your profile picture</p>

        {/* Grid of clickable avatar options */}
        <div className="avatar-picker-grid">
          {AVATARS.map((url, i) => (
            <div
              key={i}
              // "selected" CSS class highlights the currently pending avatar
              className={`avatar-picker-option ${pending === url ? "selected" : ""}`}
              onClick={() => setPending(url)} // Mark this avatar as the pending selection
            >
              {/* Avatar thumbnail image */}
              <img src={url} alt={`Avatar option ${i + 1}`} />

              {/* Checkmark overlay: only shown on the currently pending avatar */}
              {pending === url && <span className="avatar-check">✓</span>}
            </div>
          ))}
        </div>

        {/* Modal footer: cancel or apply the selection */}
        <div className="avatar-modal-footer">
          {/* Cancel: close without changing the avatar */}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>

          {/* Apply: call onSelect with the pending avatar URL, then close */}
          <button
            className="btn btn-primary"
            onClick={() => { onSelect(pending); onClose(); }}
          >
            Apply avatar
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SUB-COMPONENT: SettingsLayout
// A two-column layout: a fixed sidebar on the left for navigation
// links, and a flexible content area on the right for the active panel.
//
// Props:
//   children – the active settings panel rendered by the router
// ──────────────────────────────────────────────────────────────
function SettingsLayout({ children }) {
  return (
    <div className="settings-layout">

      {/* ── SIDEBAR NAV ────────────────────────────────────── */}
      <aside className="settings-sidebar">

        {/* Account link: NavLink automatically adds class "active"
            when the current URL is /settings/account              */}
        <NavLink
          to="/settings/account"
          className={({ isActive }) => `settings-link ${isActive ? "active" : ""}`}
        >
          {/* Person/silhouette SVG icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/> {/* Body */}
            <circle cx="12" cy="7" r="4"/>                          {/* Head */}
          </svg>
          Account
        </NavLink>

        {/* Theme link: active when URL is /settings/theme */}
        <NavLink
          to="/settings/theme"
          className={({ isActive }) => `settings-link ${isActive ? "active" : ""}`}
        >
          {/* Pencil/edit SVG icon (representing appearance customisation) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Theme
        </NavLink>
      </aside>

      {/* ── CONTENT AREA ────────────────────────────────────── */}
      {/* The active panel (AccountPanel or ThemePanel) is rendered here */}
      <div className="settings-content">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SUB-COMPONENT: AccountPanel
// Lets the user update their display name, avatar, and bio.
// Also provides a Logout button.
// ──────────────────────────────────────────────────────────────
function AccountPanel() {
  // Pull the current user, logout function, and updateUser helper
  // from the global authentication context.
  const { user, logout, updateUser } = useAuth();

  // Form state: name (editable) and bio (editable).
  // Pre-filled with the user's current name from context.
  const [form, setForm] = useState({ name: user?.name || "", bio: "" });

  // Current avatar URL (starts as whatever is stored in the user profile).
  const [avatar, setAvatar] = useState(user?.avatar || "");

  // Controls whether the AvatarPickerModal is visible.
  const [showPicker, setShowPicker] = useState(false);

  // True for 2.5 seconds after a successful save to show the success banner.
  const [saved, setSaved] = useState(false);

  // Stores a server-side error message if the profile update fails.
  const [error, setError] = useState("");

  // Generic field setter factory: returns an onChange handler for field `f`.
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  // ── HANDLER: Save Profile Changes ────────────────────────
  const handleSave = async (e) => {
    e.preventDefault(); // Prevent default form page reload
    setError("");        // Clear previous errors

    try {
      // Send updated name and avatar to the backend.
      const res = await api.put("/users/profile", { name: form.name, avatar });
      // Update the global user object in AuthContext so the nav
      // bar and other components reflect the change immediately.
      updateUser(res.data.user);
      setSaved(true);
      // Auto-hide the success message after 2.5 seconds.
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="settings-panel">

      {/* ── AVATAR SECTION ───────────────────────────────── */}
      <div className="account-avatar-wrap">
        <div className="account-avatar">
          {/* Render either the avatar image or a fallback SVG silhouette */}
          {avatar
            ? <img src={avatar} alt="Profile avatar" />
            : (
              // Default person icon when no avatar has been set
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )
          }

          {/* Small pencil button overlaid on the avatar to open the picker */}
          <button className="avatar-edit-btn" onClick={() => setShowPicker(true)}>
            {/* Tiny edit/pencil SVG icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Error / success banners */}
      {error && <div className="error-msg" style={{ marginBottom: "14px" }}>{error}</div>}
      {saved && <div className="success-msg">Profile updated!</div>}

      {/* ── PROFILE FORM ─────────────────────────────────── */}
      <form onSubmit={handleSave} className="account-form">

        {/* Username field: editable */}
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" value={form.name} onChange={set("name")} />
        </div>

        {/* Email field: read-only (cannot be changed from this form) */}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            value={user?.email || ""}
            disabled                   // Prevent editing
            style={{ opacity: 0.6 }}   // Visual cue that this field is disabled
          />
        </div>

        {/* Bio field: multi-line textarea */}
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea className="form-input" value={form.bio} onChange={set("bio")} rows={3} />
        </div>

        {/* Submit button */}
        <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "10px 28px" }}>
          Save Changes
        </button>
      </form>

      {/* Logout button: calls the AuthContext logout() which clears the
          JWT token from localStorage and redirects to the login page. */}
      <button className="logout-btn" onClick={logout}>Log Out</button>

      {/* Avatar picker modal: conditionally rendered when showPicker is true */}
      {showPicker && (
        <AvatarPickerModal
          currentAvatar={avatar}
          // When confirmed, update the local avatar state
          onSelect={(url) => setAvatar(url)}
          // Hide the modal
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SUB-COMPONENT: ThemePanel
// Renders a toggle switch that flips the application between
// light mode and dark mode. Persists the preference to the backend
// and updates the <html> data-theme attribute for instant effect.
// ──────────────────────────────────────────────────────────────
function ThemePanel() {
  // Pull user object and updateUser from context.
  const { user, updateUser } = useAuth();

  // `isDark` is true when the current theme is "dark".
  // Initialised from the user's stored theme preference.
  const [isDark, setIsDark] = useState((user?.theme || "light") === "dark");

  // ── HANDLER: Toggle Theme ─────────────────────────────────
  const handleToggle = async () => {
    const newTheme = isDark ? "light" : "dark"; // Flip the current theme
    setIsDark(!isDark); // Optimistically update local state for instant UI feedback

    // Apply the theme immediately by setting the data-theme attribute on <html>.
    // CSS variables in the global stylesheet react to this attribute.
    document.documentElement.setAttribute("data-theme", newTheme === "dark" ? "dark" : "");

    try {
      // Persist the new theme preference to the backend so it survives page reloads.
      const res = await api.put("/users/settings", { theme: newTheme });
      updateUser(res.data.user); // Update the user object in global context
    } catch (e) {
      console.error(e); // Log any persistence error (UI has already updated optimistically)
    }
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="settings-panel">
      <h2 className="settings-section-title">Appearance</h2>
      <div className="theme-options">
        <div className="theme-row">
          <span>Light / Dark Mode</span>

          {/* Custom CSS toggle switch:
              - "active" class moves the thumb to the right (dark mode)
              - Clicking anywhere on the track fires handleToggle        */}
          <div
            className={`toggle-switch ${isDark ? "active" : ""}`}
            onClick={handleToggle}
          >
            {/* The circular thumb that slides left/right */}
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT: SettingsPage
// The exported default component. Wraps everything in AppLayout
// and SettingsLayout, then uses nested React Router routes to
// render the correct panel (Account or Theme) based on the URL.
// ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <AppLayout>
      <SettingsLayout>
        {/* Nested routes: the URL suffix determines which panel renders */}
        <Routes>
          {/* Index route: redirect bare /settings to /settings/account */}
          <Route index element={<Navigate to="account" replace />} />

          {/* /settings/account → AccountPanel */}
          <Route path="account" element={<AccountPanel />} />

          {/* /settings/theme → ThemePanel */}
          <Route path="theme" element={<ThemePanel />} />
        </Routes>
      </SettingsLayout>
    </AppLayout>
  );
}
