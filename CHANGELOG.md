# Changelog

## 0.2.0

### Minor Changes

- **Stateless Agent Migration**: Removed the requirement for remote agents to have direct access to the Paperclip REST API. The bridge now injects all necessary context into the wake prompt.
- **Automated Status Proxying**: Implemented a "Proxy Secretary" model that scans agent summaries for `STATUS: DONE` or `STATUS: BLOCKED` and autonomously updates Paperclip issue states.
- **Prompt Refactoring**: Redesigned the agent wake prompt to be cleaner, more professional, and free of technical metadata noise.
- **Schema Cleanup**: Removed the deprecated `paperclipApiUrl` configuration field.
- **Retry Loop Prevention**: Explicitly include agent summaries in execution results to satisfy Paperclip invariants and prevent orphaned issue retries.

## 0.1.4

### Patch Changes

- Inject Paperclip API Key directly into the wake message using per-run JWTs (`supportsLocalAgentJwt`).
- Remove `claimedApiKeyPath` configuration field as the agent no longer needs to read the key from its local filesystem.
- Update unit tests to verify API key injection and schema cleanup.

## 0.1.3

### Patch Changes

- [#10](https://github.com/gregagi/paperclip-openclaw-bridge/pull/10) [`3a4c819`](https://github.com/gregagi/paperclip-openclaw-bridge/commit/3a4c819ada16e2ab99e648e63d673cdc7987db05) Thanks [@gregagi](https://github.com/gregagi)! - Align package metadata and root exports more closely with known external adapter examples by adding manifest metadata, a default adapter export, and explicit main/types entries.

- [#10](https://github.com/gregagi/paperclip-openclaw-bridge/pull/10) [`3a4c819`](https://github.com/gregagi/paperclip-openclaw-bridge/commit/3a4c819ada16e2ab99e648e63d673cdc7987db05) Thanks [@gregagi](https://github.com/gregagi)! - Expose stable device-auth configuration in the adapter schema, including `devicePrivateKeyPem`, and default requested scopes to include `operator.pairing` for auto-pairing flows.

## 0.1.2

### Patch Changes

- [#8](https://github.com/gregagi/paperclip-openclaw-bridge/pull/8) [`2fd2552`](https://github.com/gregagi/paperclip-openclaw-bridge/commit/2fd25523a12243b450b2d780d7c9674334e5440d) Thanks [@gregagi](https://github.com/gregagi)! - Align package metadata and root exports more closely with known external adapter examples by adding manifest metadata, a default adapter export, and explicit main/types entries.

## 0.1.1

### Patch Changes

- [#5](https://github.com/gregagi/paperclip-openclaw-bridge/pull/5) [`56e5439`](https://github.com/gregagi/paperclip-openclaw-bridge/commit/56e54391eab70e01715dd06cda9975e25cc28bab) Thanks [@gregagi](https://github.com/gregagi)! - Add an adapter config schema so Paperclip can render the required OpenClaw Bridge fields, including the gateway WebSocket URL, when creating or editing agents.

## Unreleased

- Switch release automation to Changesets-driven versioning and npm publishing
- Add CI on PRs and `main` so validation runs separately from publishing
- Document squash-merge + semver + changeset workflow for autonomous releases

## 0.1.0

- Initial standalone `openclaw_bridge` adapter package for Paperclip
- Forked from Paperclip's built-in OpenClaw gateway adapter surface
- Strips root-level `paperclip` params from outbound OpenClaw gateway requests
- Adds a regression test for strict OpenClaw gateway compatibility
