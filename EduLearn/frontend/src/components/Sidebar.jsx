// ─── Sidebar.jsx ─────────────────────────────────────────────────────────────
// The fixed left navigation sidebar shown on all authenticated pages.
//
// Responsibilities:
//   1. Renders a list of navigation links (Home, Notes, Saved, History…).
//   2. Conditionally shows an Admin link only for users with role "admin".
//   3. Accepts an `open` prop from AppLayout to slide in/out via CSS.
//   4. Highlights the currently active link using react-router-dom's NavLink.
//   5. Defines all navigation icons as small inline SVG components at the bottom.
// ─────────────────────────────────────────────────────────────────────────────

import { NavLink } from "react-router-dom";
// NavLink is like <Link> but it automatically adds an "active" class to itself
// when its `to` prop matches the current URL. We use this to highlight
// the current page in the sidebar.

import { useAuth } from "../context/AuthContext";
// useAuth → reads the logged-in user so we can check their role.

import "./Sidebar.css";
// Component-scoped CSS: sidebar layout, animation, item hover/active styles.


// ─── Navigation Link Definitions ─────────────────────────────────────────────

// NAV_TOP → main navigation links shown in the upper group.
// Each object has: to (URL path), label (display text), icon (React component).
const NAV_TOP = [
  { to: "/home",    label: "Home",    icon: HomeIcon },
  { to: "/notes",   label: "Notes",   icon: NotesIcon },
  { to: "/saved",   label: "Saved",   icon: SavedIcon },
  { to: "/history", label: "History", icon: HistoryIcon },
];

// NAV_BOTTOM → secondary links shown below the divider.
const NAV_BOTTOM = [
  { to: "/settings/account", label: "Settings", icon: SettingsIcon },
  { to: "/help",             label: "Help",     icon: HelpIcon },
  { to: "/about",            label: "About Us", icon: AboutIcon },
];
// Separating top and bottom items lets us render a visual divider between them
// and keep the two groups independently managed.


// ─── Sidebar Component ───────────────────────────────────────────────────────

export default function Sidebar({ open }) {
  // open → boolean from AppLayout.
  //   true  → sidebar is visible (slides in from the left).
  //   false → sidebar is hidden (slides off-screen to the left).

  const { user } = useAuth();
  // Read the current user from AuthContext.
  // We need user.role to conditionally render the Admin link.

  return (
    <aside className={`sidebar ${open ? "open" : "closed"}`}>
      {/* <aside> is the semantic HTML element for supplementary navigation.
          
          CSS class logic:
            open=true  → className = "sidebar open"
            open=false → className = "sidebar closed"
          
          In Sidebar.css:
            .sidebar        → position:fixed, width:270px, full-height panel.
            .sidebar.closed → transform: translateX(-100%) — slides off-screen left.
          The transition property on .sidebar animates the slide in/out smoothly. */}

      <nav className="sidebar-nav">
        {/* <nav> is the semantic HTML element for navigation landmarks.
            Screen readers and accessibility tools use it to announce
            "there's a navigation region here". */}

        {/* ── Top Navigation Group ──────────────────────────────────────── */}
        <div className="sidebar-group">

          {NAV_TOP.map(({ to, label, icon: Icon }) => (
            // .map() iterates over the NAV_TOP array and renders a NavLink for each item.
            // Destructuring: { to, label, icon: Icon } renames `icon` to `Icon`
            // (capital I) so it can be used as a JSX component: <Icon />.

            <NavLink
              key={to}
              // key={to} → React requires a unique "key" prop when rendering lists.
              // The URL path (to) is unique per item, so it works as the key.

              to={to}
              // Tells NavLink which URL this link navigates to.

              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
              // className can be a function in NavLink (unique to NavLink, not Link).
              // react-router-dom calls this function with { isActive: boolean }.
              // isActive is true when the current URL matches `to`.
              // Result:
              //   Current URL = /home → className = "sidebar-item active"
              //   Current URL = /notes → className = "sidebar-item"
            >
              <Icon />
              {/* Renders the SVG icon component (e.g. <HomeIcon />) for this item. */}

              <span>{label}</span>
              {/* Text label next to the icon, e.g. "Home", "Notes". */}
            </NavLink>
          ))}

          {/* ── Admin Link (conditional) ─────────────────────────────────── */}
          {user?.role === "admin" && (
            // user?.role → optional chaining in case user is null/undefined.
            // Only renders the Admin link if the logged-in user is an admin.
            // Regular users never see this link in the sidebar.
            // (The /admin route itself is also protected by ProtectedRoute in App.jsx.)
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              <AdminIcon />
              <span>Admin</span>
            </NavLink>
          )}
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="sidebar-divider" />
        {/* A thin horizontal line separating the main nav from the secondary nav.
            Styled in Sidebar.css as a 1px border in the --border colour. */}

        {/* ── Bottom Navigation Group ──────────────────────────────────────── */}
        <div className="sidebar-group">
          {NAV_BOTTOM.map(({ to, label, icon: Icon }) => (
            // Same pattern as NAV_TOP — iterate and render NavLinks.
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

      </nav>
    </aside>
  );
}


// ─── Icon Components ─────────────────────────────────────────────────────────
// Each is a tiny, pure functional component that renders an SVG icon.
// Keeping them in this file (rather than a separate icons file) is convenient
// since they're only used here.
//
// All icons share the same SVG attributes:
//   width/height="20"         → displayed at 20×20px.
//   viewBox="0 0 24 24"       → the icon's coordinate space is 24×24 units,
//                               scaled to fit the 20×20 display size.
//   fill="none"               → shapes are outlines, not filled.
//   stroke="currentColor"     → stroke colour is inherited from the parent's
//                               CSS colour (changes on hover/active automatically).
//   strokeWidth="2"           → medium-weight outline strokes.
//   strokeLinecap="round"     → line ends are rounded (softer look).
//   strokeLinejoin="round"    → corners where lines meet are rounded.


function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      {/* The roof and walls of the house shape. */}
      <polyline points="9 21 9 12 15 12 15 21"/>
      {/* The door in the centre of the house. */}
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      {/* Horizontal line at the bottom — the baseline of the pen stroke. */}
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      {/* The diagonal pencil/edit shape drawn across the icon. */}
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      {/* Outer circle — represents a "play" button or saved item indicator. */}
      <polygon points="10 8 16 12 10 16 10 8"/>
      {/* Triangle play button inside the circle. */}
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      {/* Arrow head of the circular refresh/history arrow. */}
      <path d="M20.49 15a9 9 0 1 1-.07-2.99"/>
      {/* The arc of the circular arrow — represents going back in time. */}
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      {/* The centre circle of the gear — represents the pivot point. */}
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      {/* The outer gear teeth — a complex path that forms the cog/sprocket shape
          by combining straight segments and curves at each tooth position. */}
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      {/* Outer circle — the "speech bubble" or indicator ring. */}
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      {/* The question mark curve at the top. */}
      <line x1="12" y1="17" x2="12.01" y2="17"/>
      {/* The dot at the bottom of the question mark.
          x2="12.01" instead of "12" makes it a visible dot with strokeLinecap="round". */}
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      {/* Front person's body/shoulders. */}
      <circle cx="9" cy="7" r="4"/>
      {/* Front person's head. */}
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      {/* Back person's body (partially visible). */}
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      {/* Back person's head arc. */}
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      {/* Rounded rectangle — represents a dashboard or panel. */}
      <path d="M10 8l6 4-6 4V8z"/>
      {/* Play-button triangle inside the panel — signifies control/admin access. */}
    </svg>
  );
}
