# jisho mcp

The [Jisho.org](https://jisho.org) Japanese English dictionary. Words,
readings, senses, JLPT levels. No key.

## Tools

- `search_words`, Japanese text, romaji, or English keywords
- `search_by_tag`, feature searches: `#common`, `jlpt-n1`…`jlpt-n5`,
`wanikani10`, English meanings

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What does 大丈夫 mean?"
> `search_words("daijoubu")` → 大丈夫 (だいじょうぶ), safe; sound; problem free [Na adj] ⭐common, JLPT N5

> "Give me common JLPT N5 words"
> `search_by_tag("jlpt-n5")`
