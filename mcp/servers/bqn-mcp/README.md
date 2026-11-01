# bqn-mcp

An MCP server for [BQN](https://mlochbaum.github.io/BQN/), the array programming language. It answers questions about BQN's primitives, syntax and array model from the project's own documentation, and shows real BQN programs from the upstream test suite.

## What's inside

Everything is extracted from [mlochbaum/BQN](https://github.com/mlochbaum/BQN) and shipped with the package.

| Dataset | Count | Source |
|---|---|---|
| Documentation sections | 382 | `docs/doc/*.html`, converted to text and split by heading |
| Primitives and concepts | 71 | one entry per documentation page, with its title and summary |
| Sample programs | 10 | real files from `test/cases/*.bqn` |

Generated from upstream commit `5abbab967fefc68ae9b3c2620d5d38473a90cb66`.

## Install

```bash
npx -y bqn-mcp
# or
npm i -g bqn-mcp
```

Client configuration:

```json
{
  "mcpServers": {
    "bqn": {
      "command": "npx",
      "args": ["-y", "bqn-mcp"]
    }
  }
}
```

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `overview` | none | Repo, docs site, source commit, dataset counts and the document list |
| `list_docs` | none | Every document with its id and section count |
| `list_sections` | `doc` (optional) | `id — title` for one document or all of them |
| `get_section` | `id` (required) | Full section text, truncated at 60,000 chars with a marker |
| `search_docs` | `query` (required), `limit` (optional, default 5, max 20) | Title-first hits with a snippet |
| `quickstart` | none | The index / quick / running sections joined |
| `lookup_symbol` | `name` (required) | Exact then prefix matches with title and description |
| `search_symbols` | `query` (required), `module` (optional), `limit` (optional, default 10, max 50) | Matching primitives and concepts |
| `list_modules` | none | Modules with symbol counts, largest first |
| `list_symbols_in_module` | `module` (required) | Every symbol in that module |
| `list_symbol_kinds` | none | Symbol kinds with counts |
| `list_symbols_by_kind` | `kind` (required) | Every symbol of that kind |
| `list_samples` | none | Sample programs with path and size |
| `get_sample` | `name` (required) | Source of one program, `.bqn` optional |
| `search_samples` | `query` (required), `limit` (optional, default 5) | Programs containing the fragment, with context |
| `search_all` | `query` (required) | Docs, symbols and samples in one answer |
| `glyph_lookup` | `glyph` (required), `limit` (optional, default 10, max 30) | Sections that use that glyph, with the matching line |

## Example prompts

- "What does the glyph ⊑ do in BQN?"
- "Explain Fold and Insert with an example."
- "How does BQN's array model differ from APL's?"
- "Show me the test program for namespaces."
- "What is the difference between Pick and Select?"

## Data provenance

- Documentation HTML is converted to text and split into 382 sections by heading.
- `symbols.json` has one entry per documentation page, built from its title and opening summary.
- `samples.json` holds real `test/cases/*.bqn` files, unmodified.
- The data is read from `data/` at startup. The server makes no network requests and needs no API key.

It is a reference server: it does not run BQN code. For that you need a BQN implementation such as [CBQN](https://github.com/dzaima/CBQN).

## License

MIT for this package. BQN itself is distributed under its own upstream license — see [mlochbaum/BQN](https://github.com/mlochbaum/BQN).
