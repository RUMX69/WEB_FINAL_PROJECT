// ============================================================
// LoginPage.jsx
// The login screen for EduLearn. Renders a two-panel layout:
//   • Left panel  – branding (logo + tagline)
//   • Right panel – login form (email, password, forgot link)
// On successful authentication it redirects the user to /home.
// ============================================================

// useState – manages the form field values, error message,
//            and the loading state during the API call.
import { useState } from "react";

// Link     – renders an <a> tag that navigates without a page reload.
// useNavigate – returns a function for imperative route navigation.
import { Link, useNavigate } from "react-router-dom";

// useAuth provides the `login` function from the global AuthContext.
// Calling login() sends credentials to the API and stores the
// returned JWT token + user data in context/localStorage.
import { useAuth } from "../context/AuthContext";

// Shared CSS stylesheet for both LoginPage and SignUpPage
// (they share the same two-panel auth layout styles).
import "./AuthPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: LoginPage
// ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  // Controlled input state for the email field.
  const [email, setEmail] = useState("");

  // Controlled input state for the password field.
  const [password, setPassword] = useState("");

  // Error message shown above the form when login fails.
  // Empty string means no error is displayed.
  const [error, setError] = useState("");

  // True while the login API request is in-flight.
  // Disables the submit button to prevent duplicate submissions.
  const [loading, setLoading] = useState(false);

  // Destructure the login function from the auth context.
  const { login } = useAuth();

  // Function to navigate programmatically to a new route.
  const navigate = useNavigate();

  // ── HANDLER: Form Submit ──────────────────────────────────
  // Called when the user clicks the Login button or presses Enter.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser's default form page-reload
    setError("");        // Clear any previous error message
    setLoading(true);    // Disable the submit button

    try {
      // Call the auth context's login function with the form values.
      // This sends a POST /auth/login request to the backend.
      // If successful, it stores the JWT and user in context.
      await login(email, password);

      // On success, redirect the user to the main home/feed page.
      navigate("/home");
    } catch (err) {
      // Show the server's error message if available, otherwise a generic fallback.
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false); // Re-enable the button regardless of outcome
    }
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    // Full-viewport two-column flex container (no AppLayout — this is a public page)
    <div className="auth-page">

      {/* ── LEFT PANEL: Branding ──────────────────────────── */}
      {/* Dark/coloured brand panel shown beside the form */}
      <div className="auth-left">
        {/* Application name split into two spans so CSS can colour
            "Edu" and "Learns" differently (brand accent colour). */}
        <h1 className="auth-brand">
          <span>Edu</span><span className="brand-accent">Learns</span>
        </h1>
        {/* Short marketing tagline */}
        <p className="auth-tagline">Learn. Build. Grow.</p>
      </div>

      {/* ── RIGHT PANEL: Login Form ───────────────────────── */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Login</h2>

          {/* Error banner: only rendered when `error` is non-empty */}
          {error && <div className="error-msg">{error}</div>}

          {/* Login form — onSubmit triggers handleSubmit */}
          <form onSubmit={handleSubmit} className="auth-form">

            {/* ── Email Input ──────────────────────────────── */}
            <input
              type="email"              // Triggers email-specific keyboard on mobile
              placeholder="User / Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update state on every keystroke
              className="form-input"
              required                  // Browser enforces non-empty email format
            />

            {/* ── Password Input ───────────────────────────── */}
            <input
              type="password"           // Masks characters as the user types
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />

            {/* ── Forgot Password Link ─────────────────────── */}
            {/* Currently a placeholder href="#" — no reset flow implemented yet */}
            <div className="auth-forgot">
              <a href="#">Forgot password?</a>
            </div>

            {/* ── Submit Button ────────────────────────────── */}
            {/* Disabled while the API call is in-flight to prevent double-submit.
                Label changes to indicate the pending state.                       */}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          {/* ── Sign-up Link ──────────────────────────────── */}
          {/* Directs new users to the registration page */}
          <p className="auth-switch">
            Need an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
