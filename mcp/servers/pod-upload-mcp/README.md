# pod-upload-mcp

MCP server that drives **browser-based uploads of original artwork to
print-on-demand marketplaces** - starting with Redbubble, TeePublic next.

There is no upload API on either marketplace, so this server wraps the real web
apps with Playwright using a **persistent, visible browser profile**. The human
logs in with their own hands; the server and the calling agent only drive forms.
No credentials are ever read or stored. Payout, Stripe, payment and identity
screens are never touched by automation - humans only.

## Tools

| Tool | What it does | Status |
|---|---|---|
| `pod_browser_status` | session + open pages | stable |
| `pod_open_login` | opens login, polls until the human finishes | stable |
| `redbubble_upload_work` | one design end-to-end: file → title → main tag → supporting tags → description → mature=No → rights check → Save; returns work ID + slug | field-verified 2026-10-20 (9/9 live publishes) |
| `redbubble_list_works` | portfolio listing with edit hrefs | field-verified 2026-10-20 |
| `redbubble_probe_form` | dumps form field diagnostics | for selector repair |
| `teepublic_upload` | designer-flow upload (title + tags) | **experimental** - pin selectors on first live run |

## Redbubble field knowledge baked in (from a live session)

- no upload API exists; `/portfolio/images/new` is the road
- master file input = first `input[type=file]` on the page
- title: `input[placeholder="Example: Great Wave of Trees"]`
- mature-content radios are React-controlled and revert synthetic clicks - trusted
  label clicks inside the "Is this mature content?" block are required
- the rights checkbox is not inside a `<label>`; matched via aria/text "I agree to the Redbubble"
- success = URL leaves `/images/new` for `/studio/promote/<workId>`
- portfolio works permalink pattern: `/portfolio/images/{id}-{slug}/edit`

## Ethics and rules of engagement

- RB/TP do not sanction automation; this is unofficial tooling for an artist's
  **own original work**, run at **human pace** in small batches.
- The calling agent must never provide credentials; if a captcha appears the
  human solves it.
- Payout/identity/Stripe screens are out of scope forever.

## Run

```sh
cd mcp/servers/pod-upload-mcp
npm install
npm run build
node dist/index.js        # stdio MCP server
npm test                  # unit tests (pure helpers)
```

## Wire into OpenCode (`~/.config/opencode/opencode.jsonc`)

```jsonc
"pod-upload": {
  "type": "local",
  "command": ["node", "/Users/test/awesome-servers-work/mcp/servers/pod-upload-mcp/dist/index.js"],
  "enabled": true,
  "timeout": 120000
}
```

Env: `POD_MCP_PROFILE` - browser profile dir (default `~/.pod-upload-mcp/profile`).

## Live-run ledger (what this server has done)

| Date | Platform | Result |
|------|----------|--------|
| 2026-10-20 | Redbubble | 9/9 works uploaded by driving this same flow interactively (see `pod-upload-mcp/README`history and the calling session's `kits/verify_log.md`) |
