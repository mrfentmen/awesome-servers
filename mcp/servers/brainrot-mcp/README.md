# brainrot mcp

Decodes internet slang, brainrot vocabulary, and niche subculture terms.
**100% offline**, the lexicon ships with the server. Includes the classic
brainrot (skibidi, sigma, rizz, fanum tax, ohio, mogging...) plus the
underground rap scene (Nettspend, Xavier Wulf era, Osamason, KanKan,
LazerDim700, plugg, rage...) and the TikTok era.

## Tools

- `decode_term`, meaning, origin, example, vibe for one term
- `search_terms`, fuzzy search by term, meaning, or vibe
- `decode_text`, scan a caption/tweet and decode every known term in it
- `random_term`, expand your brainrot
- `lexicon_stats`, term count + vibe breakdown

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> Input: "bro that skibidi edit was bussin no cap, he rizzed up the whole room fr fr"
>
> Output: full breakdowns of skibidi, bussin, no cap, rizz, fr fr.

## Add terms

Open `src/lexicon.ts`, entries are plain objects (`term`, `meaning`,
`origin`, `example`, `vibe`). Rebuild and it's live.
