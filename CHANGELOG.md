# Changelog

## Unreleased

- Switch release automation to Changesets-driven versioning and npm publishing
- Add CI on PRs and `main` so validation runs separately from publishing
- Document squash-merge + semver + changeset workflow for autonomous releases

## 0.1.0

- Initial standalone `openclaw_bridge` adapter package for Paperclip
- Forked from Paperclip's built-in OpenClaw gateway adapter surface
- Strips root-level `paperclip` params from outbound OpenClaw gateway requests
- Adds a regression test for strict OpenClaw gateway compatibility
