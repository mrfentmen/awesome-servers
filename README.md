# awesome-servers

One repo for three families of servers, each subtree keeping its own layout and tooling so it
can still be built, run and published on its own.

| Subtree | What it holds | Run one |
|---|---|---|
| [`mcp/`](mcp) | 869 TypeScript MCP servers (one npm package each) | `cd mcp/servers/<slug> && npm install && npm run build` |
| [`acp/`](acp) | 76 Python ACP agents | `python3 acp/agents/<name>/agent.py` |
| [`a2a/`](a2a) | 37 Python A2A servers plus the shared `a2a_kit` | `python3 a2a/servers/<name>/server.py` |

Most servers read public data with no key of their own; the ones wrapping a vendor API take
that vendor's key. **There is no paywall anywhere in this repo any more.** On 2026-10-17 the
licence machinery was removed for good: the per-tool `src/license.ts` gates are gone from the
MCP servers, and the A2A and ACP trees no longer carry the hosted licence-gateway half — the
skills that used it now answer with an explicit not-implemented stub. Nothing here asks a
caller to pay, and nothing they run is refused with a buy link.

Nothing here is generated: each subtree's README says what its servers read, and every server
has its own unit tests (`mcp/servers/<slug>/tests`, `acp/agents/<name>/tests`,
`a2a/servers/<name>/tests`) plus a live smoke check (`tools/smoke*.py`,
`a2a/tools/smoke_all.py`).

## Publishing

* MCP servers publish from `mcp/servers/<slug>` (its own `package.json`, version and README).
* ACP and A2A servers are repo-run today (Python, no packaging step).
