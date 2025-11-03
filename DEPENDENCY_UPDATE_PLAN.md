# Dependency Update Strategy

This document outlines the strategy for gradually updating dependencies in Prototypo.

## Current Status

- Node.js: Updated from >=4 to >=18
- Docker: Added with Node 18
- CI/CD: GitHub Actions workflow added

## Dependencies Requiring Updates

### High Priority (Security/Compatibility)

1. **lodash** (^4.17.11 → ^4.17.21)
   - Known security vulnerabilities in older versions
   - Update: `yarn upgrade lodash@^4.17.21`

2. **moment** (^2.10.3 → ^2.29.4 or migrate to date-fns)
   - Very outdated, consider migration to date-fns or dayjs
   - Update: `yarn upgrade moment@^2.29.4`

3. **jszip** (^2.5.0 → ^3.10.1)
   - Major version behind
   - Update: `yarn upgrade jszip@^3.10.1`

4. **opentype.js** (^0.6.9 → ^1.3.4)
   - Core dependency for font handling
   - Update: `yarn upgrade opentype.js@^1.3.4`

5. **React ecosystem** (16.4.0 → 18.x)
   - Major version updates available
   - Requires code changes for migration
   - Plan: Gradual migration path

### Medium Priority

1. **webpack** (^3.6.0 → ^5.x)
   - Major version behind
   - Requires configuration updates

2. **babel** ecosystem
   - Mix of beta and stable versions
   - Standardize on latest stable versions

3. **gulp** (^3.9.1 → ^4.x or ^5.x)
   - Consider migration to npm scripts

### Low Priority

1. **normalize.css** (^3.0.3 → ^8.0.1)
2. **classnames** (^2.1.2 → ^2.3.2)
3. **bluebird** (^3.1.1 → ^3.7.2)

## Update Process

1. Update one category at a time
2. Test after each update
3. Commit working changes
4. Document any breaking changes

## Testing Strategy

- Run `yarn lint` after updates
- Run `yarn test` after updates
- Run `yarn build:dist` after updates
- Manual testing of key features
