"""Lobbying - what the Senate's own disclosure filings say, and who filed them.

The Senate publishes every lobbying disclosure, keyless, and the numbers are almost
unreadable without this. "what did Microsoft file in 2023?" gets its filings with the
amount on each one, the period it covers, the issues it names and the people who signed
it; "how many filings were there in 2024?" gets the Senate's own count.

Two limits are stated up front because the API has them, not because this agent does.
The Senate API accepts a text search and an issue filter and *ignores both* - every
variation of them returns the whole year - so this agent never filters by topic and says
so rather than answering a different question than the one asked. And a registration
report carries no money, so an amount is printed only where the filing has one.

The question the free skills do not answer is the total: what one firm spent on lobbying
across years, added up over every filing it made. That is a multi-page read, and it is the
premium skill, licensed on the gateway.
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

from data import (DATASET, FILING_TYPES, PAGE_SIZE, LobbyingData,  # noqa: E402
                  LobbyingError, LobbyingNotFound, span_from_text, sum_money)

HELP = (
    "I read the Senate's Lobbying Disclosure filings (keyless). Ask me:\n"
    "  - what did Microsoft file with the Senate in 2023?\n"
    "  - what issues does Boeing lobby on?\n"
    "  - show me the Q1 filings from 2024\n"
    "  - how many lobbying filings were there in 2024?\n"
    "  - how much did Microsoft spend on lobbying in total from 2021 to 2023? (premium)\n"
    "Two things the Senate's own API does not do, so I do not pretend to: it accepts a text\n"
    "search and an issue filter and ignores both - every variation returns the whole year -\n"
    "so a question about lobbying *on a topic* cannot be filtered, only a question about a\n"
    "named firm or a kind of filing. And a registration report (RR) carries no money, so an\n"
    "amount is printed only where the filing has one."
)

PERMISSION_KEY = "lobbying-read-senate-lda"

SKILLS = ("lobbying-registrant", "lobbying-issues", "lobbying-by-type", "lobbying-count",
          "lobbying-totals", "help")

_TYPE_RE = re.compile(r"\b(Q[1-4]|YY|YA|MM|MA|RR|1A|2A|2B|2C|PP|SA)\b", re.IGNORECASE)
_TYPE_WORDS = re.compile(
    r"(?i)\b(first|second|third|fourth|1st|2nd|3rd|4th)\s+quarter\b"
    r"|\b(mid-?year|semi-?annual|annual|quarterly|registration)\s+(report|filings?)\b"
    r"|\bregistration\s+report\b")

_TYPE_PHRASES = {
    "first quarter": "Q1", "1st quarter": "Q1", "second quarter": "Q2", "2nd quarter": "Q2",
    "third quarter": "Q3", "3rd quarter": "Q3", "fourth quarter": "Q4", "4th quarter": "Q4",
    "mid-year": "MM", "mid year": "MM", "semi-annual": "MM", "semiannual": "MM",
    "annual": "YY", "registration report": "RR", "registration": "RR",
}

#: A *total* question is the aggregate, and the aggregate is the paywall.
_TOTAL_WORDS = re.compile(
    r"\b(in total|altogether|added up|sum|summed|cumulative|overall|across the years|"
    r"over the years|all of|every filing|all filings|every year|all years|"
    r"put together|combined|total for)\b",
    re.IGNORECASE)

_ISSUE_WORDS = re.compile(r"\b(issues?|topics?|about what|on what|what about|subjects?|"
                          r"lobby(?:ing)? on|lobbied on)\b", re.IGNORECASE)
_COUNT_WORDS = re.compile(r"\bhow many|how much|number of|count of|how often\b", re.IGNORECASE)

#: A question about lobbying at all.
_LOBBY_WORDS = re.compile(
    r"\b(lobb(?:y|ies|ied|ing)|lobbyist|lobbyists|filing|filings|senate|congress|"
    r"congressional|disclosure|lda|quarter|quarterly|annual|registrant|registrants|"
    r"registration|register|report|reports|income|expenses|spend|spent|spending|"
    r"money|amount|amounts)\b",
    re.IGNORECASE)

_CAPITALISED = re.compile(r"\b([A-Z][A-Za-z'&.-]*(?:\s+[A-Z][A-Za-z'&.-]*)*)\b")
_NOT_A_NAME = {
    "What", "Which", "Who", "How", "The", "A", "An", "In", "On", "For", "And", "But", "Is",
    "Are", "Does", "Do", "Can", "Could", "Show", "Give", "Tell", "Find", "List", "Get",
    "Senate", "Congress", "Congressional", "LDA", "Filing", "Filings", "Registration",
    "Report", "Reports", "Quarter", "Quarterly", "Annual", "Lobbying", "Lobbyist",
    "Lobbyists", "Money", "Total", "Totals", "Amount", "Amounts", "Spending", "Spent",
    "Please", "I", "It", "There", "That", "This", "US", "U.S.",
}


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if not _LOBBY_WORDS.search(stripped):
        return "help", {}

    filing_type = type_from_text(stripped)
    from_year, to_year = span_from_text(stripped)
    name = name_from_text(stripped)

    if name and _TOTAL_WORDS.search(stripped):
        return "lobbying-totals", {"registrant": name, "from_year": from_year,
                                   "to_year": to_year}
    if name and _ISSUE_WORDS.search(stripped):
        return "lobbying-issues", {"registrant": name, "year": to_year}
    if name:
        return "lobbying-registrant", {"registrant": name, "year": to_year}
    if filing_type:
        return "lobbying-by-type", {"filing_type": filing_type, "year": to_year}
    if _COUNT_WORDS.search(stripped):
        return "lobbying-count", {"year": to_year}
    return "help", {}


def type_from_text(text: str) -> str | None:
    """A Senate filing type from a question, e.g. Q1 or RR."""
    work = str(text or "").upper()
    match = _TYPE_RE.search(work)
    if match:
        code = match.group(1)
        if code in FILING_TYPES:
            return code
    lowered = str(text or "").lower()
    for phrase, code in _TYPE_PHRASES.items():
        if phrase in lowered:
            return code
    if _TYPE_WORDS.search(lowered) and not match:
        #: "registration report" without the code still means RR.
        if "registration" in lowered:
            return "RR"
    return None


def name_from_text(text: str) -> str | None:
    """A registered lobbyist or firm, in the way a question writes one.

    A capitalised run, with the question words and the Senate's own vocabulary taken off
    the ends. There is no name lookup to check it against - the API's only name filter is
    `registrant_name`, which matches part of the registered name - so the run is passed to
    the API as typed and the answer reports what came back.
    """
    work = str(text or "").strip()
    for name in re.findall(r'"([^"]{2,80})"', work):
        return name.strip()
    runs = _CAPITALISED.findall(work)
    for run in runs:
        if re.fullmatch(r"(?:19|20)\d{2}", run) or _TYPE_RE.fullmatch(run):
            continue
        words = [re.sub(r"['’]s$", "", word) for word in run.split()]
        while words and words[0] in _NOT_A_NAME:
            words.pop(0)
        while words and words[-1] in _NOT_A_NAME:
            words.pop()
        phrase = " ".join(words).strip(" .,;:'\"")
        if len(phrase) >= 2 and phrase not in _NOT_A_NAME:
            return phrase
    return None


def _usd(value) -> str:
    """An amount for a line of text, or the honest 'not reported'."""
    if value is None:
        return "not reported"
    return f"${value:,.2f}"


def render_registrant(found: dict) -> str:
    """One firm's filings, oldest first, with what each one reports."""
    rows = found["rows"]
    lines = [f"{found['count']} filing(s) by {found['query_name']!r} in {found['year']}, "
             f"showing {len(rows)}"]
    for row in rows:
        lines.append(f"  {row['filing_type']} - {row['filing_type_name'] or 'filing'} "
                     f"({row['period'] or 'period not reported'}), posted {row['posted'] or 'not reported'}")
        money_line = []
        if row["income"] is not None:
            money_line.append(f"income {_usd(row['income'])}")
        if row["expenses"] is not None:
            money_line.append(f"expenses {_usd(row['expenses'])}")
        lines.append("    " + (", ".join(money_line) if money_line
                                else "no amount on this filing (a registration report "
                                     "carries none)"))
        if row["client"] and row["client"] != row["registrant"]:
            lines.append(f"    for {row['client']}")
        if row["issues"]:
            issues = ", ".join(f"{code} ({name})" for code, name in
                               list((row.get("issue_names") or {}).items())[:6])
            lines.append(f"    issues: {issues}")
        if row["lobbyists"]:
            lines.append("    lobbyists: " + ", ".join(list(row["lobbyists"])[:6]))
        if row["document"]:
            lines.append(f"    filing: {row['document']}")
    if found["more_pages"]:
        lines.append(f"  the Senate holds {found['count']} and one page holds {PAGE_SIZE}; "
                     "ask for the premium total to read them all")
    return "\n".join(lines)


