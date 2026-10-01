"""Nonprofits - what a charity actually reports, and how big it is next to its peers.

ProPublica's Nonprofit Explorer serves the IRS's own Business Master File, keyless, and the
numbers in it are the ones a journalist needs and cannot get out of a PDF. "what does the
Red Cross report as revenue?" gets the amount and the tax period it belongs to - those two
belong together, because two charities side by side are rarely reporting for the same year.

The question the free skills do not answer is how big a charity is *next to the others*: the
search only returns names, so a real comparison means reading one record per organisation,
and that is the premium skill, licensed on the gateway.
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

from data import (DATASET, PAGE_SIZE, NonprofitData, NonprofitError,  # noqa: E402
                  NonprofitNotFound, ein_from_text, name_from_text)

HELP = (
    "I read ProPublica's Nonprofit Explorer (keyless) - the IRS Business Master File. Ask me:\n"
    "  - what does the Red Cross report as revenue?\n"
    "  - what is charity EIN 53-0196605's income?\n"
    "  - which charities are named Habitat for Humanity?\n"
    "  - compare the Red Cross and Habitat for Humanity\n"
    "  - how does the Red Cross compare with other charities like it? (premium)\n"
    "Every amount comes with the tax period it belongs to, because two charities side by\n"
    "side are rarely reporting for the same year. These are the IRS's own figures for each\n"
    "charity, not a parsed Form 990 - ProPublica's filing endpoint returns nothing for the\n"
    "organisations I tried, so I do not quote one."
)

PERMISSION_KEY = "nonprofit-read-propublica"

SKILLS = ("nonprofit-search", "nonprofit-organization", "nonprofit-compare",
          "nonprofit-standing", "help")

#: How big is this one next to the others. Narrow on purpose: "peers", "typical", "among"
#: and "percentile". A plain "compare X and Y" is the free skill, not this one.
_STANDING_WORDS = re.compile(
    r"\b(peers?|among (?:them|other|the)|other charities like|charities like it|"
    r"typical|average charity|median|percentile|distribution|how big|how large|"
    r"relative to|compared with|compared to others|rank|ranking|where does it stand|"
    r"larger than|smaller than|against the rest)\b",
    re.IGNORECASE)

_COMPARE_WORDS = re.compile(r"\b(compare|comparison|versus|vs\.?|against|beside|"
                            r"side by side|next to)\b", re.IGNORECASE)
_SEARCH_WORDS = re.compile(r"\b(which|what|who|list|find|search|show)\b.*\b(charit\w+|"
                           r"non-?profit\w*|organi[sz]ations?|foundations?|societies)\b",
                           re.IGNORECASE)
_COUNT_RE = re.compile(r"\b(?:top|first|show|list)\s+(\d{1,3})\b", re.IGNORECASE)

#: A question about a charity at all.
_CHARITY_WORDS = re.compile(
    r"\b(charity|charities|non-?profit\w*|organi[sz]ation\w*|ein|revenue|income|"
    r"expenses|assets|funds?|foundation|society|relief|donation|donations|give|giving|"
    r"raise|raises|raised|filing|filings|tax|990|budget|money|million|billion|"
    r"big|large|small|size|compare|comparison|versus|peers?|rank|ranking|typical|"
    r"median|percentile|distribution|stand|stands|among|registered)\b",
    re.IGNORECASE)

#: A charity's name is written as proper nouns, with lowercase connectors inside it:
#: "Habitat for Humanity", "Doctors Without Borders", "Feeding America".
_NAME_RUN = re.compile(
    r"[A-Z][A-Za-z'&.-]*(?:\s+(?:of|for|the|de|der|van|von|la|le|without)?\s*"
    r"[A-Z][A-Za-z'&.-]*)*")

#: Capitalised words that are the question, not the charity.
_NOT_A_NAME = {
    "What", "Which", "Who", "Whose", "Where", "How", "How Much", "How Big", "How Large",
    "The", "A", "An", "In", "On", "For", "And", "But", "Is", "Are", "Was", "Were", "Does",
    "Do", "Did", "Show", "Give", "Tell", "Find", "List", "Get", "Compare", "Comparison",
    "Versus", "Against", "Rank", "Ranking", "Stand", "Stands", "Peers", "Peer", "Like",
    "Typical", "Average", "Median", "Percentile", "Distribution", "Big", "Large", "Small",
    "Size", "Revenue", "Income", "Expenses", "Assets", "Funds", "Fund", "Budget", "Money",
    "Charity", "Charities", "Nonprofit", "Nonprofits", "Organisation", "Organization",
    "Organizations", "Organisations", "Foundation", "Societies", "Society", "Report",
    "Reports", "Filing", "Filings", "Tax", "Top", "First", "Please", "Me", "US", "IRS",
    "EIN", "Its", "It", "There", "That", "This", "Other", "Others", "Same", "Much", "Many",
    "Raise", "Raises", "Raised", "Earn", "Earns", "Earned", "Spend", "Spent", "Make",
    "Makes", "Made", "Has", "Have", "Had", "About", "Between", "Next", "Than", "With",
}


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if not _CHARITY_WORDS.search(stripped):
        return "help", {}

    ein = ein_from_text(stripped)
    names = names_from_text(stripped)
    limit = int(_COUNT_RE.search(stripped).group(1)) if _COUNT_RE.search(stripped) else 10
    limit = max(1, min(limit, 25))

    if names and _STANDING_WORDS.search(stripped):
        return "nonprofit-standing", {"name": names[0], "limit": limit, "ein": ein}
    if len(names) >= 2 and _COMPARE_WORDS.search(stripped):
        return "nonprofit-compare", {"names": names[:4]}
    if ein and not names:
        return "nonprofit-organization", {"ein": ein}
    if names and _SEARCH_WORDS.search(stripped):
        return "nonprofit-search", {"name": names[0], "limit": limit}
    if names:
        return "nonprofit-organization", {"name": names[0]}
    if ein:
        return "nonprofit-organization", {"ein": ein}
    return "help", {}


_NAME_SPLIT = re.compile(r"\b(?:and|vs\.?|versus|against|next to|between)\b", re.IGNORECASE)


def names_from_text(text: str) -> list[str]:
    """The charities a question names, in the order it names them.

    A charity is written as proper nouns, so a capitalised run is the name and the question
    words around it are not. A quoted phrase is taken whole, because whoever quoted a name
    meant exactly that name.
    """
    work = str(text or "").strip()
    found: list[str] = []
    for quoted in re.findall(r'"([^"]{2,120})"', work):
        if quoted.strip() not in found:
            found.append(quoted.strip())
    if found:
        return found
    for part in _NAME_SPLIT.split(work):
        for run in _NAME_RUN.findall(part):
            words = [re.sub(r"['’]s$", "", word) for word in run.split()]
            while words and words[0] in _NOT_A_NAME:
                words.pop(0)
            while words and words[-1] in _NOT_A_NAME:
                words.pop()
            name = " ".join(words).strip(" .,;:!?'\"")
            if len(name) < 3 or name in _NOT_A_NAME or name.lower() in _NOT_A_NAME:
                continue
            if name not in found:
                found.append(name)
    return found


def _usd(value) -> str:
    """An amount for a line of text, or the honest 'not reported'."""
    if value is None:
        return "not reported"
    if value == 0:
        #: A zero in the file is a reported zero, which is a different thing from a blank.
        return "$0.00 (reported as zero)"
    return f"${value:,.2f}"


def _usd_short(value) -> str:
    if value is None:
        return "not reported"
    if value == 0:
        return "$0 (reported as zero)"
    if abs(value) >= 1_000_000_000:
        return f"${value / 1_000_000_000:,.2f}B"
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:,.2f}M"
    if abs(value) >= 1_000:
        return f"${value / 1_000:,.2f}K"
    return f"${value:,.2f}"


def render_search(found: dict) -> str:
    """The organisations the search matched, in the API's own order."""
    lines = [f"{found['total']} organisation(s) in ProPublica's nonprofit explorer match "
             f"{found['query']!r}, showing the {found['count']} it ranks first"]
    for row in found["rows"]:
        lines.append(f"  {row['name']}")
        where = [bit for bit in (row["city"], row["state"]) if bit]
        detail = [f"EIN {row['ein']}"]
        if where:
            detail.append(", ".join(where))
        if row["ntee_code"]:
            detail.append(f"NTEE {row['ntee_code']}")
        if row.get("score") is not None:
            try:
                detail.append(f"match score {float(row['score']):.0f}")
            except (TypeError, ValueError):
                pass
        lines.append("    " + ", ".join(detail))
        lines.append(f"    {row['url']}")
    if not found["rows"]:
        lines.append("  no organisation matched that")
    if (found.get("num_pages") or 0) > 1:
        lines.append(f"  the search holds {found['num_pages']} pages of {PAGE_SIZE}")
    return "\n".join(lines)


