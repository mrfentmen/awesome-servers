"""Tests for the films agent: Wikidata and Internet Archive readers, routing, premium index.

    python3 agents/films/tests/test_agent.py
"""

from __future__ import annotations

import json
import os
import queue
import sys
import threading
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import AcpClient, Connection, GatewayClient, STOP_END_TURN, STOP_REFUSAL  # noqa: E402

from agent import FilmsAgent, decade_from_text, person_from_text, route, title_from_text  # noqa: E402
from data import (  # noqa: E402
    DATASET_ARCHIVE,
    DATASET_WIKIDATA,
    FilmsData,
    FilmsError,
)

# ---------------------------------------------------------------------------
# Payloads in the shapes Wikidata and the Archive really send
# ---------------------------------------------------------------------------


def cell(value):
    return {"value": value}


#: Three bindings for one film, which is what the OPTIONALs produce - the reader deduplicates.
FILM_BINDINGS = {"results": {"bindings": [
    {"film": cell("http://www.wikidata.org/entity/Q25188"), "filmLabel": cell("Inception"),
     "year": cell("2010"), "directorLabel": cell("Christopher Nolan"), "runtime": cell("148"),
     "genreLabel": cell("science fiction film"), "imdb": cell("tt1375666")},
    {"film": cell("http://www.wikidata.org/entity/Q25188"), "filmLabel": cell("Inception"),
     "year": cell("2010"), "directorLabel": cell("Christopher Nolan"), "runtime": cell("148"),
     "genreLabel": cell("heist film"), "imdb": cell("tt1375666")},
    {"film": cell("http://www.wikidata.org/entity/Q25188"), "filmLabel": cell("Inception"),
     "year": cell("2010"), "directorLabel": cell("Christopher Nolan"), "runtime": cell("148"),
     "genreLabel": cell("science fiction film"), "imdb": cell("tt1375666")},
]}}

DIRECTOR_BINDINGS = {"results": {"bindings": [
    {"person": cell("http://www.wikidata.org/entity/Q25191"),
     "personLabel": cell("Christopher Nolan")},
]}}

FILMOGRAPHY_BINDINGS = {"results": {"bindings": [
    {"film": cell("http://www.wikidata.org/entity/Q1"), "filmLabel": cell("Following"),
     "year": cell("1998"), "runtime": cell("69")},
    {"film": cell("http://www.wikidata.org/entity/Q2"), "filmLabel": cell("Memento"),
     "year": cell("2000"), "runtime": cell("113")},
    {"film": cell("http://www.wikidata.org/entity/Q3"), "filmLabel": cell("Inception"),
     "year": cell("2010"), "runtime": cell("148")},
]}}

ARCHIVE_SEARCH = {"response": {"numFound": 1381, "docs": [
    {"identifier": "the_stranger_1946", "title": "The Stranger", "year": "1946",
     "creator": "Sam Spiegel", "downloads": 661257, "subject": ["noir", "film noir"]},
    {"identifier": "scarlet_street_1945", "title": "Scarlet Street", "year": "1945",
     "creator": ["Fritz Lang", "Walter Wanger"], "downloads": 523027},
]}}

ARCHIVE_ITEM = {
    "metadata": {"identifier": "scarlet_street_1945", "title": "Scarlet Street",
                 "year": "1945", "creator": "Fritz Lang", "runtime": "103 min",
                 "language": "eng", "subject": ["noir", "crime"],
                 "description": "<p>A <b>noir</b> classic. https://example.org/x</p>"},
    "files": [
        {"name": "scarlet_street_1945.mp4", "format": "h.264", "size": "700000000"},
        {"name": "scarlet_street.jpg", "format": "JPEG", "size": "120000"},
    ],
}


def dispatch(url: str, params: dict):
    """Answer by source, and by which Wikidata query was sent."""
    if "wikidata" in url:
        query = params.get("query", "")
        if "wdt:P106" in query:
            return DIRECTOR_BINDINGS
        if "wdt:P57 wd:" in query:
            return FILMOGRAPHY_BINDINGS
        return FILM_BINDINGS
    if "metadata" in url:
        return ARCHIVE_ITEM
    if "advancedsearch" in url:
        return ARCHIVE_SEARCH
    return {}


