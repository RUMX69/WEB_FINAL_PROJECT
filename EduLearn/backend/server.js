// ─── server.js ───────────────────────────────────────────────────────────────
// Entry point of the Express application.
// Connects to MongoDB, registers all middleware and routes, then starts the server.

// Import the Express framework for building the HTTP server and routing
const express = require("express");

// Import Mongoose – the ODM (Object-Document Mapper) used to interact with MongoDB
const mongoose = require("mongoose");

// Import the CORS middleware to allow cross-origin requests from the frontend
const cors = require("cors");

// Import dotenv to load environment variables from the .env file into process.env
const dotenv = require("dotenv");

// Import cookie-parser so Express can read cookies attached to incoming requests
const cookieParser = require("cookie-parser");

// Load all variables defined in the .env file (e.g. MONGO_URI, JWT_SECRET, PORT)
dotenv.config();

// ── Route imports ─────────────────────────────────────────────────────────────
// Each route file groups the endpoints for a specific feature/resource

// Routes that handle user registration, login, logout, and session info
const authRoutes = require("./routes/auth.routes");

// Routes that handle listing, adding, updating, and deleting videos
const videoRoutes = require("./routes/video.routes");

// Routes that handle creating, reading, updating, and deleting per-video notes
const noteRoutes = require("./routes/note.routes");

// Routes that handle saving and un-saving videos for a user's watch list
const savedRoutes = require("./routes/saved.routes");

// Routes that handle the user's video-watch history
const historyRoutes = require("./routes/history.routes");

// Routes that handle questions and answers attached to videos
const qaRoutes = require("./routes/qa.routes");

// Routes that handle updating the user's profile, password, and settings
const userRoutes = require("./routes/user.routes");

// Create the Express application instance
const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

// Enable CORS: allow requests only from the URL defined in CLIENT_URL (.env),
// and allow cookies/credentials to be sent with those requests
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Parse incoming JSON request bodies so controllers can read req.body
app.use(express.json());

// Parse Cookie header and populate req.cookies so the auth middleware
// can read the JWT stored as an HTTP-only cookie
app.use(cookieParser());

// ── Route mounting ────────────────────────────────────────────────────────────
// Each router is mounted at its own base path.
// All endpoints inside that router file will be prefixed with this path.

app.use("/api/auth", authRoutes);      // e.g. POST /api/auth/login
app.use("/api/videos", videoRoutes);   // e.g. GET  /api/videos
app.use("/api/notes", noteRoutes);     // e.g. POST /api/notes
app.use("/api/saved", savedRoutes);    // e.g. POST /api/saved
app.use("/api/history", historyRoutes);// e.g. GET  /api/history
app.use("/api/qa", qaRoutes);          // e.g. GET  /api/qa/:videoId
app.use("/api/users", userRoutes);     // e.g. PUT  /api/users/profile

// ── Database connection & server start ───────────────────────────────────────

mongoose
  // Connect to MongoDB using the URI from the .env file
  .connect(process.env.MONGO_URI)
  .then(() => {
    // Only start listening for HTTP requests after the DB connection is confirmed
    console.log("MongoDB connected");

    // Start the HTTP server on the port defined in .env, or fall back to 5000
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  // If the DB connection fails, log the error (the server will NOT start)
  .catch((err) => console.error(err));
