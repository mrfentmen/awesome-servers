"""Spending - what the federal government actually paid, and to whom.

USAspending publishes every federal award, keyless, and almost nobody asks it a question
an editor can answer. "what did the government spend on semiconductors?" gets the biggest
matching awards with the agency and the amount; "how much did NASA obligate?" gets one
agency's whole-book numbers, which is a different question from any single award.

The question the free skills do not answer is the shape of a recipient's whole award
book: every award, every agency, how concentrated the money is. That is the premium skill,
and its licence is checked on the gateway.
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

from data import (AWARD_TYPE_CODES, DATASET, EARLIEST_AWARD_DATE,  # noqa: E402
                  SpendingData, SpendingError, fiscal_year_from_text,
                  last_full_fiscal_year, sum_money)

HELP = (
    "I read USAspending (keyless) - every federal award, and every top-tier agency's\n"
    "outlays and obligations. Ask me:\n"
    "  - what did the federal government spend on semiconductors in 2024?\n"
    "  - biggest awards to Lockheed Martin\n"
    "  - the 20 biggest federal awards in 2023\n"
    "  - biggest awards performed in Texas\n"
    "  - how much did the Department of Defense obligate?\n"
    "  - which agencies obligate the most money?\n"
    "  - profile Lockheed Martin's federal awards in 2024 (premium)\n"
    "A federal fiscal year runs 1 October to 30 September, so \"2024\" means\n"
    "2023-10-01 to 2024-09-30. Award searches only reach back to 2007-10-01.\n"
    "Amounts are *obligations* - what the government promised to pay - which is not the\n"
    "same as cash already paid out."
)

PERMISSION_KEY = "spending-read-usaspending"

SKILLS = ("spending-awards", "spending-recipient", "spending-top", "spending-agency",
          "spending-agencies", "spending-profile", "help")

#: Words that mean an agency is being asked about, so the phrase is a name, not a topic.
_AGENCY_WORDS = re.compile(
    r"\b(department|dept|agency|agencies|bureau|administration|commission|service|services|"
    r"office|council|fund|institute|nasa|fbi|fda|va|irs|doj|cdc|nih|nsa|opm|ssa|hhs|"
    r"dod|epa|fcc|fda|usda)\b",
    re.IGNORECASE)

#: A recipient is a company or organisation, named with a capital somewhere or a suffix.
_RECIPIENT_HINT = re.compile(
    r"\b(inc|incorporated|llc|l\.l\.c|corp|corporation|company|co|plc|ltd|limited|gmbh|"
    r"holdings|group|university|college|hospital|foundation|institute|church|university|"
    r"airlines|airways|motors|systems|technologies|solutions|scientific|partners|associates)\b",
    re.IGNORECASE)

#: "how much did X get" - a recipient question, not a topic question.
_RECIPIENT_QUESTION = re.compile(
    r"(?i)\b(?:to|from|for|paid|goes|went|awarded to|awards to|contracts? to|"
    r"money to|fund(?:ing|ed)? to)\b")

#: The superlatives that mean a whole-book question: the premium skill's job.
_BOOK_WORDS = re.compile(
    r"\b(profile|breakdown|concentrat\w*|share|split|every agency|all agencies|"
    r"which agencies|what agencies|across agencies|shape|make-?up|makeup|"
    r"over time|year over year|trends?|percent(age)? of|proportion)\b",
    re.IGNORECASE)

_COUNT_RE = re.compile(
    r"(?:\b(?:top|first|show|list|biggest|largest|how many)\s+(\d{1,3})\b"
    r"|\bthe\s+(\d{1,3})\s+(?:biggest|largest|top|highest)\b)",
    re.IGNORECASE)

#: A superlative with no topic and no name: "the biggest awards in 2023".
_TOP_WORDS = re.compile(r"\b(biggest|largest|largest|top|highest|most)\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if not _SPEND_WORDS.search(stripped):
        return "help", {}

    year = fiscal_year_from_text(stripped) or last_full_fiscal_year()
    asked = _COUNT_RE.search(stripped)
    limit = max(1, min(int((asked.group(1) or asked.group(2)) if asked else 10), 100))
    #: An agency named in the question is the subject, not a recipient and not a topic:
    #: "of Defense" inside "Department of Defense" must not be read as a search word.
    agency = agency_from_text(stripped)
    remainder = stripped.replace(agency, " ", 1) if agency and agency in stripped else stripped
    recipient = recipient_from_text(remainder)
    topic = topic_from_text(remainder)
    state = state_from_text(remainder)
    superlative = bool(_TOP_WORDS.search(stripped))

    #: "which agency gets the most" asks about agencies as a group, so it beats the
    #: superlative branch below: "most" here is about the agency table, not about awards.
    if _AGENCY_QUESTION.search(stripped) and not topic and not recipient:
        return "spending-agencies", {}
    #: A state plus a superlative: the largest awards, filtered to that state. The API
    #: reports states as two-letter codes, so the code is what travels.
    if state and superlative and not topic and not recipient:
        return "spending-top", {"fiscal_year": year, "limit": limit, "state": state[1],
                                "state_name": state[0]}
    if recipient and _BOOK_WORDS.search(stripped):
        return "spending-profile", {"recipient": recipient, "fiscal_year": year}
    if recipient and not topic:
        return "spending-recipient", {"recipient": recipient, "fiscal_year": year,
                                      "limit": limit}
    if agency and not topic:
        return "spending-agency", {"agency": agency}
    if superlative and not topic:
        return "spending-top", {"fiscal_year": year, "limit": limit, "state": None,
                                "state_name": None}
    if topic:
        return "spending-awards", {"keyword": topic, "fiscal_year": year, "limit": limit}
    return "help", {}


#: A question about federal money at all. Without it, "tell me a joke" is not a lookup.
_SPEND_WORDS = re.compile(
    r"\b(spend|spending|spent|spends|award|awards|awarded|contract|contracts|obligat\w*|"
    r"budget|money|fund|funds|funding|grant|grants|"
    r"pay|paid|payment|payments|get|gets|got|receive|received|dollar|dollars|revenue|"
    r"agency|agencies|department|federal|government|appropriat\w*|outlay|outlays|fiscal|"
    r"billions?|millions?)\b",
    re.IGNORECASE)

#: "which agencies obligate the most" is a directory question about agencies.
_AGENCY_QUESTION = re.compile(
    r"(?i)\b(?:which|what|list|name|top|biggest|largest|most)\s+"
    r"(?:top-?tier\s+)?(?:federal\s+)?(?:agencies|agency|departments?)\b")

#: Where a topic sits in a question: "spend on semiconductors", "spending for X".
_TOPIC_RE = re.compile(
    r"(?i)\b(?:on|for|into|toward|towards|against|about|of)\s+"
    r"(?:the\s+)?([a-z][a-z0-9 ,&'\-]{2,60}?)\s*[?.!,]*$")

#: A year inside the topic is a filter, not a search word.
_TOPIC_YEAR_RE = re.compile(r"(?i)\s*\b(?:in|for|during|from)?\s*(?:19|20)\d{2}\b.*$")

#: A run of capitalised words, which is how a company is usually written.
_CAPS_RE = re.compile(r"\b([A-Z][A-Za-z.&'\-]*(?:\s+[A-Z][A-Za-z.&'\-]*)*)\b")

#: A proper name ending in a government noun: "Department of Defense", "National Science
#: Foundation". `[A-Z]` stays case-sensitive so "how much did the" cannot start it.
_AGENCY_NAME_RE = re.compile(
    r"\b((?:[A-Z][A-Za-z.&'-]*\s+){0,3}"
    r"(?i:department|dept|bureau|agency|administration|commission|office|council|institute|"
    r"service|services|foundation|corps|guard|bank|service)"
    r"(?:\s+of\s+(?:the\s+)?[A-Z][A-Za-z.&'-]*)*)\b")

#: An agency abbreviation used as the subject: "How much did NASA obligate?"
_AGENCY_ACRONYM_RE = re.compile(r"(?i)\b(?:the\s+)?([A-Z]{2,6})\b(?=\s+(?:obligate|obligated|"
                               r"spend|spent|award|awarded|got|receive))")

#: "which agency gets the most" names no agency. A bare government noun is not a name.
_BARE_AGENCY_RE = re.compile(
    r"(?i)^(?:the\s+)?(?:agenc(?:y|ies)|departments?|bureaus?|administrations?|commissions?|"
    r"offices?|councils?|institutes?|services?|foundations?|corps|guard|banks?)$")

#: State name and the two-letter code USAspending puts in its award rows. Full names
#: only, for the same reason groundwater uses them: "in" and "of" are two letters too.
STATES = (
    ("Alabama", "AL"), ("Alaska", "AK"), ("Arizona", "AZ"), ("Arkansas", "AR"),
    ("California", "CA"), ("Colorado", "CO"), ("Connecticut", "CT"), ("Delaware", "DE"),
    ("District of Columbia", "DC"), ("Florida", "FL"), ("Georgia", "GA"), ("Hawaii", "HI"),
    ("Idaho", "ID"), ("Illinois", "IL"), ("Indiana", "IN"), ("Iowa", "IA"),
    ("Kansas", "KS"), ("Kentucky", "KY"), ("Louisiana", "LA"), ("Maine", "ME"),
    ("Maryland", "MD"), ("Massachusetts", "MA"), ("Michigan", "MI"), ("Minnesota", "MN"),
    ("Mississippi", "MS"), ("Missouri", "MO"), ("Montana", "MT"), ("Nebraska", "NE"),
    ("Nevada", "NV"), ("New Hampshire", "NH"), ("New Jersey", "NJ"), ("New Mexico", "NM"),
    ("New York", "NY"), ("North Carolina", "NC"), ("North Dakota", "ND"), ("Ohio", "OH"),
    ("Oklahoma", "OK"), ("Oregon", "OR"), ("Pennsylvania", "PA"),
    ("Puerto Rico", "PR"), ("Rhode Island", "RI"), ("South Carolina", "SC"),
    ("South Dakota", "SD"), ("Tennessee", "TN"), ("Texas", "TX"), ("Utah", "UT"),
    ("Vermont", "VT"), ("Virginia", "VA"), ("Washington", "WA"),
    ("West Virginia", "WV"), ("Wisconsin", "WI"), ("Wyoming", "WY"),
)


def state_from_text(text: str) -> tuple[str, str] | None:
    """A US state as (name, code), or None."""
    lowered = str(text or "").lower()
    for name, code in sorted(STATES, key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"\b{re.escape(name.lower())}\b", lowered):
            return name, code
    return None


_STATE_NAMES_LOWER = {name.lower() for name, _code in STATES}


def topic_from_text(text: str) -> str | None:
    """The subject of an award search, or None when the question names no subject."""
    work = str(text or "").strip()
    quoted = re.findall(r'"([^"]{2,80})"', work)
    if quoted:
        return quoted[0].strip()
    match = _TOPIC_RE.search(work)
    if not match:
        return None
    topic = _TOPIC_YEAR_RE.sub("", match.group(1)).strip(" ,&'-")
    if not topic or topic.lower() in _STOP_PHRASES:
        return None
    #: An agency name inside the tail is a filter, not a topic, unless it is a bare
    #: acronym - "spending on NASA contracts" is a topic, "how much did NASA obligate"
    #: is not, and route() has already taken the agency branch by then.
    if _AGENCY_WORDS.search(topic) and not re.fullmatch(r"[A-Z]{2,8}", topic):
        return None
    return topic


def recipient_from_text(text: str) -> str | None:
    """A named recipient, when the question names one and is about who got the money.

    Two ways a recipient is written: a run of capitalised words ("Lockheed Martin") or a
    name with a company suffix ("Acme Corp"). Both are real, and a question that has
    neither is a topic question, not a recipient question.
    """
    work = str(text or "").strip()
    for name in re.findall(r'"([^"]{2,80})"', work):
        return name.strip()
    caps = _CAPS_RE.findall(work)
    lead = re.sub(r"(?i)^\s*(?:what|which|who|how much|how many|show|list|find|tell me|"
                  r"profile|the|biggest|largest|top|please)\s+", "", work)
    lead = re.sub(r"(?i)\b(?:did|do|does|has|have|get|gets|got|receive|receives|received|"
                  r"awarded|award|awards|spend|spent|spending|contract|contracts|money|"
                  r"funds?|funding|profile|breakdown|in|for|on|to|from|of)\b", " ", lead)
    #: A year in the name is a filter: "Acme Corp in 2023" is Acme Corp, searched in 2023.
    lead = re.sub(r"(?i)\b(?:19|20)\d{2}\b", " ", lead)
    for part in re.split(r"[,]", lead):
        words = part.split()
        for start in range(len(words)):
            for end in range(len(words), start, -1):
                phrase = " ".join(words[start:end]).strip(" .,'-?")
                if len(phrase) < 3 or phrase.lower() in _STOP_PHRASES:
                    continue
                if _AGENCY_WORDS.search(phrase):
                    continue
                if phrase.lower() in _STATE_NAMES_LOWER:
                    #: "the biggest awards in Texas" is a place question, not a company.
                    continue
                if _RECIPIENT_HINT.search(phrase) or any(phrase in cap for cap in caps):
                    return phrase
    return None


def agency_from_text(text: str) -> str | None:
    """An agency name, when the question names one as a subject rather than a filter."""
    work = str(text or "").strip()
    for name in re.findall(r'"([^"]{2,80})"', work):
        if _AGENCY_WORDS.search(name):
            return name.strip()
    match = _AGENCY_NAME_RE.search(work) or _AGENCY_ACRONYM_RE.search(work)
    if not match:
        return None
    found = match.group(1).strip()
    if _BARE_AGENCY_RE.match(found) or found.lower() in _STOP_PHRASES or len(found) < 4:
        return None
    return found


#: Phrases that are never a name on their own.
_STOP_PHRASES = {
    "how much", "how many", "what", "which", "who", "the", "federal", "government",
    "us", "usa", "united states", "money", "funds", "funding", "fiscal year", "show me",
    "tell me", "biggest awards", "top awards", "profile", "tell", "list", "find", "me",
    "this", "that", "it", "them", "money for", "money to", "government spend",
}


def _usd(value) -> str:
    """A dollar amount for a line of text, or the honest 'not reported'."""
    if value is None:
        return "not reported"
    return f"${value:,.2f}"


def _usd_short(value) -> str:
    """A dollar amount short enough for a ranked line."""
    if value is None:
        return "not reported"
    if abs(value) >= 1_000_000_000:
        return f"${value / 1_000_000_000:,.2f}B"
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:,.2f}M"
    return f"${value:,.2f}"


def render_awards(found: dict) -> str:
    """The biggest awards matching a topic."""
    lines = [f"{found['count']} award(s) matching {found['keyword']!r} in federal fiscal year "
             f"{found['fiscal_year']} ({found['window']['start']} to {found['window']['end']}), "
             "largest first"]
    for row in found["rows"]:
        lines.append(f"  {_usd(row['amount'])} - {row['recipient'] or 'recipient not reported'}")
        detail = [row["agency"] or "agency not reported"]
        if row["sub_agency"] and row["sub_agency"] != row["agency"]:
            detail.append(row["sub_agency"])
        lines.append("    " + ", ".join(detail))
        if row["description"]:
            lines.append(f"    {row['description']}")
        when = [bit for bit in (row["start"] and f"from {row['start']}",
                                row["end"] and f"to {row['end']}") if bit]
        if when:
            lines.append("    " + ", ".join(when))
        if row["place_state"]:
            lines.append(f"    performed in {row['place_state']}")
        lines.append(f"    award {row['award_id'] or 'id not reported'}: {row['url']}")
    if found["more_pages"]:
        lines.append(f"  (USAspending has more pages of matches after these {found['count']})")
    return "\n".join(lines)


def render_recipient(found: dict) -> str:
    """One recipient's biggest awards, with what the rows shown add up to."""
    lines = [f"biggest federal awards to {found['recipient']} in fiscal year "
             f"{found['fiscal_year']} ({found['window']['start']} to {found['window']['end']})"]
    for row in found["rows"]:
        lines.append(f"  {_usd(row['amount'])} - {row['agency'] or 'agency not reported'}")
        if row["description"]:
            lines.append(f"    {row['description']}")
        if row["place_state"]:
            lines.append(f"    performed in {row['place_state']}")
        lines.append(f"    award {row['award_id'] or 'id not reported'}")
    lines.append(f"  these {found['count']} award(s) add up to {_usd(found['total_shown'])}")
    lines.append("  that is the sum of the awards shown, not the recipient's whole federal total")
    if found["more_pages"]:
        lines.append("  USAspending has more awards after these; ask for the premium profile to "
                     "read the whole book")
    return "\n".join(lines)


