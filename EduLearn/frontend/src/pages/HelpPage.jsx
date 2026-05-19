// ============================================================
// HelpPage.jsx
// Static help/support page for the EduLearn application.
// Displays contact information (email, phone) and a list of
// Frequently Asked Questions (FAQs) using HTML <details> elements
// for native accordion/expand behaviour — no extra JavaScript needed.
// ============================================================

// AppLayout provides the shared navigation shell (header, sidebar, etc.)
// that wraps every authenticated page in the application.
import AppLayout from "../components/AppLayout";

// CSS file scoped to this page for styling the help card and FAQ items.
import "./HelpPage.css";

// ──────────────────────────────────────────────────────────────
// COMPONENT: HelpPage
// A purely presentational (no state, no API calls) functional
// component that renders static support content.
// ──────────────────────────────────────────────────────────────
export default function HelpPage() {
  return (
    // Wrap the page content in the global navigation/layout shell.
    <AppLayout>
      <div className="page-inner">

        {/* Page heading */}
        <h1 className="page-title">Help</h1>

        {/* ── CONTACT CARD ─────────────────────────────────── */}
        {/* A styled card that lists the team's contact details.  */}
        <div className="help-card card">

          {/* Email contact row: envelope SVG icon + email address */}
          <div className="help-row">
            {/* Inline SVG of an envelope icon drawn with strokes */}
            <svg
              width="20" height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--navy)"   // Uses CSS custom property for colour
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer rectangle of the envelope */}
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              {/* The "V" fold at the top of the envelope */}
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            {/* Email label and address */}
            <span><strong>Email</strong> — 02250381.cst@rub.edu.bt</span>
          </div>

          {/* Phone contact row: telephone SVG icon + phone numbers */}
          <div className="help-row">
            {/* Inline SVG of a classic telephone handset */}
            <svg
              width="20" height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--navy)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Complex path that draws the telephone handset shape */}
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {/* Contact Number label and list of team phone numbers */}
            <span>
              <strong>Contact Number</strong> — +975-17824817,+975-17962838,+975-17619599,+975-17564731,+975-17942886
            </span>
          </div>
        </div>

        {/* ── FAQ SECTION ──────────────────────────────────── */}
        <div className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>

          {/* Iterate over the `faqs` array defined below and render
              one <details> accordion element per FAQ item.
              The `i` index is used as the React key since the array
              is static and items are never reordered. */}
          {faqs.map((faq, i) => (
            // <details> is a native HTML element that toggles its
            // content open/closed when the user clicks the <summary>.
            // No JavaScript needed for the expand/collapse behaviour.
            <details key={i} className="faq-item card">
              {/* <summary> is the always-visible clickable header */}
              <summary className="faq-q">{faq.q}</summary>
              {/* This paragraph is hidden until the user opens the item */}
              <p className="faq-a">{faq.a}</p>
            </details>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}

// ──────────────────────────────────────────────────────────────
// FAQ DATA ARRAY
// Declared BELOW the component (still in module scope) so it is
// hoisted and accessible inside the JSX above.
// Each object has:
//   q – the question string shown in the <summary>
//   a – the answer string revealed when the item is expanded
// ──────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "How do I take timestamped notes?",
    a: "While watching a video, type your note in the Smart Notes panel on the right and click Save Note. The current video timestamp is automatically attached.",
  },
  {
    q: "How do I save a video?",
    a: "Click the ⋮ menu on any video card and select Save, or click the Save Video button on the video player page.",
  },
  {
    q: "Can I edit or delete my notes?",
    a: "Yes. Go to the Notes page, expand a video group and you'll find Delete and Edit buttons on each note.",
  },
  {
    q: "How do I change the theme?",
    a: "Go to Settings → Theme and toggle between Light and Dark.",
  },
];
