#!/usr/bin/env python3
"""Remove the leftover licence gate from published packages.

60 packages in published/ still ship dist/license.js and a gate block in front of
selected tools, while their README promises no licence key. The tool bodies are
local, so the gate is pure obstruction: deleting it makes the promised behaviour
true.

The blocks are machine-generated and identical in shape, which is what makes a
scripted removal safe:

    const paywallMessage = await premiumRequired("<tool>");
    if (paywallMessage)
        return { content: [{ type: "text", text: paywallMessage }], isError: true };
    // ---- paywall: <marker> ----

Packages whose tools live on the remote gateway are NOT touched here: their tool
bodies are not in the package, so there is nothing to ungate — see
published/INDEX.md for those.

Usage:
    python3 scripts/ungate.py [--dry-run]
"""

import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT / "published"

IMPORT_LINE = re.compile(r'^import \{ premiumRequired \} from "\./license\.js";\n', re.M)

GATE_BLOCK = re.compile(
    r'[ \t]*const paywallMessage = await premiumRequired\("[^"]*"\);\n'
    r'[ \t]*if \(paywallMessage\)\n'
    r'[ \t]*return \{ content: \[\{ type: "text", text: paywallMessage \}\], isError: true \};\n'
    r'[ \t]*// ---- paywall: [^\n]*\n'
)


def bump(version: str) -> str:
    parts = version.split(".")
    while len(parts) < 3:
        parts.append("0")
    parts[2] = str(int(parts[2]) + 1)
    return ".".join(parts[:3])


def gated_packages() -> list[pathlib.Path]:
    found = []
    for pkg_dir in sorted(p for p in PUB.iterdir() if p.is_dir()):
        licence = pkg_dir / "dist" / "license.js"
        if licence.is_file() and "MCP_LICENSE_KEY" in licence.read_text(errors="replace"):
            found.append(pkg_dir)
    return found


def patch(pkg_dir: pathlib.Path, dry_run: bool) -> dict:
    server = pkg_dir / "dist" / "server.js"
    source = server.read_text()

    blocks = len(GATE_BLOCK.findall(source))
    patched = GATE_BLOCK.sub("", source)
    patched = IMPORT_LINE.sub("", patched)

    leftover = patched.count("premiumRequired") + patched.count("MCP_LICENSE")
    if leftover:
        return {"slug": pkg_dir.name, "status": "LEFT-OVER", "blocks": blocks, "left": leftover}

    if not dry_run:
        server.write_text(patched)
        (pkg_dir / "dist" / "license.js").unlink(missing_ok=True)
        licence_types = pkg_dir / "dist" / "license.d.ts"
        licence_types.unlink(missing_ok=True)

        manifest = pkg_dir / "package.json"
        data = json.loads(manifest.read_text())
        data["version"] = bump(data["version"])
        manifest.write_text(json.dumps(data, indent=2) + "\n")

    return {"slug": pkg_dir.name, "status": "patched", "blocks": blocks, "left": 0}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    packages = gated_packages()
    print(f"packages carrying dist/license.js: {len(packages)}")
    results = [patch(p, args.dry_run) for p in packages]

    patched = [r for r in results if r["status"] == "patched"]
    stuck = [r for r in results if r["status"] != "patched"]
    total_blocks = sum(r["blocks"] for r in results)
    print(f"gate blocks removed : {total_blocks}")
    print(f"packages patched    : {len(patched)}")
    print(f"packages stuck      : {len(stuck)}")
    for r in stuck:
        print(f"  STUCK {r['slug']}: {r['left']} references left")
    if args.dry_run:
        print("(dry run — nothing written)")
    return 0 if not stuck else 1


if __name__ == "__main__":
    sys.exit(main())
