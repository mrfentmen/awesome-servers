# Stack Exchange MCP

Stack Exchange: search questions, tags, answers and user profiles across 180+ sites — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/stackexchange-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "stackexchange-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/stackexchange-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_questions` | Relevance search on any Stack Exchange site |
| `questions_by_tag` | Top-voted questions under one tag |
| `hot_questions` | What is hot right now |
| `question_detail` | Full question body, score, tags and link |
| `answers_for_question` | Highest-voted answers, HTML converted to text |
| `user_profile` | Reputation, badges, member-since |

## Example

```
1. [1094] What are the differences between Rust's `String` and `str`?
   16 answers · answered · 241091 views · string, rust
   https://stackoverflow.com/questions/24158114/...
```

## Notes

Uses the keyless Stack Exchange API v2.3. Every tool accepts a `site`
(`stackoverflow`, `superuser`, `askubuntu`, `math`, ...). The API allows a few
hundred calls per day per IP without a key; errors are surfaced with the API's
own message.

## Licence

MIT
