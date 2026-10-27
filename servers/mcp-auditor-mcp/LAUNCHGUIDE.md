# MCP Server Auditor

## Tagline
Audit MCP servers and the APIs behind them - no API key.

## Description
Check an MCP server before you ship it or depend on it: probe an API to see whether it answers without credentials, handshake with a public endpoint and read its tool list, audit naming, descriptions, annotations and parameter gaps, compare two servers for overlap, lint server TypeScript, diff two tool schemas for breaking changes and validate Store copy against the real field limits and category list. Every check runs on the input you give it. An independent MCP server. Not affiliated with or endorsed by any vendor it audits.

## Setup Requirements
No setup. Every tool works on input from the call itself: a URL to probe, a payload to audit or a source file to lint.

## Category
Developer Tools

## Features

- Probe keyless API: Ask an API whether it answers with no credentials, and report its status, response shape and rate-limit headers.
- Audit MCP endpoint: Handshake with a public MCP endpoint, read its tool list and report tool count, naming, descriptions, annotations and parameter gaps.
- Audit pasted tool list: Same audit as audit_endpoint, but run on a tools/list payload you paste in. Use it for endpoints behind credentials or a draft before deploy.
- Compare servers: Measure how much two MCP servers overlap, so near-duplicate servers are obvious before they compete. Each side is an endpoint URL or a pasted tools/list payload.
- Check listing copy: Validate Store copy against the real limits and the real category list, so a push cannot fail on a field length or a made-up category.
- Lint server source: Lint pasted MCP server TypeScript: tool count, duplicate names, tool and parameter descriptions, annotations, missing try/catch, fetch calls with no timeout, type suppressions, placeholders and dead code.
- Generate a tool registration: Turn a tool spec into a complete server.ts in house style: imports, registerTool blocks, zod schemas and try/catch, ready to paste.
- Diff tool schema: Compare two tools/list replies and separate breaking changes from safe additions, so a release cannot silently break callers.
- Registry lookup: Search the official MCP registry for a server name or keyword and see whether the name is taken, who published it, which versions exist and what transports they use.
- Check npm package: Check an npm package before a registry submission: is the name free, how old is the last release, how many downloads, and does the manifest carry mcpName, a bin, keywords and a license.
- Call a tool: Handshake with a public MCP endpoint, confirm the tool is in its list, then actually call it and report the latency, the content blocks and whether it returned a tool-level error.
- Check server.json: Validate a server.json against the rules the official registry enforces: name shape and namespace, description length, semver, repository, packages or remotes, transports, and secret environment variables.

## Getting Started

- Ask your assistant to audit an MCP endpoint, a pasted tool list or a server source using this server once installed
- Tool: probe_keyless — Ask an API whether it answers with no credentials, and report its status, response shape and rate-limit headers.
- Tool: audit_endpoint — Handshake with a public MCP endpoint, read its tool list and report tool count, naming, descriptions, annotations and parameter gaps.
- Tool: audit_tools — Same audit as audit_endpoint, but run on a tools/list payload you paste in. Use it for endpoints behind credentials or a draft before deploy.
- Tool: compare_servers — Measure how much two MCP servers overlap, so near-duplicate servers are obvious before they compete. Each side is an endpoint URL or a pasted tools/list payload.
- Tool: check_listing — Validate Store copy against the real limits and the real category list, so a push cannot fail on a field length or a made-up category.
- Tool: lint_source — Lint pasted MCP server TypeScript: tool count, duplicate names, tool and parameter descriptions, annotations, missing try/catch, fetch calls with no timeout, type suppressions, placeholders and dead code.
- Tool: generate_tool_registration — Turn a tool spec into a complete server.ts in house style: imports, registerTool blocks, zod schemas and try/catch, ready to paste.
- Tool: diff_tool_schema — Compare two tools/list replies and separate breaking changes from safe additions, so a release cannot silently break callers.
- Tool: registry_lookup — Search the official MCP registry for a server name or keyword and see whether the name is taken, who published it, which versions exist and what transports they use.
- Tool: npm_package_check — Check an npm package before a registry submission: is the name free, how old is the last release, how many downloads, and does the manifest carry mcpName, a bin, keywords and a license.
- Tool: call_tool — Handshake with a public MCP endpoint, confirm the tool is in its list, then actually call it and report the latency, the content blocks and whether it returned a tool-level error.
- Tool: server_json_check — Validate a server.json against the rules the official registry enforces: name shape and namespace, description length, semver, repository, packages or remotes, transports, and secret environment variables.

## Tags
mcp, audit, linter, schema, review, developer tools

## Documentation URL
https://github.com/mrfentmen/awesome-servers/tree/main/servers/mcp-auditor-mcp
