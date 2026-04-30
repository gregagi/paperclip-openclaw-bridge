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

Use adapter type `openclaw_bridge` and config like:

```json
{
  "url": "ws://127.0.0.1:18789",
  "role": "operator",
  "scopes": ["operator.admin"],
  "authToken": "<gateway-token>",
  "timeoutSec": 120,
  "waitTimeoutMs": 120000,
  "disableDeviceAuth": false,
  "sessionKeyStrategy": "issue"
}
```

## Development

```bash
npm install
npm run typecheck
npm run test
npm run build
```

## Release and publish

Publishing is automated through GitHub Actions when a **GitHub Release** is published.

### Stable release flow

1. Merge code to `main`
2. Bump `package.json` version
3. Update `CHANGELOG.md`
4. Create and publish a GitHub Release with tag `vX.Y.Z`
5. The workflow validates that the tag matches `package.json`, then runs typecheck, tests, build, and `npm publish`

### Prerelease flow

If you publish a GitHub prerelease such as `v0.2.0-beta.1`, the workflow publishes it to npm under the `next` dist-tag by default.

### Manual fallback

The workflow also supports manual dispatch if a release ever needs to be re-run deliberately.

## Package contract

This package exports:

- `.` → root metadata + `createServerAdapter()`
- `./server` → server adapter entrypoints
- `./ui` → helper UI exports
- `./cli` → CLI output formatter
- `./ui-parser` → self-contained Paperclip dynamic UI parser

## License

MIT
