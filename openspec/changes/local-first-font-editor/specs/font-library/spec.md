## ADDED Requirements

### Requirement: Templates listed in the library
The library at `#/library/home` SHALL show the five bundled templates: Spectral, Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, Prototypo Fell.

#### Scenario: Library shows templates
- **WHEN** a user with a local session opens `#/library/home`
- **THEN** all five template names are visible

### Requirement: Template JSON is fetchable
Each template SHALL be available at `/templates/<templateName>/font.json` after `pnpm start` copies them from `node_modules`.

#### Scenario: Template font.json loads
- **WHEN** the app requests `/templates/venus.ptf/font.json`
- **THEN** the response is JSON with `fontinfo` and `controls`

### Requirement: Families persist locally
Creating a family SHALL store it in `prototypo-local-db` and return it on the user's `library` query.

#### Scenario: Create family appears in library
- **WHEN** `createFamily` is called with a name and template
- **THEN** the family is persisted and `user { library { name } }` includes that name
