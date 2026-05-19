// ============================================================
// SignUpPage.jsx
// User registration (sign-up) screen for EduLearn.
// Mirrors the two-panel layout of LoginPage:
//   • Left panel  – branding (logo + tagline)
//   • Right panel – registration form (name, email, password × 2)
// Validates passwords client-side before hitting the API.
// On success, redirects the user to /home.
// ============================================================

// useState – manages controlled form fields, error text, and loading state.
import { useState } from "react";

// Link       – navigates to the login page without a full page reload.
// useNavigate – imperative route navigation after successful sign-up.
import { Link, useNavigate } from "react-router-dom";

// useAuth provides the `signup` function from the global AuthContext.
// signup() sends the registration request and stores the returned JWT.
import { useAuth } from "../context/AuthContext";

// Shared stylesheet for the two-panel auth layout (same CSS used by LoginPage).
import "./AuthPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: SignUpPage
// ──────────────────────────────────────────────────────────────
export default function SignUpPage() {
  // Single form state object groups all four fields together so
  // they can be updated generically with the `set` factory below.
  const [form, setForm] = useState({
    name:     "",  // User's display name
    email:    "",  // Email address used for login
    password: "",  // Chosen password
    confirm:  "",  // Password confirmation (must match `password`)
  });

  // Error message shown above the form when validation or the API fails.
  const [error, setError] = useState("");

  // True while the sign-up API call is in-flight; disables the submit button.
  const [loading, setLoading] = useState(false);

  // Destructure the signup action from the auth context.
  const { signup } = useAuth();

  // Programmatic navigation after successful account creation.
  const navigate = useNavigate();

  // ── HELPER: Generic Field Setter ─────────────────────────
  // Returns an onChange handler that updates a single field inside
  // the `form` object while leaving all other fields untouched.
  // Usage: <input onChange={set("name")} />
  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  // ── HANDLER: Form Submit ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the browser from reloading the page on submit
    setError("");        // Clear any previously displayed error

    // ── CLIENT-SIDE VALIDATION ────────────────────────────
    // Check that the two password fields match before hitting the API.
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    // Enforce a minimum password length for basic security.
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true); // Disable the submit button while the request is pending

    try {
      // Call the AuthContext signup function with the three required fields.
      // The confirm field is intentionally NOT sent — it was only for UI validation.
      await signup(form.name, form.email, form.password);

      // Redirect to the home feed after a successful account creation and auto-login.
      navigate("/home");
    } catch (err) {
      // Display the server's error message (e.g., "Email already in use")
      // or a generic fallback.
      setError(err.response?.data?.message || "Sign up failed.");
    } finally {
      setLoading(false); // Re-enable the submit button regardless of outcome
    }
  };

  // ── RENDER ─────────────────────────────────────────────────
  return (
    // Full-viewport two-column flex container (no AppLayout — public page)
    <div className="auth-page">

      {/* ── LEFT PANEL: Branding ──────────────────────────── */}
      <div className="auth-left">
        {/* Split-coloured brand name: "Edu" + accent-coloured "Learns" */}
        <h1 className="auth-brand">
          <span>Edu</span><span className="brand-accent">Learns</span>
        </h1>
        <p className="auth-tagline">Learn. Build. Grow.</p>
      </div>

      {/* ── RIGHT PANEL: Registration Form ───────────────── */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title" style={{ textAlign: "left", fontSize: "22px" }}>
            Register your account
          </h2>

          {/* Error banner: only shown when `error` is non-empty */}
          {error && <div className="error-msg" style={{ marginBottom: "14px" }}>{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* ── Name ───────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                placeholder="Enter your full name..."
                className="form-input"
                value={form.name}
                onChange={set("name")}
                required // Browser prevents submission if empty
              />
            </div>

            {/* ── Email ──────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"            // Enforces valid email format at browser level
                placeholder="Enter your email address..."
                className="form-input"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>

            {/* ── Password ───────────────────────────────── */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"         // Masks characters as they are typed
                placeholder="Enter your password..."
                className="form-input"
                value={form.password}
                onChange={set("password")}
                required
              />
            </div>

            {/* ── Confirm Password ───────────────────────── */}
            {/* A second password field used only for client-side comparison.
                The value is NOT sent to the API — just validated locally.   */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Enter your password again..."
                className="form-input"
                value={form.confirm}
                onChange={set("confirm")}
                required
              />
            </div>

            {/* ── Submit Button ──────────────────────────── */}
            {/* Disabled while the API request is in flight.
                Label changes to show the pending state.      */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: "6px" }}
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          {/* ── Already have an account link ─────────────── */}
          {/* Directs existing users back to the login page */}
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
