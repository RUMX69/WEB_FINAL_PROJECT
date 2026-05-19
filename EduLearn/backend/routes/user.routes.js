// ─── routes/user.routes.js ───────────────────────────────────────────────────
// Defines the HTTP endpoints for updating the authenticated user's own account.
// All routes here are prefixed with /api/users (set in server.js).
// All routes require authentication – users can only modify their own data.

// Create a new Express Router instance
const express = require("express");
const r = express.Router();

// Import the three user controller functions
const c = require("../controllers/user.controller");

// Import the `protect` middleware to require a valid JWT on every request
const { protect } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// PUT /api/users/profile
// Updates the logged-in user's display name and/or avatar URL.
// Body can include: { name?, avatar? }
r.put("/profile", protect, c.updateProfile);

// PUT /api/users/password
// Changes the logged-in user's password after verifying their current one.
// Body must include: { currentPassword, newPassword }
r.put("/password", protect, c.updatePassword);

// PUT /api/users/settings
// Updates the logged-in user's UI preferences (theme, font size, accent colour).
// Body can include: { theme?, appearance?: { fontSize?, accentColor? } }
r.put("/settings", protect, c.updateSettings);

// Export the router so server.js can mount it at /api/users
module.exports = r;
