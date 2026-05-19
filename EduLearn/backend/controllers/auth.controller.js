// ─── controllers/auth.controller.js ──────────────────────────────────────────
// Handles all authentication logic: sign-up, login, logout, and fetching the
// currently authenticated user's profile.

// Import the User Mongoose model so we can query/create user documents
const User = require("../models/User");

// Import the jsonwebtoken library to create and verify JWT tokens
const jwt = require("jsonwebtoken");

// ── Helper function ───────────────────────────────────────────────────────────

/**
 * sendToken – Creates a signed JWT, stores it in an HTTP-only cookie,
 *             and also returns it in the JSON response body.
 *
 * @param {Object} user        – The Mongoose user document
 * @param {number} statusCode  – The HTTP status code to send (201 for signup, 200 for login)
 * @param {Object} res         – The Express response object
 */
const sendToken = (user, statusCode, res) => {
  // Sign a JWT containing the user's MongoDB _id as the payload.
  // The token is valid for the duration set in JWT_EXPIRE (.env, e.g. "7d")
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Attach the token as an HTTP-only cookie so the browser stores it
  // automatically and JavaScript on the client cannot read it (XSS protection)
  res.cookie("token", token, {
    httpOnly: true, // cookie is inaccessible to client-side JS

    // Only mark as Secure (HTTPS-only) when running in production
    secure: process.env.NODE_ENV === "production",

    // Cookie expires after 7 days (in milliseconds)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Send the HTTP response with the status code, token, and a safe subset
  // of the user document (password is intentionally excluded)
  res.status(statusCode).json({
    success: true,
    token, // also returned in body so the client can use it in Authorization headers
    user: {
      _id: user._id,           // unique MongoDB identifier
      name: user.name,         // display name
      email: user.email,       // account email
      role: user.role,         // "user" or "admin"
      avatar: user.avatar,     // URL to the user's profile picture
      theme: user.theme,       // preferred color theme
      appearance: user.appearance, // font size & accent color preferences
    },
  });
};

// ── Controller exports ────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Registers a new user account.
 */
exports.signup = async (req, res) => {
  try {
    // Destructure the three required fields from the request body
    const { name, email, password } = req.body;

    // Check if an account with this email already exists in the database
    const exists = await User.findOne({ email });

    // If a duplicate is found, reject the request with a 400 Bad Request
    if (exists) return res.status(400).json({ message: "Email already in use" });

    // Create a new user document; the pre-save hook in the User model
    // will automatically hash the password before storing it
    const user = await User.create({ name, email, password });

    // Respond with 201 Created and send the JWT token to log the user in immediately
    sendToken(user, 201, res);
  } catch (err) {
    // Return a 500 Internal Server Error with the error message for debugging
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/auth/login
 * Authenticates an existing user by email and password.
 */
exports.login = async (req, res) => {
  try {
    // Destructure credentials from the request body
    const { email, password } = req.body;

    // Find the user document in the database that matches the given email
    const user = await User.findOne({ email });

    // If no user is found, OR the password doesn't match the stored hash,
    // return 401 Unauthorized. Both cases share the same vague message to
    // prevent email-enumeration attacks.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Credentials are valid – issue a JWT and respond with 200 OK
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/auth/logout
 * Clears the auth cookie, effectively logging the user out.
 * Protected route – user must be logged in to call this.
 */
exports.logout = (req, res) => {
  // Overwrite the "token" cookie with an empty value and set its
  // expiry to the Unix epoch (past), which tells the browser to delete it
  res.cookie("token", "", { expires: new Date(0) });

  // Confirm the logout to the client
  res.json({ success: true, message: "Logged out" });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * req.user is populated by the `protect` middleware before this runs.
 */
exports.getMe = async (req, res) => {
  // req.user is already set by the protect middleware (contains user without password)
  res.json({ success: true, user: req.user });
};
