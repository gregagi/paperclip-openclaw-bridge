# Changelog

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
