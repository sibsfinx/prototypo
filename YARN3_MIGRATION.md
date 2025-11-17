# Yarn 3 Migration

This project has been configured to use Yarn 3.8.7 (Berry).

## Setup

Yarn 3 is configured via:
- `.yarnrc.yml` - Yarn configuration
- `.yarn/releases/yarn-3.8.7.cjs` - Yarn 3 binary  
- `nodeLinker: node-modules` - Uses traditional node_modules (not PnP)

## First-Time Setup

After cloning the repository, run:

```bash
yarn install
```

This will:
1. Install all dependencies using Yarn 3
2. Generate a Yarn 3-compatible yarn.lock file
3. Create the node_modules directory

**Note:** The initial yarn.lock is in Yarn 1 format for compatibility. Yarn 3 will automatically migrate it on first install.

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

Some GitHub-hosted dependencies in package.json may require manual handling during `yarn install` in restricted network environments. If you encounter errors related to `classic.yarnpkg.com`:

1. Ensure you have good network connectivity
2. The install may work despite some warnings
3. If needed, you can temporarily use Yarn 1:
   ```bash
   yarn set version 1.22.22
   yarn install
   yarn set version 3.8.7
   ```

## Docker

The Dockerfile has been updated to use Corepack for Yarn 3:
```bash
docker compose up
```

## Migration from Yarn 1

Yarn 3 can read Yarn 1 lockfiles for compatibility. On first `yarn install`, it will work with the existing lockfile. To fully migrate to Yarn 3 format, the lockfile will be updated automatically.

