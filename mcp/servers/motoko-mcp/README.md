# motoko-mcp

MCP server for **Motoko**, the actor-based language of the Internet Computer. Motoko gives every canister orthogonal persistence, so state survives upgrades without a database, and its type system is built around actors, async messages and stable variables. This server puts the official language docs and the whole `motoko-base` API in front of a model, offline.

## What's inside

| Dataset | Count | Source |
|---|---|---|
| Documentation sections | **710** | `doc/md` in `dfinity/motoko` |
| Public base symbols | **339** | `src/*.mo` in `dfinity/motoko-base` |
| Sample canisters | **7** | `samples/*.mo` in `dfinity/motoko` |
| Base modules | every module with a public symbol | `src/*.mo` in `dfinity/motoko-base` |

Generated from `dfinity/motoko` at commit `61ea72bd9cfadfb54751d938647b9e2b32d1ea43`.

- Upstream compiler and docs: <https://github.com/dfinity/motoko>
- Docs site: <https://internetcomputer.org/docs/motoko>

## Install

```bash
npx -y motoko-mcp
# or
npm i -g motoko-mcp
```

Client config:

```json
{
  "mcpServers": {
    "motoko": {
      "command": "npx",
      "args": ["-y", "motoko-mcp"]
    }
  }
}
```

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `overview` | none | Repo, source commit, dataset counts, documents |
| `list_docs` | none | Every document with id, title, section count |
| `list_sections` | `doc` (optional) | Section ids and titles for one document or all |
| `get_section` | `id` (required) | Full section text, truncated at 60,000 chars with a marker |
| `search_docs` | `query` (required), `limit` (optional, default 5, max 20) | Title-first ranked hits with snippets |
| `quickstart` | none | The compiler repo's index page, for program structure |
| `lookup_symbol` | `name` (required) | Exact then prefix matches across every base module |
| `search_symbols` | `query` (required), `module` (optional), `limit` (optional, default 10, max 50) | Matching public symbols |
| `list_modules` | none | Every base module with its symbol count |
| `list_symbols_in_module` | `module` (required) | That module's symbols and declaration forms |
| `list_symbol_kinds` | none | Counts by declaration form: func, let, type, class |
| `list_symbols_by_kind` | `kind` (required) | Every symbol of that form |
| `list_samples` | none | Sample canisters with path and size |
| `get_sample` | `name` (required) | Full sample source, with or without `.mo` |
| `search_samples` | `query` (required), `limit` (optional, default 5) | Samples containing the substring, with a window |
| `search_all` | `query` (required), `limit` (optional, default 5) | One query across docs, symbols and samples |
| `list_base_modules` | none | Module index with counts and the first few symbols each |

## Example prompts

- "How do I keep a list in a stable variable across upgrades?"
- "What is the signature of `Array.tabulate` and which module do I import?"
- "Show me the `Array` module's public API."
- "Find the docs on `actor` classes versus `shared` functions."
- "Which base types are defined as `type` rather than `class`?"

## Data provenance

Everything is extracted from the upstream repositories at build time:

- the `doc/md` tree of `dfinity/motoko`, split into 710 sections by heading;
- the public declarations (`public func`, `public let`, `public type`, `public class`) parsed out of `dfinity/motoko-base` sources into 339 symbols, keeping each symbol's module;
- the real `samples/*.mo` canisters, unmodified.

The result is shipped as JSON in `data/` and read from disk at startup. The server makes no network requests and needs no credentials.

## License

MIT for this package. Motoko itself is licensed by DFINITY; see <https://github.com/dfinity/motoko>.
