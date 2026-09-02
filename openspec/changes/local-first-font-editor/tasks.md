## 1. Local session

- [x] 1.1 Auto-issue `local-prototypo-token` and seed `prototypo-local-db`
- [x] 1.2 Resolve GraphQL through in-process `executeLocalQuery`
- [x] 1.3 Unit test: `ensureLocalSession` + `authenticateEmailUser` + `createFamily`

## 2. Library and templates

- [x] 2.1 Copy templates into `public/templates/<name>/font.json` on `yarn start`
- [x] 2.2 Load templates with `fetch('/templates/...')`
- [x] 2.3 Show Spectral, Antique Gothic, Elzevir, Grotesk, Fell in the library

## 3. Font construction

- [x] 3.1 Merge control inits in `FontPrecursor.constructFont`
- [x] 3.2 Default missing/NaN Formula params to `0`
- [x] 3.3 Unit test: Formula missing/NaN params
- [x] 3.4 Unit test: FontPrecursor `controlInits`

## 4. Vite runtime

- [x] 4.1 ESM Vite config, Flow strip, SVG/`please-wait` shims, no webpack `hot(module)`

## 5. Demo and verify

- [x] 5.1 Storyboard beats covering library, create, width slider, slant slider
- [x] 5.2 `yarn test:unit` green
- [ ] 5.3 Record demo of create + customize
- [ ] 5.4 Extract frames and verify each beat against the named spec scenario