def render_organization(row: dict, alternatives: list[dict] | None = None,
                        total: int | None = None) -> str:
    """One charity's own record, plus the others its name matches.

    A name like "Red Cross" matches 190 organisations in ProPublica's explorer and the API
    ranks its own best match first, which is not always the one a person meant. So the
    others are named: the answer says which one was read and which the rest are.
    """
    lines = [row["name"]]
    lines.append(f"  EIN: {row['ein']}" + (f" ({row['strein']})" if row.get("strein") else ""))
    where = [bit for bit in (row.get("address"), row.get("city"), row.get("state"),
                             row.get("zipcode")) if bit]
    if where:
        lines.append("  address: " + ", ".join(where))
    lines.append(f"  tax period: {row.get('tax_period') or 'not reported'}")
    lines.append(f"  revenue: {_usd(row.get('revenue'))}")
    lines.append(f"  income: {_usd(row.get('income'))}")
    lines.append(f"  assets: {_usd(row.get('assets'))}")
    if row.get("ntee_code"):
        lines.append(f"  NTEE code: {row['ntee_code']}")
    if row.get("ruling_date"):
        lines.append(f"  IRS ruling date: {row['ruling_date']}")
    if row.get("subsection_code"):
        lines.append(f"  IRS subsection code: {row['subsection_code']}")
    if row.get("deductibility_code"):
        lines.append(f"  IRS deductibility code: {row['deductibility_code']}")
    lines.append(f"  {row['url']}")
    others = [item for item in (alternatives or []) if item["ein"] != row["ein"]]
    if others:
        lines.append(f"  ProPublica matches {total} organisation(s) for that name and ranks this "
                     f"one first. The next, in case you meant a different one:")
        for item in others[:3]:
            where = [bit for bit in (item.get("city"), item.get("state")) if bit]
            lines.append(f"    {item['name']} (EIN {item['ein']}"
                         + (", " + ", ".join(where) if where else "") + ")")
    return "\n".join(lines)


