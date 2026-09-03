## ADDED Requirements

### Requirement: Auto local session
The app SHALL start a local session on load without Graphcool credentials, writing token `local-prototypo-token` to `localStorage` key `graphcoolToken` and seeding `prototypo-local-db`.

#### Scenario: First visit has a session
- **WHEN** the app loads with empty `localStorage`
- **THEN** `graphcoolToken` is `local-prototypo-token` and `prototypo-local-db` contains a user record

#### Scenario: GraphQL stays in-process
- **WHEN** the client runs a GraphQL operation
- **THEN** it is resolved by the local API and SHALL NOT call a remote Graphcool host

### Requirement: Email auth is local
`authenticateEmailUser` SHALL return the local token so existing sign-in UI cannot block the editor.

#### Scenario: Authenticate returns local token
- **WHEN** `authenticateEmailUser` is invoked
- **THEN** the result token is `local-prototypo-token`
