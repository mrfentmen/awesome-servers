"""Papers - PubMed, arXiv and Crossref inside your editor.

Every ACP agent on the vendors' list writes code. This one reads the literature: what has been
published on a topic, what is new this week, and what is behind a DOI. Keyless, and it keeps
the three sources apart on purpose - a preprint is not a peer-reviewed paper, and the answer
says which one each result is.

Honest about ranking: PubMed is asked for relevance, arXiv for newest first (its full-text
search is not relevance ranked the way a person expects), and Crossref only ever answers about
a work's DOI. When nothing is found the answer says so instead of padding the list.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text  # noqa: E402
from acp_kit import GatewayClient, GatewayError, premium_call, empty_premium_answer  # noqa: E402

from data import DATASET, PapersData, PapersError, doi_from_text  # noqa: E402

HELP = (
    "I read three keyless literature services. Ask me:\n"
    "  - papers about CRISPR sickle cell\n"
    "  - recent papers about protein folding\n"
    "  - arxiv papers on transformer architectures\n"
    "  - what is DOI 10.1038/nature12373?\n"
    "  - topic board for CRISPR from 2022 to 2024 (premium)\n"
    "I say which service each result came from: a PubMed result is indexed literature with a "
    "PMID, an arXiv result is a preprint with a version history, and Crossref answers about a "
    "DOI. A preprint is not a peer-reviewed paper."
)

PERMISSION_KEY = "papers-read-public-literature"

SKILLS = ("papers-search", "papers-recent", "papers-doi", "papers-board", "help")

_ARXIV_HINT = re.compile(r"\b(arxiv|preprint|preprints|physics|astro|heuristic|quantum|maths?|"
                         r"mathematics|categor(?:y|ies)|latex)\b", re.IGNORECASE)
_PUBMED_HINT = re.compile(r"\b(pubmed|biomedical|clinical|medical|medicine|gene|genom|protein|"
                          r"cancer|trial|patient|health|cell|virus|drug)\b", re.IGNORECASE)
_RECENT_WORDS = re.compile(r"\b(recent|latest|newest|new|this (?:week|month|year)|just published|"
                           r"what[`']?s new)\b", re.IGNORECASE)
_COUNT_RE = re.compile(r"\b(?:top|first|last|list|show|give me)\s+(\d{1,2})\b", re.IGNORECASE)
_TOPIC_PATTERNS = (
    r"\b(?:papers?|preprints?|articles?|studies|research|publications?|works?|literature)\s+"
    r"(?:about|on|into|regarding|for|covering)\s+(.+?)(?=[?.!]|$)",
    r"\b(?:about|on)\s+(.+?)\s+\b(?:papers?|preprints?|articles?|studies)\b",
    r"\bwhat\s+(?:has|have)\s+been\s+published\s+(?:about|on)\s+(.+?)(?=[?.!]|$)",
    r"\bsearch\s+(?:for\s+)?(.+?)(?=[?.!]|$)",
)


def topic_from_text(text: str) -> str | None:
    """The subject a paper question is about, or None."""
    work = str(text or "").strip()
    for pattern in _TOPIC_PATTERNS:
        match = re.search(pattern, work, re.IGNORECASE)
        if not match:
            continue
        phrase = match.group(1).strip(" .,?!")
        phrase = re.sub(r"^\b(?:doi|in|the|a|an)\s+", "", phrase, flags=re.IGNORECASE)
        phrase = re.sub(r"\b(?:please|for me|right now|today)\b", "", phrase, flags=re.IGNORECASE).strip()
        if phrase and not _ARXIV_HINT.fullmatch(phrase) and len(phrase) > 1:
            return phrase[:120]
    return None


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    board = re.search(r"\b(?:topic board|board)\s+(?:for|about|on)\s+(.+?)\s+from\s+(\d{4})\s+to\s+(\d{4})[?.!]*$", stripped, re.IGNORECASE)
    if board:
        return "papers-board", {"topic": board[1].strip(), "start_year": int(board[2]), "end_year": int(board[3])}

    params: dict = {}
    identifier = doi_from_text(stripped)
    if identifier and re.search(r"\b(doi|what is|resolve|look ?up)\b", stripped, re.IGNORECASE):
        return "papers-doi", {"doi": identifier}

    count = _COUNT_RE.search(stripped)
    if count:
        params["limit"] = int(count.group(1))
    if _ARXIV_HINT.search(stripped):
        params["source"] = "arxiv"
    elif _PUBMED_HINT.search(stripped) or re.search(r"\bpubmed\b", stripped, re.IGNORECASE):
        params["source"] = "pubmed"

    topic = topic_from_text(stripped)
    if topic:
        params["topic"] = topic
    if params.get("source") == "arxiv" and not topic:
        return "help", {}
    if not topic:
        return "help", {}
    if _RECENT_WORDS.search(stripped):
        return "papers-recent", params
    return "papers-search", params


def _author_line(authors: list[str], limit: int = 3) -> str:
    if not authors:
        return "authors not listed"
    if len(authors) <= limit:
        return ", ".join(authors)
    return ", ".join(authors[:limit]) + f", and {len(authors) - limit} more"


def _render(papers: list[dict], index: int) -> str:
    lines = []
    for paper in papers:
        where = paper.get("journal") or paper.get("publisher") or paper["source"]
        identifying = paper.get("pmid") and f"PMID {paper['pmid']}" or ""
        if paper.get("doi"):
            identifying = f"{identifying} doi:{paper['doi']}".strip()
        if paper.get("arxiv_id"):
            identifying = f"arXiv:{paper['arxiv_id']} {identifying}".strip()
        if paper.get("citations") is not None:
            identifying = f"{identifying} - cited by {paper['citations']}".strip()
        lines.append(f"  {index}. {paper['title']}")
        lines.append(f"     {_author_line(paper.get('authors') or [])}")
        lines.append(f"     {where} - {paper.get('date') or 'date not listed'}"
                     + (f" [{paper.get('category')}]" if paper.get("category") else ""))
        lines.append(f"     {identifying}  {paper.get('url') or ''}".rstrip())
        index += 1
    return "\n".join(lines)


class PapersAgent(AcpAgent):
    name = "papers"
    title = "Papers - PubMed, arXiv and Crossref literature search"
    version = "1.0.0"

    def __init__(self, connection=None, data: PapersData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or PapersData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Papers session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Search the literature service", "medium"),
            ("Report each result with the identifier it carries", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I keep the sources apart: PubMed indexes literature, arXiv hosts "
                        "preprints, Crossref answers about DOIs.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Search {params.get('source', 'crossref')}", kind="fetch",
                      name=skill, raw_input={"skill": skill, **params})
        if not ctx.ask_permission(tool, "Allow Papers to search the public literature services?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to search the public literature services first.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except (PapersError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the literature service: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # every skill is a short read

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "papers-board":
            return self._board(params)
        if skill in ("papers-search", "papers-recent"):
            return self._search(params, recent=skill == "papers-recent")
        if skill == "papers-doi":
            return self._doi(params)
        return HELP, {"summary": "help", "dataset": None}

    def _board(self, params: dict) -> tuple[str, dict]:
        arguments = {"query": params["topic"], "start_year": int(params["start_year"]),
                     "end_year": int(params["end_year"])}
        data, refused = premium_call(self.gateway, "papers_topic_board", arguments,
                                     {"agent": "papers", "skill": "papers-board"})
        if refused:
            return refused
        cross = data.get("crossref") if isinstance(data, dict) else None
        pmc = data.get("europe_pmc") if isinstance(data, dict) else None
        def valid_count(value):
            return type(value) is int and value >= 0

        def valid_board(board, identifier):
            if not isinstance(board, dict) or not valid_count(board.get("total")):
                return False
            annual, venues, top = (board.get(key) for key in ("annual", "venues", "top_cited"))
            if (not isinstance(annual, list) or not 2 <= len(annual) <= 3
                    or not isinstance(venues, list) or len(venues) > 10
                    or not isinstance(top, list) or len(top) > 5):
                return False
            return (all(isinstance(row, dict) and type(row.get("year")) is int
                        and valid_count(row.get("count")) for row in annual)
                    and all(isinstance(row, dict) and isinstance(row.get("venue"), str)
                            and valid_count(row.get("count")) for row in venues)
                    and all(isinstance(row, dict) and isinstance(row.get("title"), str)
                            and isinstance(row.get(identifier), str)
                            and valid_count(row.get("citations")) for row in top))

        if not valid_board(cross, "doi") or not valid_board(pmc, "id"):
            return empty_premium_answer("The gateway returned no readable literature topic board.",
                                        {"agent": "papers", "skill": "papers-board", "dataset": "Crossref and Europe PMC"})
        lines = [f"Premium topic board for {data.get('query', arguments['query'])!r} "
                 f"({arguments['start_year']}-{arguments['end_year']}):"]
        for label, board in (("Crossref", cross), ("Europe PMC", pmc)):
            lines.append(f"{label}: {board['total']:,} matching records.")
            lines.append("  By year: " + ", ".join(f"{r['year']}: {r['count']:,}" for r in board["annual"]))
            lines.append("  Venues" + (" in citation-ranked sample" if label == "Europe PMC" else " (full facets)")
                         + ": " + (", ".join(f"{r['venue']}: {r['count']:,}" for r in board["venues"])
                                   or "none reported"))
            lines.append("  Most cited hits:")
            for row in board["top_cited"]:
                identifier = row["doi"] if label == "Crossref" else row["id"]
                lines.append(f"    - {row['title']} ({row['citations']:,} citations; {identifier})")
        lines.append("Source: Crossref and Europe PMC, compared on the licence gateway. "
                     "Crossref searches titles and may match individual query words; Europe PMC "
                     "searches the phrase in titles/abstracts. Coverage and citation counts differ; "
                     "do not add provider totals. Europe PMC venue counts use up to 100 most-cited "
                     "records per year, not full facets. Ties follow provider ordering.")
        return "\n".join(lines), {**data, "premium": True, "dataset": "Crossref and Europe PMC",
                                  "summary": f"premium topic board: {cross['total']:,} Crossref, "
                                             f"{pmc['total']:,} Europe PMC"}

    def _search(self, params: dict, recent: bool) -> tuple[str, dict]:
        topic = params["topic"]
        limit = max(1, min(int(params.get("limit") or 5), 10))
        source = params.get("source") or "pubmed"
        if source == "arxiv":
            papers = self.data.arxiv(topic, limit=limit)
            kind = "arXiv preprints"
        else:
            papers = self.data.pubmed(topic, limit=limit, sort="date" if recent else "relevance")
            kind = "PubMed papers"
        artifact = {"summary": f"{DATASET}: {len(papers)} {kind} for {topic!r}",
                    "dataset": DATASET, "source": source, "topic": topic,
                    "sort": "newest first" if (recent or source == "arxiv") else "relevance",
                    "papers": papers}
        header = (f"{len(papers)} {kind} for {topic!r}"
                  + (", newest first" if (recent or source == "arxiv") else ", best match first")
                  + ":")
        if not papers:
            return (f"{kind} returned nothing for {topic!r}. That means the search found no "
                    f"match, not that nothing exists: {source} indexes titles, abstracts and "
                    "keywords with its own syntax, so try a plainer phrase.",
                    {"summary": f"{DATASET}: no results for {topic!r}", "dataset": DATASET,
                     "source": source, "topic": topic, "papers": []})
        lines = [header, _render(papers, 1), ""]
        if source == "arxiv":
            lines.append("arXiv carries preprints: they have a version history and have not "
                         "necessarily been peer reviewed. Check the journal field before citing "
                         "one as published work.")
        else:
            lines.append("PubMed indexes the literature it is given: a result here has a PMID "
                         "and is usually - not always - peer reviewed.")
        lines.append(f"Source: {DATASET}, read live. Identifiers are the services' own.")
        return "\n".join(lines), artifact

    def _doi(self, params: dict) -> tuple[str, dict]:
        record = self.data.doi(params["doi"])
        if record is None:
            return (f"Crossref has no record for {params['doi']}. That usually means the DOI is "
                    "mistyped, or the work was deposited with a registry other than Crossref.",
                    {"summary": f"{DATASET}: no record for {params['doi']}", "dataset": DATASET,
                     "doi": params["doi"], "work": None})
        artifact = {"summary": f"{DATASET}: {record['title'][:80]}",
                    "dataset": DATASET, "doi": record["doi"], "work": record}
        lines = [f"{record['title']}",
                 f"  - DOI: {record['doi']}",
                 f"  - authors: {_author_line(record['authors'], 4)}"]
        if record.get("journal"):
            lines.append(f"  - journal: {record['journal']}")
        if record.get("publisher"):
            lines.append(f"  - publisher: {record['publisher']}")
        lines.append(f"  - published: {record.get('date') or 'date not listed'}")
        if record.get("type"):
            lines.append(f"  - type: {record['type']}")
        if record.get("citations") is not None:
            lines.append(f"  - cited by: {record['citations']} works (Crossref's own count)")
        lines.append(f"  - link: {record.get('url') or ''}")
        lines.append("")
        lines.append(f"Source: {DATASET}, read live. Crossref's citation count covers works "
                     "that cite a DOI Crossref knows about, so it is a floor, not the whole "
                     "picture.")
        return "\n".join(lines), artifact


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        PapersAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
