#!/usr/bin/env python3
"""Mirror what is really live on npm into published/.

The repo's servers/ tree fell behind the registry: the paywall-removal pass was
published from a working copy that was never committed, so npm holds code that
does not exist in git. That makes git useless as a source of truth.

This script rebuilds published/<slug>/ straight from the registry tarballs, so
the repo always has an exact copy of what users install. It never touches
servers/ — that tree keeps whatever original source still exists.

Each mirrored package keeps only what ships to users:
    package.json, README.md, server.json, LICENSE, dist/, src/ (when present)

Usage:
    python3 scripts/sync-published.py [--limit N]

Writes published/INDEX.md summarising version, publish date, and the two
failure modes we care about: a leftover licence gate (MCP_LICENSE_KEY) and
tools stubbed with "Not yet implemented".
"""

import argparse
import io
import json
import pathlib
import sys
import tarfile
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "published"
KEEP_FILES = {"package.json", "README.md", "server.json", "LICENSE"}
KEEP_DIRS = ("dist/", "src/")
UA = {"User-Agent": "awesome-servers-sync"}
REGISTRY = "https://registry.npmjs.org/"


def server_slugs() -> list[str]:
    servers = ROOT / "servers"
    return sorted(p.name for p in servers.iterdir() if p.is_dir())


def meta(pkg: str):
    url = REGISTRY + urllib.parse.quote(pkg, safe="")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        return json.load(r)


def local_version(slug: str) -> str:
    manifest = OUT / slug / "package.json"
    if not manifest.is_file():
        return ""
    try:
        return json.loads(manifest.read_text()).get("version", "")
    except Exception:
        return ""


def semver_gt(a: str, b: str) -> bool:
    """True when a is a strictly higher version than b."""
    def parts(v):
        out = []
        for chunk in v.split("-")[0].split(".")[:3]:
            try:
                out.append(int(chunk))
            except ValueError:
                out.append(0)
        return out + [0] * (3 - len(out))

    return parts(a) > parts(b)


def fetch(slug: str) -> dict:
    """Download one package and unpack the files users actually receive.

    A package whose local copy is ahead of the registry carries an unpublished
    fix, so it is left alone: re-syncing would silently revert it. A bare name
    that belongs to a different publisher is never mirrored either — npm's
    `twilio-mcp` is not ours, and that collision is why this check exists.
    """
    mine = local_version(slug)
    for candidate in (f"@mrfentmen/{slug}", slug):
        try:
            m = meta(candidate)
        except Exception:
            continue
        if "versions" not in m:
            continue
        owners = {x.get("name") if isinstance(x, dict) else str(x) for x in m.get("maintainers") or []}
        if not candidate.startswith("@mrfentmen/") and "mrfentmen" not in owners:
            continue
        latest = m["dist-tags"]["latest"]
        if mine and semver_gt(mine, latest):
            return {"slug": slug, "package": candidate, "version": mine, "published": "local",
                    "files": 0, "bytes": 0, "gated": 0, "stubs": 0,
                    "has_src": (OUT / slug / "src").is_dir(), "local_ahead": True}
        version_meta = m["versions"][latest]
        with urllib.request.urlopen(
            urllib.request.Request(version_meta["dist"]["tarball"], headers=UA), timeout=40
        ) as r:
            blob = r.read()

        dest = OUT / slug
        dest.mkdir(parents=True, exist_ok=True)
        texts = []
        shipped = 0
        with tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz") as tf:
            for member in tf.getmembers():
                if not member.isfile():
                    continue
                name = member.name
                if not name.startswith("package/"):
                    continue
                rel = name[len("package/"):]
                if not (rel in KEEP_FILES or rel.startswith(KEEP_DIRS)):
                    continue
                src = tf.extractfile(member)
                if src is None:
                    continue
                data = src.read()
                target = dest / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                shipped += 1
                if rel.endswith((".js", ".ts", ".md", ".json")):
                    texts.append(data.decode("utf-8", "replace"))

        joined = "\n".join(texts)
        return {
            "slug": slug,
            "package": candidate,
            "version": latest,
            "published": m.get("time", {}).get(latest, "")[:10],
            "files": shipped,
            "bytes": len(blob),
            "gated": joined.count("MCP_LICENSE_KEY"),
            "stubs": joined.count("Not yet implemented"),
            "has_src": (dest / "src").is_dir(),
            "local_ahead": False,
        }
    return {"slug": slug, "package": "", "version": "MISSING", "published": "", "files": 0,
            "bytes": 0, "gated": 0, "stubs": 0, "has_src": False, "local_ahead": False}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="only sync the first N servers")
    args = ap.parse_args()

    slugs = server_slugs()
    if args.limit:
        slugs = slugs[: args.limit]
    OUT.mkdir(exist_ok=True)
    print(f"syncing {len(slugs)} packages from the npm registry")

    with ThreadPoolExecutor(max_workers=10) as ex:
        rows = list(ex.map(fetch, slugs))

    rows.sort(key=lambda r: r["slug"])
    missing = [r for r in rows if r["version"] == "MISSING"]
    gated = [r for r in rows if r["gated"] > 0]
    stubbed = [r for r in rows if r["stubs"] > 0]
    ahead = [r for r in rows if r["local_ahead"]]

    lines = [
        "# Published snapshot",
        "",
        "Generated by `scripts/sync-published.py` from the npm registry. Do not edit by",
        "hand — re-run the script instead.",
        "",
        "This is what users actually install. `servers/` holds the older source that is",
        "still in git; where the two disagree, this directory is correct.",
        "",
        f"- packages mirrored: **{len(rows) - len(missing)}** / {len(rows)}",
        f"- total size: **{sum(r['bytes'] for r in rows) / 1048576:.1f} MB**",
        f"- still carrying a licence gate (`MCP_LICENSE_KEY`): **{len(gated)}**",
        f"- carrying tools that always answer `Not yet implemented`: **{len(stubbed)}**",
        f"- not on npm: **{len(missing)}**",
        f"- carrying a local fix not yet published: **{len(ahead)}**",
        "",
        "| package | version | published | src? | gate | stubs |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        lines.append(
            f"| `{r['package'] or r['slug']}` | {r['version']} | {r['published'] or '-'} | "
            f"{'yes' if r['has_src'] else 'no'} | {r['gated'] or ''} | {r['stubs'] or ''} |"
        )
    (OUT / "INDEX.md").write_text("\n".join(lines) + "\n")

    print(f"mirrored      : {len(rows) - len(missing)}")
    print(f"total size    : {sum(r['bytes'] for r in rows) / 1048576:.1f} MB")
    print(f"still gated   : {len(gated)}")
    print(f"stubbed tools : {len(stubbed)}")
    print(f"missing       : {len(missing)}")
    print(f"local ahead   : {len(ahead)} (left untouched)")
    if missing:
        print("  " + ", ".join(r["slug"] for r in missing[:10]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
