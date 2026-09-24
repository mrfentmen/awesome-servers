# Weights & Biases MCP

MCP server for Weights & Biases: profile, projects, runs. Needs a free API key.

## Setup

Get a key at https://wandb.ai/settings/ (User Settings > API keys, free), then:

```bash
export WANDB_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `my_profile`: Username and email.
- `list_projects`: Projects of a user or team.
- `list_runs`: Recent training runs with states.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to W&B's API. All tools are read-only.
