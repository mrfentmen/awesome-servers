# Datamuse

Use this MCP server to wordplay. Rhymes, related words, spell checks, and word suggestions for any phrase.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `rhymes_with`: Find words that rhyme with a word.
- `means_like`: Find words and phrases with a similar meaning, with definitions.
- `related_to`: Find words commonly associated with a topic.
- `spell_check`: Check a word
- `word_suggestions`: Suggest words starting with a prefix.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `rhymes_with`.
