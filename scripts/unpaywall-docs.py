#!/usr/bin/env python3
"""Remove the paywall section from package READMEs.

The code no longer gates anything, but every touched README still told readers
to buy a key and set MCP_LICENSE_KEY. The section is fenced by HTML comments
(`<!-- paywall -->` … `<!-- /paywall -->`), so it can be removed exactly.

Also deletes leftover src/license.ts files: two packages ship their sources, and
that file is the gate implementation even though nothing imports it any more.

Usage:
    python3 scripts/unpaywall-docs.py [--dry-run]
"""

import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT / "published"

SECTION = re.compile(r"<!-- paywall -->.*?<!-- /paywall -->\n?", re.S)


def bump(version: str) -> str:
    parts = version.split(".")
    while len(parts) < 3:
        parts.append("0")
    parts[2] = str(int(parts[2]) + 1)
    return ".".join(parts[:3])


def gateway_backed(pkg: pathlib.Path) -> bool:
    """True when the tool bodies live on the remote gateway, not in the package.

    Those packages still need a key to attempt a call, so stripping their README
    claim would just move the lie: the docs would say free while the code asks
    for a licence. They are left exactly as published.
    """
    return (pkg / "dist" / "gateway.js").is_file()


def affected() -> list[pathlib.Path]:
    out = []
    for pkg in sorted(p for p in PUB.iterdir() if p.is_dir() and p.name != "node_modules"):
        readme = pkg / "README.md"
        if not readme.is_file() or gateway_backed(pkg):
            continue
        if SECTION.search(readme.read_text()):
            out.append(pkg)
    return out


def clean(pkg: pathlib.Path, dry_run: bool) -> dict:
    readme = pkg / "README.md"
    text = readme.read_text()
    stripped = SECTION.sub("", text).rstrip() + "\n"

    leftovers = [m for m in ("MCP_LICENSE_KEY", "mcp-marketplace.io", "<!-- paywall -->") if m in stripped]
    if leftovers:
        return {"slug": pkg.name, "status": "LEFT-OVER", "left": leftovers}

    removed_src = False
    for stray in (pkg / "src" / "license.ts", pkg / "src" / "license.d.ts"):
        if stray.is_file():
            removed_src = True
            if not dry_run:
                stray.unlink()

    if not dry_run:
        readme.write_text(stripped)
        manifest = pkg / "package.json"
        data = json.loads(manifest.read_text())
        data["version"] = bump(data["version"])
        manifest.write_text(json.dumps(data, indent=2) + "\n")

    return {"slug": pkg.name, "status": "cleaned", "left": [], "removed_src": removed_src}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    packages = affected()
    print(f"READMEs carrying a paywall section: {len(packages)}")
    results = [clean(p, args.dry_run) for p in packages]

    stuck = [r for r in results if r["status"] != "cleaned"]
    src_hits = [r for r in results if r.get("removed_src")]
    print(f"cleaned        : {len(results) - len(stuck)}")
    print(f"stray src/license.ts removed: {len(src_hits)}")
    for r in stuck:
        print(f"  STUCK {r['slug']}: still mentions {r['left']}")
    if args.dry_run:
        print("(dry run - nothing written)")
    return 0 if not stuck else 1


if __name__ == "__main__":
    sys.exit(main())
