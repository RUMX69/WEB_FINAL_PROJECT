// ─── models/User.js ──────────────────────────────────────────────────────────
// Mongoose model for user accounts.
// Handles password hashing automatically via a pre-save hook, and exposes
// a `matchPassword` method used during login to verify credentials.

// Import Mongoose to define the schema and create the model
const mongoose = require("mongoose");

// Import bcryptjs for hashing passwords before storage and comparing them at login
const bcrypt = require("bcryptjs");

// ── Schema definition ─────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // The user's display name. `trim` removes leading/trailing whitespace.
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // The user's email address, used as a unique login identifier.
    // `lowercase: true` normalises input so "User@Email.com" === "user@email.com".
    // `unique: true` creates a MongoDB unique index to prevent duplicate accounts.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // The user's password – stored as a bcrypt hash, NEVER as plain text.
    // `minlength: 6` is a schema-level validation that fires before hashing.
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Optional URL to the user's profile picture. Defaults to an empty string
    // (meaning no avatar), which the frontend can detect and show a placeholder.
    avatar: {
      type: String,
      default: "",
    },

    // The user's role within the platform.
    // `enum` restricts the value to either "user" (regular) or "admin".
    // New accounts default to "user".
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // The user's preferred color theme for the UI.
    // "system" means follow the OS-level light/dark preference.
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },

    // Nested appearance preferences for fine-grained UI customisation.
    appearance: {
      // Preferred text size across the application
      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },

      // Accent / brand colour used for buttons, links, etc.
      // Stored as a CSS hex colour string.
      accentColor: {
        type: String,
        default: "#1a73e8", // Google-blue default
      },
    },
  },
  {
    // Automatically add `createdAt` and `updatedAt` fields to every document
    timestamps: true,
  }
);

// ── Pre-save hook: password hashing ──────────────────────────────────────────
// Runs automatically before every `.save()` call.
// Only hashes the password if it has been set or changed, avoiding
// unnecessary re-hashing when other fields (e.g. name) are updated.
userSchema.pre("save", async function (next) {
  // `this` refers to the document being saved.
  // If the password field has NOT been modified, skip hashing and continue.
  if (!this.isModified("password")) return next();

  // Hash the plain-text password with a cost factor of 12.
  // Higher cost = slower hash = harder to brute-force (12 is a solid default).
  this.password = await bcrypt.hash(this.password, 12);

  // Signal that the pre-save processing is complete; move to the next hook or save
  next();
});

// ── Instance method: password comparison ─────────────────────────────────────
// Added to every user document instance so controllers can call:
//   await user.matchPassword(plainTextPassword)
// Returns true if the entered password matches the stored hash, false otherwise.
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare handles the hashing internally and returns a boolean
  return bcrypt.compare(enteredPassword, this.password);
};

// Compile the schema into a Mongoose model named "User" and export it
module.exports = mongoose.model("User", userSchema);
