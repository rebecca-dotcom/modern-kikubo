# ── Stage 1: Build React frontend ─────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy backend source
COPY server/ ./server/
COPY prisma/ ./prisma/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/dist ./client/dist

# Generate Prisma client
RUN cd server && npx prisma generate

EXPOSE 5000

CMD ["node", "server/index.js"]
