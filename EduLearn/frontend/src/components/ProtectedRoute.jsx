// ─── ProtectedRoute.jsx ──────────────────────────────────────────────────────
// A route guard component that prevents unauthenticated users from accessing
// any private/protected page.
//
// How it works inside React Router:
//   In App.jsx, all protected pages are nested as children of this route:
//
//     <Route element={<ProtectedRoute />}>
//       <Route path="/home" element={<HomePage />} />
//       <Route path="/notes" element={<NotesPage />} />
//       ...
//     </Route>
//
//   React Router renders the parent route's element (<ProtectedRoute />) first.
//   ProtectedRoute then decides what to render in place of <Outlet />:
//     - If still loading     → show a full-page spinner (avoid a flash redirect)
//     - If user is logged in → render <Outlet /> (the matched child route's page)
//     - If user is NOT logged in → redirect to /login
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, Outlet } from "react-router-dom";
// Navigate → a component that immediately redirects to another URL when rendered.
//            Using a component (not the navigate() function) is the correct way
//            to redirect during render in React Router v6.
// Outlet   → a placeholder rendered by the parent route where the matched
//            child route's element goes. Think of it as a "slot" for child pages.

import { useAuth } from "../context/AuthContext";
// useAuth → reads `user` and `loading` from the global AuthContext.


export default function ProtectedRoute() {

  const { user, loading } = useAuth();
  // user    → the logged-in user object, or null if not authenticated.
  // loading → true while AuthContext is still validating the stored JWT
  //           (the GET /auth/me request in the useEffect on mount).


  // ── Case 1: Still validating the stored token ──────────────────────────
  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "100vh" }}>
        {/* spinner-wrap (index.css) → flex container, centered content.
            minHeight: "100vh" → inline style ensures the spinner fills the
            entire screen height while auth is being checked. */}
        <div className="spinner" />
        {/* spinner (index.css) → circular CSS animation: a grey ring with
            a navy-coloured top arc that rotates 360° continuously.
            Styled with border + border-top-color + @keyframes spin. */}
      </div>
    );
    // WHY this matters: without this loading check, ProtectedRoute would
    // render BEFORE the /auth/me response comes back. At that moment user is null,
    // so it would redirect to /login even for a logged-in user.
    // The spinner buys time for the auth check to complete.
  }


  // ── Case 2: Auth check complete ────────────────────────────────────────
  return user
    ? <Outlet />
    // user is truthy (the user is logged in) →
    //   Render <Outlet />, which renders whichever child route matched the URL.
    //   e.g. if the URL is /home, the matched child is <HomePage />.

    : <Navigate to="/login" replace />;
    // user is null/falsy (not logged in) →
    //   Render <Navigate to="/login" /> which immediately redirects to the login page.
    //
    //   replace → replaces the current history entry instead of pushing a new one.
    //   This means clicking the browser's Back button won't take the user back
    //   to the protected URL they were denied — they go to the page before that.
    //   (Without replace, the history would be: ... → /home → /login,
    //    and Back would try /home again, causing another redirect loop.)
}