def render_compare(found: dict) -> str:
    """Two to four charities, one line each, with each one's own tax period."""
    rows = found["rows"]
    lines = [f"{len(rows)} charities, as the IRS Business Master File has them"]
    for row in rows:
        lines.append(f"  {row['name']} (EIN {row['ein']})")
        lines.append(f"    revenue {_usd(row.get('revenue'))}, income {_usd(row.get('income'))}, "
                     f"assets {_usd(row.get('assets'))}")
        lines.append(f"    tax period {row.get('tax_period') or 'not reported'}"
                     + (f", {row['city']}, {row['state']}" if row.get("city") else ""))
        if row.get("unavailable"):
            lines.append(f"    {row['unavailable']}")
    lines.append("  these are different tax periods in most cases, so the sizes are not the "
                 "same year")
    return "\n".join(lines)


def render_standing(data: dict) -> str:
    """How big a charity is next to the others its own name search returns."""
    lines = [f"where {data.get('focus_name', 'not reported')} sits among the organisations "
             f"ProPublica ranks for {data.get('query', 'not reported')!r}"]
    lines.append(f"  the search holds {data.get('search_total', 'not reported')} organisation(s); "
                 f"{data.get('read', 0)} were read in full"
                 + (" (a sample, not the whole search)" if data.get("sampled") else ""))
    lines.append(f"  revenue across those: smallest {_usd_short(data.get('min_revenue'))}, "
                 f"median {_usd_short(data.get('median_revenue'))}, "
                 f"largest {_usd_short(data.get('max_revenue'))}")
    if data.get("rank") is not None:
        lines.append(f"  {data['focus_name']} is rank {data['rank']} of "
                     f"{data.get('ranked_count', 'not reported')} by revenue"
                     + (f", the {data.get('percentile')}th percentile"
                        if data.get("percentile") is not None else ""))
    rows = data.get("rows") or []
    for row in rows[:15]:
        lines.append(f"    {_usd_short(row.get('revenue')):>16}  {row['name'][:44]}"
                     f" (tax period {row.get('tax_period') or 'not reported'})")
    if data.get("note"):
        lines.append(f"  {data['note']}")
    lines.append(f"  source: {data.get('source', DATASET)}")
    return "\n".join(lines)


