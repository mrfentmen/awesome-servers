# env-contract-mcp

Env Contract is a local MCP tool for finding configuration drift before a project fails at runtime. It compares variable names declared in `.env.example` and dotenv files with likely environment references in source and config files.

## Tool

- `inspect_contract`: report declared names, referenced names, missing names, unused names, and the files where they occur.

## Safety

- Reads local project files only; it never fetches URLs.
- Never reads or emits environment values. Only names and bounded file paths are returned.
- Ignores `node_modules`, build output, coverage, and Git internals.
- Caps file count, file size, recursion depth, and output.
- Matching is heuristic and is not a replacement for a build, deployment check, or secret scanner.

Set `ENV_CONTRACT_ROOT` to bound analysis to a workspace root. It defaults to the parent of the MCP package when launched normally.

## Run

```bash
npm install
npm run build
node dist/index.js
```
