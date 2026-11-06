# ACL Anthology MCP

ACL Anthology: 100k+ computational-linguistics papers — paper lookup, BibTeX, volume and venue browsing — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/acl-anthology-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "acl-anthology-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/acl-anthology-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `paper` | One paper by Anthology id: title, authors, venue, pages, DOI, PDF, abstract |
| `bibtex` | The Anthology's own BibTeX entry, ready to paste into a bibliography |
| `volume_papers` | Papers in one proceedings volume, paginated, with ids and links |
| `find_in_volume` | Title search inside one volume, when you know the venue but not the id |
| `event_volumes` | Every volume published for one event (all of ACL 2024, say) |

## Example

```
Quantized Side Tuning: Fast and Memory-Efficient Tuning of Quantized Large Language Models

Authors: Zhengxin Zhang, Dan Zhao, Xupeng Miao, Gabriele Oliaro, Zhihao Zhang, Qing Li +2 more
Venue: Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)
Published: 2024/8
Pages: 1-17
DOI: 10.18653/v1/2024.acl-long.1
Anthology: https://aclanthology.org/2024.acl-long.1/
PDF: https://aclanthology.org/2024.acl-long.1.pdf
```

## Notes

Uses the Anthology's published per-paper BibTeX (`<id>.bib`) and its static
archive pages for paper, volume and event records. Volume and event pages are
large (an ACL volume page is a few MB), so parsed listings are cached in-process
for ten minutes; repeated calls in one session are cheap.

The Anthology exposes no text-search API, so `find_in_volume` matches titles
inside one volume rather than searching the whole archive. To search everything,
`@mrfentmen/arxiv-mcp`, `@mrfentmen/crossref-mcp` and `@mrfentmen/openalex-mcp`
cover the same papers by metadata.

Ids come in two shapes: modern (`2024.acl-long.1`) and pre-2019 (`P19-1001`).

## Licence

MIT
