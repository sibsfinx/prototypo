FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ git

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 9000

CMD ["pnpm", "start"]
