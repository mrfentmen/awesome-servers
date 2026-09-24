# Storyblok MCP

MCP server for Storyblok: stories, spaces. Needs an API token.

## Setup

Get a token at space Settings > Access Tokens, then:

```bash
export STORYBLOK_TOKEN=your_token_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_space`: Name, domain, plan.
- `list_stories`: Slugs and publish dates.
- `get_story`: Content keys.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to Storyblok's API. All tools are read-only.
