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

## Novel and original

Nearly all of this is first-of-its-kind work, not a port of an existing catalogue. Before each
server or agent was built, it was checked against the official tool lists (the MCP registries,
`agentclientprotocol.com`'s agent list and registry) and a live GitHub search for the same
domain, and the research logs record what was found and why it still counted as missing — see
[`mcp/MISSING.md`](mcp/MISSING.md), [`acp/MISSING.md`](acp/MISSING.md) and
[`a2a/docs/`](a2a/docs). Highlights:

* The MCP side holds 869 TypeScript servers, one npm package each, and mcp/MISSING.md
  documents the check that preceded every build: what was searched, what was skipped and why
  the domain still counted as uncovered.
* On the ACP side there were **zero domain agents** before this repo — every agent on the
  official list was a coding agent. These 76 Python agents are the first non-coding ACP
  agents, and several use protocol surfaces no other agent uses in production
  (`session/request_permission` for dataset reads, `fs/write_text_file` for a briefing file,
  `session/cancel` for a conditional watch, image content blocks, a live SSE push feed), each
  proved-unused in the wild by search at build time.
* The pattern across all three subtrees is the same thesis: wrap one real, keyless public
  dataset, answer honestly about what the feed did and did not say, and keep the whole thing
  small, tested and self-contained.

## Publishing

* MCP servers publish from `mcp/servers/<slug>` (its own `package.json`, version and README).
* ACP and A2A servers are repo-run today (Python, no packaging step).
