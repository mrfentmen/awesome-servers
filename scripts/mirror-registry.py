#!/usr/bin/env python3
"""Mirror every npm MCP package maintained by mrfentmen into published/.

git only ever held part of what ships: most packages were published from
working copies that were never committed. This script closes that gap by
downloading each registry tarball and keeping what users install --
package.json, README, server.json and the build output -- so the repo again
carries a copy of everything on npm.

Only dist/ (+ src/ when a package ships one), package.json, server.json,
tsconfig.json, README*/LICENSE* are extracted. node_modules never exists in a
tarball, so nothing from a local install can leak in.

Two npm names can share a slug (`mixpanel-mcp` and `@mrfentmen/mixpanel-mcp`
both land in published/mixpanel-mcp), so the highest version per slug wins
regardless of download order.

Usage:
    python3 scripts/mirror-registry.py [--dry-run]
"""

import json
import os
import sys
import tarfile
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "published")
UA = {"user-agent": "mrfentmen-mirror/1.0"}
KEEP_TOP = ("package.json", "server.json", "tsconfig.json")
KEEP_DIRS = ("dist", "src", "bin", "assets", "lib")
KEEP_PREFIX = ("README", "LICENSE", "LICENCE")


def fetch_json(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def list_packages():
    names = set()
    for frm in range(0, 4000, 250):
        url = f"https://registry.npmjs.org/-/v1/search?text=maintainer:mrfentmen&size=250&from={frm}"
        d = fetch_json(url)
        objs = d.get("objects", [])
        for o in objs:
            names.add(o["package"]["name"])
        if len(objs) < 250:
            break
    return sorted(names)


def meta(name):
    d = fetch_json("https://registry.npmjs.org/" + name.replace("/", "%2F"))
    v = d["dist-tags"]["latest"]
    p = d["versions"][v]
    return {
        "name": name,
        "slug": name.split("/")[-1],
        "version": v,
        "mcpName": p.get("mcpName"),
        "tarball": p["dist"]["tarball"],
    }


def version_key(v):
    return tuple(int(p) for p in v.split("-")[0].split("."))


def keep(member):
    parts = member.split("/")
    if parts[0] in KEEP_TOP or parts[0] in KEEP_DIRS:
        return True
    return len(parts) == 1 and os.path.basename(member).startswith(KEEP_PREFIX)


def mirror(item):
    slug = item["slug"]
    dest = os.path.join(OUT, slug)
    try:
        req = urllib.request.Request(item["tarball"], headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        tmp = f"/tmp/.mirror-{slug}.tgz"
        with open(tmp, "wb") as f:
            f.write(data)
        os.makedirs(dest, exist_ok=True)
        written = 0
        with tarfile.open(tmp, "r:gz") as tf:
            for m in tf.getmembers():
                if not m.isfile():
                    continue
                rel = m.name[len("package/"):] if m.name.startswith("package/") else m.name
                if not keep(rel) or ".." in rel.split("/"):
                    continue
                target = os.path.join(dest, rel)
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with tf.extractfile(m) as src, open(target, "wb") as out:
                    out.write(src.read())
                written += 1
        os.remove(tmp)
        return {"slug": slug, "name": item["name"], "version": item["version"], "files": written, "ok": True}
    except Exception as e:
        return {"slug": slug, "name": item["name"], "version": item["version"], "ok": False, "error": str(e)}


def main():
    dry = "--dry-run" in sys.argv
    names = list_packages()
    print(f"npm packages maintained: {len(names)}", flush=True)
    with ThreadPoolExecutor(max_workers=12) as ex:
        metas = [m for _, m in ex.map(lambda n: (n, meta(n)), names) if m.get("mcpName")]
    others = [n for n in names if n not in {m["name"] for m in metas}]
    by_slug = {}
    for m in metas:
        prev = by_slug.get(m["slug"])
        if prev is None or version_key(m["version"]) > version_key(prev["version"]):
            by_slug[m["slug"]] = m
    picked = sorted(by_slug.values(), key=lambda m: m["slug"])
    print(f"mcp servers: {len(metas)} | slugs: {len(picked)} | non-MCP skipped: {len(others)}", flush=True)
    if dry:
        print("dry run: nothing downloaded")
        return
    results = []
    with ThreadPoolExecutor(max_workers=12) as ex:
        for i, res in enumerate(ex.map(mirror, picked), 1):
            results.append(res)
            if i % 100 == 0:
                print(f"  mirrored {i}/{len(picked)}", flush=True)
    ok = [r for r in results if r["ok"]]
    bad = [r for r in results if not r["ok"]]
    print(f"done: ok={len(ok)} failed={len(bad)} files={sum(r['files'] for r in ok)}")
    for r in bad[:15]:
        print("  FAIL", r["name"], r["error"])
    json.dump({"ok": ok, "failed": bad, "skipped": others},
              open("/tmp/mirror-report.json", "w"), indent=1)


if __name__ == "__main__":
    main()
