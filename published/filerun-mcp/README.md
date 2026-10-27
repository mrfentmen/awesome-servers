# filerun-mcp

Query the FileRun API: browse folders, search files and folders, and create folders. Works with any FileRun server via `FILERUN_BASE_URL` with OAuth2 bearer `FILERUN_ACCESS_TOKEN` (scopes: list for reads, upload for create_folder).

## Tools

- `browse_folder` — List files and folders in a FileRun path (requires FILERUN_ACCESS_TOKEN).
- `search_files` — Search file/folder names or contents under a path.
- `create_folder` — Create a folder (requires upload scope).

## Source

[filerun-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/filerun-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