def render_top(found: dict) -> str:
    """The largest awards of a fiscal year, optionally filtered to one state."""
    head = (f"the {found['read']} largest federal awards of fiscal year {found['fiscal_year']} "
            f"({found['window']['start']} to {found['window']['end']})")
    label = found.get("state_name") or found.get("state")
    if found.get("state"):
        lines = [f"{found['count']} of those were performed in or awarded to {label}"]
    else:
        lines = [head, f"they add up to {_usd(found['total_read'])}"]
    for row in found["rows"]:
        lines.append(f"  {_usd(row['amount'])} - {row['recipient'] or 'recipient not reported'}")
        lines.append("    " + ", ".join(bit for bit in (row["agency"] or "agency not reported",
                                                        row["place_state"] and
                                                        f"performed in {row['place_state']}")
                                          if bit))
        if row["description"]:
            lines.append(f"    {row['description']}")
    if found.get("state"):
        lines.append(f"  USAspending's award search has no state filter, so this is the "
                     f"{found['read']} largest awards of the year filtered to {label}, "
                     "not a total for that state.")
    if found["more_pages"]:
        lines.append("  there are more pages of awards after these")
    return "\n".join(lines)


def render_agency(agency: dict) -> str:
    """One agency's outlays, obligations and budget authority."""
    lines = [agency["name"]]
    if agency.get("abbreviation"):
        lines.append(f"  abbreviation: {agency['abbreviation']}")
    lines.append(f"  fiscal year: {agency['fiscal_year']}"
                 + (f", quarter {agency['quarter']}" if agency.get("quarter") else ""))
    lines.append(f"  obligations: {_usd(agency['obligated'])}")
    lines.append(f"  outlays (cash already paid out): {_usd(agency['outlay'])}")
    lines.append(f"  budget authority: {_usd(agency['budget_authority'])}")
    lines.append(f"  {agency['url']}")
    return "\n".join(lines)


