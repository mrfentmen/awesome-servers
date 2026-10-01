"""Court opinions, from CourtListener's public search API (keyless).

Verified live on 2026-09-28 on REST v4:

  /api/rest/v4/search/?q=privacy&type=o
      -> count 117150; first hit 'Electronic Privacy Information Center v. DOJ',
         18 F.4th 712, Court of Appeals for the D.C. Circuit, filed 2021-11-30,
         docket 20-5364
  /api/rest/v4/search/?q=privacy&type=o&court=ca9
      -> count 3401, every row court_citation_string '9th Cir.'
  /api/rest/v4/courts/?format=json
      -> count 3359, ids like 'scotus' and 'ca9', with citation_string and in_use

Three things the payloads make plain and this reader keeps. `count` is the whole-corpus
number for the query, so it is the one figure that says how common a topic is, and it is
free of any paging. `type=o` is what narrows the search to opinions - drop it and the
count includes dockets, which are a different corpus. And the court filter wants the
short id ('ca9'), never the name, so `courts()` is what turns "Ninth Circuit" into
something the search endpoint accepts.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://www.courtlistener.com/api/rest/v4/"

SITE = "https://www.courtlistener.com"

DATASET = "CourtListener opinion search (courtlistener.com)"

DEFAULT_USER_AGENT = "awesome-acps-courts/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: CourtListener's own page size is 20. A question about *opinions* asks for type=o.
PAGE_SIZE = 20

#: Longest search string the API will take before it starts trimming. Sent as-is.
MAX_QUERY = 200

#: Court ids and citation strings are short and known; a long "court" is a mistake.
MAX_COURT = 120


class CourtsError(RuntimeError):
    """CourtListener could not be read."""


class CourtsNotFound(CourtsError):
    """The API answered fine but matched nothing - a real 'nothing here', not a failure."""


def query_from_text(text: str) -> str | None:
    """The search phrase in a question, or None.

    Only the words the question is about: the lead-in ("find opinions about") and the
    trailing ("which court decided") are dropped, so a question does not search for
    itself. Quoted phrases in the text win, because a person who quotes a phrase means
    that phrase.
    """
    work = str(text or "").strip()
    if not work:
        return None
    quoted = re.findall(r'"([^"]{2,120})"', work)
    if quoted:
        return quoted[0].strip()
    lead = re.match(r"(?i)^\s*(?:please\s+)?(?:can\s+you\s+)?"
                    r"(?:find|show|list|get|search(?:\s+for)?|look\s+up|search)\s+"
                    r"(?:me\s+)?(?:for\s+)?(?:the\s+)?"
                    r"(?:court\s+opinions?|opinions?|cases?|decisions?)\s+"
                    r"(?:about|on|regarding|concerning|mentioning|that\s+mention)?\s*[:\-]?\s*(.+)$",
                    work)
    if lead:
        candidate = lead.group(1)
    else:
        candidate = work
    candidate = re.sub(r"(?i)\b(?:which|what|who|when|where)\b.*$", "", candidate)
    candidate = re.sub(r"(?i)\b(?:please|thanks?|thank you)\b", " ", candidate)
    candidate = re.sub(r"[?.!]+$", "", candidate.strip())
    candidate = re.sub(r"\s{2,}", " ", candidate)
    return candidate[:MAX_QUERY] or None


#: A court name's tail: "Ninth Circuit", "the Supreme Court", "D.C. Circuit".
#: `[A-Z]` is deliberately case-sensitive, so a lowercase "in the" cannot start the
#: match, while the court nouns themselves are not.
_COURT_TAIL_RE = re.compile(
    r"(?:the\s+)?(?:[A-Z][A-Za-z.&-]+\s+){0,3}"
    r"(?i:circuit|district|supreme\s+court|court\s+of\s+appeals?|supreme\s+court\s+of\s+"
    r"the\s+united\s+states)")

#: The phrase a topic hangs off: "opinions *about* privacy", "how many mention X".
_TOPIC_TAIL_RE = re.compile(
    r"(?i)\b(?:on|about|regarding|concerning|mentioning|mentions|mention|discussing|discusses|"
    r"discuss|covering|dealing with|around)\s+(?:the\s+)?(.+?)\s*[?.!]*$")

#: Question noise on either side of a topic: "how many", "did the", "the D.C. Circuit".
_TOPIC_LEAD_RE = re.compile(
    r"(?i)^(?:please\s+)?(?:how many|how much|how often|what|which|who|show me|tell me about|"
    r"list|find|get|search for|are there|is there)\s+")
_TOPIC_TAIL_NOISE_RE = re.compile(
    r"(?i)\s+\b(?:did|do|does|has|have|had|are|is|were|was|decided|rule|rules|ruled|"
    r"handle|handles|held|come|came|say|said)\b.*$")
_TOPIC_STOPWORD_RE = re.compile(r"(?i)\s+\b(?:in|of|the|for|from|at|by|with)\s+$")


#: "what is the most common court for privacy cases" puts the topic after a preposition
#: at the end. Narrow on purpose: it needs superlative + preposition, so a question like
#: "what is the citation string for the D.C. Circuit?" gets no topic from here.
_MOST_FOR_RE = re.compile(
    r"(?i)^(?:what|which)\s+(?:is|are)\s+the\s+(?:most|biggest|largest|top|commonest)\s+"
    r".*?\b(?:for|on|about)\s+(.+?)\s*[?.!]*$")


def case_name_from_text(text: str) -> str | None:
    """A case name in the form 'X v. Y', which is how a decided case is asked about."""
    work = re.sub(r"\s*[?.!]+\s*$", "", str(text or "").strip())
    match = re.search(r"([A-Z0-9][^?]{2,90}?\s+v\.?\s+[A-Z0-9][^?]{2,90}?)\s*$", work)
    if not match:
        return None
    #: "how many times has X v. Y been cited" - drop what follows the second party.
    name = re.sub(r"(?i)\s+\b(?:been|was|is|has|have|had|decided|held|cite[ds]?|overruled|"
                  r"come|came|goes|went)\b.*$", "", match.group(1))
    return name.strip() or None


def years_from_text(text: str) -> tuple[str | None, str | None]:
    """A filed-date window as (after, before) ISO dates, or (None, None).

    A bare year is a window of that calendar year, and "2019-2021" or "2019 to 2021"
    is a window over the range. Anything else is left out rather than guessed at.
    """
    work = str(text or "")
    span = re.search(r"\b(19\d{2}|20\d{2})\s*(?:-|–|to|through|until)\s*(19\d{2}|20\d{2})\b", work)
    if span:
        first, last = sorted((int(span.group(1)), int(span.group(2))))
        if last - first > 80:
            return None, None
        return f"{first}-01-01", f"{last}-12-31"
    one = re.search(r"\b(19\d{2}|20\d{2})\b", work)
    if one:
        year = one.group(1)
        return f"{year}-01-01", f"{year}-12-31"
    return None, None


def court_name_from_text(text: str) -> str | None:
    """Court words in a question, if any - 'Ninth Circuit', 'the Supreme Court'."""
    work = str(text or "").strip()
    if not re.search(r"(?i)\b(court|courts|circuit|district|supreme|appeals?)\b", work):
        return None
    quoted = re.findall(r'"([^"]{2,80})"', work)
    if quoted:
        return quoted[0].strip()
    match = _COURT_TAIL_RE.search(work)
    return match.group(0).strip() if match else None


def topic_from_text(text: str) -> str | None:
    """The subject of a search, without the question words around it.

    "how many opinions mention fourth amendment" is about *fourth amendment*, and
    searching for the whole question would find nothing. A court name inside the tail is
    cut off, because that is a filter and not part of the topic.
    """
    work = str(text or "").strip()
    if not work:
        return None
    quoted = re.findall(r'"([^"]{2,120})"', work)
    if quoted:
        return quoted[0].strip()
    match = _TOPIC_TAIL_RE.search(work)
    if match:
        topic = match.group(1)
    else:
        superlative = _MOST_FOR_RE.match(work)
        topic = superlative.group(1) if superlative else (query_from_text(work) or "")
    topic = _COURT_TAIL_RE.sub("", topic)
    topic = re.sub(r"(?i)\s+\b(?:in|from|at|during|since|between)\b\s+.*$", "", topic)
    topic = _TOPIC_TAIL_NOISE_RE.sub("", topic)
    topic = _TOPIC_LEAD_RE.sub("", topic)
    topic = re.sub(r"(?i)[?.!,;:\"]+.*$", "", topic)
    #: Years are a filter the search endpoint takes, not search words, so "privacy
    #: opinions 2019-2021" must not look for the digits too.
    topic = re.sub(r"(?i)\s*\b(?:19\d{2}|20\d{2})\s*(?:[-–]\s*(?:19\d{2}|20\d{2})\s*)?\b", " ", topic)
    for _ in range(3):
        trimmed = _TOPIC_STOPWORD_RE.sub("", topic)
        if trimmed == topic:
            break
        topic = trimmed
    topic = re.sub(r"\s{2,}", " ", topic).strip()
    return topic[:MAX_QUERY] or None



class CourtsData:
    """Opinion search, one case, and the court directory."""

    def __init__(self, fetch=None, cache_ttl: float = 1800.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("COURTS_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("COURTS_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("COURTS_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str, params: dict | None = None) -> str:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise CourtsNotFound(f"CourtListener answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise CourtsError(f"request failed: {exc}") from exc

    def _get(self, path: str, params: dict, ttl: float | None = None) -> dict:
        query = API + path + "?" + parse.urlencode(params, doseq=True)
        now = time.time()
        hit = self._cache.get(query)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(API + path, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise CourtsError(
                    f"CourtListener returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise CourtsError("CourtListener returned an unexpected payload")
        self._cache[query] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def search(self, query: str, court: str | None = None, order_by: str | None = None,
               after: str | None = None, before: str | None = None) -> dict:
        """One page of opinions matching a query, plus the whole-corpus count."""
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me what to search for, for example privacy")
        params: dict = {"q": text[:MAX_QUERY], "type": "o", "order_by": order_by or "score desc"}
        if court:
            params["court"] = str(court)[:MAX_COURT]
        if after:
            params["filed_after"] = after
        if before:
            params["filed_before"] = before
        payload = self._get("search/", params, ttl=900.0)
        rows = [_row(item) for item in (payload.get("results") or [])]
        return {"query": text, "court": court, "count": payload.get("count"),
                "rows": rows, "window": _window_label(after, before),
                #: `next` is the API's own word for "there are more matches than I sent".
                "truncated": bool(payload.get("next")),
                "source": DATASET}

    def case(self, name: str) -> dict:
        """One decided case: which court, when, and how often it has been cited.

        The `caseName:"..."` filter is what makes this a case lookup rather than a
        keyword search - a plain-text search for the same words returns whichever
        heavily cited case happens to rank first, which is usually a different case.
        There is no fallback to plain text on purpose: a wrong case is worse than none.
        """
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which case, for example Twitter v. Taamneh")
        payload = self._get("search/", {"q": f'caseName:"{text}"', "type": "o",
                                        "order_by": "citeCount desc"}, ttl=3600.0)
        results = payload.get("results") or []
        if not results:
            raise CourtsNotFound(
                f"no opinion in CourtListener is filed under the case name {text!r}")
        return _row(max(results, key=lambda item: item.get("citeCount") or 0))

    def courts(self, name: str | None = None) -> dict:
        """The court directory, or the one court whose name matches."""
        text = str(name or "").strip()
        if text:
            wanted = re.sub(r"(?i)^the\s+", "", text).lower()
            wanted = re.sub(r"\s+", " ", wanted)
            for page in (1, 2):
                payload = self._get("courts/", {"format": "json", "page": page,
                                                "page_size": 100}, ttl=21600.0)
                for item in (payload.get("results") or []):
                    names = {str(item.get("short_name") or "").lower(),
                             str(item.get("full_name") or "").lower(),
                             str(item.get("citation_string") or "").lower(),
                             str(item.get("id") or "").lower()}
                    names = {re.sub(r"\s+", " ", n) for n in names if n}
                    if wanted in names or any(wanted in n for n in names):
                        return {"court": _court_row(item), "total": payload.get("count"),
                                "source": DATASET}
            raise CourtsNotFound(f"CourtListener's court directory has no court called {text!r}")
        rows: list[dict] = []
        total = 0
        for page in (1, 2):
            payload = self._get("courts/", {"format": "json", "page": page, "page_size": 100},
                                ttl=21600.0)
            total = payload.get("count") or total
            rows.extend(_court_row(item) for item in (payload.get("results") or []))
        return {"courts": rows, "total": total, "source": DATASET}


def _window_label(after: str | None, before: str | None) -> str | None:
    """A human label for the filed-date window, or None when there was none."""
    if after and before and after[:4] == before[:4]:
        return f"filed in {after[:4]}"
    if after and before:
        return f"filed {after} to {before}"
    if after:
        return f"filed after {after}"
    if before:
        return f"filed before {before}"
    return None


def _row(item: dict) -> dict:
    """One search hit, flattened into the fields an answer actually prints."""
    citations = item.get("citation") or []
    opinions = item.get("opinions") or []
    return {
        "case_name": item.get("caseName") or "(unnamed case)",
        "citation": "; ".join(str(c) for c in citations) if citations else None,
        "court": item.get("court") or None,
        "court_id": item.get("court_id") or None,
        "court_citation": item.get("court_citation_string") or None,
        "jurisdiction": item.get("court_jurisdiction") or None,
        "date_filed": item.get("dateFiled") or None,
        "docket": item.get("docketNumber") or None,
        "judge": item.get("judge") or None,
        "status": item.get("status") or None,
        "cite_count": item.get("citeCount"),
        "cited_opinions": len(opinions),
        "url": SITE + str(item.get("absolute_url") or ""),
    }


def _court_row(item: dict) -> dict:
    return {
        "id": item.get("id"),
        "name": item.get("short_name") or item.get("full_name") or item.get("id"),
        "full_name": item.get("full_name"),
        "citation": item.get("citation_string"),
        "jurisdiction": item.get("jurisdiction"),
        "in_use": item.get("in_use"),
        "url": item.get("url") or (SITE + "/api/rest/v4/courts/" + str(item.get("id") or "") + "/"),
    }
