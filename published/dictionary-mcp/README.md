# Free Dictionary

English dictionary lookups: definitions by part of speech, examples, synonyms and antonyms for any word - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dictionary-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dictionary-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dictionary-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `define` | Definitions of a word, grouped by part of speech. |
| `synonyms` | Synonyms and antonyms of a word, with pronunciation links. |

## Data source

Free Dictionary API (dictionaryapi.dev, Wiktionary-based)
