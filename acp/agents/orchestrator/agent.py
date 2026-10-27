"""The orchestrator: one question in, several real ACP agents answering under it.

Briefs fan a place out to five substree agents at once (each a real process over stdio ACP),
and `ask <agent>: ...` forwards any single question verbatim. The orchestrator owns no
dataset of its own - it is the first agent here that answers by *running* the other agents,
the way an editor would.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text  # noqa: E402

from federation import AGENTS, SiblingError, ask_pair, brief, catalog, run_sibling, sibling_question, topics_from  # noqa: E402

HELP = (
    "I run this repo's own ACP agents and hand you their answers. Ask me:\n"
    "  - brief me on Denver\n"
    "  - brief me on Denver for air and moon\n"
    "  - ask air: is it smoggy in Denver right now?\n"
    "  - what agents can you run?\n"
    f"I bridge {', '.join(sorted(AGENTS))}. Each answer is produced by that agent's own"
    " process, fed one question in its own phrasing, and the brief says where each part"
    " came from."
)

PERMISSION_KEY = "orchestrator-run-siblings"

PLACE_IN = re.compile(
    r"\b(?:on|in|at|for|about)\s+([A-Za-z][A-Za-z .'\-]{1,50}?)(?=\s+(?:for\s+(?:air|hazards|wildfire|tides|moon)|"
    r"right now|today|tonight|please)\b|[?.!]|$)", re.IGNORECASE)
_TOPIC_WORDS = re.compile(r"\b(air|hazards|wildfire|tides|moon)\b", re.IGNORECASE)
_AGENT_LIST = re.compile(r"\bwhat agents\b|\bcan you run\b|\bwho do you coordinate\b|\bcatalog\b", re.IGNORECASE)


_TOPIC_CLAUSE = re.compile(
    r"\b(?:for|and|with)?\s*(?:\b(?:air|hazards|wildfire|tides|moon)\b\s*(?:,|and|with)?\s*)+",
    re.IGNORECASE)


def place_from(text: str) -> str | None:
    """The place in a brief request, with any sibling-topic clause removed first, so
    `brief me for air and moon in Denver` yields Denver, not `air and moon in Denver`."""
    cleaned = _TOPIC_CLAUSE.sub(" ", str(text or ""))
    match = PLACE_IN.search(cleaned)
    if not match:
        return None
    words = [w for w in match.group(1).strip().split() if w]
    if not words or len(words) > 5 or words[0].lower() in {"and", "the", "a", "for", "in", "on", "at"}:
        return None
    return " ".join(words).strip(" .,?!")[:50]


def route(text: str) -> tuple[str, dict]:
    """Deterministic routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _AGENT_LIST.search(stripped):
        return "catalog", {}
    pair = ask_pair(stripped)
    if pair:
        return "ask", {"agent": pair[0], "question": pair[1]}
    if re.search(r"\bbrief\b", stripped, re.IGNORECASE):
        place = place_from(stripped)
        if not place:
            return "help", {}
        topics = topics_from(stripped)
        return "brief", {"place": place, "topics": topics}
    if _TOPIC_WORDS.search(stripped):
        # a bare domain question is forwarded to that sibling verbatim
        for name in AGENTS:
            if re.search(rf"\b{re.escape(name)}\b", stripped, re.IGNORECASE):
                return "ask", {"agent": name, "question": stripped}
    return "help", {}


def clamp(text: str, lines: int = 4) -> str:
    """A sibling's answer, cut to the lead so a brief stays a brief."""
    rows = [ln for ln in (text or "").splitlines() if ln.strip()]
    if len(rows) <= lines:
        return "\n".join(rows) or "(no answer)"
    return "\n".join(rows[:lines]) + f"\n  ... +{len(rows) - lines} more line(s) from the agent"


def render_brief(place: str, rows) -> tuple[str, str]:
    """The brief body and its one-line summary."""
    good = [row for row in rows if row.ok and row.text]
    bad = [row for row in rows if not (row.ok and row.text)]
    lines = [f"Brief for {place} - {len(good)} of {len(rows)} agents answered:"]
    for row in good:
        lines.append(f"\n[{row.agent}]")
        lines.append(clamp(row.text))
    for row in bad:
        detail = row.error or "refused the question"
        lines.append(f"\n[{row.agent}] not answered: {detail}")
    summary = f"{len(good)}/{len(rows)} sibling answers"
    return "\n".join(lines) + f"\n\nSource: this repo's agents, each started as its own process (ACP over stdio).", summary


class OrchestratorAgent(AcpAgent):
    name = "orchestrator"
    title = "Orchestrator - runs this repo's other ACP agents and merges their answers"
    version = "1.0.0"

    def __init__(self, connection=None, gateway: object | None = None) -> None:
        super().__init__(connection)
        self.gateway = gateway  # inert; the federation is sibling processes, not a gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Orchestrator session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Run the sibling agent(s) over ACP", "high"),
            ("Merge and quote their answers", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("One question here is several agents answering it in their own shape.")
            return STOP_END_TURN

        if skill == "catalog":
            body = "\n".join(f"  - {row['agent']}: {row['ask_example']}" for row in catalog())
            ctx.stream_text("Agents I can run:\n" + body + "\n")
            ctx.message("Each runs as its own ACP process, spawned the same way an editor spawns me.")
            return STOP_END_TURN

        if skill == "ask":
            name = params["agent"]
            tool = "call_ask"
        else:
            names = params["topics"] or sorted(AGENTS)
            tool = "call_brief"
        ctx.tool_call(tool, title := (f"Run the {name} agent over ACP" if skill == "ask"
                                      else f"Run {len(names)} agents over ACP"), kind="run",
                      name=tool, raw_input=params)
        if not ctx.ask_permission(tool, "Allow Orchestrator to start this repo's agents and read their answers?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to start sibling processes first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "ask":
                row = run_sibling(name, params["question"])
                if not row.ok and row.error:
                    raise SiblingError(row.error)
                body = row.text or "(the agent returned an empty answer)"
                body += f"\n\nSource: the {name} agent, run over ACP by the orchestrator."
                summary = f"{name}: stopReason={row.stop_reason or 'end-turn'}"
            else:
                questions = {name: sibling_question(name, params["place"]) for name in names}
                rows = brief(questions)
                body, summary = render_brief(params["place"], rows)
        except SiblingError as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"The sibling did not answer: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one fan-out per turn


def main(argv=None) -> int:
    import logging
    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        OrchestratorAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
