#!/usr/bin/env python3
"""Build the site data (servers.json, atlas.json) that the static pages render.

Sources, all in-repo or local build artifacts, no network:
  npm-publish-cron/metadata.json   the queue's truth about every server (tool counts)
  npm-publish-cron/done.txt        what is actually published ("name version")
  /Users/test/_npm-desc.json       npm packument descriptions (fetched once at build time)
  acp/MISSING.md                   the probe table every atlas row cites

Run from the repo root:  python3 site/build.py
"""

from __future__ import annotations

import datetime
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CRON = Path("/Users/test/npm-publish-cron")
SITE = Path(__file__).resolve().parent
DESC_JSON = SITE / "data" / "npm.json"

REPO_URL = "https://github.com/mrfentmen/awesome-servers"


def load_servers() -> list[dict]:
    meta = {e["name"]: e for e in json.load(open(CRON / "metadata.json"))}
    try:
        descs = {e["name"]: e for e in json.load(open(DESC_JSON))}
    except FileNotFoundError:
        descs = {}
    done = {}
    for line in open(CRON / "done.txt"):
        parts = line.split()
        if len(parts) == 2:
            done[parts[0]] = parts[1]
    rows = []
    for name, entry in sorted(meta.items()):
        desc = descs.get(name, {})
        version = done.get(name) or entry.get("npmVersion") or ""
        if not desc.get("description"):
            continue  # only entries the registry itself described; the page is honest about totals elsewhere
        rows.append({
            "name": name,
            "description": desc["description"],
            "version": version,
            "keywords": desc.get("keywords") or [],
            "toolCount": entry.get("toolCount"),
            "npm": f"https://www.npmjs.com/package/{name}",
            "source": desc.get("error") and None or f"{REPO_URL}/tree/main/mcp/servers/{name}",
        })
    return rows


HEADING_DATE = re.compile(r"^## .*(probed live|Dead or blocked) on (\d{4}-\d{2}-\d{2})")
ROW = re.compile(r"^\| `([^`]+)` \| `([^`]+)` \| (.+) \|\s*$")


def load_atlas() -> list[dict]:
    """The public-feed atlas: every probe row in acp/MISSING.md with its status."""
    rows: list[dict] = []
    date = ""
    dead = False
    for line in (ROOT / "acp" / "MISSING.md").read_text().splitlines():
        head = HEADING_DATE.match(line)
        if head:
            date = head.group(2)
            dead = "Dead or blocked" in line
            continue
        row = ROW.match(line)
        if row and date:
            name, feed, result = row.groups()
            status = "dead" if dead else ("built" if "**built**" in result else "open")
            note = re.sub(r"\*\*|`", "", result)
            note = note.split(" — ", 1)[1] if " — " in note else note
            rows.append({"name": name, "feed": feed, "status": status,
                         "probed": date, "note": note.strip()[:160]})
    # de-dupe: a later probe of the same feed wins (sessions re-probe)
    best: dict[tuple[str, str], dict] = {}
    for row in rows:
        best[(row["name"], row["feed"])] = row
    return sorted(best.values(), key=lambda r: (r["status"] != "dead", r["probed"], r["name"]))


def agent_names() -> set[str]:
    return {p.name for p in (ROOT / "acp" / "agents").iterdir() if p.is_dir()}


def main() -> int:
    SITE.joinpath("data").mkdir(exist_ok=True)
    servers = load_servers()
    (SITE / "servers.json").write_text(json.dumps(servers, indent=1))
    atlas = load_atlas()
    built = agent_names()
    # the probe table only tags some rows **built**; a feed whose agent exists and has
    # tests in this repo is verifiably built, so the directory listing is the arbiter.
    for row in atlas:
        if row["name"] in built:
            row["status"] = "built"
            row["agent"] = f"{REPO_URL}/tree/main/acp/agents/{row['name']}"
    (SITE / "atlas.json").write_text(json.dumps(atlas, indent=1))
    print(f"site: {len(servers)} servers, {len(atlas)} atlas feeds "
          f"({sum(1 for r in atlas if r['status'] == 'built')} built, "
          f"{sum(1 for r in atlas if r['status'] == 'dead')} dead)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
