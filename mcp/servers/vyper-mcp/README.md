# vyper-mcp

MCP server for **Vyper**, the Python-like smart-contract language for the EVM. Vyper is deliberately small: no inheritance, no recursion, no inline assembly, bounded loops — and this server gives an agent the whole language reference offline, from builtin functions to compiler attributes.

## What's inside

| Dataset | Count |
|---|---|
| Documentation sections | 288, split by heading from the official reStructuredText docs |
| Symbols | 51 builtin functions, classes, methods and compiler attributes |
| Example contracts | 1 real example from the upstream `examples/` directory |

Generated from [vyperlang/vyper](https://github.com/vyperlang/vyper) at commit `803062676390fe975f4d6b0794a42b8513656a4a`. Docs site: <https://docs.vyperlang.org/>.

## Install

```bash
npx -y vyper-mcp
```

or

```bash
npm i -g vyper-mcp
```

Claude Desktop / any stdio MCP client:

```json
{
  "mcpServers": {
    "vyper": {
      "command": "npx",
      "args": ["-y", "vyper-mcp"]
    }
  }
}
```

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `overview` | none | Repo, docs site, source commit, dataset counts, page list |
| `list_docs` | none | Every page with its section count and page id |
| `list_sections` | `doc` (optional) | Section titles and ids for one page or all pages |
| `get_section` | `id` (required) | Full section text, truncated at 60,000 chars with a marker |
| `search_docs` | `query` (required), `limit` (optional, default 5, max 20) | Title-first ranked hits with a window around the match |
| `quickstart` | none | The whole quickstart page: install, compile, deploy |
| `lookup_symbol` | `name` (required) | Exact then prefix matches, every overload signature |
| `search_symbols` | `query` (required), `module` (optional), `limit` (optional, default 10, max 50) | Matching symbols by name or signature |
| `list_modules` | none | Pages that contributed symbols, with counts and kinds |
| `list_symbols_in_module` | `module` (required) | Every symbol from one page |
| `list_symbol_kinds` | none | Symbol kinds with counts |
| `list_symbols_by_kind` | `kind` (required) | Every symbol of one kind |
| `list_builtin_functions` | none | The full built-in reference grouped by kind |
| `list_samples` | none | Bundled example contracts with path and size |
| `get_sample` | `name` (required) | Example source, with or without `.vy` |
| `search_samples` | `query` (required), `limit` (optional, default 5, max 20) | Example hits with a code window |
| `search_all` | `query` (required), `limit` (optional, default 5, max 20) | One query across docs, symbols and examples |

## Example prompts

- "What is the signature of `raw_call` and what does each argument mean?"
- "How do I use `@nonreentrant` in Vyper 0.4?"
- "Show me every built-in function related to hashing."
- "What changed between Solidity and Vyper for storage variables?"
- "Give me the quickstart — how do I compile and deploy a contract?"

## Data provenance

Everything is extracted from the upstream repository at build time:

- the reStructuredText docs are converted to text and split into 288 sections by heading;
- `docs/built-in-functions.rst` and the other pages are parsed for their `py:function` / `py:class` / `py:method` directives, giving 51 symbols with real signatures;
- the example contract is taken unmodified from the upstream `examples/` directory.

The result is shipped as JSON in `data/` and read from disk at startup. The server makes no network requests, needs no credentials and works fully offline.

## License

MIT for this package. Vyper itself is licensed upstream — see <https://github.com/vyperlang/vyper>.