def render_issues(found: dict) -> str:
    """The issues one firm's filings name, most-seen first."""
    rows = found["rows"]
    lines = [f"issues named on the {len(rows)} filing(s) by {found['query_name']!r} in "
             f"{found['year']} that one page of the Senate's list holds"]
    for entry in found["issues"]:
        lines.append(f"  {entry['code']} - {entry['issue']}: on {entry['count']} "
                     "activity report(s)")
    if not found["issues"]:
        lines.append("  none of these filings names an issue code")
    if found["lobbyists"]:
        lines.append("  the lobbyists named on them: "
                     + ", ".join(f"{row['name']} ({row['count']})"
                                 for row in found["lobbyists"][:8]))
    lines.append("  the Senate's API cannot filter filings by issue, so these are the codes on "
                 "the filings this firm made, not a search for an issue")
    return "\n".join(lines)


def render_by_type(found: dict) -> str:
    """One kind of filing from a year."""
    rows = found["rows"]
    lines = [f"{found['count']} {found['filing_type']} filing(s) in {found['year']}, showing "
             f"{len(rows)} of the first page"]
    for row in rows:
        lines.append(f"  {row['registrant'] or 'registrant not reported'}"
                     + (f" for {row['client']}" if row["client"] and row["client"] != row["registrant"]
                        else ""))
        money_line = []
        if row["income"] is not None:
            money_line.append(f"income {_usd(row['income'])}")
        if row["expenses"] is not None:
            money_line.append(f"expenses {_usd(row['expenses'])}")
        lines.append("    " + (", ".join(money_line) if money_line
                                else "no amount on this filing"))
        if row["issues"]:
            lines.append("    issues: " + ", ".join(
                f"{code} ({name})" for code, name in list((row.get("issue_names") or {}).items())[:5]))
    if found["issues"]:
        lines.append("  the issue codes on this page: "
                     + ", ".join(f"{entry['code']} ({entry['count']})"
                                 for entry in found["issues"][:8]))
    return "\n".join(lines)


