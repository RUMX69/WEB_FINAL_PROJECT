// ─── main.jsx ───────────────────────────────────────────────────────────────
// This is the entry point of the entire React application.
// It is the very first JavaScript file that runs in the browser.
// Its sole job is to "mount" (attach) the React component tree into the HTML page.
// ────────────────────────────────────────────────────────────────────────────

import React from "react";
// Imports the React library.
// Even though you don't see "React" used directly below, it must be imported
// in older React setups for JSX to compile. In React 17+ with the new JSX
// transform this import is optional, but it is kept here for compatibility.

import ReactDOM from "react-dom/client";
// ReactDOM is the bridge between React and the actual browser DOM.
// Specifically, we import from "react-dom/client" which is the React 18 API.
// This gives us the new `createRoot` API for concurrent rendering.

import App from "./App.jsx";
// Imports the top-level App component, which contains all routes and
// context providers. Every page the user sees comes through App.

import "./index.css";
// Imports the global CSS stylesheet.
// This applies CSS variables (design tokens), resets, and utility classes
// that are shared across every page in the application.

// ─── Mount the React App ────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root"))
// document.getElementById("root") → finds the <div id="root"> in index.html.
// ReactDOM.createRoot(...) → creates a React "root" using the React 18 API.
//   This enables Concurrent Mode, which allows React to pause and resume
//   rendering work to keep the UI responsive.

  .render(
    // .render() tells React what to draw inside the root element.

    <React.StrictMode>
      {/* React.StrictMode is a development helper wrapper — it does NOT render
          any visible UI. Instead, it intentionally runs certain lifecycle methods
          twice to catch bugs like:
            - Impure render functions (functions that have side effects)
            - Deprecated API usage
            - Accidental state mutation
          StrictMode checks are ONLY active in development; in production builds
          the extra checks are stripped out for performance. */}

      <App />
      {/* Renders the root App component, which contains BrowserRouter,
          AuthProvider, and all page <Route> definitions. */}

    </React.StrictMode>
  );
