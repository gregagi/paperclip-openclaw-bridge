# Changelog

## Unreleased

- Publish to npm automatically when a GitHub Release is published
- Validate that the release tag matches `package.json` version before publishing
- Publish prereleases to npm under the `next` dist-tag by default

## 0.1.0

- Initial standalone `openclaw_bridge` adapter package for Paperclip
- Forked from Paperclip's built-in OpenClaw gateway adapter surface
- Strips root-level `paperclip` params from outbound OpenClaw gateway requests
- Adds a regression test for strict OpenClaw gateway compatibility
