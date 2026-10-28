# shebang-sherpa-mcp

Shebang Sherpa is a local portability audit for scripts that work on one laptop and mysteriously fail on another. It scans bounded script candidates and reports aggregate interpreter categories, executable-bit coverage, and coarse portability warnings.

## Tool

- `inspect_script_portability`: scan a local project without executing scripts.

The result can flag machine-specific interpreter paths, legacy interpreter names, absolute system interpreters, executable files without shebangs, and scripts missing the executable bit. It never returns paths, script text, project names, dependency names, command arguments, or environment values.

## Safety

- Reads files only. It never executes a script, shell, package manager, hook, or launcher.
- Skips Git metadata, dependency folders, build output, coverage, and common caches.
- Uses a bounded file count and file size.
- Confines the project to `SHEBANG_SHERPA_ROOT`.
- This is a portability heuristic, not a shell parser or security scanner.

## Run

```bash
npm install
npm run build
node dist/index.js
```
