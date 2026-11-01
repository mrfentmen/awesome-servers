# move-mcp

MCP server for the [Move](https://github.com/move-language/move) language. Move is a resource-oriented smart-contract language where values are linear by default, and a bytecode verifier enforces safety before anything runs on chain. Its type system is built around four abilities — `copy`, `drop`, `store` and `key` — that decide what a value may do.

This server answers language questions offline: the whole Move book, every declaration that appears in it, and real standard-library sources.

## What's inside

| Dataset | Count |
|---|---|
| Documentation sections (the Move book) | **222** |
| Declarations (struct, fun, enum, module, const, use, script) | **289** |
| Real `.move` source files from `move-stdlib` | **10** |

Generated from the upstream repository at commit `c453c90994cba0af30314fe4134acee57fb20d0c`.

## Install

```bash
npx -y move-mcp
# or
npm i -g move-mcp
```

Claude Desktop or any MCP client:

```json
{
  "mcpServers": {
    "move": {
      "command": "npx",
      "args": ["-y", "move-mcp"]
    }
  }
}
```

No API key, no network access at runtime.

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `overview` | none | Upstream repo, commit, dataset counts, book page list |
| `list_docs` | none | Every book page with its section count and doc id |
| `list_sections` | `doc` (optional) | `id — title` for one page or all of them |
| `get_section` | `id` (required) | Full section text, truncated at 60,000 chars with a marker |
| `search_docs` | `query` (required), `limit` (optional, default 5, max 20) | Title-first ranked hits with a snippet |
| `quickstart` | none | The book introduction and first examples |
| `lookup_symbol` | `name` (required) | Exact matches, then prefix matches, with signatures |
| `search_symbols` | `query` (required), `module` (optional), `limit` (optional, default 10, max 50) | Declarations matching the query |
| `list_modules` | none | Every book page by declaration count |
| `list_symbols_in_module` | `module` (required) | One page's declarations |
| `list_symbol_kinds` | none | Kinds with counts |
| `list_symbols_by_kind` | `kind` (required) | All declarations of one kind |
| `list_samples` | none | Bundled `.move` files with path and size |
| `get_sample` | `name` (required) | Full source of one file |
| `search_samples` | `query` (required), `limit` (optional, default 5) | Matching files with a code window |
| `search_all` | `query` (required), `limit` (optional, default 5) | Docs, declarations and samples in one answer |
| `list_abilities` | none | `copy`, `drop`, `store`, `key` with the sections that define them |

## Example prompts

- "What is the difference between `copy` and `store` in Move?"
- "Show me how `Option` is implemented in the Move standard library."
- "What does a `script` look like, and how is it different from a module?"
- "Find every function in the book that mentions `acquires`."
- "How do I write a unit test in Move?"

## Data provenance

Everything is extracted from the upstream repository at build time:

- `language/documentation/book/src/*.md` is split into 222 sections by heading;
- declarations are parsed from fenced Move code across the book — 289 of them, each keeping its kind and the page it appeared on;
- samples are the real `language/move-stdlib/sources/*.move` files, unmodified.

The result ships as JSON in `data/` and is read from disk at startup. The server makes no network requests and needs no credentials.

## License

MIT for this package. Move itself is licensed upstream — see the [repository](https://github.com/move-language/move).