class FakeData(FilmsData):
    """Same interface as the real reader, no network."""

    def __init__(self, raise_error: bool = False) -> None:
        self.raise_error = raise_error
        self.calls: list[dict] = []

    def film(self, title: str, limit: int = 5) -> dict:
        if self.raise_error:
            raise FilmsError(f"Wikidata has no film matching {title!r}")
        self.calls.append({"kind": "film", "title": title})
        return {"title": title, "rows": [{
            "qid": "Q25188", "title": "Inception", "year": 2010,
            "directors": ["Christopher Nolan"], "runtime": 148,
            "genres": ["science fiction film"], "imdb": "tt1375666",
            "url": "https://www.wikidata.org/wiki/Q25188"}]}

    def filmography(self, name: str) -> dict:
        if self.raise_error:
            raise FilmsError(f"Wikidata lists no films directed by {name}")
        self.calls.append({"kind": "filmography", "name": name})
        return {"person": {"qid": "Q25191", "name": "Christopher Nolan",
                           "url": "https://www.wikidata.org/wiki/Q25191"},
                "rows": [{"title": "Following", "year": 1998, "runtime": 69, "qid": "Q1"},
                         {"title": "Memento", "year": 2000, "runtime": 113, "qid": "Q2"},
                         {"title": "Inception", "year": 2010, "runtime": 148, "qid": "Q3"}],
                "first_year": 1998, "last_year": 2010}

    def archive_films(self, keyword=None, decade=None, limit: int = 5) -> dict:
        if self.raise_error:
            raise FilmsError("the Internet Archive has no film matching that")
        self.calls.append({"kind": "archive", "keyword": keyword, "decade": decade})
        return {"rows": [{"identifier": "scarlet_street_1945", "title": "Scarlet Street",
                          "year": "1945", "creator": "Fritz Lang", "downloads": 523027,
                          "subjects": ["noir"],
                          "url": "https://archive.org/details/scarlet_street_1945"}],
                "found": 1381, "keyword": keyword, "decade": decade}

    def archive_item(self, identifier: str) -> dict:
        if self.raise_error:
            raise FilmsError(f"the Internet Archive has no item {identifier}")
        self.calls.append({"kind": "item", "identifier": identifier})
        return {"identifier": identifier, "title": "Scarlet Street", "year": "1945",
                "creator": "Fritz Lang", "director": None, "runtime": "103 min",
                "language": "eng", "description": "A noir classic.",
                "subjects": ["noir", "crime"],
                "files": [{"name": "scarlet_street_1945.mp4", "format": "h.264", "size_mb": 700.0}],
                "url": f"https://archive.org/details/{identifier}"}


class QueueReader:
    """One side's inbox: an iterator of lines, plus push to add one."""

    def __init__(self):
        self._items: queue.Queue = queue.Queue()

    def push(self, text):
        self._items.put(text)

    def close(self):
        self._items.put(None)

    def __iter__(self):
        return self

    def __next__(self):
        item = self._items.get()
        if item is None:
            raise StopIteration
        return item


class WiredWriter:
    def __init__(self, reader):
        self.reader = reader

    def write(self, text):
        self.reader.push(text)

    def flush(self):
        pass

    def close(self):
        self.reader.close()


def connected_pair():
    to_agent, to_client = QueueReader(), QueueReader()
    return (
        Connection(to_agent, WiredWriter(to_client), name="agent"),
        Connection(to_client, WiredWriter(to_agent), name="client"),
    )


class ReaderTests(unittest.TestCase):
    def test_a_film_is_deduplicated_across_bindings(self):
        data = FilmsData(fetch=dispatch)
        result = data.film("inception")
        self.assertEqual(len(result["rows"]), 1)
        row = result["rows"][0]
        self.assertEqual(row["title"], "Inception")
        self.assertEqual(row["year"], 2010)
        self.assertEqual(row["directors"], ["Christopher Nolan"])
        self.assertEqual(row["runtime"], 148)
        self.assertEqual(row["genres"], ["science fiction film", "heist film"])
        self.assertEqual(row["imdb"], "tt1375666")

    def test_a_director_is_resolved_by_occupation(self):
        data = FilmsData(fetch=dispatch)
        person = data.filmmaker("christopher nolan")
        self.assertEqual(person["name"], "Christopher Nolan")
        self.assertEqual(person["qid"], "Q25191")

    def test_a_filmography_is_oldest_first_with_a_span(self):
        data = FilmsData(fetch=dispatch)
        result = data.filmography("christopher nolan")
        self.assertEqual([row["title"] for row in result["rows"]],
                         ["Following", "Memento", "Inception"])
        self.assertEqual((result["first_year"], result["last_year"]), (1998, 2010))

    def test_archive_search_reports_the_match_count_and_creators(self):
        data = FilmsData(fetch=dispatch)
        result = data.archive_films(keyword="noir", decade=1940)
        self.assertEqual(result["found"], 1381)
        self.assertEqual(result["rows"][0]["identifier"], "the_stranger_1946")
        self.assertEqual(result["rows"][1]["creator"], "Fritz Lang, Walter Wanger")
        self.assertIn("collection:(feature_films)", result["query"])
        self.assertIn("year:[1940 TO 1949]", result["query"])

    def test_archive_item_keeps_film_files_and_strips_markup(self):
        data = FilmsData(fetch=dispatch)
        item = data.archive_item("scarlet_street_1945")
        self.assertEqual([f["name"] for f in item["files"]], ["scarlet_street_1945.mp4"])
        self.assertEqual(item["files"][0]["size_mb"], 700.0)
        self.assertNotIn("<b>", item["description"])
        self.assertNotIn("https://example.org", item["description"])

    def test_quotes_are_stripped_before_a_query_is_built(self):
        self.assertEqual(FilmsData.check_title('the "prestige"'), "the prestige")
        with self.assertRaises(ValueError):
            FilmsData.check_title("x")

    def test_nothing_matching_is_an_error(self):
        data = FilmsData(fetch=lambda url, params: {"results": {"bindings": []}}
                         if "wikidata" in url else {"response": {"numFound": 0, "docs": []}})
        with self.assertRaises(FilmsError):
            data.film("nosuchfilm")


