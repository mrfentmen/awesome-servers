"""The CourtListener agent: four free skills over the case law, one premium census.

  - opinion-search:   opinions on a topic, optionally in one court or date range
  - case-lookup:      a case or docket by name or docket number (RECAP)
  - court-info:       what a court is — code, name, jurisdiction, parent court
  - judge-lookup:     judges by name, with the courts they sat on
  - citation-census:  which authorities a topic's case law leans on (premium)

The census is premium because it is the one question the free skills cannot
answer: opinion-search returns cases in relevance order, and ranking a result set
by how often the case law has been cited is a different answer entirely. The
tally is computed on the licence gateway, so a caller who has not paid gets the
gateway's own message and no ranking at all.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    COURTS_DATASET,
    DATASET,
    PRODUCT,
    CourtListenerClient,
    UpstreamError,
)

SKILL_OPINION_SEARCH = "opinion-search"
SKILL_CASE_LOOKUP = "case-lookup"
SKILL_COURT_INFO = "court-info"
SKILL_JUDGE_LOOKUP = "judge-lookup"
SKILL_CITATION_CENSUS = "citation-census"

SOURCE = "Free Law Project, CourtListener"
MAX_LISTED = 8
MAX_COURT_POSITIONS = 4
GATEWAY_TOOL = "courts_citation_census"

CARD_SKILLS = [
    {
        "id": SKILL_OPINION_SEARCH,
        "name": "Search opinions",
        "description": (
            "Published opinions on a legal topic, in relevance order, with the case name, court, "
            "date filed, docket number, reporter citations and how many times each case has been "
            "cited. Optionally narrowed to one court and to a filed-after / filed-before range."
        ),
        "tags": ["courts", "case law", "opinions", "search", "free"],
        "examples": [
            "what case law is there on the fourth amendment?",
            "privacy opinions in the D.C. Circuit filed after 2020-01-01",
            '{"skill": "opinion-search", "query": "fourth amendment", "court": "scotus", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CASE_LOOKUP,
        "name": "Look up a case or docket",
        "description": (
            "A case by name or docket number from CourtListener's RECAP docket archive: the docket "
            "number, the court, the date filed, the date argued and the date terminated."
        ),
        "tags": ["courts", "docket", "case", "recap", "free"],
        "examples": [
            "look up docket 20-5364 in the D.C. Circuit",
            "find the Electronic Privacy Information Center v. DOJ case",
            '{"skill": "case-lookup", "query": "In re: Electronic Privacy Information", "court": "cadc"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_COURT_INFO,
        "name": "Court reference",
        "description": (
            "CourtListener's court list: the code, the short and full name, the reporter citation, the "
            "jurisdiction, when the court started, and which court it appeals to."
        ),
        "tags": ["courts", "court", "reference", "jurisdiction", "free"],
        "examples": [
            "what court is cadc?",
            "list the courts in the 9th circuit",
            '{"skill": "court-info", "court": "scotus"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_JUDGE_LOOKUP,
        "name": "Judge lookup",
        "description": (
            "Judges and other CourtListener people by name, with the courts they have sat on, their "
            "education, ABA rating and political affiliation where CourtListener publishes them."
        ),
        "tags": ["courts", "judge", "people", "lookup", "free"],
        "examples": [
            "look up the judge Ruth Bader Ginsburg",
            "which judges is the name Roberts associated with?",
            '{"skill": "judge-lookup", "query": "Abrams", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_CITATION_CENSUS,
        "name": "Citation census",
        "description": (
            "Read a page of case law on a topic and report what it leans on: the cases cited most "
            "often across that page, the most common reporter citations and reporters, the courts the "
            "opinions came from, the year spread, and the total inbound citations. Premium: the tally "
            "runs behind a licence check on the gateway."
        ),
        "tags": ["courts", "case law", "citations", "census", "analysis", "premium"],
        "examples": [
            "which authorities does the privacy case law lean on?",
            "run a citation census on fourth amendment search results",
            '{"skill": "citation-census", "query": "privacy", "court": "cadc", "limit": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_COURT_CODE_RE = re.compile(r"\b(" + "|".join(
    ("scotus", "supremecourt", "ca1", "ca2", "ca3", "ca4", "ca5", "ca6", "ca7", "ca8", "ca9",
     "ca10", "ca11", "cadc", "cand", "cafc", "cavc", "cb1", "cb2", "cb3", "cb4", "cb5",
     "cb6", "cb7", "cb8", "cb9", "cb10", "cidea", "cffd", "citc", "nmcca")) + r")\b",
    re.IGNORECASE)
#: People write "9th circuit", not "ca9". These are the two written forms worth reading.
_ORDINALS = ("first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth",
             "ninth", "tenth", "eleventh")
_COURT_NAME_ALIASES = {"supreme court": "scotus", "d.c. circuit": "cadc", "dc circuit": "cadc",
                       "district of columbia circuit": "cadc", "federal circuit": "cafc",
                       "court of appeals for the federal circuit": "cafc",
                       "court of international trade": "citc",
                       "court of international appeals": "cavc"}
for _index, _word in enumerate(_ORDINALS, start=1):
    # People write both "ninth circuit" and "9th circuit"; both are worth reading.
    _COURT_NAME_ALIASES[f"{_word} circuit"] = f"ca{_index}"
    _COURT_NAME_ALIASES[f"{_index}{'st' if _index in (1, 21) else 'nd' if _index in (2, 22) else 'rd' if _index in (3, 23) else 'th'} circuit"] = f"ca{_index}"
    _COURT_NAME_ALIASES[f"{_word} circuit of appeals"] = f"cb{_index}"
    _COURT_NAME_ALIASES[f"{_index}{'st' if _index in (1, 21) else 'nd' if _index in (2, 22) else 'rd' if _index in (3, 23) else 'th'} circuit of appeals"] = f"cb{_index}"
_COURT_NAME_RE = re.compile(
    r"\b(" + "|".join(sorted((re.escape(name) for name in _COURT_NAME_ALIASES), key=len, reverse=True)) + r")\b",
    re.IGNORECASE)
_DATE_RE = re.compile(r"\b(19|20)\d{2}-\d{2}-\d{2}\b")
#: A docket number is two to four digits, a dash, then two to five. The lookarounds
#: keep an ISO date (2020-01-01) from reading as one.
_DOCKET_RE = re.compile(r"(?<![\d-])\d{2,4}-\d{2,5}(?![\d-])")
#: A quoted phrase is the search term, always.
_QUOTED_RE = re.compile(r"[\"“]([^\"”]{3,120})[\"”]")
#: Words that describe the question rather than the subject, so they are dropped
#: before the leftover becomes a CourtListener search. Court names and ISO dates
#: go too, because they are already carried as search filters — but only the court
#: the caller actually named, so "fourth amendment" keeps "fourth".
_QUERY_STOP = frozenset("""
    a about all am an and any are as at be been being but by can could do does did i if in
    into is it its just know like list make many me much my need of on one only or please
    recent really see show so some tell that the their them there these thing this those to
    up us want was were what when where which who whom whose why will with would
    case cases law laws legal opinion opinions holding holdings ruling rulings decision
    decisions precedent precedents court courts docket dockets judge judges justice justices
    filed file filing filings record records search searched
    look run census tally map profile landscape rank ranked ranking citation citations
    authority authorities cited cite cites citing rely relied relies lean leant dominate
    dominates dominated most best top result results after before during since between
