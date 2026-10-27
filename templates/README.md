# Actor template

`actor-mcp/` is the wrapper every Actor in `actors/` is generated from. It is the
piece that turns a stdio MCP server into a paid Apify Actor:

| File | What it does |
| --- | --- |
| `src/main.ts` | Actor entry point: starts the HTTP server in standby mode, otherwise health-checks the proxied server so every run produces a dataset item |
| `src/server.ts` | Streamable HTTP MCP transport served at `/mcp` |
| `src/mcp.ts` | Client for the vendored stdio server, spawned through `MCP_COMMAND` |
| `src/billing.ts` | Pay-per-event charging: a tool call, a list request, a resource read, a prompt |
| `.actor/actor.json` | Actor manifest (standby mode, web server MCP path `/mcp`) |
| `.actor/pay_per_event.json` | The prices the Store bills |
| `Dockerfile` | Two-stage build: compile here, run with production deps only |

This one is the jobicy Actor (the first one built), which is why `main.ts` still says
`MCP_COMMAND = ['node', 'vendor/jobicy-mcp/index.js']`. The generator rewrites that
line, the `mcpServer` name, the endpoint host and the jobicy comments for each server
it is pointed at.

## How a server becomes an Actor

`gen_actor.py` in the pilot tooling:

1. builds the server package from `servers/<slug>/` with `tsc`,
2. copies this template, ignoring `node_modules`, `dist`, `package-lock.json` and
   `vendor` (so the template's own jobicy build is never shipped),
3. vendors the built server into `vendor/<slug>/` and copies its `package.json` beside it,
4. rewrites the jobicy references in `src/main.ts` and fails loudly if any are left,
5. reads the tool list and Store copy (`listings.json`) into `.actor/actor.json`,
   `package.json` and the Actor `README.md`.

Changing anything here changes every Actor generated afterwards. Existing Actors keep
their vendored build until they are regenerated and pushed, which is what
`actor_staleness.py` measures.