def render_agencies(directory: dict) -> str:
    """The agency table, biggest obligations first."""
    years = sorted({row["fiscal_year"] for row in directory["agencies"]
                    if row.get("fiscal_year")})
    lines = [f"top federal agencies by obligations, {directory['count']} top-tier agencies in "
             "USAspending's reference table (fiscal year "
             + (", ".join(years) if years else "not reported") + " figures)"]
    for row in directory["agencies"][:15]:
        lines.append(f"  {_usd_short(row['obligated']):>14}  {row['name']}"
                     + (f" ({row['abbreviation']})" if row.get("abbreviation") else ""))
    lines.append(f"  the rest of the table: {len(directory['agencies']) - 15} agency(ies) not shown")
    return "\n".join(lines)


def render_profile(data: dict) -> str:
    """One recipient's whole award book: the total read, and who paid it."""
    agencies = data.get("agencies") or []
    lines = [f"{data.get('recipient', 'recipient not reported')} - federal award book, fiscal year "
             f"{data.get('fiscal_year', 'not reported')}"]
    lines.append(f"  awards read: {data.get('awards_read', 0)}"
                 + (f" (asked for {data.get('awards_asked_for', 'not reported')}, and there are "
                    "more)" if data.get("more_awards") else ""))
    lines.append(f"  total obligated across those awards: {_usd(data.get('total_obligated'))}")
    if data.get("median_award") is not None:
        lines.append(f"  median award: {_usd(data['median_award'])}")
    if data.get("largest_award"):
        lines.append(f"  largest award: {_usd(data['largest_award'].get('amount'))} from "
                     f"{data['largest_award'].get('agency') or 'agency not reported'}"
                     + (f", {data.get('largest_share_pct')}% of the total read"
                        if data.get("largest_share_pct") is not None else ""))
    lines.append(f"  distinct awarding agencies: {data.get('distinct_agencies', 'not reported')}")
    if agencies:
        lines.append("  the agencies that paid the most of it:")
        for row in agencies:
            lines.append(f"    {_usd_short(row['amount']):>14}  {row['agency']}"
                         f" ({row['awards']} award(s), {row['share_pct']}%)")
    if data.get("note"):
        lines.append(f"  {data['note']}")
    lines.append(f"  source: {data.get('source', DATASET)}")
    return "\n".join(lines)


