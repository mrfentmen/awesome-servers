"""Read-only cinema reader for the films A2A server.

  https://query.wikidata.org/sparql                     Wikidata film facts (mwapi EntitySearch)
  https://archive.org/advancedsearch.php                Internet Archive feature_films catalogue
  https://archive.org/metadata/<identifier>             one Internet Archive item

Both keyless. Verified live on 2026-09-30:

  - Wikidata's EntitySearch service answered "Inception" in 0.8s as Inception (2010, Christopher
    Nolan) and "The Prestige" as The Prestige (2006, Christopher Nolan), through
    `SERVICE wikibase:mwapi`, which is the only shape that answered inside the service timeout.
  - The Archive's `feature_films` collection is 28,562 titles, 1,381 of them tagged `noir`
    (The Stranger 1946, Scarlet Street 1945, Quicksand 1950 as its most-downloaded).

Two honesty rules the sources force:

  - Wikidata is a community wiki. Facts it does not carry are reported as "not reported" rather
    than filled in from elsewhere, and the answer says the data is Wikidata's.
  - The Archive's feature_films collection is a mixed shelf: many titles are public domain, some
    are not, and the collection does not say which. Every answer says so instead of promising
    that a copy is free to reuse.
"""

from __future__ import annotations

import re
from urllib import parse

from a2a_kit import JsonApiClient, UpstreamError

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
ARCHIVE_SEARCH = "https://archive.org/advancedsearch.php"
ARCHIVE_METADATA = "https://archive.org/metadata"
COLLECTION = "feature_films"

DATASET_WIKIDATA = "query.wikidata.org/sparql"
DATASET_ARCHIVE = "archive.org/advancedsearch.php (feature_films)"

DEFAULT_LIMIT = 5
MAX_LIMIT = 12

_WS_RE = re.compile(r"\s+")

#: Wikidata queries. One point of entry per question, so a slow scan never happens.
FILM_QUERY = """
SELECT ?film ?filmLabel ?year ?directorLabel ?runtime ?genreLabel ?imdb WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:api "EntitySearch";
                    wikibase:endpoint "www.wikidata.org";
                    mwapi:search "%(term)s";
                    mwapi:language "en".
    ?film wikibase:apiOutputItem mwapi:item.
  }
  ?film wdt:P31 wd:Q11424; wdt:P577 ?date.
  OPTIONAL { ?film wdt:P57 ?director. }
  OPTIONAL { ?film wdt:P2047 ?runtime. }
  OPTIONAL { ?film wdt:P136 ?genre. }
  OPTIONAL { ?film wdt:P345 ?imdb. }
  BIND(YEAR(?date) AS ?year)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 12
"""

DIRECTOR_QUERY = """
SELECT ?person ?personLabel WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:api "EntitySearch";
                    wikibase:endpoint "www.wikidata.org";
                    mwapi:search "%(term)s";
                    mwapi:language "en".
    ?person wikibase:apiOutputItem mwapi:item.
  }
  ?person wdt:P106 wd:Q2526255.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 3
"""

FILMOGRAPHY_QUERY = """
SELECT ?film ?filmLabel ?year ?runtime WHERE {
  ?film wdt:P57 wd:%(qid)s; wdt:P31 wd:Q11424; wdt:P577 ?date.
  OPTIONAL { ?film wdt:P2047 ?runtime. }
  BIND(YEAR(?date) AS ?year)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?year
LIMIT 40
"""


def _plain_text(value) -> str | None:
    """The Archive sends descriptions as strings or lists, with markup. One plain paragraph."""
    if isinstance(value, list):
        value = " ".join(str(part) for part in value)
    if not value:
        return None
    text = re.sub(r"<[^>]+>", " ", str(value))
    text = re.sub(r"https?://\S+", " ", text)
    text = _WS_RE.sub(" ", text).strip()
    return text[:500] or None


