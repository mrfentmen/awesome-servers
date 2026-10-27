# Star Wars API MCP

SWAPI: characters, planets, films, starships, vehicles and species, with film cross-references — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y swapi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "swapi-mcp": { "command": "npx", "args": ["-y", "swapi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_star_wars` | Search any resource by name |
| `star_wars_detail` | One record with its full field list |
| `list_resource` | First page of a resource |
| `film_chronicle` | All nine films in story order |
| `character_films` | Which films a character appears in |

## Example

```
SWAPI people matching "skywalker" (3 results):

1. Luke Skywalker — born 19BBY, male, 172cm, 77kg (id 1)
```

## Notes

Uses swapi.dev and falls back to the community mirror swapi.py4e.com when the primary is down. Covers the six classic films' data set only — newer series are not in SWAPI.

## Licence

MIT
