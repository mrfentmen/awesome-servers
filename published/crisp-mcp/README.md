# crisp-mcp

Query Crisp (set CRISP_IDENTIFIER + CRISP_KEY, Basic; website-scoped reads): visitor list, people profile, conversation.

## Tools

- `list_visitors` — Visitors on the site right now, with last page seen.
- `get_profile` — Crisp profile for one email, with custom fields.
- `get_conversation` — Messages in one conversation, by session id.

- `conversations` — Paged conversation list.
- `conversation_messages` — Messages in a session.
- `conversation_meta` — Session metadata.

## Source

[crisp-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/crisp-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