class RouteTests(unittest.TestCase):
    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")

    def test_a_title_is_a_lookup(self):
        skill, params = route("tell me about the prestige")
        self.assertEqual(skill, "film-lookup")
        self.assertEqual(params["title"], "prestige")

    def test_who_directed_asks_about_the_film(self):
        skill, params = route("who directed inception")
        self.assertEqual(skill, "film-lookup")
        self.assertEqual(params["title"], "inception")

    def test_films_by_a_person(self):
        skill, params = route("films by fritz lang")
        self.assertEqual(skill, "filmmaker-films")
        self.assertEqual(params["person"], "fritz lang")

    def test_watch_question_carries_the_decade(self):
        skill, params = route("1940s noir I can watch for free")
        self.assertEqual(skill, "films-to-watch")
        self.assertEqual(params["decade"], 1940)
        self.assertEqual(params["keyword"], "noir")

    def test_decade_index_is_the_premium_skill(self):
        skill, params = route("which decade has the most noir films")
        self.assertEqual(skill, "film-index")
        self.assertEqual(params["keyword"], "noir")

    def test_one_item_lookup(self):
        skill, params = route("what is in scarlet_street_1945")
        self.assertEqual(skill, "archive-item")
        self.assertEqual(params["identifier"], "scarlet_street_1945")

    def test_helpers(self):
        self.assertEqual(decade_from_text("films from 1936"), 1930)
        self.assertIsNone(decade_from_text("films"))
        self.assertEqual(title_from_text('the "the prestige"'), "the prestige")
        self.assertIsNone(person_from_text("what can you do"))


