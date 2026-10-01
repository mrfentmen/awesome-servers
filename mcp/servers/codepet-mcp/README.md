# CodePet MCP

A local MCP companion for the CodePet Chrome extension. It exposes pet status, quests, and source free coding events.

## Tools

* `get_pet_status` reads local pet metadata
* `record_coding_event` records language, line count, test count, file count, and status
* `list_quests` shows progress
* `clear_pet_history` removes local metadata history

Do not send source code to this server. It intentionally accepts metadata only.

## Run

```bash
npm install
npm run build
node dist/index.js
```

The state file defaults to `~/.codepet/state.json`. Set `CODEPET_STATE_FILE` to use another local path.

## Privacy

No API key is required. The server makes no network requests. It never executes or stores source code.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_pet_status`: Read CodePet
- `record_coding_event`: Record source free coding metadata for CodePet. Never pass source code to this tool.
- `list_quests`: List the current CodePet quest ideas and progress based on local metadata.
- `clear_pet_history`: Clear CodePet

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_pet_status`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `find_coding_quests`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
