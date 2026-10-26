# vapi-mcp

Query the Vapi API (free tier key; set VAPI_API_KEY, Bearer): assistants, single assistant, call history, call details.

## Tools

- `list_assistants` — Voice assistants on the account, with id and model.
- `get_assistant` — One assistant by id, with its prompt and voice config.
- `list_calls` — Call history with duration, cost and outcome.
- `get_call` — One call by id, with transcript and recording URL.

## Source

[vapi-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/vapi-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
