# vndb-mcp

Search the [Visual Novel Database](https://vndb.org) (API v2). No auth, no key.

## Tools

- `search_vns` — search VNs, sort by rating / popularity / released / title
- `get_vn` — full details: description, tags, developers, platforms
- `search_characters` — find characters by name or trait
- `get_vn_releases` — every release of a VN (platforms, languages, catalogs)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What's the highest-rated VN with mecha?"
> `search_vns("mecha", sort="rating")`

> "Does Muv-Luv have a console release?"
> `get_vn_releases("v92")`
