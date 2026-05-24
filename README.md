# WEB_FINAL_PROJECT
# EduLearn

A full-stack educational video platform built with the MERN stack (MongoDB, Express, React, Node.js). Users can browse and watch curated video lessons, take timestamped notes, save videos for later, track their watch history, and ask questions in per-video Q&A threads. Admins manage the video library from a dedicated dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Pages & Routes](#pages--routes)
- [Role System](#role-system)

---

## Features

### For Users
- **Browse & Search** - Discover videos by title, tags, or category from the Home page.
- **Video Player** - Watch YouTube-embedded videos with a clean, distraction-free interface.
- **Timestamped Notes** - Write notes tied to a specific second in a video; notes are sorted by timestamp so they follow along with playback.
- **Saved Videos** - Bookmark videos into a personal watch-later list; a duplicate-save guard prevents double entries.
- **Watch History** - Every video watch is recorded. Re-watching the same video refreshes the timestamp rather than creating a duplicate entry.
- **Q&A Threads** - Ask questions on any video and reply to other users' questions. Authors and admins can delete questions.
- **Settings** - Update display name, avatar URL, password (with current-password verification), and UI preferences (theme, font size, accent colour).

### For Admins
- **Admin Dashboard** - Add new videos (title, description, YouTube ID, thumbnail, category, tags), edit existing ones, and delete them.
- **Role-based access** - Admin-only endpoints are guarded server-side by the `adminOnly` middleware; the sidebar link is also hidden from regular users in the UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios, react-youtube |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (stored as HTTP-only cookie + Authorization header fallback) |
| Password hashing | bcryptjs |

---

## Project Structure
![alt text](<WhatsApp Image 2026-05-24 at 10.12.55 PM-1.jpeg>)
---

## Getting Started

### Prerequisites

- Node.js v18 or later
- A MongoDB Atlas cluster (or a local MongoDB instance)
- npm

### Backend Setup

```bash
cd FinpOI/backend
npm install
```

Create a `.env` file in `backend/` (see [Environment Variables](#environment-variables) below), then start the server:

```bash
# Development (auto-restarts with nodemon)
npm run dev

# Production
npm start
```

The server listens on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd FinpOI/frontend
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173` and proxies API calls to the backend.

To build for production:

```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

---

## Environment Variables

Create `backend/.env` with the following keys:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `MONGO_URI` | Full MongoDB connection string | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/edulearn` |
| `JWT_SECRET` | Secret key used to sign JWTs | `some_long_random_string` |
| `JWT_EXPIRE` | Token lifetime (parsed by jsonwebtoken) | `7d` |
| `CLIENT_URL` | CORS allowed origin (your frontend URL) | `http://localhost:5173` |

> **Never commit `.env` to version control.** Add it to `.gitignore`.

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth - `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register a new user account |
| POST | `/login` | Public | Log in; sets HTTP-only JWT cookie |
| POST | `/logout` | Protected | Clears the auth cookie |
| GET | `/me` | Protected | Returns the current user's profile |

### Videos - `/api/videos`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all videos; supports `?search=` and `?category=` query params |
| GET | `/:id` | Public | Get a single video by ID |
| POST | `/` | Admin | Add a new video |
| PUT | `/:id` | Admin | Update a video |
| DELETE | `/:id` | Admin | Delete a video |

### Notes - `/api/notes`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | Get all of the current user's notes (all videos) |
| GET | `/:videoId` | Protected | Get the current user's notes for a specific video, sorted by timestamp |
| POST | `/` | Protected | Create a note (`videoId`, `content`, `timestamp` in body) |
| PUT | `/:id` | Protected | Update a note's content |
| DELETE | `/:id` | Protected | Delete a note |

### Saved - `/api/saved`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | Get the current user's saved videos |
| POST | `/` | Protected | Save a video (`videoId` in body); returns 400 if already saved |
| DELETE | `/:videoId` | Protected | Remove a video from saved |

### History - `/api/history`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | Get the current user's watch history, newest first |
| POST | `/` | Protected | Record or refresh a watch entry (`videoId` in body) |
| DELETE | `/:videoId` | Protected | Remove a single entry from history |
| DELETE | `/clear` | Protected | Clear the entire watch history |

### Q&A - `/api/qa`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:videoId` | Public | Get all questions and answers for a video |
| POST | `/` | Protected | Post a question (`videoId`, `question` in body) |
| PUT | `/:id/answer` | Protected | Append an answer (`answer` in body) to a question |
| DELETE | `/:id` | Protected | Delete a question (author or admin only) |

### Users - `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | `/profile` | Protected | Update display name and/or avatar URL |
| PUT | `/password` | Protected | Change password (requires `currentPassword` + `newPassword`) |
| PUT | `/settings` | Protected | Update UI preferences (`theme`, `appearance`) |

---

## Authentication

Authentication uses **JSON Web Tokens (JWT)**:

1. On login or signup, the server signs a JWT containing the user's `_id` and sends it as an **HTTP-only cookie** (`token`). The token is also returned in the response body for clients that prefer the `Authorization: Bearer <token>` header.
2. The `protect` middleware checks for the token first in the `Authorization` header, then falls back to the cookie.
3. If the token is valid, the user document (without the password hash) is attached to `req.user` for all downstream handlers.
4. Logout overwrites the cookie with an expired empty value, clearing it from the browser.

Passwords are hashed with **bcryptjs** via a `pre('save')` hook on the User model - plain-text passwords are never stored.

---

## Pages & Routes

| URL | Page | Access |
|---|---|---|
| `/` | Splash / Landing | Public |
| `/login` | Login | Public |
| `/signup` | Sign Up | Public |
| `/home` | Video Browse | Protected |
| `/video/:id` | Video Player | Protected |
| `/notes` | My Notes | Protected |
| `/saved` | Saved Videos | Protected |
| `/history` | Watch History | Protected |
| `/settings/*` | Settings | Protected |
| `/help` | Help / FAQ | Protected |
| `/about` | About Us | Protected |
| `/admin` | Admin Dashboard | Protected |
| `*` | Redirects to `/` | — |

Unmatched URLs are caught by a wildcard route and redirected to the splash page.

---

## Role System

Two roles exist: `user` (default) and `admin`.

- The **`protect`** middleware gates any route that requires a valid login.
- The **`adminOnly`** middleware (always chained after `protect`) gates routes that only admins may access — currently the video create, update, and delete endpoints.
- On the frontend, the sidebar link to `/admin` is conditionally rendered only when `user.role === "admin"`, but the server enforces the restriction independently so it cannot be bypassed from the client.