// ─────────────────────────────────────────────────────────────────────────────
// api.js
// Central Axios HTTP client used by every page in the app.
// Handles base URL configuration, auth token injection, and 401 redirects.
// ─────────────────────────────────────────────────────────────────────────────

// Import the axios library – a popular promise-based HTTP client for JavaScript.
// It is used here instead of the native fetch API because it provides
// built-in interceptor support and cleaner error handling.
import axios from "axios";

// Create a pre-configured Axios instance called `api`.
// All HTTP requests in the application should use this instance rather than
// calling axios directly, so that base URL and credentials are always applied.
const api = axios.create({
  // Every request made through this instance will be prefixed with "/api".
  // For example, `api.get("/videos")` will hit "http://<host>/api/videos".
  // This assumes a reverse-proxy (e.g. Nginx or Vite devServer proxy) forwards
  // "/api/*" requests to the actual backend server.
  baseURL: import.meta.env.VITE_API_URL || "/api",

  // Instructs the browser to include cookies (and other credentials such as
  // HTTP auth headers) in cross-origin requests.
  // Required so that session cookies are sent to the backend automatically.
  withCredentials: true,
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Interceptors run before/after every request or response.
// This request interceptor runs BEFORE each outgoing HTTP call.
api.interceptors.request.use((config) => {
  // Look up the JWT (JSON Web Token) stored in the browser's localStorage.
  // The key "token" is where the app saves the token after a successful login.
  const token = localStorage.getItem("token");

  // If a token is found (i.e. the user is logged in), attach it to the
  // Authorization header using the "Bearer" scheme.
  // The backend reads this header to verify the user's identity.
  // Example header value: "Authorization: Bearer eyJhbGciOiJ..."
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Return the (potentially modified) config object so Axios can continue
  // building and sending the request.
  return config;
});

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// This response interceptor runs AFTER a response (or error) comes back.
api.interceptors.response.use(
  // Success handler: called when the server returns a 2xx status code.
  // Here we simply pass the response through unchanged.
  (res) => res,

  // Error handler: called when the server returns a non-2xx status code
  // OR when the network request fails entirely.
  (err) => {
    // Check whether the server actually responded AND whether it sent a
    // 401 Unauthorized status code.
    // The optional-chaining operator (?.) prevents a crash if `err.response`
    // is undefined (e.g. a network timeout with no response at all).
    if (err.response?.status === 401) {
      // The stored token is invalid or has expired.
      // Remove it from localStorage so the app doesn't keep sending a bad token.
      localStorage.removeItem("token");

      // Force a hard navigation to the "/login" page so the user can
      // re-authenticate. Using window.location.href (instead of a router push)
      // also clears any in-memory state, giving the app a clean slate.
      window.location.href = "/login";
    }

    // Re-reject the promise with the original error so that any `.catch()`
    // handler in the calling component still receives the error and can show
    // an appropriate UI message.
    return Promise.reject(err);
  }
);

// Export the configured Axios instance as the default export.
// Other files in the project import it like: import api from "./api";
export default api;
