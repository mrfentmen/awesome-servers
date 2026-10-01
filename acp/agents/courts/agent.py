"""Courts - the US opinion record, from CourtListener's public search API.

CourtListener indexes 117,000+ opinions and nobody asks them what a court actually said
about a topic. "find court opinions about privacy" gets the best-matching cases with the
court, the date and the citation, and "which court decided Brown v. Board of Education"
gets one case with how often it has been cited since.

The one question this will not answer free is "which courts rule most on this topic",
because that means reading across thousands of opinions, not one page. That one is a
premium skill, and the licence for it is checked on the gateway.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (STOP_END_TURN, STOP_REFUSAL, AcpAgent, GatewayClient,  # noqa: E402
                     GatewayError, SessionContext, empty_premium_answer, premium_call,
                     prompt_text)

from data import (DATASET, PAGE_SIZE, CourtsData, CourtsError,  # noqa: E402
                  CourtsNotFound, case_name_from_text, court_name_from_text,
                  topic_from_text, years_from_text)

HELP = (
    "I read CourtListener's opinion search (keyless) - 117,000+ US court opinions. Ask me:\n"
    "  - find court opinions about privacy\n"
    "  - which court decided Brown v. Board of Education?\n"
    "  - how many opinions mention fourth amendment?\n"
    "  - opinions on privacy in the Ninth Circuit\n"
    "  - what is the citation string for the D.C. Circuit?\n"
    "  - which courts rule most on privacy? (premium)\n"
    "Every search is limited to *opinions*, not dockets, and the count I report is the\n"
    "whole-corpus number CourtListener holds, not the number of pages I read."
)

PERMISSION_KEY = "courts-read-courtlistener"

SKILLS = ("courts-opinions", "courts-case", "courts-count", "courts-courts",
          "courts-topic-courts", "help")

#: Court ids, like ca9 or scotus, and the citation form 18 F.4th 712.
_COUNT_WORDS = re.compile(r"\bhow many|how often|count of|number of|how much of the corpus\b",
                          re.IGNORECASE)

#: Without one of these words, a question is not about the law and is not answered here.
#: A quoted phrase or an X v. Y case name counts on its own, because both are already
#: a search term rather than a sentence.
_LEGAL_WORDS = re.compile(r"\b(court|courts|circuit|district|supreme|appeal|appeals|"
                          r"opinion|opinions|decisions?|decision|holding|holdings|docket|"
                          r"judge|judges|justice|justices|citation|cite|cited|citing|"
                          r"lawsuit|ruling|rulings|statute|constitutional)\b", re.IGNORECASE)

#: "which courts does CourtListener index" is a directory question, not a search.
_DIRECTORY_RE = re.compile(r"(?i)\b(?:which|what|list|name)\s+courts?\b")
_TOPIC_WORDS = re.compile(
    r"\b(most|biggest|largest|rank|ranking|ranked|breakdown|distribution|share|"
    r"which courts|what courts|across courts|by court|court by court|compare courts|"
    r"top courts|leading courts|divided)\b",
    re.IGNORECASE,
)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    court_id = _court_id_from_text(stripped)
    court = court_name_from_text(stripped)
    topic = topic_from_text(stripped)
    case = case_name_from_text(stripped)
    counted = bool(_COUNT_WORDS.search(stripped))
    after, before = years_from_text(stripped)
    if not (_LEGAL_WORDS.search(stripped) or case or '"' in stripped or court_id):
        #: Not a legal question. Answering "tell me a joke" by searching CourtListener
        #: for those words would be worse than saying what this agent is for.
        return "help", {}
    if case:
        return "courts-case", {"case": case}

    #: A court named in the question is a filter, not a request for the directory, so a
    #: topic wins before the directory lookup does.
    if topic and (court_id or court or after or before):
        skill = "courts-count" if counted else "courts-opinions"
        params = {"query": topic, "court": court_id, "court_name": court}
        if after:
            params["after"] = after
        if before:
            params["before"] = before
        return skill, params
    #: Narrow on purpose: a *breakdown across courts* question. "how many opinions mention
    #: X" and "find opinions about X" stay with the free skills above.
    if topic and _TOPIC_WORDS.search(stripped):
        return "courts-topic-courts", {"query": topic}
    if court_id or court or _DIRECTORY_RE.search(stripped):
        return "courts-courts", {"court": court_id or court} if (court_id or court) else {"court": None}
    if topic:
        if counted:
            return "courts-count", {"query": topic}
        return "courts-opinions", {"query": topic}
    return "help", {}



def _court_id_from_text(text: str) -> str | None:
    """A court id already in the form the search endpoint takes, like ca9 or scotus.

    A digit, or one of the two ids that are words. That keeps ordinary lowercase words
    out: CourtListener answers 400 to a court it does not have.
    """
    for token in re.findall(r"\b([a-z]{2,8}\d{0,3})\b", str(text or "")):
        if any(ch.isdigit() for ch in token) or token in ("scotus", "cafc"):
            return token
    return None


#: How many cases a single answer lists. CourtListener returns 20; twenty citations in a
#: terminal answer is noise, and the rest are one call away.
SHOWN = 8


def render_opinions(found: dict) -> str:
    """The matching cases, best match first, with the count of the whole corpus."""
    window = f", {found['window']}" if found.get("window") else ""
    if found["truncated"]:
        head = (f"{SHOWN} best match(es) of {found['count']} opinion(s) for {found['query']!r}")
    else:
        head = f"{len(found['rows'])} opinion(s) for {found['query']!r}"
    lines = [head + (f" in {found['court']}" if found["court"] else "") + window]
    for row in found["rows"][:SHOWN]:
        lines.append(f"  {row['case_name']} ({row['court_citation'] or row['court'] or 'court not reported'})")
        detail = []
        if row["citation"]:
            detail.append(row["citation"])
        if row["date_filed"]:
            detail.append(f"filed {row['date_filed']}")
        if row["docket"]:
            detail.append(f"docket {row['docket']}")
        if detail:
            lines.append("    " + ", ".join(detail))
        if row["cite_count"]:
            lines.append(f"    cited by {row['cite_count']} opinion(s) in CourtListener")
        lines.append(f"    {row['url']}")
    if not found["rows"]:
        lines.append("  no opinion in CourtListener matched that")
    if found["truncated"]:
        lines.append(f"  {len(found['rows'])} came back on the first page; "
                     f"{found['count']} match in CourtListener's whole corpus.")
    return "\n".join(lines)


def render_case(row: dict) -> str:
    """One case: who decided it, when, and how much it has been cited since."""
    lines = [f"{row['case_name']}"]
    lines.append(f"  decided by: {row['court'] or 'court not reported'}"
                 + (f" ({row['court_citation']})" if row["court_citation"] else ""))
    if row["jurisdiction"]:
        lines.append(f"  jurisdiction: {row['jurisdiction']}")
    if row["date_filed"]:
        lines.append(f"  filed: {row['date_filed']}")
    if row["citation"]:
        lines.append(f"  citation: {row['citation']}")
    if row["docket"]:
        lines.append(f"  docket: {row['docket']}")
    if row["judge"]:
        lines.append(f"  judge: {row['judge']}")
    if row["status"]:
        lines.append(f"  status: {row['status']}")
    if row["cite_count"] is not None:
        lines.append(f"  cited by: {row['cite_count']} opinion(s) later in CourtListener")
    lines.append(f"  {row['url']}")
    return "\n".join(lines)


def render_count(found: dict) -> str:
    """How common a topic is across the corpus, with the best matches."""
    window = f", {found['window']}" if found.get("window") else ""
    lines = [f"{found['count']} opinion(s) in CourtListener mention {found['query']!r}"
             + (f", as decided by {found['court']}" if found["court"] else "")
             + window]
    for row in found["rows"][:3]:
        lines.append(f"  - {row['case_name']} ({row['court_citation'] or 'court not reported'}, "
                     f"{row['date_filed'] or 'date not reported'})")
    if found["truncated"]:
        lines.append(f"  (showing the {PAGE_SIZE} best matches of {found['count']})")
    return "\n".join(lines)


def render_courts(directory: dict) -> str:
    """The court directory, or the one court asked about."""
    if "court" in directory:
        court = directory["court"]
        lines = [f"{court['name']}"]
        if court["full_name"] and court["full_name"] != court["name"]:
            lines.append(f"  full name: {court['full_name']}")
        lines.append(f"  search id: {court['id']}")
        lines.append(f"  citation string: {court['citation'] or 'not reported'}")
        if court["jurisdiction"]:
            lines.append(f"  jurisdiction: {court['jurisdiction']}")
        lines.append(f"  in use: {'yes' if court['in_use'] else 'no'}")
        lines.append(f"  in the directory of {directory['total']} courts")
        return "\n".join(lines)
    lines = [f"{len(directory['courts'])} of {directory['total']} courts CourtListener indexes:"]
    for court in directory["courts"][:25]:
        lines.append(f"  {court['id']:<22} {court['citation'] or '':<10} {court['name']}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_topic_courts(data: dict) -> str:
    """Where a topic is decided: the courts ranked, with their share of the matches."""
    courts = data.get("courts") or []
    lines = [f"which courts decide {data.get('query', 'not reported')!r}, from "
             f"{data.get('opinions_sampled', 0)} opinion(s) CourtListener returned"]
    total = sum(court.get("count") or 0 for court in courts) or 0
    for court in courts:
        share = court.get("share")
        lines.append(f"  {court.get('court', 'court not reported')}"
                     + (f" ({court['court_citation']})" if court.get("court_citation") else "")
                     + f": {court.get('count', 0)} opinion(s)"
                     + (f", {_num(share)}% of the {total} sampled" if share is not None else ""))
    if not courts:
        lines.append("  the gateway sampled no opinion that matched")
    if data.get("sampled_note"):
        lines.append(f"  {data['sampled_note']}")
    lines.append(f"  corpus count for this query: {data.get('corpus_count', 'not reported')}")
    lines.append(f"  source: {data.get('source', DATASET)}")
    return "\n".join(lines)


class CourtsAgent(AcpAgent):
    name = "courts"
    title = "Courts - what the US opinion record says about a topic, and who decided what"
    version = "1.0.0"

    def __init__(self, connection=None, data: CourtsData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or CourtsData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Courts session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read CourtListener's opinion search", "medium"),
            ("Report the cases, the court and the dates", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("A count is the whole corpus; a list is the best matches on one page.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read CourtListener's opinion search", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Courts to read CourtListener's public opinions?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read CourtListener's opinions first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "courts-topic-courts":
                return self._run_skill(ctx, params, tool)
            if skill == "courts-case":
                row = self.data.case(params["case"])
                body = render_case(row)
                summary = f"{row['case_name']} - {row['court_citation'] or row['court'] or 'court not reported'}"
            elif skill == "courts-courts":
                directory = self.data.courts(params.get("court"))
                body = render_courts(directory)
                summary = ("court directory" if "courts" in directory
                           else str(directory["court"]["name"]))
            else:
                court_id = params.get("court") or self._court_id(params.get("court_name"))
                found = self.data.search(params["query"], court=court_id,
                                         after=params.get("after"), before=params.get("before"))
                if params.get("court_name") and not court_id:
                    found["court"] = params["court_name"]
                    found["note"] = (f"{params['court_name']!r} is not in CourtListener's court "
                                     "directory, so these are every court.")
                if skill == "courts-count":
                    body = render_count(found)
                    summary = f"{found['count']} opinion(s) mention {found['query']!r}"
                else:
                    body = render_opinions(found)
                    summary = (f"{len(found['rows'])} of {found['count']} opinion(s) match "
                               f"{found['query']!r}")
                if found.get("note"):
                    body = found["note"] + "\n" + body
        except (CourtsError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read CourtListener: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. CourtListener's coverage is uneven: "
                    "federal appellate and district opinions are well indexed, many state "
                    "courts are not, and an opinion that is missing here may still be "
                    "decided law. A citation count counts what CourtListener has indexed, "
                    "not every citation in the country.")
        return STOP_END_TURN

    def _court_id(self, name: str | None) -> str | None:
        """Turn a court name into the short id the search endpoint takes.

        A name the directory does not have returns None rather than raising, because the
        unfiltered answer is still worth giving - the caller says which name was ignored.
        """
        if not name:
            return None
        try:
            directory = self.data.courts(name)
        except CourtsError:
            return None
        return (directory.get("court") or {}).get("id")

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"query": params["query"]}

        data, refused = premium_call(self.gateway, "courts_topic_courts", arguments,
                                    {"agent": "courts"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not (data.get("courts") or data.get("opinions_sampled")):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a court breakdown for that topic.",
                {"agent": "courts"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a breakdown out of what the gateway sent.")
            return STOP_END_TURN

        body = render_topic_courts(data)
        summary = (f"{len(data.get('courts') or [])} court(s) sampled across "
                   f"{data.get('opinions_sampled', 0)} opinion(s) on {data.get('query', '?')!r}")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: CourtListener, aggregated on the licence gateway. The share is "
                    "of the opinions the gateway sampled, which CourtListener returns best-"
                    "first, so a topic with thousands of matches is a *sample*, not a census.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one search, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        CourtsAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
