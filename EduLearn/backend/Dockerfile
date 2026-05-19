# ── EduLearn Backend Dockerfile ──────────────────────
# Uses lightweight Node.js Alpine image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy all backend source files
COPY . .

# Backend listens on port 5000
EXPOSE 5000

# Start the Express server
CMD ["node", "server.js"]