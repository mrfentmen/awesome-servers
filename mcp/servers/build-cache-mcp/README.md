# build-cache-mcp

Build Cache summarizes local build and cache footprint. It helps explain why a workspace is slow or large without exposing filenames or contents.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_build_cache` with a local project path.

## Privacy and limits

Only file metadata inside recognized artifact directories is read. The response contains aggregate size and age buckets, directory counts, and file counts. It does not return paths, names, contents, or dependency data. Recursion, file count, file size, and total byte limits prevent unbounded scans.
