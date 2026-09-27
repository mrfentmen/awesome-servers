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
