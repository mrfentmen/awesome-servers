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
