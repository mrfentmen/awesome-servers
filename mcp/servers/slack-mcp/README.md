# slack-mcp

Query the Slack Web API (bot token; set SLACK_BOT_TOKEN, xoxb): channels, history, post messages. Posting is real.

## Tools

- `list_channels` — Public channels in the workspace, with id and name.
- `get_history` — Recent messages in one channel, newest last.
- `post_message` — Post a message to a channel as the bot, visible to everyone.

- `list_users` — Workspace members.
- `user_info` — Member profile.
- `channel_info` — Channel details.
- `thread_replies` — Replies in a thread.
- `emoji_list` — Workspace emoji.
- `pin_message` — Pin a REAL message.
- `set_topic` — Set a REAL channel topic.

## Source

[slack-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/slack-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `service_incident_history`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-slack-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
