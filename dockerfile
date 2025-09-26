FROM node:20-slim

# System deps for Chromium
RUN apt-get update && apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
  libpango-1.0-0 libpangocairo-1.0-0 libgtk-3-0 fonts-liberation \
  libjpeg-dev libxshmfence1 ca-certificates && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci && npx playwright install --with-deps chromium
COPY . .

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]