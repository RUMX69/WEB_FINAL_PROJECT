// ─── routes/auth.routes.js ────────────────────────────────────────────────────
// Defines the HTTP endpoints for user authentication.
// All routes here are prefixed with /api/auth (set in server.js).

// Create a new Express Router instance to group these related routes
const express = require("express");
const router = express.Router();

// Import the four auth controller functions, each handling one endpoint
const { signup, login, logout, getMe } = require("../controllers/auth.controller");

// Import the `protect` middleware to guard routes that require authentication
const { protect } = require("../middleware/auth.middleware");

// ── Route definitions ─────────────────────────────────────────────────────────

// POST /api/auth/signup
// Public route – anyone can register a new account.
// No authentication required before this handler runs.
router.post("/signup", signup);

// POST /api/auth/login
// Public route – any user can attempt to log in with email + password.
router.post("/login", login);

// POST /api/auth/logout
// Protected route – only a logged-in user can log out.
// `protect` runs first to verify the JWT; if valid, `logout` clears the cookie.
router.post("/logout", protect, logout);

// GET /api/auth/me
// Protected route – returns the profile of the currently authenticated user.
// `protect` populates req.user; `getMe` then sends it in the response.
router.get("/me", protect, getMe);

// Export the router so server.js can mount it at /api/auth
module.exports = router;
