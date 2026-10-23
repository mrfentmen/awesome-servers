# neverbounce-mcp

MCP server for the [NeverBounce](https://neverbounce.com) email-verification
API (ZoomInfo): verify one email before an agent sends to it, watch account
credits, and read out bulk-verification jobs.

Checked 2026-10-23: NeverBounce has no first-party MCP server, and npm has no
MCP package under this name (only their plain `neverbounce` API client).
Third-party connector platforms exist but ship no MCP package — see
`mcp/MISSING.md` for the log.

## Tools

| Tool | What it does |
|---|---|
| `nb_account_info` | credits remaining + monthly usage |
| `nb_verify_email` | one `/single/check`: result (valid/invalid/disposable/catchall/unknown), flags, suggested correction |
| `nb_job_status` | poll a bulk job |
| `nb_job_results` | page through a finished job's per-email results |
| `nb_job_delete` | delete a bulk job (destructive, scoped to that job) |

Deliberately out of scope: `jobs/create` — the vendor requires a list file
uploaded through their own workflow first, which no MCP server should fake.

## Auth

One static key. In the NeverBounce dashboard create a **Custom Integration
App**; its key looks like `secret_xxxx`.

```sh
export NEVERBOUNCE_API_KEY=secret_xxxx
```

## Run

```sh
cd mcp/servers/neverbounce-mcp
npm install
npm run build
node dist/index.js        # stdio MCP server
npm test                  # unit tests (pure helpers)
python3 tools/smoke.py    # live check; SKIPs honestly without a key
```

## Wire into OpenCode (`~/.config/opencode/opencode.jsonc`)

```jsonc
"neverbounce": {
  "type": "local",
  "command": ["node", "/path/to/awesome-servers/mcp/servers/neverbounce-mcp/dist/index.js"],
  "enabled": true,
  "environment": { "NEVERBOUNCE_API_KEY": "secret_..." },
  "timeout": 60000
}
```

## Honesty notes

- Verifications are metered by the vendor (credits). `nb_verify_email` spends
  one; the smoke check uses `/account/info`, which does not.
- Pagination caps here (`items_per_page` <= 500) are this server's guardrails,
  not vendor law; the API answers with `query_info` totals either way.
