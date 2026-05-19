# ── EduLearn Frontend Dockerfile ─────────────────────

# Stage 1: Build the React app using Node.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package*.json ./

# Install all dependencies including devDependencies (needed for build)
RUN npm install

# Copy all frontend source files
COPY . .

# Build React app — outputs static files to /app/dist
RUN npm run build

# Stage 2: Serve the built files using Nginx
# Final image is small — Node.js is not included
FROM nginx:alpine

# Copy built React files into Nginx's default serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Serve on port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]