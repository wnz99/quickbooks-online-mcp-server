FROM oven/bun:1 AS builder

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ ./src/
RUN bun run build

FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist

ENV MCP_TRANSPORT=http
ENV MCP_PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)process.exit(1)})" || exit 1

CMD ["bun", "dist/index.js", "--http"]