def render_count(found: dict) -> str:
    """The Senate's own count for a year."""
    return "\n".join([
        f"{found['count']} lobbying filing(s) in {found['year']}"
        + (f" by {found['registrant']!r}" if found.get("registrant") else "")
        + (f" of type {found['filing_type']}" if found.get("filing_type") else ""),
        "  the Senate's own count, taken without reading the filings",
        "  a filing is one lobbyist's report for one client on one set of issues; there are "
        "many filings per firm per year",
    ])


def _usd_short(value) -> str:
    if value is None:
        return "not reported"
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:,.2f}M"
    if abs(value) >= 1_000:
        return f"${value / 1_000:,.2f}K"
    return f"${value:,.2f}"


def render_totals(data: dict) -> str:
    """One firm's whole filing book, added up."""
    lines = [f"{data.get('registrant', 'not reported')}: Senate lobbying filings "
             f"{data.get('from_year', '?')} to {data.get('to_year', '?')}"]
    lines.append(f"  filings read: {data.get('filings_read', 0)}"
                 + (f" of {data.get('filings_available', 0)} the Senate holds"
                    if data.get("filings_available") else "")
                 + (" (there are more, so this is a partial total)" if data.get("truncated")
                    else " (that is all of them)"))
    lines.append(f"  total income reported: {_usd(data.get('total_income'))}"
                 f" (on {data.get('filings_reporting_income', 0)} filing(s))")
    lines.append(f"  total expenses reported: {_usd(data.get('total_expenses'))}"
                 f" (on {data.get('filings_reporting_expenses', 0)} filing(s))")
    if data.get("net") is not None:
        lines.append(f"  expenses less income: {_usd(data['net'])}")
    if data.get("by_type"):
        lines.append("  by kind of filing:")
        for row in data["by_type"][:8]:
            bits = [f"{row['filings']} filing(s)"]
            if row.get("income_reported"):
                bits.append(f"income {_usd_short(row['income'])}")
            if row.get("expenses_reported"):
                bits.append(f"expenses {_usd_short(row['expenses'])}")
            lines.append(f"    {row['filing_type']}: " + ", ".join(bits))
    if data.get("issues"):
        lines.append("  the issues it lobbied on most:")
        for row in data["issues"][:10]:
            lines.append(f"    {row['code']} - {row['issue']}: {row['count']} activity "
                         "report(s)")
    if data.get("lobbyists"):
        lines.append("  the lobbyists named on them: "
                     + ", ".join(f"{row['name']} ({row['count']})"
                                 for row in data["lobbyists"][:8]))
    lines.append(f"  source: {data.get('source', DATASET)}")
    return "\n".join(lines)


