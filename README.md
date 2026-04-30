# paperclip-openclaw-bridge

Third-party Paperclip adapter for connecting Paperclip to OpenClaw over the Gateway WebSocket protocol.

This package exists as a pragmatic external adapter path while Paperclip's built-in OpenClaw adapter remains unreliable for strict OpenClaw gateway deployments.

## What it changes

- Uses a distinct Paperclip adapter type: `openclaw_bridge`
- Keeps the familiar OpenClaw Gateway transport and config surface
- **Never sends a root-level `paperclip` key** in outbound OpenClaw `agent` requests
- Preserves Paperclip wake context by embedding it in the rendered `message` payload instead

That last point matters because current OpenClaw gateway validation rejects unknown top-level params with errors like:

```text
invalid agent params: at root: unexpected property 'paperclip'
```

## Install in Paperclip

### Option 1: install from npm

Once published:

```bash
curl -X POST http://localhost:3102/api/adapters/install \
  -H "Authorization: Bearer <paperclip-token>" \
  -H "Content-Type: application/json" \
  -d '{"packageName":"paperclip-openclaw-bridge"}'
```

### Option 2: install from local path

Useful for self-hosted testing before npm publish:

```bash
curl -X POST http://localhost:3102/api/adapters/install \
  -H "Authorization: Bearer <paperclip-token>" \
  -H "Content-Type: application/json" \
  -d '{"packageName":"/absolute/path/to/paperclip-openclaw-bridge","isLocalPath":true}'
```

## Configure an agent

In recent versions, Paperclip should render adapter-specific form fields for this external adapter automatically, including the required gateway WebSocket URL.

Use adapter type `openclaw_bridge` and config like:

```json
{
  "url": "ws://127.0.0.1:18789",
  "role": "operator",
  "scopes": ["operator.admin", "operator.pairing"],
  "authToken": "<gateway-token>",
  "devicePrivateKeyPem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "deviceFamily": "paperclip-openclaw-bridge",
  "timeoutSec": 120,
  "waitTimeoutMs": 120000,
  "disableDeviceAuth": false,
  "sessionKeyStrategy": "issue"
}
```

For device-auth deployments, generate a dedicated Ed25519 private key and save the full private PEM in `devicePrivateKeyPem`. Without a persisted key the adapter generates an ephemeral device identity each run, so every heartbeat can require a fresh manual approval.

```bash
openssl genpkey -algorithm Ed25519 -out ari-openclaw-device-key.pem
cat ari-openclaw-device-key.pem
```

## Development

```bash
npm install
npm run typecheck
npm run test
npm run build
```

## Release and publish

This repo uses **Changesets** for semver decisions, changelog generation, and npm publishing.

### Day-to-day flow

1. Open a PR with code changes
2. Add a changeset with `npx changeset` if the change should ship
3. Merge the PR to `main`
4. GitHub Actions automatically opens or updates a release PR
5. When that release PR is merged, GitHub Actions publishes the package to npm automatically

### Versioning rules

- `patch` for fixes and low-risk behavior corrections
- `minor` for backward-compatible features
- `major` for breaking changes

### Prereleases

If we want preview builds, we can cut prerelease versions such as `0.2.0-beta.1` through Changesets and publish them under a non-default npm dist-tag when needed.

### Merge strategy

Recommended default: **squash merge PRs into `main`**.

That keeps `main` readable while still preserving the full small-commit history inside each PR branch and PR timeline.

### Commit style

Use conventional-commit style when practical (`fix:`, `feat:`, `chore:`), but Changesets — not commit parsing — is the source of truth for version bumps and changelog entries.

## Package contract

This package exports:

- `.` → root metadata + `createServerAdapter()`
- `./server` → server adapter entrypoints
- `./ui` → helper UI exports
- `./cli` → CLI output formatter
- `./ui-parser` → self-contained Paperclip dynamic UI parser

## License

MIT
