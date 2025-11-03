# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies with increased timeout
RUN yarn install --frozen-lockfile --network-timeout 100000 || \
    yarn install --network-timeout 100000

# Copy application files
COPY . .

# Expose port for development server
EXPOSE 8080

# Default command
CMD ["yarn", "start"]
