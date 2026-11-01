# lobster-mcp

An MCP server for the [Lobster programming language](https://strlen.com/lobster/) — Wouter van Oortmerssen's statically typed, Python-esque language built for games and graphics, with compile-time memory management instead of a garbage collector. It bundles Lobster's real documentation, its full builtin function reference, its keyword list and real sample programs, so an assistant can answer Lobster questions offline.

It is a reference and knowledge server. It does not compile or run Lobster code.

## What's inside

| Dataset | Count | Source |
|---|---|---|
| Documentation sections | 187 | the official HTML docs, converted to text and split by heading |
| Builtin functions | 879 | `docs/builtin_functions_reference.html`, parsed into name / signature / returns / description / category |
| Keywords | 45 | the keyword list in the official language reference |
| Sample programs | 18 | real `samples/*.lobster` files from the repository |

Generated from [aardappel/lobster](https://github.com/aardappel/lobster) at commit `6c1389c6e2a6f79cd351813829076a4d653f1e2b`. Site: <https://strlen.com/lobster/>.

The 187 sections cover the language reference, the language spec, memory management, the type checker, the style guide, getting started, the shooter tutorial, philosophy, command line usage, the C-style cheat sheet, the engine, the language server, implementation notes and the "welcome" page.

## Requirements

The reference tools work offline with no dependencies. Only `run_code` and `toolchain_status` need a Lobster compiler on the machine:

```bash
git clone https://github.com/aardappel/lobster.git
cd lobster/dev && cmake -DCMAKE_BUILD_TYPE=Release && make -j8
export LOBSTER_BIN="$PWD/../bin/lobster"
```

If the binary is missing and `LOBSTER_BIN` is unset, `toolchain_status` reports NOT FOUND and `run_code` returns an error naming the variable. Neither crashes.

## Install

```bash
npx -y lobster-mcp
# or
npm i -g lobster-mcp
```

Any MCP client that speaks stdio:

```json
{
  "mcpServers": {
    "lobster": {
      "command": "npx",
      "args": ["-y", "lobster-mcp"]
    }
  }
}
```

No API key, no environment variables, no network access at runtime.

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `overview` | none | Upstream repo, source commit, dataset counts, list of documents |
| `list_docs` | none | Every document with its section count and doc id |
| `list_sections` | `doc` (optional) | `id — title` for one document or all of them |
| `get_section` | `id` (required) | The full text of one section, truncated at 60,000 chars with a marker |
| `search_docs` | `query` (required), `limit` (optional, default 5, max 20) | Title-first ranked hits with a snippet |
| `lookup_builtin` | `name` (required) | Every overload of that builtin: signature, category, returns, description |
| `search_builtins` | `query` (required), `category` (optional), `limit` (optional, default 10, max 50) | Matching builtins by name and description |
| `list_builtin_categories` | none | Categories with function counts, largest first |
| `list_builtins_in_category` | `category` (required) | `signature — description` for every builtin in that category |
| `list_keywords` | `kind` (optional) | Keywords grouped by kind: type, declaration, control, module, operator, literal, expression |
| `get_cheatsheet` | none | The whole "C-style language cheat sheet for Lobster" |
| `list_samples` | none | Sample programs with path and size |
| `get_sample` | `name` (required) | Source of one sample, with or without the `.lobster` extension |
| `search_samples` | `query` (required), `limit` (optional, default 5, max 20) | Samples whose code contains the substring, with a window around each hit |
| `toolchain_status` | none | Whether the compiler was found, which binary it resolved, and how it was found (`LOBSTER_BIN` or PATH) |
| `run_code` | `code` (required), `args` (optional array), `timeoutMs` (optional, default 10000, max 60000) | Compiles and runs the code in a temp dir: exit code, duration, stdout, stderr |

## Example prompts

- "What does `gl.create_colored_texture` do and what type does it return?"
- "Show me every `imgui` builtin."
- "How does Lobster handle memory management without a garbage collector?"
- "I'm coming from C — give me the Lobster cheat sheet."
- "Show me the `knights_tour` sample and explain the `for` loop in it."

## Data provenance

Everything is extracted from the upstream repository at build time:

- the documentation HTML is converted to text and split into 187 sections by heading;
- `docs/builtin_functions_reference.html` is parsed into 879 structured builtin entries with their category from the reference's own section headers;
- the keyword list is taken verbatim from the language reference;
- the samples are the real `samples/*.lobster` files, unmodified.

The result is shipped as JSON in `data/` and read from disk at startup. The server makes no network requests and needs no credentials.

**`run_code` executes the code you pass it** on this machine, in a temporary directory, with the permissions of the MCP client process. There is no sandbox: treat it exactly like running `lobster file.lobster` in a shell.

## Regenerating

The files in `data/` are produced by a build script that reads the upstream repo; replace them with a newer extraction to update the server.

## License

MIT for this package. Lobster itself is licensed separately — see [github.com/aardappel/lobster](https://github.com/aardappel/lobster).