class SpendingAgent(AcpAgent):
    name = "spending"
    title = "Spending - what the federal government paid, to whom, and through which agency"
    version = "1.0.0"

    def __init__(self, connection=None, data: SpendingData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or SpendingData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Spending session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read USAspending's award search", "medium"),
            ("Report the amounts, the agencies and the dates", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("An obligation is a promise to pay. An outlay is cash already gone.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read USAspending", kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Spending to read USAspending's public award data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read USAspending's data first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "spending-profile":
                return self._run_skill(ctx, params, tool)
            if skill == "spending-agency":
                agency = self.data.agency(params["agency"])
                body = render_agency(agency)
                summary = f"{agency['name']}: {_usd_short(agency['obligated'])} obligated"
            elif skill == "spending-agencies":
                directory = self.data.agencies()
                body = render_agencies(directory)
                summary = f"{directory['count']} top-tier agencies, largest obligations first"
            elif skill == "spending-recipient":
                found = self.data.recipient_awards(params["recipient"], params["fiscal_year"],
                                                   limit=params.get("limit") or 10)
                body = render_recipient(found)
                summary = (f"{found['recipient']}: {found['count']} award(s), "
                           f"{_usd_short(found['total_shown'])} shown")
            elif skill == "spending-top":
                found = self.data.top_awards(params["fiscal_year"], limit=params.get("limit") or 10,
                                             state=params.get("state"))
                found["state_name"] = params.get("state_name")
                body = render_top(found)
                summary = (f"{found['count']} of the largest FY{found['fiscal_year']} award(s)"
                           + (f" in {params.get('state_name')}" if found.get("state") else ""))
            else:
                found = self.data.awards(params["fiscal_year"], keyword=params["keyword"],
                                         limit=params.get("limit") or 10)
                body = render_awards(found)
                summary = (f"{found['count']} award(s) for {found['keyword']!r} in FY"
                           f"{found['fiscal_year']}, {_usd_short(sum_money(row['amount'] for row in found['rows']))}")
        except (SpendingError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read USAspending: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Award types are "
                    f"{', '.join(AWARD_TYPE_CODES)} (contracts, grants, loans, direct payments) and "
                    f"award searches only reach back to {EARLIEST_AWARD_DATE}. A fiscal year runs "
                    "1 October to 30 September, so FY2024 means 2023-10-01 to 2024-09-30.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"recipient": params["recipient"],
                           "fiscal_year": int(params["fiscal_year"])}

        data, refused = premium_call(self.gateway, "spending_recipient_profile", arguments,
                                    {"agent": "spending"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("awards_read"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back an award profile for that recipient.",
                {"agent": "spending"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a profile out of what the gateway sent.")
            return STOP_END_TURN

        body = render_profile(data)
        summary = (f"{data.get('recipient', 'recipient not reported')}: "
                   f"{data.get('awards_read', 0)} award(s) across "
                   f"{data.get('distinct_agencies', 0)} agency(ies), "
                   f"{_usd_short(data.get('total_obligated'))} read")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: USAspending, read across pages on the licence gateway. The total is "
                    "the sum of the awards the gateway read, not every federal dollar the "
                    "recipient has, and a federal award is an obligation rather than a payment.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one search, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        SpendingAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
