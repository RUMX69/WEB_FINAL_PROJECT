// ============================================================
// AboutUsPage.jsx
// Displays the "About Us" page for the EduLearn application.
// Shows a mission statement card and a grid of team member cards
// with their photo, name, phone, and email contact details.
// ============================================================

// Import the shared AppLayout wrapper component that provides
// the common navigation, header, and page structure used across all pages.
import AppLayout from "../components/AppLayout";

// Import the CSS stylesheet specific to this page for scoped styling.
import "./AboutUsPage.css";

// Import individual team member profile photo assets (PNG images)
// stored inside the project's assets folder. Each import gives us
// a URL string we can pass to an <img> tag's src attribute.
import imgSanskar from "../assets/sanskar.png";
import imgSurash  from "../assets/surash.png";
import imgYosel   from "../assets/yosel.png";
import imgBidhas  from "../assets/bidhas.png";
import imgSanjuck from "../assets/sanjuck.png";

// ──────────────────────────────────────────────────────────────
// TEAM DATA ARRAY
// A static array of objects, where each object represents one
// team member. Keeping this data outside the component avoids
// re-creating the array on every render and makes it easy to
// add or remove members in one place.
// ──────────────────────────────────────────────────────────────
const TEAM = [
  // Each object has: full name, Bhutanese phone number, institutional
  // email address, and the imported photo asset for that member.
  { name: "Sanskar Gurung", phone: "+975-17824817", email: "02250368.cst@rub.gov.bt", photo: imgSanskar },
  { name: "Surash Subba",   phone: "+975-17564731", email: "02250372.cst@rub.gov.bt", photo: imgSurash  },
  { name: "Yosel Rai",      phone: "+975-17619599", email: "02250381.cst@rub.gov.bt", photo: imgYosel   },
  { name: "Bidhas Mongar",  phone: "+975-17962838", email: "02250345.cst@rub.gov.bt", photo: imgBidhas  },
  { name: "Sanjuck Subba",  phone: "+975-17824817", email: "02250372.cst@rub.gov.bt", photo: imgSanjuck },
];

// ──────────────────────────────────────────────────────────────
// COMPONENT: AboutUsPage
// A default-exported React functional component. It renders the
// full "About Us" page inside the shared AppLayout shell.
// ──────────────────────────────────────────────────────────────
export default function AboutUsPage() {
  return (
    // AppLayout wraps the page content with the site's nav bar,
    // sidebar, and consistent padding/background.
    <AppLayout>

      {/* page-inner gives a max-width container with consistent padding */}
      <div className="page-inner">

        {/* ── MISSION CARD ────────────────────────────────────── */}
        {/* A card that shows the project's mission statement on the
            left and the EduLearn brand logo/name on the right.    */}
        <div className="about-mission card">

          {/* Left side: title and descriptive paragraph */}
          <div className="mission-text">
            <h1 className="about-title">About Us</h1>
            <p>
              {/* Short description of who the team is and what EduLearn does */}
              We are a team of students from the College of Science and Technology,
              Royal University of Bhutan, dedicated to advancing education through technology.
              Our project, EduLearn, transforms passive video learning into interactive study
              experiences by integrating modern web tools, fostering engagement,
              collaboration, and effective knowledge retention.
            </p>
          </div>

          {/* Right side: brand icon (inline SVG of a layered-stack/book icon)
              plus the EduLearn name and tagline */}
          <div className="mission-logo">

            {/* Circular or styled icon container */}
            <div className="mission-logo-icon">
              {/* Inline SVG that draws a stacked-layers icon (represents learning) */}
              <svg
                width="48" height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"        // White stroke so it shows on dark background
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Top layer of the stack (roof of a "house" or top sheet) */}
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                {/* Bottom-most horizontal bar of the stack */}
                <path d="M2 17l10 5 10-5"/>
                {/* Middle horizontal bar of the stack */}
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>

            {/* Text block next to the icon */}
            <div>
              {/* Application name */}
              <h2 className="mission-logo-name">EduLearn</h2>
              {/* Marketing tagline displayed in smaller text */}
              <p className="mission-logo-sub">LEARN SMARTER. GROW FURTHER.</p>
            </div>
          </div>
        </div>

        {/* ── TEAM CARDS ──────────────────────────────────────── */}
        {/* A card that wraps a CSS grid of individual team member cards */}
        <div className="team-section card">
          <div className="team-grid">

            {/* Iterate over the TEAM array and render one card per member.
                The member's name is used as the unique React key because
                all names in this project are unique. */}
            {TEAM.map((member) => (
              <div key={member.name} className="team-card">

                {/* Circular avatar container. CSS (.team-avatar) makes
                    this a fixed-size circle with overflow:hidden so
                    the photo fills it without spilling out. */}
                <div className="team-avatar">
                  <img
                    src={member.photo}           // Imported asset URL for this member
                    alt={member.name}            // Accessible alt text for screen readers
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    // objectFit: "cover" ensures the image fills the avatar
                    // box without stretching, cropping from the center.
                  />
                </div>

                {/* Member's full name */}
                <p className="team-name">{member.name}</p>

                {/* Member's phone number */}
                <p className="team-info">{member.phone}</p>

                {/* Member's institutional email address */}
                <p className="team-info">{member.email}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
