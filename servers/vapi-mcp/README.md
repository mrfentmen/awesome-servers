# vapi-mcp

Query the Vapi API (free tier key; set VAPI_API_KEY, Bearer): assistants, single assistant, call history, call details.

## Tools

- `list_assistants` — Voice assistants on the account, with id and model.
- `get_assistant` — One assistant by id, with its prompt and voice config.
- `list_calls` — Call history with duration, cost and outcome.
- `get_call` — One call by id, with transcript and recording URL.

## Source

[vapi-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/vapi-mcp)
