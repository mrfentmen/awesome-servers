"""The sibling-agent registry and the transport that talks to them.

The orchestrator is an ACP agent whose feeds are *other ACP agents in this repo*: it starts
them as stdio child processes with the kit's own AcpClient (the editor-side half of the
protocol), opens a session, forwards the question and collects the turn. Every sibling is a
real process in the three-file shape, so the caller's answer comes from the same code an
editor would run - a brief is several real domain answers, not a proxy of one.

Registry kept to keyless-domain agents whose answer depends only on the question text; each
row carries the phrasing that agent understands (mirrored from its own HELP examples).
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
KIT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))  # acp_kit's home

#: sibling agent (directory under acp/agents), one ask template each
AGENTS = {
    "air": ("air", "how is the air quality in {place} right now?"),
    "hazards": ("hazards", "what alerts or earthquakes affect {place} right now?"),
    "wildfire": ("wildfire", "are any wildfire incidents burning near {place}?"),
    "tides": ("tides", "what are the tides at {place} for the next day?"),
    "moon": ("moon", "when does it get dark in {place} tonight?"),
}


class SiblingError(RuntimeError):
    """A sibling could not be started, did not answer in time, or failed its turn."""


def catalog() -> list[dict]:
    """The manifest, printable."""
    return [{"agent": name, "ask_example": template.replace("{place}", "Denver")}
            for name, (_, template) in sorted(AGENTS.items())]


def ask_pair(text: str) -> tuple[str, str] | None:
    """`ask air: is it smoggy in Denver?` -> ('air', 'is it smoggy in Denver?')."""
    match = re.match(r"\s*ask\s+([A-Za-z]+)\s*[:]\s*(.+?)\s*$", str(text or ""), re.IGNORECASE)
    if not match:
        return None
    name = match.group(1).lower()
    question = match.group(2).strip()
    if name not in AGENTS or not question:
        return None
    return name, question


def topics_from(text: str) -> list[str] | None:
    """`air and moon in Denver` -> the named subset, or None when nothing was named."""
    topics = [name for name in AGENTS if re.search(rf"\b{re.escape(name)}\b", text, re.IGNORECASE)]
    return topics or None


def sibling_question(name: str, question: str) -> str:
    """The phrasing a sibling expects: its own template when the caller gave a bare place,
    the caller's words verbatim when the question was already formed."""
    if name not in AGENTS:
        raise SiblingError(f"unknown sibling: {name!r}")
    _, template = AGENTS[name]
    if not question:
        raise SiblingError("no question to forward")
    if "{place}" in template and re.fullmatch(r"[A-Za-z][A-Za-z .'\-]{1,50}", question.strip()):
        return template.replace("{place}", question.strip())
    return question


class SiblingTurn:
    """One sibling's answer. Between the raw protocol and the caller's brief."""

    def __init__(self, agent: str) -> None:
        self.agent = agent
        self.ok = False
        self.text = ""
        self.stop_reason = ""
        self.error = ""

    def as_row(self) -> dict:
        return {"agent": self.agent, "ok": self.ok, "text": self.text,
                "stop_reason": self.stop_reason, "error": self.error}


def run_sibling(name: str, question: str, cwd: str | None = None,
                timeout: float = 60.0) -> SiblingTurn:
    """One real ACP turn against one sibling, spawned as its own process."""
    turn = SiblingTurn(name)
    if KIT_ROOT not in sys.path:  # the delayed kit import works for any caller
        sys.path.insert(0, KIT_ROOT)
    from acp_kit import AcpClient  # delayed: federation stays import-light for tests

    path = os.path.join(REPO_ROOT, "acp", "agents", AGENTS[name][0], "agent.py")
    command = [sys.executable, path]
    override = os.environ.get("ORCHESTRATOR_SIBLING_OVERRIDE")
    if override:  # tests point the manifest at a real (fast, offline) sibling instead
        path, command = override, [sys.executable, override]
    spawn_cwd = cwd or REPO_ROOT
    try:
        with AcpClient(command=command, timeout=timeout) as client:
            client.initialize(name="orchestrator-bridge", version="1.0.0")
            session_id = client.new_session(cwd=spawn_cwd)
            result = client.prompt(sibling_question(name, question), session_id=session_id)
            turn.ok = result.get("stopReason") != "refusal"
            turn.text = (result.get("text") or "").strip()
            turn.stop_reason = result.get("stopReason") or ""
    except FileNotFoundError:
        turn.error = f"the {name} agent is not on this machine"
    except subprocess.TimeoutExpired:
        turn.error = f"the {name} agent did not answer within {timeout:g}s"
    except Exception as exc:  # a sibling failing is a row, not a crash
        turn.error = str(exc)[:200]
    return turn


def brief(questions: dict[str, str], cwd: str | None = None,
          timeout: float = 60.0, workers: int = 4) -> list[SiblingTurn]:
    """Fan the questions out to siblings at once; a failing sibling is a row with ok=False."""
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {name: pool.submit(run_sibling, name, question, cwd, timeout)
                   for name, question in questions.items()}
        rows = [future.result() for _, future in sorted(futures.items())]
    return sorted(rows, key=lambda row: row.agent)
