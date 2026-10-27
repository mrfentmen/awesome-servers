# JokeAPI

Jokes from JokeAPI across categories, with safe mode, one-liners and two-part setups - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jokeapi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jokeapi-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jokeapi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_joke` | One joke from a category, safe by default. |
| `jokes_batch` | Several jokes at once from one category. |

## Data source

JokeAPI v2 (safe mode on by default)
