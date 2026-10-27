#!/usr/bin/env python3
"""Build the agent cards the hosted worker serves.

Each server in ``servers/`` already declares its own card (name, description, skills)
on its agent class. This script imports that class, keeps only the skills the hosted
worker really implements, adds the registry identity hints the A2A Registry needs for
GitHub-verified personal hosting, and writes:

    cards.json          the bundle src/index.js imports at deploy time
    cards/<name>.json   one file per agent, for anyone who wants to read them directly

Usage:

    python3 worker/tools/build_cards.py

The script fails loudly if a skill listed here no longer exists on the agent, so the
card can never drift away from the code it describes.
"""

from __future__ import annotations

import importlib
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKER_DIR = REPO_ROOT / "worker"
SERVERS_DIR = REPO_ROOT / "servers"

PUBLIC_BASE = "https://mrfentmen-a2a.contactae2000.workers.dev"
GITHUB_USER = "mrfentmen"
REPOSITORY = "https://github.com/mrfentmen/a2a"
PROTOCOL_VERSION = "0.3.0"

# Only skills the hosted worker actually answers are published. Everything else
# stays on the local server card, where the local server can honour it.
HOSTED_SKILLS = {
    "air": ("air-now", "air-forecast"),
    "aurora": ("aurora-now", "aurora-forecast", "aurora-visibility"),
    "nws": ("alerts-active", "alerts-summary"),
    "quakes": ("quakes-recent", "quakes-near", "quakes-summary"),
    "recalls": ("recalls-recent", "recall-search", "recall-lookup"),
    "tides": ("tide-next", "tide-predictions", "stations"),
}


def server_version(name: str) -> str:
    """Read the version the server module publishes, so the card matches the code."""
    text = (SERVERS_DIR / name / "server.py").read_text(encoding="utf-8")
    match = re.search(r'AGENT_VERSION\s*=\s*"([^"]+)"', text)
    if not match:
        raise SystemExit(f"{name}: no AGENT_VERSION in server.py")
    return match.group(1)


def load_agent(name: str):
    """Import one server's agent class without letting two servers share a module name."""
    server_dir = SERVERS_DIR / name
    for module in ("agent", "data"):
        sys.modules.pop(module, None)
    sys.path.insert(0, str(server_dir))
    sys.path.insert(0, str(REPO_ROOT))
    try:
        module = importlib.import_module("agent")
        for value in vars(module).values():
            if isinstance(value, type) and getattr(value, "card_skills", None):
                return value
        raise SystemExit(f"{name}: no agent class with card_skills found")
    finally:
        sys.path.remove(str(REPO_ROOT))
        sys.path.remove(str(server_dir))
        for module in ("agent", "data"):
            sys.modules.pop(module, None)


def hosted_skills(agent_class, wanted: tuple[str, ...]) -> list[dict]:
    by_id = {skill["id"]: skill for skill in agent_class.card_skills}
    missing = [skill_id for skill_id in wanted if skill_id not in by_id]
    if missing:
        raise SystemExit(
            f"{agent_class.__name__}: hosted skill(s) {missing} are not on the card; "
            f"the card declares {sorted(by_id)}"
        )
    return [by_id[skill_id] for skill_id in wanted]


def build_card(name: str) -> dict:
    agent_class = load_agent(name)
    version = server_version(name)
    base = f"{PUBLIC_BASE}/agents/{name}"
    hosted = hosted_skills(agent_class, HOSTED_SKILLS[name])
    local_only = [s["id"] for s in agent_class.card_skills if s["id"] not in HOSTED_SKILLS[name]]
    # The server's own description sells every skill it has. Hosted here, only some of
    # them answer, so the card says which — a description that promises a webhook the
    # hosted endpoint will never send would be a lie in the one place people read.
    description = agent_class.card_description
    if local_only:
        description += (
            f" This hosted endpoint answers {', '.join(s['id'] for s in hosted)};"
            f" the local server additionally implements {', '.join(local_only)}."
        )
    card = {
        "protocolVersion": PROTOCOL_VERSION,
        "name": agent_class.card_name,
        "description": description,
        "url": base + "/",
        "preferredTransport": "JSONRPC",
        "additionalInterfaces": [{"url": base + "/", "transport": "JSONRPC"}],
        "version": version,
        # The hosted worker is request/response only. Saying so here keeps a client
        # from waiting on a stream or a webhook that will never come.
        "capabilities": {"streaming": False, "pushNotifications": False},
        "defaultInputModes": ["text/plain", "application/json"],
        "defaultOutputModes": ["application/json", "text/plain"],
        "provider": {"organization": GITHUB_USER, "url": REPOSITORY},
        "skills": hosted,
        "metadata": {
            "registryIdentityProvider": "github",
            "registryIdentity": GITHUB_USER,
            "registryPackageName": f"github.{GITHUB_USER}.{name}",
            "sourceRepository": REPOSITORY,
            "localServer": f"servers/{name}/server.py",
            "hostedBy": "cloudflare-worker",
            "note": (
                "The local Python server implements every skill on its own card, "
                "including watch loops and push notifications. This hosted card lists "
                "only the skills the hosted endpoint answers."
            ),
        },
    }
    return card


def main() -> int:
    cards = []
    cards_dir = WORKER_DIR / "cards"
    cards_dir.mkdir(parents=True, exist_ok=True)
    for name in sorted(HOSTED_SKILLS):
        card = build_card(name)
        cards.append(card)
        (cards_dir / f"{name}.json").write_text(
            json.dumps(card, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"{name}: {card['name']} v{card['version']} — {len(card['skills'])} skills")
    (WORKER_DIR / "cards.json").write_text(
        json.dumps(cards, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"wrote {WORKER_DIR / 'cards.json'} ({len(cards)} cards)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
