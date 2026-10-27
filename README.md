# awesome-servers

One repo for three families of servers, each subtree keeping its own layout and tooling so it
can still be built, run and published on its own.

| Subtree | What it holds | Run one |
|---|---|---|
| [`mcp/`](mcp) | 6 TypeScript MCP servers, plus 230 published packages in [`published/`](published) | `cd mcp/servers/<slug> && npm install && npm run build` |
| [`acp/`](acp) | 79 Python ACP agents | `python3 acp/agents/<name>/agent.py` |
| [`a2a/`](a2a) | 37 Python A2A servers plus the shared `a2a_kit` | `python3 a2a/servers/<name>/server.py` |
| [`watchd/`](watchd) | a threshold watcher that runs the feeds between editor sessions | `python3 watchd/watchd.py --config conditions.json --loop` |
| [`site/`](site) | the published site: registry with search, the public-feed atlas, watchd plans | <https://mrfentmen.github.io/awesome-servers/> |

Most servers read public data with no key of their own; the ones wrapping a vendor API take
that vendor's key. **Nothing in this repo asks a caller to pay.** On 2026-10-17 the
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

* The MCP side holds TypeScript servers, one npm package each, and 230 published packages under
  `published/`; mcp/MISSING.md
  documents the check that preceded every build: what was searched, what was skipped and why
  the domain still counted as uncovered.
* On the ACP side there were **zero domain agents** before this repo — every agent on the
  official list was a coding agent. These 79 Python agents are the first non-coding ACP
  agents, and several use protocol surfaces no other agent uses in production
  (`session/request_permission` for dataset reads, `fs/write_text_file` for a briefing file,
  `session/cancel` for a conditional watch, image content blocks, a live SSE push feed), each
  proved-unused in the wild by search at build time. Two more firsts carry their own proof:
  the [`orchestrator`](acp/agents/orchestrator) is an agent whose feeds are *agents* — it
  spawns sibling repo agents as real ACP child processes and merges their answers — and the
  [`nyc`](acp/agents/nyc) pack is the first multi-agency city surface.
* [`acp/MISSING.md`](acp/MISSING.md) doubles as the **public-feed atlas**: every keyless
  feed probed live, with its date, what it answered and whether it still works. The
  published site renders that table at <https://mrfentmen.github.io/awesome-servers/atlas.html>.
* The pattern across all three subtrees is the same thesis: wrap one real, keyless public
  dataset, answer honestly about what the feed did and did not say, and keep the whole thing
  small, tested and self-contained.

## Publishing

* MCP servers publish from `mcp/servers/<slug>` (its own `package.json`, version and README).
* ACP and A2A servers are repo-run today (Python, no packaging step).

## Built on top of it

Creatures that use this corpus as their world live in the sibling repo
[`mrfentmen/superagents`](https://github.com/mrfentmen/superagents) (public, with its own
claim-check in `MISSING.md`):

* **polymath** — routes your question to the most fitting agents of this repo, spawns each
  as a real ACP child process, and merges the answers into one brief with per-row citations;
  a sibling that fails appears as a named row, never silence. Its registry is a data file
  and its ranking is deterministic word-scoring, not a model opinion.
* **sentry** — one plain sentence ("watch air quality in Denver over 150") becomes a tracked
  watch: a permission-asked protocol write produces the conditions file this repo's
  `watchd/` obeys unchanged, plus the activation lines. Checks it can author today:
  air thresholds, quake magnitudes within a radius, river gauges at flood stage.
* **fedora hat guy** — the persona agent in his own repo
  [`mrfentmen/fedora-hat`](https://github.com/mrfentmen/fedora-hat): says "never miss" and
  means it — one sentence installs the full crown of watches (air + quakes, gauge-named
  flood) in one permissioned write, and your other questions are forwarded to the siblings
  above with every row cited.
* **instink** — the instinct agent in his own repo
  [`mrfentmen/instink`](https://github.com/mrfentmen/instink): compiles a skill into a
  reflex — a matcher plus the answer it fires, with hit/miss counters and honest
  promotion/demotion. The skill doc stays one step away, never deleted.
* **contextink** — the context agent in his own repo
  [`mrfentmen/contextink`](https://github.com/mrfentmen/contextink): you say "do this" and
  it acquires the context from the repo, git, and recent files so you don't have to explain
  it; asks only the minimal high-information-gain questions when acquisition fails.
* **rewind** — the replay agent in his own repo
  [`mrfentmen/rewind`](https://github.com/mrfentmen/rewind): replays agent runs and mutates
  one variable to see what would have happened. Replay + mutate + diff for agent traces.
* **scopink** — the scope agent in his own repo
  [`mrfentmen/scopink`](https://github.com/mrfentmen/scopink): checks if an action is within
  the scope of what was asked. Detects scope creep in agent plans.
* **curious** — the curiosity agent in his own repo
  [`mrfentmen/curious`](https://github.com/mrfentmen/curious): proactively seeks information
  it doesn't have. Scans for knowledge gaps, seeks answers, learns facts.
* **bored** — the idle agent in his own repo
  [`mrfentmen/bored`](https://github.com/mrfentmen/bored): uses idle time productively.
  Consolidates memories, explores areas, prepares for tasks.

Point the polymath at a checkout of this repo with `AWESOME_SERVERS_HOME=$PWD/awesome-servers`
and it federates across the two repos live.

## Published snapshot (`published/`)

`published/` holds one directory per npm package, byte-for-byte what the registry
serves: 230 packages, every version matching npm `latest`.

- `published/INDEX.md` is generated from the tree by `python3 scripts/index-published.py`.
- `scripts/sync-published-snapshot.py` re-downloads every package from npm; run it only
  when every local fix has been published, because it overwrites `dist/` from the tarballs.
- No package carries a licence gate: 0 reference `MCP_LICENSE_KEY` and 0 shipped tools
  answer `Not yet implemented`.
- Every package links to this repo (`mrfentmen/awesome-servers`) as its source.

`servers/` holds the older per-server source that predates the snapshot. Where the two
disagree, `published/` is what users actually install.
