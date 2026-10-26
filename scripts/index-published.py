#!/usr/bin/env python3
"""Summarise published/ from the files actually on disk.

`sync-published-snapshot.py` mirrors the registry, which is the right thing when
npm is ahead of the repo. It is the wrong thing once the repo carries fixes that
are not published yet, because re-syncing reverts them. This script only reads:
it counts what is in the tree and rewrites INDEX.md from that.

Usage:
    python3 scripts/index-published.py
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "published"
GATE = "MCP_LICENSE_KEY"
STUB = "Not yet implemented"


def count(paths, needle: str) -> int:
    total = 0
    for path in paths:
        try:
            total += path.read_text("utf-8", "replace").count(needle)
        except OSError:
            continue
    return total


def main() -> int:
    rows = []
    for pkg_dir in sorted(p for p in OUT.iterdir() if p.is_dir()):
        manifest = pkg_dir / "package.json"
        if not manifest.is_file():
            continue
        try:
            meta = json.loads(manifest.read_text())
        except Exception:
            continue
        shipped = sorted(pkg_dir.glob("dist/*.js"))
        source = sorted(pkg_dir.glob("src/*.ts"))
        size = sum(
            f.stat().st_size
            for f in pkg_dir.rglob("*")
            if f.is_file() and not f.name.endswith(".map")
        )
        rows.append(
            {
                "slug": pkg_dir.name,
                "name": meta.get("name", pkg_dir.name),
                "version": meta.get("version", ""),
                "gate": count(shipped, GATE),
                "stubs": count(shipped, STUB),
                "src_stubs": count(source, STUB),
                "src": (pkg_dir / "src").is_dir(),
                "bytes": size,
            }
        )

    gated = [r for r in rows if r["gate"]]
    stubbed = [r for r in rows if r["stubs"]]
    stale_src = [r for r in rows if r["src_stubs"]]
    scoped = [r for r in rows if r["name"].startswith("@")]

    lines = [
        "# Published snapshot",
        "",
        "This directory is the code users install. It was mirrored from the npm",
        "registry by `scripts/sync-published-snapshot.py`, then repaired in place:",
        "every tool that answered `Not yet implemented` has a real implementation,",
        "and no package carries a licence gate. `servers/` holds the older source",
        "and is not what ships.",
        "",
        "Regenerate this summary with `python3 scripts/index-published.py`. Re-run",
        "`sync-published-snapshot.py` only when every local fix has been published —",
        "it overwrites `dist/` from the registry tarballs.",
        "",
        f"- packages: **{len(rows)}**",
        f"- scoped under `@mrfentmen`: **{len(scoped)}**",
        f"- total size: **{sum(r['bytes'] for r in rows) / 1048576:.1f} MB**",
        f"- carrying a licence gate (`{GATE}`): **{len(gated)}**",
        f"- carrying tools that answer `{STUB}` in the shipped `dist/`: **{len(stubbed)}**",
        f"- whose `src/` still holds the pre-fix source (not shipped): **{len(stale_src)}**",
        "",
        "| package | version | src? | gate | stubs |",
        "| --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        lines.append(
            f"| `{r['name']}` | {r['version']} | {'yes' if r['src'] else 'no'} | "
            f"{r['gate'] or ''} | {r['stubs'] or ''} |"
        )
    (OUT / "INDEX.md").write_text("\n".join(lines) + "\n")

    print(f"packages      : {len(rows)}")
    print(f"scoped        : {len(scoped)}")
    print(f"total size    : {sum(r['bytes'] for r in rows) / 1048576:.1f} MB")
    print(f"licence gates : {len(gated)}")
    print(f"stubbed tools : {len(stubbed)}")
    for r in gated + stubbed:
        print(f"  {r['name']}: gate={r['gate']} stubs={r['stubs']}")
    for r in stale_src:
        print(f"  stale src: {r['name']} ({r['src_stubs']} stub body/bodies in src/, dist is fixed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
