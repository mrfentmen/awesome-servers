# lockstep-mcp

Lockstep is a local MCP tool for spotting reproducibility drift in small projects. It identifies package-manager lockfiles, counts their bytes and lines, detects structural lockfile markers, and flags a package manifest with no matching lockfile.

## Tool

- `inspect_reproducibility`: inspect lockfile presence and package-manager signals without returning dependency names or versions.

## Safety

- Local paths only, bounded by `LOCKSTEP_ROOT` and realpath checks.
- Skips Git data, dependencies, build output, coverage, and caches.
- Never returns dependency names, versions, lockfile contents, or environment values.
- Caps recursion, file count, file size, and output.
- This is a reproducibility aid, not a dependency vulnerability scanner or build oracle.
