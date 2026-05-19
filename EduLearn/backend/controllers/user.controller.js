// ─── controllers/user.controller.js ──────────────────────────────────────────
// Handles updates to the authenticated user's own account:
//   - profile (name + avatar)
//   - password (with verification of the current password)
//   - UI settings (theme + appearance)
// All routes here are protected – the user must be logged in.

// Import the User Mongoose model so we can find and update user documents
const User = require("../models/User");

// Import bcryptjs for hashing/comparing passwords (available here if needed;
// the actual hashing is handled by the User model's pre-save hook)
const bcrypt = require("bcryptjs");

/**
 * PUT /api/users/profile
 * Updates the user's display name and/or avatar URL.
 */
exports.updateProfile = async (req, res) => {
  try {
    // Extract the fields the user wants to change from the request body
    const { name, avatar } = req.body;

    // Find the user by their _id and update in a single atomic operation.
    // `new: true`          → return the document AFTER the update (not before)
    // `runValidators: true` → enforce schema rules (e.g. required, trim) on the new values
    // `.select("-password")` → exclude the hashed password from the returned document
    const user = await User.findByIdAndUpdate(
      req.user._id,                          // the logged-in user's MongoDB _id
      { name, avatar },                      // fields to update
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/users/password
 * Changes the user's password after verifying their current one.
 */
exports.updatePassword = async (req, res) => {
  try {
    // Extract the old and new passwords from the request body
    const { currentPassword, newPassword } = req.body;

    // Fetch the full user document (including the hashed password field)
    // so we can call matchPassword on it.
    // Note: req.user from the protect middleware omits the password field,
    // so we must re-query with findById here.
    const user = await User.findById(req.user._id);

    // Verify that the supplied current password matches the stored hash.
    // matchPassword is a custom instance method defined on the User schema.
    if (!(await user.matchPassword(currentPassword))) {
      // Return 400 Bad Request if the current password is wrong
      return res.status(400).json({ message: "Current password incorrect" });
    }

    // Assign the new plain-text password to the document.
    // The User model's `pre("save")` hook will hash it automatically
    // before it is written to the database.
    user.password = newPassword;

    // Persist the document (triggers the pre-save hashing hook)
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/users/settings
 * Updates the user's UI preferences: color theme and appearance options.
 */
exports.updateSettings = async (req, res) => {
  try {
    // Extract the settings the user wants to change from the request body
    const { theme, appearance } = req.body;
    //  theme      – e.g. "light" | "dark" | "system"
    //  appearance – object with { fontSize, accentColor }

    // Update the user document and return the new version without the password
    const user = await User.findByIdAndUpdate(
      req.user._id,             // identify the user to update
      { theme, appearance },    // the fields to set
      { new: true }             // return the updated document
    ).select("-password");      // strip the password hash before sending to client

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