class LobbyingAgent(AcpAgent):
    name = "lobbying"
    title = "Lobbying - the Senate's own disclosure filings, and the money on them"
    version = "1.0.0"

    def __init__(self, connection=None, data: LobbyingData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or LobbyingData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Lobbying session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the Senate's disclosure filings", "medium"),
            ("Report the filings, the amounts and the issues", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("The Senate's API takes a text search and an issue filter and ignores "
                        "both, so a topic question is answered by a firm's own filings.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read the Senate's disclosure filings", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Lobbying to read the Senate's public filings?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the Senate's filings first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "lobbying-totals":
                return self._run_skill(ctx, params, tool)
            if skill == "lobbying-issues":
                found = self.data.registrant(params["registrant"], params["year"], limit=25)
                body = render_issues(found)
                summary = (f"{len(found['issues'])} issue code(s) on "
                           f"{found['query_name']!r}'s {found['year']} filings")
            elif skill == "lobbying-registrant":
                found = self.data.registrant(params["registrant"], params["year"], limit=10)
                body = render_registrant(found)
                summary = (f"{found['query_name']}: {found['count']} filing(s) in "
                           f"{found['year']}, expenses "
                           f"{_usd_short(sum_money(row['expenses'] for row in found['rows']))}")
            elif skill == "lobbying-by-type":
                found = self.data.by_type(params["filing_type"], params["year"], limit=10)
                body = render_by_type(found)
                summary = f"{found['count']} {found['filing_type']} filing(s) in {found['year']}"
            else:
                found = self.data.count(params["year"])
                body = render_count(found)
                summary = f"{found['count']} filing(s) in {found['year']}"
        except (LobbyingError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the Senate's filings: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Filings are one lobbyist's report for one "
                    "client, so a firm files many per year and its filings can cover several "
                    "clients. The Senate's own API ignores a text search and an issue filter, "
                    "which is why a topic is read off a firm's filings rather than searched for.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"registrant": params["registrant"],
                           "from_year": int(params["from_year"]),
                           "to_year": int(params["to_year"])}

        data, refused = premium_call(self.gateway, "lobbying_registrant_totals", arguments,
                                    {"agent": "lobbying"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("filings_read"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a total for that registrant.",
                {"agent": "lobbying"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a total out of what the gateway sent.")
            return STOP_END_TURN

        body = render_totals(data)
        summary = (f"{data.get('registrant', '?')}: {data.get('filings_read', 0)} filing(s) "
                   f"read, {_usd_short(data.get('total_expenses'))} of expenses")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: Senate LDA, read across pages on the licence gateway. The totals "
                    "are the sum of the filings the gateway read and are only as complete as that "
                    "read, and a registration report contributes no amount because it carries "
                    "none.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        LobbyingAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
