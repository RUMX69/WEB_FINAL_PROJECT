// ─── App.jsx ─────────────────────────────────────────────────────────────────
// The root component of the application.
// Responsibilities:
//   1. Wraps the whole app in AuthProvider so every component can access the
//      current logged-in user.
//   2. Sets up client-side routing with BrowserRouter + Routes.
//   3. Declares every URL path and which page component to render for it.
//   4. Protects private routes so only logged-in users can visit them.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// BrowserRouter → provides the routing context for the whole app.
//   Uses the HTML5 History API (pushState) so URLs look like real URLs
//   (e.g. /home) instead of hash URLs (e.g. /#/home).
// Routes → the container for all <Route> definitions. Only renders the
//   first child route whose path matches the current URL.
// Route → maps a URL path to a React component.
// Navigate → a component that immediately redirects the user to another URL.

import { AuthProvider } from "./context/AuthContext";
// AuthProvider is a React Context wrapper that:
//   - Holds the currently logged-in user object in state.
//   - Exposes login(), logout(), signup(), and updateUser() functions.
//   - Makes all of this available to any component via useAuth().

import ProtectedRoute from "./components/ProtectedRoute";
// ProtectedRoute is a special route wrapper that checks whether the user
// is logged in. If not, it redirects them to /login.
// If auth is still loading (checking the token), it shows a spinner.

import AdminPage from "./pages/AdminPage";
// The admin dashboard page, only accessible to users with role === "admin".

// ─── Page Imports ─────────────────────────────────────────────────────────────
// Each of these is a full-page React component rendered when the user
// navigates to the corresponding URL.

import SplashPage      from "./pages/SplashPage";
// The landing / marketing page shown at the root URL "/".
// Typically contains a hero section, call-to-action buttons, etc.

import LoginPage       from "./pages/LoginPage";
// The login form page at "/login".

import SignUpPage      from "./pages/SignUpPage";
// The registration form page at "/signup".

import HomePage        from "./pages/HomePage";
// The main dashboard after login at "/home".
// Shows a browsable/searchable grid of video courses.

import VideoPlayerPage from "./pages/VideoPlayerPage";
// The video player page at "/video/:id".
// ":id" is a URL parameter — the specific video's database ID.

import NotesPage       from "./pages/NotesPage";
// The notes page at "/notes" where users can write and manage notes.

import SavedPage       from "./pages/SavedPage";
// The saved/bookmarked videos page at "/saved".

import HistoryPage     from "./pages/HistoryPage";
// The watch history page at "/history".

import SettingsPage    from "./pages/SettingsPage";
// The settings page at "/settings/*".
// The /* wildcard means it handles nested routes like /settings/account,
// /settings/notifications, etc. (sub-routing handled inside SettingsPage itself).

import HelpPage        from "./pages/HelpPage";
// The help/FAQ page at "/help".

import AboutUsPage     from "./pages/AboutUsPage";
// The About Us page at "/about".

// ─── App Component ────────────────────────────────────────────────────────────

export default function App() {
  // export default → makes App the default export so main.jsx can import it
  // without curly braces: import App from "./App.jsx"

  return (
    <AuthProvider>
      {/* AuthProvider wraps everything so every page and component in the tree
          can call useAuth() to access user data and auth functions.
          It must be the outermost wrapper so nothing is rendered without auth. */}

      <BrowserRouter>
        {/* BrowserRouter provides the routing context.
            Any component inside can use hooks like useNavigate(), useParams(),
            and components like <NavLink>, <Navigate>, etc. */}

        <Routes>
          {/* Routes looks at the current URL and renders only the matching Route.
              It's like a switch statement for URLs. */}

          {/* ── Public Routes ──────────────────────────────────────────────────
              These routes are accessible WITHOUT being logged in. */}

          <Route path="/"       element={<SplashPage />} />
          {/* "/" is the root/home path — shows the splash/landing page. */}

          <Route path="/login"  element={<LoginPage />} />
          {/* "/login" shows the login form. */}

          <Route path="/signup" element={<SignUpPage />} />
          {/* "/signup" shows the registration form. */}

          {/* ── Protected Routes ───────────────────────────────────────────────
              The parent <Route element={<ProtectedRoute />}> acts as a guard.
              ProtectedRoute checks for a valid logged-in user.
              If the user IS logged in, it renders <Outlet />, which renders
              whichever child route matches the URL.
              If the user is NOT logged in, it redirects to /login. */}

          <Route element={<ProtectedRoute />}>

            <Route path="/home"       element={<HomePage />} />
            {/* The main video browse page after login. */}

            <Route path="/video/:id"  element={<VideoPlayerPage />} />
            {/* Video player — :id is a dynamic segment (e.g. /video/abc123).
                VideoPlayerPage reads this ID with useParams() to fetch the video. */}

            <Route path="/notes"      element={<NotesPage />} />
            {/* User's personal notes. */}

            <Route path="/saved"      element={<SavedPage />} />
            {/* User's saved/bookmarked videos. */}

            <Route path="/history"    element={<HistoryPage />} />
            {/* User's recently watched videos. */}

            <Route path="/settings/*" element={<SettingsPage />} />
            {/* Settings with nested routes (/* catches /settings/account, etc.). */}

            <Route path="/help"       element={<HelpPage />} />
            {/* Help / FAQ page. */}

            <Route path="/about"      element={<AboutUsPage />} />
            {/* About Us page. */}

            <Route path="/admin"      element={<AdminPage />} />
            {/* Admin dashboard — the sidebar only shows this link when
                user.role === "admin", but the route itself is still
                protected by ProtectedRoute (login required). */}

          </Route>

          {/* ── Catch-All (404) Route ───────────────────────────────────────────
              If the user visits any URL that doesn't match any route above,
              this rule fires and immediately redirects them to "/" (SplashPage).
              replace → replaces the history entry so the user can't click
              "Back" to return to the 404 URL. */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
