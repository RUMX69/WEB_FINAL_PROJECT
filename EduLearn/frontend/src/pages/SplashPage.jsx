// ============================================================
// SplashPage.jsx
// The very first screen users see when they open EduLearn.
// Displays the app logo and a three-dot loading animation for
// ~2.2 seconds, then automatically redirects to:
//   • /home   – if the user is already logged in (token exists)
//   • /login  – if the user is not authenticated
// This gives AuthContext time to restore the session from
// localStorage before the redirect decision is made.
// ============================================================

// useEffect – runs the auto-redirect timer after the component mounts.
import { useEffect } from "react";

// useNavigate – returns a function to navigate to a different route.
import { useNavigate } from "react-router-dom";

// useAuth – provides `user` (null if not logged in) and `loading`
// (true while AuthContext is still restoring the session from storage).
import { useAuth } from "../context/AuthContext";

// CSS for the full-screen splash animation (centered logo + dots).
import "./SplashPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: SplashPage
// ──────────────────────────────────────────────────────────────
export default function SplashPage() {
  // Programmatic navigation function.
  const navigate = useNavigate();

  // `user`    – the current user object, or null if not logged in.
  // `loading` – true while AuthContext is still reading/validating
  //             the stored JWT token (prevents a premature redirect).
  const { user, loading } = useAuth();

  // ── SIDE EFFECT: Timed Redirect ───────────────────────────
  // Re-runs whenever `loading`, `user`, or `navigate` changes.
  useEffect(() => {
    // Do nothing while the auth state is still being restored.
    // Without this guard the user would be redirected to /login
    // even if they ARE logged in (because `user` would be null
    // for a brief moment before the token is validated).
    if (loading) return;

    // Set a 2200ms (2.2 second) timer to give the splash animation
    // time to display before navigating away.
    const timer = setTimeout(() => {
      // Navigate to /home for authenticated users, /login for guests.
      navigate(user ? "/home" : "/login");
    }, 2200);

    // Cleanup function: cancels the timer if the component unmounts
    // before 2.2 seconds (e.g., the user navigates away manually).
    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  // ── RENDER ─────────────────────────────────────────────────
  return (
    // Full-viewport centred flex container (no AppLayout — this is a public screen)
    <div className="splash">

      {/* ── LOGO ROW ─────────────────────────────────────── */}
      {/* Horizontal flex row: icon on the left, text on the right */}
      <div className="splash-logo">

        {/* Circular icon container with gradient background (via CSS) */}
        <div className="splash-icon">
          {/* Stacked-layers SVG icon representing learning/education */}
          <svg
            width="48" height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"        // White stroke so it shows on the dark icon background
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Top layer / "roof" of the stacked shapes */}
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            {/* Bottom layer line */}
            <path d="M2 17l10 5 10-5"/>
            {/* Middle layer line */}
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* App name and tagline text block beside the icon */}
        <div>
          <h1 className="splash-title">EduLearn</h1>
          <p className="splash-sub">LEARN SMARTER. GROW FURTHER.</p>
        </div>
      </div>

      {/* ── LOADING DOTS ─────────────────────────────────── */}
      {/* Three <span> elements animated in CSS with a staggered
          scale/opacity pulse to create a "loading" indicator.
          No JavaScript is needed — pure CSS keyframe animation. */}
      <div className="splash-dots">
        <span />{/* Dot 1 */}
        <span />{/* Dot 2 */}
        <span />{/* Dot 3 */}
      </div>
    </div>
  );
}
