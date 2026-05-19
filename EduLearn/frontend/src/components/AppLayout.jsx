// ─── AppLayout.jsx ───────────────────────────────────────────────────────────
// A shared layout wrapper used by every protected page (Home, Notes, Saved, etc.)
//
// Why does this exist?
//   Every authenticated page needs the same chrome: a top Navbar and a left
//   Sidebar. Rather than rendering <Navbar> and <Sidebar> inside every single
//   page component, we create one layout wrapper. Pages just render their own
//   unique content (passed as `children`), and the layout handles everything else.
//
// Structure produced by this component:
//
//   ┌──────────────────────────────────┐
//   │         Navbar (fixed top)       │
//   ├────────────┬─────────────────────┤
//   │  Sidebar   │   children (pages)  │
//   │  (fixed)   │   (scrollable)      │
//   └────────────┴─────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
// useState → React hook for managing the sidebar's open/closed state.

import Sidebar from "./Sidebar";
// The left navigation sidebar component.

import Navbar from "./Navbar";
// The top navigation bar component (contains the hamburger, search, and avatar).


export default function AppLayout({ children }) {
  // children → the page content passed between the opening and closing
  //            <AppLayout> tags in each page component, e.g.:
  //            <AppLayout>
  //              <div className="page-inner">...</div>
  //            </AppLayout>

  const [sidebarOpen, setSidebarOpen] = useState(true);
  // sidebarOpen → boolean tracking whether the sidebar is visible.
  // Default is true (open) so the sidebar is visible when a page first loads.
  // When false, the sidebar slides off-screen and the main content expands
  // to fill the full width.

  return (
    <div className="page-layout">
      {/* page-layout (from index.css) → display:flex, min-height:100vh.
          The sidebar and main content sit side by side in this flex container. */}

      <Navbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
      {/* Renders the fixed top navbar.
          onToggleSidebar is a callback prop — Navbar calls it when the user
          clicks the hamburger menu button.
          The callback flips sidebarOpen: (p) => !p
            where p is the previous state value.
          This is the safe way to toggle booleans in React; using
          !sidebarOpen directly might read a stale value in closures. */}

      <Sidebar open={sidebarOpen} />
      {/* Renders the left sidebar.
          open={sidebarOpen} → passes the current open/closed boolean down.
          Sidebar uses this prop to apply the "closed" CSS class, which
          triggers the translateX(-100%) transform to slide it off-screen. */}

      <main className={`main-content ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        {/* main-content (from index.css):
              - flex: 1          → fills remaining horizontal space.
              - margin-left: 270px → offsets for the sidebar width.
              - padding-top: 60px → offsets for the navbar height.

            sidebar-collapsed (from index.css):
              - margin-left: 0   → content stretches full-width when sidebar is hidden.

            Template literal conditionally adds the collapsed class:
              sidebarOpen is true  → className = "main-content "      (no extra class)
              sidebarOpen is false → className = "main-content sidebar-collapsed" */}

        {children}
        {/* Renders whatever the wrapping page passed as children.
            This is the page-specific content — e.g. the video grid on HomePage,
            the notes editor on NotesPage, etc. */}
      </main>
    </div>
  );
}
