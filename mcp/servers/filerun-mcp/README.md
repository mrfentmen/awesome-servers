# filerun-mcp

Query the FileRun API: browse folders, search files and folders, and create folders. Works with any FileRun server via `FILERUN_BASE_URL` with OAuth2 bearer `FILERUN_ACCESS_TOKEN` (scopes: list for reads, upload for create_folder).

## Tools

- `browse_folder` — List files and folders in a FileRun path (requires FILERUN_ACCESS_TOKEN).
- `search_files` — Search file/folder names or contents under a path.
- `create_folder` — Create a folder (requires upload scope).

## Source

[filerun-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/filerun-mcp)