""".split())

_DOCKET_WORDS = re.compile(
    r"\b(docket|caseload|case load|filed against|complaint|lawsuit|plaintiff|defendant|"
    r"who (?:is )?(?:suing|sued)|versus| v\.? )",
    re.IGNORECASE,
)
_COURT_WORDS = re.compile(
    r"\b(which courts?|list (?:the )?courts?|courts? (?:list|reference|metadata|directory)|"
    r"what (?:court|courts)|court (?:reference|metadata|list)|all (?:the )?courts?)\b",
    re.IGNORECASE,
)
_JUDGE_WORDS = re.compile(
    r"\b(judges?|justices?|magistrates?|who (?:is|was) the (?:judge|justice)|"
    r"bench (?:of|for))\b",
    re.IGNORECASE,
)
#: The census asks for an aggregate over a result set, not for the results. These
#: phrases deliberately do not fire on a plain "opinions about X" question, which
#: belongs to opinion-search.
_CENSUS_WORDS = re.compile(
    r"\b(citation (?:census|map|tally|profile|landscape)|how (?:often|much)[^.\n]{0,24}cited|"
    r"most[- ]cited|cited most|which (?:cases?|authorities|decisions|precedents)[^.\n]{0,28}"
    r"(?:cite|relied on|dominate|lean on)|"
    r"what (?:does|do)[^.\n]{0,28}(?:cite|lean on|rely on)|"
    r"dominates? (?:this|the) (?:topic|area|issue|law)|"
    r"rank(?:ed|ing)?[^.\n]{0,24}citations?)\b",
    re.IGNORECASE,
)
_OPINION_WORDS = re.compile(
    r"\b(opinions?|case law|holdings?|rulings?|decisions?|precedent|authority|authorities|"
    r"fourth amendment|due process|standing|copyright|antitrust|liabilit\w+)\b",
    re.IGNORECASE,
)

HELP = (
    "I read CourtListener's case law, dockets, judges and court list. Ask me:\n"
    "  • what case law is there on the fourth amendment?\n"
    "  • privacy opinions in the D.C. Circuit filed after 2020-01-01\n"
    "  • look up docket 20-5364 in the D.C. Circuit\n"
    "  • what court is cadc?\n"
    "  • look up the judge Ruth Bader Ginsburg\n"
    "  • which authorities does the privacy case law lean on?  (premium)\n"
    "Opinions come back in relevance order and quote the reporter citation and the\n"
    "number of times a case has been cited. CourtListener's index is not every case\n"
    "ever filed, and I read only the first page of 20 results at a time."
)


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def court_from_text(text: str) -> str | None:
    """The court a question is about, from a code ("cadc") or a name ("9th circuit")."""
    match = _COURT_CODE_RE.search(text)
    if match:
        return match.group(1).lower()
    named = _COURT_NAME_RE.search(text)
    if named:
        return _COURT_NAME_ALIASES[named.group(1).lower()]
    return None


def court_tokens(court: str | None) -> frozenset[str]:
    """The words of the court the caller actually named, so they can leave the query."""
    if not court:
        return frozenset()
    tokens = {court.lower()}
    if court.lower() in _COURT_NAME_ALIASES:
        tokens.update(court.lower().split())
    for alias, code in _COURT_NAME_ALIASES.items():
        if code == court:
            tokens.update(alias.lower().split())
    return frozenset(tokens)


def query_from_text(text: str, query: str | None, court: str | None = None) -> str | None:
    """The search term, preferring a quoted phrase and otherwise the subject words.

    CourtListener matches on the phrase, so the caller must not have their own
    question handed back as the query. Question words, routing words, the named
    court and any ISO date are dropped and the rest is capped at ten words.
    """
    if query:
        return None
    match = _QUOTED_RE.search(text)
    if match:
        return match.group(1).strip()
    stop = _QUERY_STOP | court_tokens(court)
    words = [word for word in re.findall(r"[A-Za-z0-9'’\-\.]+", text)
             if word.lower() not in stop and not _DOCKET_RE.fullmatch(word)
             and not _DATE_RE.fullmatch(word)]
    if not words:
        return None
    return " ".join(words[:10])


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    court = _first(data, "court", "court_id", "court_code")
    if court is None:
        court = court_from_text(text)
    query = _first(data, "query", "q", "term", "topic")
    if query is None:
        query = query_from_text(text, None, court)
    limit = _first(data, "limit", default=10)
    filed_after = _first(data, "filed_after", "after")
    if filed_after is None:
        match = _DATE_RE.search(text)
        if match:
            filed_after = match.group(0)
    filed_before = _first(data, "filed_before", "before")

    all_skills = (SKILL_OPINION_SEARCH, SKILL_CASE_LOOKUP, SKILL_COURT_INFO,
                  SKILL_JUDGE_LOOKUP, SKILL_CITATION_CENSUS)
    asked_for_census = bool(_CENSUS_WORDS.search(text))
    if requested in all_skills:
        skill = requested
    elif asked_for_census:
        skill = SKILL_CITATION_CENSUS
    elif _JUDGE_WORDS.search(text):
        skill = SKILL_JUDGE_LOOKUP
    elif _COURT_WORDS.search(text):
        skill = SKILL_COURT_INFO
    elif _DOCKET_WORDS.search(text) or _DOCKET_RE.search(text):
        skill = SKILL_CASE_LOOKUP
    else:
        skill = SKILL_OPINION_SEARCH

    # court-info is a question about a court, not about the law it decides: it
    # carries no search term.
    if skill == SKILL_COURT_INFO and court is None:
        match = _QUOTED_RE.search(text)
        court = match.group(1).strip() if match else (query_from_text(text, None) or None)

    # A docket number is the search term when one is given: "look up docket 20-5364"
    # should search for 20-5364, not for the whole sentence around it.
    docket = _first(data, "docket_number", "docket")
    if docket is None:
        found = _DOCKET_RE.search(text)
        docket = found.group(0) if found else None
    if skill == SKILL_CASE_LOOKUP and docket:
        query = str(docket)
    if skill == SKILL_COURT_INFO:
        query = None

    params: dict = {"limit": limit}
    for key, value in (("query", query), ("court", court), ("filed_after", filed_after),
                       ("filed_before", filed_before)):
        if value is not None:
            params[key] = value
    if not requested and (not text.strip()
                         or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_census or _JUDGE_WORDS.search(text)
                    or _COURT_WORDS.search(text) or _DOCKET_WORDS.search(text)
                    or _DOCKET_RE.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: CourtListenerClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _citations(opinion: dict) -> str:
    cites = [str(cite) for cite in (opinion.get("citation") or []) if cite]
    if opinion.get("neutralCite"):
        cites.append(str(opinion["neutralCite"]))
    return ", ".join(cites) if cites else "no reporter citation yet"


# -- skills ---------------------------------------------------------------


def run_opinion_search(params: dict, client: CourtListenerClient) -> dict:
    try:
        result = client.opinions(
            params.get("query"), court=params.get("court"),
            filed_after=params.get("filed_after"), filed_before=params.get("filed_before"),
            limit=params.get("limit", 10),
        )
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    opinions = result["opinions"]
    artifact = _artifact(params, client, **result)
    if not opinions:
        return {
            "final_state": "completed",
            "message": (
                f"No opinion in CourtListener's index matches “{result['query']}”"
                + (f" in {result['court']}" if result.get("court") else "")
                + ". Try a broader term, or a different court code."
            ),
            "artifact": artifact,
            "watch": None,
        }
    scope = _scope(result)
    listing = "\n".join(
        f"  • {opinion.get('caseName') or 'untitled case'} — {opinion.get('court') or 'court not reported'}, "
        f"filed {opinion.get('dateFiled') or 'date not reported'}"
        + (f", docket {opinion['docketNumber']}" if opinion.get("docketNumber") else "")
        + f"\n    {_citations(opinion)}, cited {opinion.get('citeCount', 0)} time(s)"
        for opinion in opinions[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['total_hits']:,} opinion(s) in CourtListener's index match “{result['query']}”"
            f"{scope}; most relevant first (page of {result['page_size']}, showing {len(opinions)}):\n"
            f"{listing}\nSource: {DATASET} (read live). Relevance order, not citation count."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_case_lookup(params: dict, client: CourtListenerClient) -> dict:
    try:
        result = client.dockets(
            params.get("query"), court=params.get("court"),
            filed_after=params.get("filed_after"), filed_before=params.get("filed_before"),
            limit=params.get("limit", 10),
        )
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    dockets = result["dockets"]
    artifact = _artifact(params, client, **result)
    if not dockets:
        return {
            "final_state": "completed",
            "message": (
                f"No RECAP docket in CourtListener's archive matches “{result['query']}”"
                + (f" in {result['court']}" if result.get("court") else "")
                + ". A docket number usually works better than a case name."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {docket.get('caseName') or 'unnamed case'} — docket {docket.get('docketNumber') or 'not reported'}, "
        f"{docket.get('court') or 'court not reported'}\n"
        f"    filed {docket.get('dateFiled') or 'not reported'}"
        + (f", argued {docket['dateArgued']}" if docket.get("dateArgued") else "")
        + (f", terminated {docket['dateTerminated']}" if docket.get("dateTerminated") else "")
        for docket in dockets[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{result['total_hits']:,} docket(s) in CourtListener's RECAP archive match "
            f"“{result['query']}”{_scope(result)} (showing {len(dockets)}):\n{listing}\n"
            f"Source: {DATASET} (read live). RECAP covers PACER-filed federal cases only."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_court_info(params: dict, client: CourtListenerClient) -> dict:
    try:
        courts = client.find_courts(needle=params.get("court"), limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, court_matches=courts, count=len(courts))
    artifact["dataset"] = COURTS_DATASET
    if not courts:
        return {
            "final_state": "completed",
            "message": (
                "No CourtListener court matches that. Use a court code such as scotus, cadc, ca9, "
                "cb2, cidea or citc, or a name like “circuit”."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {court.get('short_name') or court.get('id')} ({court.get('id')}) — {court.get('full_name')}\n"
        f"    citation {court.get('citation_string') or 'not reported'}, jurisdiction "
        f"{court.get('jurisdiction') or 'not reported'}, since {court.get('start_date') or 'not reported'}"
        + (f", appeals to {court['parent_court']}" if court.get("parent_court") else "")
        for court in courts[:MAX_LISTED]
    )
    return {
        "final_state": "completed",
        "message": f"{len(courts)} CourtListener court(s):\n{listing}\nSource: {COURTS_DATASET} (read live).",
        "artifact": artifact,
        "watch": None,
    }


def run_judge_lookup(params: dict, client: CourtListenerClient) -> dict:
    try:
        result = client.people(params.get("query"), limit=params.get("limit", 10))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    people = result["people"]
    artifact = _artifact(params, client, **result)
    if not people:
        return {
            "final_state": "completed",
            "message": (
                f"No judge in CourtListener's index is named “{result['query']}”. Try a surname, "
                "or the full name as it is usually written."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(f"  • {_person_line(person)}" for person in people[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": (
            f"{result['total_hits']:,} CourtListener profile(s) match “{result['query']}” "
            f"(showing {len(people)}):\n{listing}\nSource: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_citation_census(params: dict, client: CourtListenerClient, gateway: GatewayClient) -> dict:
    """The premium citation census. Nothing here reads CourtListener.

    The gateway does the tally behind its licence check and hands back the
    census, so a caller who has not paid gets the gateway's wording and no
    ranking at all.
    """
    try:
        query = client.check_query(params.get("query"))
        court = client.check_court(params.get("court"))
        filed_after = client.check_date(params.get("filed_after"), "filed_after")
        filed_before = client.check_date(params.get("filed_before"), "filed_before")
        limit = client.check_limit(params.get("limit", 20))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    arguments = {"query": query, "limit": limit}
    if court:
        arguments["court"] = court
    if filed_after:
        arguments["filed_after"] = filed_after
    if filed_before:
        arguments["filed_before"] = filed_before
    read, refused = premium_call(gateway, GATEWAY_TOOL, arguments, {
        "dataset": DATASET, "query": query, "court": court,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or read.get("opinionsRead") is None:
        return empty_premium_answer(
            "The licence gateway answered without any citation census, so there is nothing to report.",
            {"dataset": DATASET, "query": query},
        )

    authorities = read.get("authorities") or []
    reporters = read.get("reporters") or []
    lines = [
        f"Citation census over CourtListener’s {read.get('opinionsRead')} opinion(s) on "
        f"“{read.get('query')}”{_census_scope(read)}, page of {read.get('pageSize')} from "
        f"{read.get('totalHits'):,} hit(s)."
        if isinstance(read.get("totalHits"), int)
        else f"Citation census over CourtListener’s {read.get('opinionsRead')} opinion(s) on "
             f"“{read.get('query')}”{_census_scope(read)}."
    ]
    if authorities:
        lines.append("  • Most cited cases in this page:")
        for row in authorities[:MAX_LISTED]:
            lines.append(
                f"      {row.get('caseName') or 'untitled case'} — {_citations(row)}, cited "
                f"{row.get('citeCount', 0)} time(s), {row.get('court') or 'court not reported'}, "
                f"filed {row.get('dateFiled') or 'not reported'}"
            )
        if len(authorities) > MAX_LISTED:
            lines.append(f"      ... {len(authorities) - MAX_LISTED} more in the artifact.")
    else:
        lines.append("  • CourtListener reports no citations for these opinions.")
    if reporters:
        lines.append("  • Reporter citations seen: " + ", ".join(
            f"{row.get('name') or 'not reported'} ({row.get('count', 0)})" for row in reporters[:MAX_LISTED]
        ))
    lines.append(f"  • Courts in this page: {_counts(read.get('courts'))}")
    lines.append(f"  • Years in this page: {_counts(read.get('years'))}")
    lines.append(f"  • Inbound citations across the page: {read.get('totalCiteCount', 0)}.")
    lines.append(
        "\nTallied on the MCP gateway behind its licence check, from CourtListener's search page "
        f"({DATASET}). Citation counts are how often the whole database cites a case, not how often "
        "these particular opinions cite each other, and CourtListener's index is not every case filed."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "query": read.get("query"),
        "court": read.get("court"),
        "opinions_read": read.get("opinionsRead"),
        "page_size": read.get("pageSize"),
        "total_hits": read.get("totalHits"),
        "authorities": authorities,
        "reporters": reporters,
        "courts": read.get("courts"),
        "years": read.get("years"),
        "total_cite_count": read.get("totalCiteCount"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class CourtListenerAgent(SkillAgent):
    name = "courtlistener-courts"
    card_name = "CourtListener Case Law Agent"
    card_description = (
        "Read-only agent over CourtListener's case law: published opinions on a topic with their "
        "reporter citations and inbound cite counts, RECAP docket lookups, the court list, and judge "
        "profiles — plus a citation census that tallies what a topic's case law leans on, computed on "
        "a licence-gated gateway. Every answer is read live from CourtListener."
    )
    env_prefix = "COURTS"
    datasets = (DATASET, COURTS_DATASET)
    card_skills = CARD_SKILLS

    def __init__(self, client: CourtListenerClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or CourtListenerClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == "help":
            return []
        if skill == SKILL_COURT_INFO:
            return [] if params.get("court") else ["court"]
        return [] if params.get("query") else ["query"]

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_COURT_INFO:
            return (
                "Which court? Give me a CourtListener code (scotus, cadc, ca9, cb2, cidea, citc, "
                "nmcca …) or a name like “9th circuit”."
            )
        if skill == SKILL_JUDGE_LOOKUP:
            return "Which judge? Give me a name, for example “Ruth Bader Ginsburg” or just “Abrams”."
        return "What should I look for? Give me a legal topic or a case name, for example “fourth amendment”."

    def run(self, request: dict) -> dict:
        skill = request["skill"]
        params = request["params"]
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(skill, request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if skill == SKILL_OPINION_SEARCH:
            return run_opinion_search(params, self.client)
        if skill == SKILL_CASE_LOOKUP:
            return run_case_lookup(params, self.client)
        if skill == SKILL_COURT_INFO:
            return run_court_info(params, self.client)
        if skill == SKILL_JUDGE_LOOKUP:
            return run_judge_lookup(params, self.client)
        if skill == SKILL_CITATION_CENSUS:
            return run_citation_census(params, self.client, self.gateway)
        if skill == "help":
            return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}
        return {
            "final_state": "input-required",
            "message": "I did not catch which skill that is. Try “opinions about the fourth amendment”.",
            "artifact": None,
            "watch": None,
        }


def _scope(result: dict) -> str:
    scope = f" in {result['court']}" if result.get("court") else ""
    if result.get("filed_after"):
        scope += f" filed after {result['filed_after']}"
    if result.get("filed_before"):
        scope += f" filed before {result['filed_before']}"
    return scope


def _census_scope(read: dict) -> str:
    scope = f" in {read['court']}" if read.get("court") else ""
    if read.get("filedAfter"):
        scope += f" filed after {read['filedAfter']}"
    if read.get("filedBefore"):
        scope += f" filed before {read['filedBefore']}"
    return scope


def _counts(rows) -> str:
    """A tally rendered as text: `S.D.N.Y. (3), N.D. Cal. (1)`."""
    if not rows:
        return "not reported"
    return ", ".join(f"{row.get('name') or 'not reported'} ({row.get('count', 0)})" for row in rows[:MAX_LISTED])


def _person_line(person: dict) -> str:
    line = person.get("name") or "unnamed person"
    detail = []
    positions = person.get("positions") or []
    for position in positions[:MAX_COURT_POSITIONS]:
        court = position.get("court") if isinstance(position, dict) else None
        if court:
            detail.append(str(court))
    if detail:
        line += " — sat on " + ", ".join(detail)
    school = person.get("school") or []
    if school:
        line += f"; {school[0]}"
    return line


__all__ = [
    "CARD_SKILLS",
    "CourtListenerAgent",
    "GATEWAY_TOOL",
    "HELP",
    "MAX_LISTED",
    "SKILL_CASE_LOOKUP",
    "SKILL_CITATION_CENSUS",
    "SKILL_COURT_INFO",
    "SKILL_JUDGE_LOOKUP",
    "SKILL_OPINION_SEARCH",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "query_from_text",
    "run_case_lookup",
    "run_citation_census",
    "run_court_info",
    "run_judge_lookup",
    "run_opinion_search",
]