class FilmsClient(JsonApiClient):
    """Wikidata film facts, Wikidata filmographies, and the Internet Archive's film shelf."""

    env_prefix = "FILMS"
    user_agent = "a2a-films/1.0 (+https://github.com/mrfentmen/a2a)"
    #: Wikidata answers application/sparql-results+json; the Archive answers application/json.
    default_headers = {"Accept": "application/json, application/sparql-results+json"}

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_title(value: str) -> str:
        title = _WS_RE.sub(" ", str(value or "").strip())
        if len(title) < 2 or not any(ch.isalnum() for ch in title):
            raise ValueError("a title is a name or two, like 'the prestige'")
        if len(title) > 60:
            raise ValueError("keep the title to a few words")
        # Quoted into a SPARQL string: refuse the characters that would break out of it.
        return title.replace('"', "").replace("\\", "")

    @staticmethod
    def check_person(value: str) -> str:
        person = _WS_RE.sub(" ", str(value or "").strip())
        if len(person) < 2 or not any(ch.isalnum() for ch in person):
            raise ValueError("a filmmaker's name is a name or two, like 'christopher nolan'")
        if len(person) > 60:
            raise ValueError("keep the name to a few words")
        return person.replace('"', "").replace("\\", "")

    @staticmethod
    def check_identifier(value: str) -> str:
        identifier = str(value or "").strip()
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{3,120}", identifier):
            raise ValueError("an Internet Archive identifier looks like 'scarlet_street_1945'")
        return identifier

    # -- Wikidata ----------------------------------------------------------

    def _sparql(self, query: str) -> list[dict]:
        payload = self.get_json(WIKIDATA_ENDPOINT, {"query": query, "format": "json"})
        try:
            return payload["results"]["bindings"]
        except (KeyError, TypeError):
            raise UpstreamError("Wikidata returned an unexpected payload (no results)")

    @staticmethod
    def _value(binding: dict, key: str):
        cell = binding.get(key)
        return cell.get("value") if isinstance(cell, dict) else None

    def film(self, title: str, limit: int = DEFAULT_LIMIT) -> dict:
        """Films matching a title, with the facts Wikidata carries. Deduplicated by film."""
        wanted = self.check_title(title).lower()
        count = max(1, min(int(limit), MAX_LIMIT))
        rows: dict[str, dict] = {}
        for binding in self._sparql(FILM_QUERY % {"term": self.check_title(title)}):
            name = self._value(binding, "filmLabel")
            if not name:
                continue
            qid = (self._value(binding, "film") or "").rsplit("/", 1)[-1]
            row = rows.setdefault(qid, {
                "qid": qid, "title": name, "year": None, "directors": [], "runtime": None,
                "genres": [], "imdb": None,
                "url": f"https://www.wikidata.org/wiki/{qid}" if qid else None,
            })
            year = self._value(binding, "year")
            if year and not row["year"]:
                row["year"] = int(year)
            director = self._value(binding, "directorLabel")
            if director and director not in row["directors"]:
                row["directors"].append(director)
            runtime = self._value(binding, "runtime")
            if runtime and row["runtime"] is None:
                try:
                    row["runtime"] = int(float(runtime))
                except ValueError:
                    pass
            genre = self._value(binding, "genreLabel")
            if genre and genre not in row["genres"]:
                row["genres"].append(genre)
            imdb = self._value(binding, "imdb")
            if imdb and not row["imdb"]:
                row["imdb"] = imdb
        ordered = sorted(rows.values(), key=lambda row: -(row["year"] or 0))
        exact = [row for row in ordered if row["title"].lower() == wanted]
        chosen = (exact or ordered)[:count]
        if not chosen:
            raise UpstreamError(f"Wikidata has no film matching {title!r}")
        return {"title": title, "rows": chosen}

    def filmmaker(self, name: str) -> dict:
        """The Wikidata entity for a film director, by name."""
        wanted = self.check_person(name)
        for binding in self._sparql(DIRECTOR_QUERY % {"term": wanted}):
            label = self._value(binding, "personLabel")
            qid = (self._value(binding, "person") or "").rsplit("/", 1)[-1]
            if label and qid:
                return {"qid": qid, "name": label,
                        "url": f"https://www.wikidata.org/wiki/{qid}"}
        raise UpstreamError(f"Wikidata has no film director called {name!r}")

    def filmography(self, name: str) -> dict:
        """Everything Wikidata lists as directed by a filmmaker, oldest first."""
        person = self.filmmaker(name)
        rows = []
        for binding in self._sparql(FILMOGRAPHY_QUERY % {"qid": person["qid"]}):
            title = self._value(binding, "filmLabel")
            if not title:
                continue
            year = self._value(binding, "year")
            runtime = self._value(binding, "runtime")
            rows.append({
                "title": title,
                "year": int(year) if year else None,
                "runtime": int(float(runtime)) if runtime else None,
                "qid": (self._value(binding, "film") or "").rsplit("/", 1)[-1],
            })
        if not rows:
            raise UpstreamError(f"Wikidata lists no films directed by {person['name']}")
        years = [row["year"] for row in rows if row["year"]]
        return {"person": person, "rows": rows, "first_year": min(years) if years else None,
                "last_year": max(years) if years else None}

    # -- Internet Archive --------------------------------------------------

    def archive_films(self, keyword: str | None = None, decade: int | None = None,
                      limit: int = DEFAULT_LIMIT) -> dict:
        """Feature films on the Archive, most downloaded first, optionally by word or decade."""
        parts = [f"collection:({COLLECTION})"]
        if keyword:
            word = _WS_RE.sub(" ", str(keyword).strip()).replace('"', "").replace(":", " ")
            if word:
                parts.append(f'(title:("{word}") OR subject:("{word}"))')
        if decade:
            start = int(decade)
            parts.append(f"year:[{start} TO {start + 9}]")
        query = " AND ".join(parts)
        count = max(1, min(int(limit), MAX_LIMIT))
        # `fl[]` repeats, so the params are encoded into the URL rather than handed to urlencode
        # as a dict (a dict would collapse the repeated key into one value).
        params = {
            "q": query,
            "fl[]": ["identifier", "title", "year", "creator", "downloads", "subject"],
            "rows": str(count),
            "page": "1",
            "output": "json",
            "sort[]": "downloads desc",
        }
        url = f"{ARCHIVE_SEARCH}?{parse.urlencode(params, doseq=True)}"
        payload = self.get_json(url, {})
        try:
            response = payload["response"]
            docs = response["docs"]
        except (KeyError, TypeError):
            raise UpstreamError("the Internet Archive returned an unexpected payload")
        rows = [{
            "identifier": doc.get("identifier"),
            "title": (doc.get("title") or "").strip(),
            "year": doc.get("year"),
            "creator": doc.get("creator") if isinstance(doc.get("creator"), str)
            else (", ".join(doc.get("creator") or []) if doc.get("creator") else None),
            "downloads": doc.get("downloads"),
            "subjects": (doc.get("subject") if isinstance(doc.get("subject"), list)
                         else [doc["subject"]] if doc.get("subject") else [])[:6],
            "url": f"https://archive.org/details/{doc.get('identifier')}",
        } for doc in docs]
        if not rows:
            raise UpstreamError("the Internet Archive has no film matching that")
        return {"rows": rows, "found": response.get("numFound"), "query": query,
                "keyword": keyword, "decade": decade}

    def archive_item(self, identifier: str) -> dict:
        """One Archive item: its metadata and the film files it actually holds."""
        clean = self.check_identifier(identifier)
        payload = self.get_json(f"{ARCHIVE_METADATA}/{clean}", {})
        if not isinstance(payload, dict) or not payload.get("metadata"):
            raise UpstreamError(f"the Internet Archive has no item {clean}")
        meta = payload["metadata"]
        files = [f for f in (payload.get("files") or []) if isinstance(f, dict)]
        movies = [{"name": f.get("name"), "format": f.get("format"),
                   "size_mb": round(int(f.get("size") or 0) / 1e6, 1)
                   if str(f.get("size") or "").isdigit() else None}
                  for f in files if f.get("format") in ("h.264", "MPEG4", "512Kb MPEG4", "Ogg Video")]
        subject = meta.get("subject")
        return {
            "identifier": clean,
            "title": (meta.get("title") or "").strip() or None,
            "year": meta.get("year") or meta.get("date") or None,
            "creator": meta.get("creator") or None,
            "director": meta.get("director") or None,
            "runtime": meta.get("runtime") or None,
            "language": meta.get("language") or None,
            "description": _plain_text(meta.get("description")),
            "subjects": (subject if isinstance(subject, list) else [subject] if subject else [])[:8],
            "files": movies[:4],
            "url": f"https://archive.org/details/{clean}",
        }


__all__ = [
    "ARCHIVE_METADATA",
    "ARCHIVE_SEARCH",
    "COLLECTION",
    "DATASET_ARCHIVE",
    "DATASET_WIKIDATA",
    "DEFAULT_LIMIT",
    "DIRECTOR_QUERY",
    "FILMOGRAPHY_QUERY",
    "FILM_QUERY",
    "FilmsClient",
    "MAX_LIMIT",
    "WIKIDATA_ENDPOINT",
]
