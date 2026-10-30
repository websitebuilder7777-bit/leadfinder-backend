# Official Microsoft Playwright Docker Image (Includes Chromium + all Linux OS dependencies)
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Copy package manifests and install
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose Render standard port
ENV PORT=10000
EXPOSE 10000

# Start server
CMD ["node", "server.mjs"]

