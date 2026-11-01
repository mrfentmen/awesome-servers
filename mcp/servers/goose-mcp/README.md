# goose-mcp

An MCP server for **Goose**, the systems programming language by Wouter van Oortmerssen
([aardappel/goose](https://github.com/aardappel/goose)). Goose is memory safe without a
garbage collector or lifetime annotations: every non-fixed value lives on a data stack, data
structures are flat and pointerless, and the compiler emits one C file that its bundled
TinyCC backend can compile and run in-process.

This server gives a model the language's own documentation, standard library and sample
programs, offline. It does not compile or run Goose code.

## What's inside

| Dataset | Count |
|---|---|
| Doc sections | **389** across **10** documents |
| Standard-library symbols | **702** |
| Keywords (reserved + contextual) | **57** (46 reserved, 11 contextual) |
| Operator precedence rows | **12** |
| Sample programs | **32** (25 tutorial chapters + 7 demos) |

Extracted from `aardappel/goose` at commit `b78158797a3a4199a2c519d90d4e5421b2760fe3`.
Documents bundled: overview, tutorial, language reference, standard library, language spec,
command line, packages, testing, "Goose for C++ and Rust Programmers", editors.

## Install

```bash
npx -y goose-mcp
# or
npm i -g goose-mcp
```

MCP client config:

```json
{
  "mcpServers": {
    "goose": {
      "command": "npx",
      "args": ["-y", "goose-mcp"]
    }
  }
}
```

No API key and no network access are needed at runtime.

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `overview` | none | Upstream repo, source commit, dataset counts, document list |
| `list_docs` | none | Every document with its section count and doc id |
| `list_sections` | `doc` (optional) | Section ids and titles, for one document or all |
| `get_section` | `id` (required) | Full section text, clipped at 60,000 chars with an explicit marker |
| `search_docs` | `query`, `limit` (optional, default 5) | Ranked matches with a window around the first hit; title hits first |
| `lookup_symbol` | `name` (required) | Exact stdlib matches and their real signatures, grouped by module |
| `search_symbols` | `query`, `module` (optional), `limit` (optional, default 10) | Symbols whose name or signature matches |
| `list_stdlib_modules` | none | Each module with symbol count and the kinds it exposes |
| `list_symbols_in_module` | `module` (required) | Kind, name and signature of every symbol in that module |
| `list_keywords` | `kind` (optional: `keyword`, `contextual`) | Keywords grouped by kind |
| `get_operator_precedence` | none | The reference's precedence table, tightest first |
| `list_samples` | none | The 32 bundled programs with size and path |
| `get_sample` | `name` (required, `.goose` optional) | The real source in a fenced block |
| `find_pattern` | `query`, `limit` (optional, default 3) | Sections from the C++/Rust translation guide |
| `search_samples` | `query`, `limit` (optional, default 5) | Samples containing the substring, with code context |

## Example prompts

- "How do I translate a C++ RAII pattern to Goose?" (`find_pattern`)
- "What is the stdlib signature for `heap_push`?" (`lookup_symbol`)
- "Show Goose's operator precedence." (`get_operator_precedence`)
- "How does `defer` work in Goose?" (`search_docs`, then `get_section`)
- "Show me the sieve tutorial program." (`get_sample` with `07_sieve`)

## Data provenance

Everything in `data/` was extracted from the upstream repository at build time:

- the ten `docs/*.md` files, split into 389 sections by their own headings;
- `docs/stdlib.md`, whose Goose code blocks were parsed into 702 symbols (functions, structs,
  enums, types, constants) with their module and exact signature line;
- the keyword list and the operator precedence table, taken from Appendix A of the language
  reference;
- real `samples/*.goose` files, including the 25 numbered tutorial chapters.

Nothing is hand-written or summarised: the tools return the upstream text. There is no
network call, no scraping and no model call at runtime.

## Regenerating

The shipped `data/*.json` files are the build output of that extraction; rebuild them from a
newer upstream commit to refresh the server, then run `npm test`.

## License

MIT for this package. Goose itself is licensed upstream — see
[aardappel/goose](https://github.com/aardappel/goose) for its terms.