class NonprofitAgent(AcpAgent):
    name = "nonprofit"
    title = "Nonprofits - what a charity reports, and how big it is beside its peers"
    version = "1.0.0"

    def __init__(self, connection=None, data: NonprofitData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or NonprofitData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Nonprofit session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read ProPublica's Nonprofit Explorer", "medium"),
            ("Report the amount and the tax period it belongs to", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("An amount without its tax period is half an answer. I always print both.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read ProPublica's Nonprofit Explorer", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Nonprofit to read ProPublica's public charity data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read ProPublica's charity data first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "nonprofit-standing":
                return self._run_skill(ctx, params, tool)
            if skill == "nonprofit-search":
                found = self.data.search(params["name"], page=0)
                found["rows"] = found["rows"][:params.get("limit") or 10]
                body = render_search(found)
                summary = (f"{found['total']} match for {found['query']!r}, showing "
                           f"{found['count']}")
            elif skill == "nonprofit-compare":
                found = self.data.compare(params["names"])
                body = render_compare(found)
                summary = f"{len(found['rows'])} charities compared"
            elif params.get("ein"):
                row = self.data.organization(params["ein"])
                body = render_organization(row)
                summary = (f"{row['name']}: revenue {_usd_short(row.get('revenue'))} "
                           f"(tax period {row.get('tax_period') or 'not reported'})")
            else:
                #: A name that matches many organisations is ambiguous, and the answer says
                #: which one was read and which the others are.
                found = self.data.search(params["name"], page=0)
                row = self.data.organization(found["rows"][0]["ein"])
                body = render_organization(row, alternatives=found["rows"][:4],
                                           total=found["total"])
                summary = (f"{row['name']}: revenue {_usd_short(row.get('revenue'))} "
                           f"(tax period {row.get('tax_period') or 'not reported'}"
                           + (f", first of {found['total']} matching the name"
                              if found["total"] else "") + ")")
        except (NonprofitError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read ProPublica's charity data: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. These are the IRS Business Master File's "
                    "own figures for each charity's own tax period, so two charities compared "
                    "side by side are usually not reporting for the same year. A zero in the "
                    "file is a reported zero, which is not the same as a blank.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"name": params["name"], "max_organizations": int(params["limit"] or 10)}
        if params.get("ein"):
            arguments["focus_ein"] = params["ein"]

        data, refused = premium_call(self.gateway, "nonprofit_peer_standing", arguments,
                                    {"agent": "nonprofit"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("read"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a peer comparison for that name.",
                {"agent": "nonprofit"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a comparison out of what the gateway sent.")
            return STOP_END_TURN

        body = render_standing(data)
        summary = (f"{data.get('focus_name', '?')}: rank {data.get('rank')} of "
                   f"{data.get('ranked_count', '?')} on revenue among "
                   f"{data.get('read', 0)} read")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: ProPublica, read one record per organisation on the licence "
                    "gateway. The peers are the organisations ProPublica's own search ranks "
                    "highest for that name, which is a text match rather than a peer group, "
                    "and each charity reports for its own tax period.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        NonprofitAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
