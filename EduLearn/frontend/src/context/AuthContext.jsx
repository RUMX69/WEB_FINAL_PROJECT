// ─── AuthContext.jsx ─────────────────────────────────────────────────────────
// Provides global authentication state to the entire React component tree.
//
// What is React Context?
//   Context is React's built-in solution for "global" state — data that many
//   components at different nesting levels need to read or change. Without
//   Context you'd have to pass props through every intermediate component
//   (called "prop drilling"), which becomes messy in a real app.
//
// What this file does:
//   1. Creates an AuthContext object.
//   2. Exports AuthProvider — a wrapper component that stores the user state
//      and exposes auth actions (login, logout, signup).
//   3. Exports useAuth — a custom hook that any component can call to read
//      the current user or trigger auth actions.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
// createContext → factory function that creates a new Context object.
// useContext    → hook that reads the value provided by the nearest matching
//                 Provider component above it in the tree.
// useState      → hook to store reactive data (re-renders when updated).
// useEffect     → hook to run side effects (API calls, DOM changes) after render.

import api from "../utils/api";
// "api" is likely an Axios instance (or similar) pre-configured with:
//   - The backend base URL so you don't repeat it on every call.
//   - An Authorization header interceptor that attaches the JWT token
//     from localStorage to every outgoing request automatically.


// ─── 1. Create the Context ───────────────────────────────────────────────────

const AuthContext = createContext(null);
// Creates the AuthContext with a default value of null.
// The default value is only used if a component calls useAuth() without
// an AuthProvider above it in the tree (shouldn't happen in a correctly
// structured app, but null makes bugs obvious).


// ─── 2. AuthProvider Component ───────────────────────────────────────────────

export function AuthProvider({ children }) {
  // children → everything wrapped inside <AuthProvider> in App.jsx
  //            (the entire BrowserRouter + Routes tree).

  const [user, setUser] = useState(null);
  // user → the currently logged-in user object, e.g.:
  //   { _id, name, email, role, avatar, theme }
  // Starts as null (not logged in).
  // Every time setUser is called, all components that read user via useAuth()
  // will re-render automatically.

  const [loading, setLoading] = useState(true);
  // loading → true while we are checking whether the user is already logged in
  //           (i.e. validating the stored token on first page load).
  // ProtectedRoute uses this to show a spinner instead of immediately
  // redirecting to /login before we know if the token is valid.


  // ─── Effect: Restore session on page load ───────────────────────────────
  useEffect(() => {
    // This effect runs once when the AuthProvider first mounts (the empty []
    // dependency array means "run after the first render only").
    // Its job: if the user previously logged in, their JWT is in localStorage.
    //           We validate it by calling GET /auth/me on the backend.

    const token = localStorage.getItem("token");
    // Retrieve the JWT from the browser's localStorage.
    // localStorage persists across page refreshes and browser restarts.
    // Returns null if no token is stored (user has never logged in).

    if (token) {
      // A token exists — the user may already be logged in.
      // Ask the server to verify the token and return the user's data.
      api.get("/auth/me")
        .then((res) => setUser(res.data.user))
        // Success → store the returned user object in state.
        // The app is now aware of who is logged in.

        .catch(() => localStorage.removeItem("token"))
        // Failure (e.g. token expired or server returned 401 Unauthorized):
        // Remove the invalid/expired token so we don't try again next time.
        // setUser stays null → user will be redirected to /login by ProtectedRoute.

        .finally(() => setLoading(false));
        // Always runs after .then or .catch.
        // Sets loading to false so the app stops showing the full-page spinner.
    } else {
      // No token in localStorage → user is definitely not logged in.
      // Skip the API call and immediately stop loading.
      setLoading(false);
    }
  }, []); // [] → run once on mount, never again.


  // ─── Effect: Apply saved theme preference ───────────────────────────────
  useEffect(() => {
    // Runs whenever the `user` state value changes.
    // If the user has a saved theme that isn't "system", apply it
    // by setting a data-theme attribute on the <html> element.
    // The CSS in index.css uses [data-theme="dark"] to switch the colour variables.

    if (user?.theme && user.theme !== "system") {
      // user?.theme → optional chaining: safely access .theme even if user is null.
      // "system" theme means "follow the OS preference" (handled elsewhere with
      // a media query or matchMedia), so we only set the attribute for explicit themes.
      document.documentElement.setAttribute("data-theme", user.theme);
      // document.documentElement → the <html> element.
      // setAttribute("data-theme", "dark") → adds data-theme="dark" to <html>,
      // which triggers the [data-theme="dark"] CSS block in index.css.
    }
  }, [user]); // Re-run every time `user` changes (login, logout, settings update).


  // ─── Auth Action Functions ───────────────────────────────────────────────

  const login = async (email, password) => {
    // Sends the user's credentials to the backend.
    // Throws an error if the credentials are wrong (caught by the LoginPage).
    const res = await api.post("/auth/login", { email, password });
    // POST /auth/login → returns { token, user } on success.

    localStorage.setItem("token", res.data.token);
    // Persist the JWT so it survives page refreshes.
    // The api utility's interceptor will attach this token to future requests.

    setUser(res.data.user);
    // Update global state → all components reading user via useAuth() re-render.

    return res.data;
    // Return the response so the calling component (LoginPage) can navigate
    // after a successful login.
  };

  const signup = async (name, email, password) => {
    // Creates a new user account on the backend.
    const res = await api.post("/auth/signup", { name, email, password });
    // POST /auth/signup → returns { token, user } on success.

    localStorage.setItem("token", res.data.token);
    // Auto-log-in after signup by storing the new token.

    setUser(res.data.user);
    // Update global state → user is now logged in.

    return res.data;
  };

  const logout = async () => {
    // Logs out the current user: invalidates server-side session, clears local state.
    await api.post("/auth/logout");
    // POST /auth/logout → tells the server to invalidate the token/session
    // (useful for refresh-token setups or server-side session tracking).

    localStorage.removeItem("token");
    // Remove the JWT from the browser so it can't be used again.

    setUser(null);
    // Clear the user from global state → ProtectedRoute will redirect to /login.
  };

  const updateUser = (updatedUser) => setUser(updatedUser);
  // A simple setter exposed so the SettingsPage can update the user in global
  // state (e.g. after changing name/avatar/theme) without requiring a full
  // re-login. The SettingsPage calls the API, gets the updated user back,
  // then calls updateUser(updatedUser) to sync state.


  // ─── 3. Provide the Context Value ───────────────────────────────────────
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {/* AuthContext.Provider makes the `value` object available to any
          component in the tree below it that calls useAuth().
          Passing an object lets us provide multiple values at once.

          value breakdown:
            user        → the current user object (or null).
            loading     → true while the token-validation API call is in flight.
            login       → function to log in with email + password.
            signup      → function to register a new account.
            logout      → function to log out.
            updateUser  → function to sync updated user data (from SettingsPage). */}

      {children}
      {/* Renders everything wrapped inside <AuthProvider> in App.jsx.
          Without this, none of the routes/pages would appear. */}
    </AuthContext.Provider>
  );
}


// ─── 4. Custom Hook ──────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
// useAuth is a convenience wrapper around useContext(AuthContext).
// Any component can call const { user, login, logout } = useAuth();
// instead of the more verbose const { user } = useContext(AuthContext).
// This also makes refactoring easier — if AuthContext ever changes its name,
// you only update this one line.
