// ─── middleware/auth.middleware.js ────────────────────────────────────────────
// Provides two reusable Express middleware functions:
//   1. `protect`   – verifies the user is logged in (valid JWT required)
//   2. `adminOnly` – verifies the logged-in user has the "admin" role
//
// These are composed together on protected routes in the route files, e.g.:
//   router.post("/", protect, adminOnly, addVideo);

// Import jsonwebtoken to decode and verify JWT tokens
const jwt = require("jsonwebtoken");

// Import the User model so we can fetch the full user document from the DB
const User = require("../models/User");

/**
 * protect
 * Middleware that ensures the request comes from an authenticated user.
 *
 * Token lookup order:
 *   1. Authorization header  (Bearer <token>)  – used by API clients / Postman
 *   2. cookie named "token"                     – used by the browser after login
 *
 * If a valid token is found, the decoded user document is attached to `req.user`
 * and the next middleware / route handler is called.
 * If no valid token is found, a 401 Unauthorized response is returned immediately.
 */
exports.protect = async (req, res, next) => {
  let token; // will hold the raw JWT string if one is found

  // ── Token extraction ──────────────────────────────────────────────────────

  // Check for "Authorization: Bearer <token>" header first
  if (req.headers.authorization?.startsWith("Bearer ")) {
    // Split "Bearer <token>" on the space and take the second part (the token)
    token = req.headers.authorization.split(" ")[1];

  // Fall back to reading the token from the HTTP-only cookie set at login
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // If neither source provided a token, the request is unauthenticated
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  // ── Token verification ────────────────────────────────────────────────────
  try {
    // Verify the token signature and expiry using the secret from .env.
    // `decoded` will contain the payload we signed at login: { id: user._id }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the full user document from MongoDB using the id stored in the token.
    // `.select("-password")` omits the hashed password from the returned object
    // so it is never accidentally serialised and sent to the client.
    req.user = await User.findById(decoded.id).select("-password");

    // If the user was deleted after the token was issued, reject the request
    if (!req.user) return res.status(401).json({ message: "User not found" });

    // User is authenticated – hand off to the next middleware or route handler
    next();
  } catch {
    // jwt.verify throws if the token is malformed, expired, or the signature
    // doesn't match the secret (tampering detected)
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

/**
 * adminOnly
 * Middleware that restricts a route to admin users only.
 *
 * MUST be used AFTER `protect` in the middleware chain, because it relies on
 * `req.user` being populated by `protect` first.
 *
 * Example usage in a route file:
 *   router.delete("/:id", protect, adminOnly, deleteVideo);
 */
exports.adminOnly = (req, res, next) => {
  // Check the role field on the user document attached by `protect`.
  // The optional-chaining (`?.`) guards against the case where req.user is
  // somehow undefined (defensive programming).
  if (req.user?.role !== "admin") {
    // Return 403 Forbidden if the user is authenticated but not an admin
    return res.status(403).json({ message: "Admins only" });
  }

  // User is an admin – proceed to the route handler
  next();
};
