# mcp-auditor-mcp

Audit MCP servers and the APIs behind them - no API key.

## Tools

- `probe_keyless` — Ask an API whether it answers with no credentials, and report its status, response shape and rate-limit headers.
- `audit_endpoint` — Handshake with a public MCP endpoint, read its tool list and report tool count, naming, descriptions, annotations and parameter gaps.
- `audit_tools` — Same audit as audit_endpoint, but run on a tools/list payload you paste in. Use it for endpoints behind credentials or a draft before deploy.
- `compare_servers` — Measure how much two MCP servers overlap, so near-duplicate servers are obvious before they compete. Each side is an endpoint URL or a pasted tools/list payload.
- `check_listing` — Validate Store copy against the real limits and the real category list, so a push cannot fail on a field length or a made-up category.
- `lint_source` — Lint pasted MCP server TypeScript: tool count, duplicate names, tool and parameter descriptions, annotations, missing try/catch, fetch calls with no timeout, type suppressions, placeholders and dead code.
- `generate_tool_registration` — Turn a tool spec into a complete server.ts in house style: imports, registerTool blocks, zod schemas and try/catch, ready to paste.
- `diff_tool_schema` — Compare two tools/list replies and separate breaking changes from safe additions, so a release cannot silently break callers.
- `registry_lookup` — Search the official MCP registry for a server name or keyword and see whether the name is taken, who published it, which versions exist and what transports they use.
- `npm_package_check` — Check an npm package before a registry submission: is the name free, how old is the last release, how many downloads, and does the manifest carry mcpName, a bin, keywords and a license.
- `call_tool` — Handshake with a public MCP endpoint, confirm the tool is in its list, then actually call it and report the latency, the content blocks and whether it returned a tool-level error.
- `server_json_check` — Validate a server.json against the rules the official registry enforces: name shape and namespace, description length, semver, repository, packages or remotes, transports, and secret environment variables.

## Setup

No setup. Every tool works on input from the call itself: a URL to probe, a payload to audit or a source file to lint.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).


