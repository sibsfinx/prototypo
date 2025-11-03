# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Enable Corepack for Yarn 3
RUN corepack enable && corepack prepare yarn@3.8.7 --activate

# Copy package files and Yarn configuration
COPY package.json .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies with increased timeout
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN yarn install --immutable || yarn install

# Copy application files
COPY . .

# Expose port for development server (Vite uses 9000)
EXPOSE 9000

# Default command
CMD ["yarn", "start"]
