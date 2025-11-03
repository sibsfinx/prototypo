# Yarn 3 Migration

This project has been configured to use Yarn 3.8.7 (Berry).

## Setup

Yarn 3 is configured via:
- `.yarnrc.yml` - Yarn configuration
- `.yarn/releases/yarn-3.8.7.cjs` - Yarn 3 binary
- `nodeLinker: node-modules` - Uses traditional node_modules (not PnP)

## Usage

### Install dependencies
```bash
yarn install
```

### Run development server
```bash
yarn start
```

### Build for production
```bash
yarn build
```

## Known Issues

Some GitHub-hosted dependencies in package.json may require manual handling during `yarn install` due to Yarn 3's stricter dependency resolution. If you encounter issues:

1. Ensure you have good network connectivity
2. Try: `yarn install --mode=skip-build`
3. Or temporarily use Yarn 1: `yarn set version 1.22.22 && yarn install && yarn set version 3.8.7`

## Docker

The Dockerfile has been updated to use Corepack for Yarn 3:
```bash
docker compose up
```

## Migration from Yarn 1

If you need to migrate from an existing Yarn 1 installation:
1. Delete `node_modules` and `yarn.lock`
2. Run `yarn install` with Yarn 3
3. The new `yarn.lock` will be in Yarn 3 format