class TurnTests(unittest.TestCase):
    def turn(self, text: str, data: FakeData | None = None, permission: str = "allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = FilmsAgent(agent_conn, data or FakeData())
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_lookup_reports_the_facts(self):
        result, client = self.turn("tell me about inception")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Inception — 2010 — dir. Christopher Nolan — 148 min", result["text"])
        self.assertIn("IMDb: tt1375666", result["text"])
        self.assertIn("community wiki", result["text"])
        tools = [update for update in result["updates"] if update.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "film-lookup")
        self.assertEqual(len(client.permission_requests), 1)

    def test_filmography_names_the_span(self):
        result, _ = self.turn("films by christopher nolan")
        self.assertIn("Wikidata credits Christopher Nolan with 3 films (1998–2010)", result["text"])
        self.assertIn("2000 — Memento — 113 min", result["text"])

    def test_watch_question_keeps_the_caveat(self):
        result, _ = self.turn("1940s noir I can watch for free")
        self.assertIn("1940s, noir", result["text"])
        self.assertIn("Scarlet Street — 1945 — Fritz Lang", result["text"])
        self.assertIn("not as free to reuse", result["text"])

    def test_item_lookup_lists_the_files(self):
        result, _ = self.turn("what is in scarlet_street_1945")
        self.assertIn("scarlet_street_1945.mp4 (h.264, 700.0 MB)", result["text"])
        self.assertIn("subjects: noir, crime", result["text"])

    def test_an_empty_ask_asks_for_a_title(self):
        result, _ = self.turn("hi")
        self.assertIn("Which film should I look up?", result["text"])

    def test_help_does_not_ask_permission(self):
        result, client = self.turn("what can you do?")
        self.assertIn("Wikidata", result["text"])
        self.assertEqual(client.permission_requests, [])

    def test_permission_denied(self):
        result, _ = self.turn("tell me about inception", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", result["text"])

    def test_a_feed_failure_is_reported(self):
        result, _ = self.turn("tell me about inception", data=FakeData(raise_error=True))
        self.assertIn("could not read the film sources", result["text"])
        statuses = [update.get("status") for update in result["updates"]
                    if update.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)


# ---------------------------------------------------------------------------
# Premium: the decade index is computed on the licence gateway
# ---------------------------------------------------------------------------

INDEX_PAYLOAD = {
    "keyword": "noir", "scanned": 900,
    "decades": [
        {"decade": "1940s", "count": 620, "averageDownloads": 41200,
         "mostDownloaded": {"title": "The Stranger", "identifier": "the_stranger_1946",
                            "downloads": 661257}},
        {"decade": "1950s", "count": 214, "averageDownloads": 28600,
         "mostDownloaded": {"title": "Quicksand", "identifier": "quicksand_1950",
                            "downloads": 453096}},
    ],
    "bestDecade": {"decade": "1940s", "count": 620},
    "mostDownloaded": {"title": "The Stranger", "identifier": "the_stranger_1946",
                       "downloads": 661257},
}

#: The gateway words its own refusals, buy link included, and the agent must not rewrite them.
REFUSAL_TEXT = (
    "This is a premium skill and needs a valid license key. "
    "Get one at https://polar.sh/mrfentmen and set MCP_LICENSE_KEY."
)


def mcp_result(payload, is_error=False, structured=None):
    result = {"content": [{"type": "text", "text": json.dumps(payload)}]}
    if is_error:
        result["isError"] = True
    if structured is not None:
        result["structuredContent"] = structured
    return {"jsonrpc": "2.0", "id": 1, "result": result}


def make_gateway(key, result):
    """A real GatewayClient with the transport injected - no network, ever."""
    calls = []

    def fetch(url, payload, headers):
        calls.append({"tool": payload["params"]["name"],
                      "arguments": payload["params"]["arguments"],
                      "authorized": "Authorization" in headers})
        return result

    client = GatewayClient(fetch=fetch, url="http://127.0.0.1:8787/mcp", key=key)
    client.calls = calls
    return client


class PremiumIndexTests(unittest.TestCase):
    def premium_turn(self, text, gateway, permission="allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = FilmsAgent(agent_conn, FakeData(), gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_no_key_returns_the_gateways_own_wording(self):
        saved = os.environ.pop("MCP_LICENSE_KEY", None)
        try:
            result, _ = self.premium_turn("which decade has the most noir films",
                                          make_gateway("", mcp_result(INDEX_PAYLOAD)))
        finally:
            if saved is not None:
                os.environ["MCP_LICENSE_KEY"] = saved
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])

    def test_a_bad_key_is_answered_not_crashed(self):
        gateway = make_gateway("lic_live_but_rejected", mcp_result(
            REFUSAL_TEXT, is_error=True,
            structured={"licenceRefusal": True, "reason": "denied"}))
        result, _ = self.premium_turn("which decade has the most noir films", gateway)
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("polar.sh", result["text"])

    def test_a_good_key_gets_the_index_and_the_gateway_did_the_work(self):
        gateway = make_gateway("lic_granted", mcp_result(INDEX_PAYLOAD))
        result, client = self.premium_turn("which decade has the most noir films", gateway)
        self.assertIn("computed on the licence gateway", result["text"])
        self.assertIn("1940s: 620 films, top-ten average 41,200 downloads", result["text"])
        self.assertIn("Single most downloaded: The Stranger (661,257 downloads).", result["text"])
        self.assertEqual(gateway.calls[0]["tool"], "film_decade_index")
        self.assertTrue(gateway.calls[0]["authorized"])
        self.assertEqual(gateway.calls[0]["arguments"]["keyword"], "noir")
        self.assertEqual(len(client.permission_requests), 1)

    def test_free_skills_never_reach_the_gateway(self):
        gateway = make_gateway("lic_granted", mcp_result(INDEX_PAYLOAD))
        for text in ("tell me about inception", "films by christopher nolan",
                     "1940s noir I can watch for free"):
            self.premium_turn(text, gateway)
        self.assertEqual(gateway.calls, [])

    def test_dataset_constants_name_the_sources(self):
        self.assertIn("wikidata", DATASET_WIKIDATA)
        self.assertIn("feature_films", DATASET_ARCHIVE)


if __name__ == "__main__":
    unittest.main()
