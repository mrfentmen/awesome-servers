# spdx-mcp

Search the SPDX license list while reviewing dependencies, choosing project licenses, or preparing open-source notices.

## Tools

- `search_licenses`: search identifiers and license names.
- `get_license`: fetch metadata for an exact identifier such as `MIT`, `Apache-2.0`, or `GPL-3.0-only`.

This server reports SPDX metadata. It is not a legal opinion and does not perform full dependency license compatibility analysis. The public SPDX list is cached for the process lifetime.

## Run

```bash
npm install
npm run build
node dist/index.js
```
