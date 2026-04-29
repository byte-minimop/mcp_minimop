# syntax=docker/dockerfile:1
#
# Runtime image for MCP Office — the app is built by CI before docker build runs.
# Build context: apps/mcp-office/ (from the monorepo root in CI).
#
# outputFileTracingRoot is set to "../.." (the monorepo root) so Next.js mirrors
# the checkout path inside the standalone bundle. The entry point lands at:
#   .next/standalone/apps/mcp-office/server.js
#
# The CI workflow assembles the bundle (copies .next/static into the right
# location inside standalone) before passing the context to this Dockerfile.
# All this Dockerfile needs to do is copy the output into a clean runtime image.

FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the fully assembled standalone bundle.
# Contains: apps/mcp-office/server.js, apps/mcp-office/.next/ (with static),
# apps/mcp-office/public/, and node_modules/ with all traced dependencies.
COPY .next/standalone/ ./

# Persistent data — SQLite databases must not live on the container filesystem.
# Set MCP_DATA_DIR to the Azure Files mount path in App Service configuration.
# The production health check reports degraded until that app setting is present.

# server.js is at apps/mcp-office/server.js due to outputFileTracingRoot path mirroring.
# node:sqlite is experimental in Node 22 — the flag is required at runtime.
# Remove --experimental-sqlite when the base image moves to Node 24 (stable).
WORKDIR /app/apps/mcp-office
EXPOSE 3000
CMD ["node", "--experimental-sqlite", "server.js"]
