"""Tests for the films A2A server.

    python3 servers/films/tests/test_agent.py

The films reader is the real one: only the HTTP fetch is a function, so the SPARQL result
handling, the per-film deduplication, the decade filter in the Archive query and the "mixed
shelf" honesty rule are all exercised for real.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit import UpstreamError

from agent import (  # noqa: E402
    PREMIUM_DECADES,
    PREMIUM_TOOL,
    SKILLS,
    SKILL_FILMMAKER,
    SKILL_HELP,
    SKILL_INDEX,
    SKILL_ITEM,
    SKILL_LOOKUP,
    SKILL_WATCH,
    FilmsAgent,
    decade_from_text,
    fact_line,
    parse,
    person_from_text,
    route,
    run_filmmaker,
    run_index,
    run_item,
    run_lookup,
    run_watch,
    title_from_text,
)
from data import (  # noqa: E402
    DATASET_ARCHIVE,
    DATASET_WIKIDATA,
    FilmsClient,
)

#: Wikidata's bindings as its query service answered on 2026-09-30: one row per fact, so the
#: same film arrives several times and the reader has to fold them together.
FILM_BINDINGS = [
    {"film": {"value": "http://www.wikidata.org/entity/Q471839"},
     "filmLabel": {"value": "The Prestige"}, "year": {"value": "2006"},
     "directorLabel": {"value": "Christopher Nolan"}, "runtime": {"value": "130"},
     "imdb": {"value": "tt0482571"}},
    {"film": {"value": "http://www.wikidata.org/entity/Q471839"},
     "filmLabel": {"value": "The Prestige"}, "year": {"value": "2006"},
     "genreLabel": {"value": "thriller film"}},
    {"film": {"value": "http://www.wikidata.org/entity/Q471839"},
     "filmLabel": {"value": "The Prestige"}, "year": {"value": "2006"},
     "genreLabel": {"value": "mystery film"}},
    {"film": {"value": "http://www.wikidata.org/entity/Q24871"},
     "filmLabel": {"value": "The Illusionist"}, "year": {"value": "2006"},
     "directorLabel": {"value": "Neil Burger"}},
]
DIRECTOR_BINDINGS = [
    {"person": {"value": "http://www.wikidata.org/entity/Q25191"},
     "personLabel": {"value": "Christopher Nolan"}},
]
FILMOGRAPHY_BINDINGS = [
    {"film": {"value": "http://www.wikidata.org/entity/Q1"}, "filmLabel": {"value": "Following"},
     "year": {"value": "1998"}, "runtime": {"value": "69"}},
    {"film": {"value": "http://www.wikidata.org/entity/Q2"}, "filmLabel": {"value": "Memento"},
     "year": {"value": "2000"}, "runtime": {"value": "113"}},
    {"film": {"value": "http://www.wikidata.org/entity/Q3"}, "filmLabel": {"value": "Inception"},
     "year": {"value": "2010"}},
]
ARCHIVE_PAYLOAD = {
    "response": {
        "numFound": 1381,
        "docs": [
            {"identifier": "scarlet_street_1945", "title": "Scarlet Street", "year": "1945",
             "creator": "Fritz Lang", "downloads": 40543, "subject": ["noir", "drama"]},
            {"identifier": "the_stranger_1946", "title": "The Stranger", "year": "1946",
             "creator": ["Orson Welles"], "downloads": 30000, "subject": "noir"},
        ],
    },
}
ITEM_PAYLOAD = {
    "metadata": {
        "title": "Scarlet Street", "year": "1945", "creator": "Fritz Lang",
        "runtime": "103 min", "language": "eng",
        "description": ["<p>A <b>noir</b> classic.</p>", "See https://example.org for more."],
        "subject": ["noir", "film noir"],
    },
    "files": [
        {"name": "scarlet_street_1945.mp4", "format": "h.264", "size": "740000000"},
        {"name": "scarlet_street_1945.ogv", "format": "Ogg Video", "size": "300000000"},
        {"name": "scarlet_street_1945_meta.xml", "format": "Metadata", "size": "5000"},
    ],
}


def films_fetch(fail: str | None = None, films=None, directors=None, filmography=None,
                archive=None, item=None):
    """A fetch(url, params, headers) over canned live-shaped payloads. No network."""
    calls: list[dict] = []

    def fetch(url: str, params: dict, headers: dict):
        calls.append({"url": url, "params": dict(params), "headers": dict(headers)})
        if fail and fail in url:
            raise UpstreamError("the source is down")
        if "query.wikidata.org" in url:
            query = params.get("query") or ""
            if "?person wdt:P106" in query:
                return {"results": {"bindings":
                                     directors if directors is not None else DIRECTOR_BINDINGS}}
            if "wdt:P57 wd:Q" in query:
                return {"results": {"bindings":
                                     filmography if filmography is not None else FILMOGRAPHY_BINDINGS}}
            return {"results": {"bindings": films if films is not None else FILM_BINDINGS}}
        if "advancedsearch" in url:
            return archive if archive is not None else ARCHIVE_PAYLOAD
        if "archive.org/metadata" in url:
            return item if item is not None else ITEM_PAYLOAD
        raise UpstreamError(f"unexpected url {url}")

    return fetch, calls


def client(**kwargs) -> FilmsClient:
    fetch, calls = films_fetch(**kwargs)
    return FilmsClient(fetch=fetch, cache_ttl=0, timeout=5), calls


INDEX_PAYLOAD = {
    "keyword": "noir",
    "decades": [
        {"decade": "2020s", "count": 41, "averageDownloads": 900.0,
         "mostDownloaded": {"title": "Some Recent Noir", "downloads": 5000}},
        {"decade": "1950s", "count": 260, "averageDownloads": 25000.0,
         "mostDownloaded": {"title": "Kiss Me Deadly", "downloads": 90000}},
    ],
    "scanned": 301,
    "bestDecade": {"decade": "1950s", "count": 260},
    "mostDownloaded": {"title": "Kiss Me Deadly", "downloads": 90000},
}
TOOL_ERROR_TEXT = "`film_decade_index` failed: `keyword` must be between 2 and 40 characters."




def message(text: str, **data) -> dict:
    parts: list[dict] = [{"kind": "text", "text": text}]
    if data:
        parts.append({"kind": "data", "data": data})
    return {"kind": "message", "role": "user", "messageId": "m", "parts": parts}


class HelperTests(unittest.TestCase):
    def test_a_filmmaker_name_drops_the_asking_words(self):
        self.assertEqual(person_from_text("films by fritz lang"), "fritz lang")
        self.assertEqual(person_from_text("who directed inception"), "inception")

    def test_a_quoted_title_wins(self):
        self.assertEqual(title_from_text('tell me about "the prestige"'), "the prestige")

    def test_a_decade_is_read_from_1940s_and_from_a_year(self):
        self.assertEqual(decade_from_text("1940s noir"), 1940)
        self.assertEqual(decade_from_text("noir from 1953"), 1950)
        self.assertIsNone(decade_from_text("noir"))

    def test_a_fact_line_is_film_facts_in_order(self):
        row = {"title": "The Prestige", "year": 2006, "directors": ["Christopher Nolan"],
               "runtime": 130}
        self.assertEqual(fact_line(row),
                         "The Prestige — 2006 — dir. Christopher Nolan — 130 min")

    def test_a_fact_line_leaves_out_what_wikidata_lacks(self):
        self.assertEqual(fact_line({"title": "Following", "year": 1998, "directors": [],
                                    "runtime": None}), "Following — 1998")


class RouteTests(unittest.TestCase):
    def test_a_title_question_looks_the_film_up(self):
        skill, params = route("tell me about the prestige")
        self.assertEqual(skill, SKILL_LOOKUP)
        self.assertEqual(params["title"], "the prestige")

    def test_who_directed_asks_about_the_film_not_the_person(self):
        skill, params = route("who directed inception?")
        self.assertEqual(skill, SKILL_LOOKUP)
        self.assertEqual(params["title"], "inception")

    def test_films_by_a_person_read_the_filmography(self):
        skill, params = route("films by fritz lang")
        self.assertEqual(skill, SKILL_FILMMAKER)
        self.assertEqual(params["person"], "fritz lang")

    def test_a_watch_question_reads_the_archive_with_its_decade(self):
        skill, params = route("1940s noir I can watch for free")
        self.assertEqual(skill, SKILL_WATCH)
        self.assertEqual(params["decade"], 1940)
        self.assertEqual(params["keyword"], "noir")


    def test_an_item_question_reads_the_archive_item(self):
        skill, params = route("what is in scarlet_street_1945")
        self.assertEqual(skill, SKILL_ITEM)
        self.assertEqual(params["identifier"], "scarlet_street_1945")

    def test_empty_and_help_go_to_help(self):
        self.assertEqual(route("")[0], SKILL_HELP)
        self.assertEqual(route("what can you do?")[0], SKILL_HELP)


class ParseTests(unittest.TestCase):
    def test_a_data_part_names_the_skill_and_the_parameters(self):
        parsed = parse(message("ignore me", skill=SKILL_WATCH, keyword="western", decade=1950))
        self.assertEqual(parsed["skill"], SKILL_WATCH)
        self.assertEqual(parsed["params"]["keyword"], "western")
        self.assertEqual(parsed["params"]["decade"], 1950)
        self.assertTrue(parsed["explicit"])

    def test_a_title_in_a_data_part_needs_no_prose(self):
        parsed = parse({"parts": [{"kind": "data", "data": {"title": "the prestige"}}]})
        self.assertEqual(parsed["skill"], SKILL_LOOKUP)
        self.assertEqual(parsed["params"]["title"], "the prestige")
        self.assertTrue(parsed["explicit"])

    def test_a_bare_title_is_not_explicit(self):
        # A one-line answer to "which film?" must not look like a fresh question.
        parsed = parse(message("the prestige"))
        self.assertEqual(parsed["params"]["title"], "the prestige")
        self.assertFalse(parsed["explicit"])

    def test_a_question_with_its_own_intent_is_explicit(self):
        self.assertTrue(parse(message("films by fritz lang"))["explicit"])
        self.assertTrue(parse(message("1940s noir I can watch"))["explicit"])
        self.assertTrue(parse(message("which decade has the most noir films"))["explicit"])

    def test_help_is_explicit_but_an_empty_message_is_not(self):
        self.assertTrue(parse(message("help"))["explicit"])
        self.assertFalse(parse({"parts": [{"kind": "text", "text": ""}]})["explicit"])

    def test_an_identifier_in_the_text_makes_an_item_request(self):
        parsed = parse(message("what is in scarlet_street_1945"))
        self.assertEqual(parsed["skill"], SKILL_ITEM)
        self.assertEqual(parsed["params"]["identifier"], "scarlet_street_1945")
        self.assertTrue(parsed["explicit"])


class LookupTests(unittest.TestCase):
    def test_the_same_film_arrives_once_with_all_its_facts(self):
        data, _ = client()
        result = run_lookup({"title": "the prestige", "limit": None}, data)
        rows = result["artifact"]["rows"]
        prestige = next(row for row in rows if row["title"] == "The Prestige")
        self.assertEqual(prestige["year"], 2006)
        self.assertEqual(prestige["directors"], ["Christopher Nolan"])
        self.assertEqual(prestige["runtime"], 130)
        self.assertEqual(prestige["genres"], ["thriller film", "mystery film"])
        self.assertEqual(prestige["imdb"], "tt0482571")
        self.assertEqual(prestige["qid"], "Q471839")

    def test_an_exact_title_comes_first(self):
        data, _ = client()
        result = run_lookup({"title": "the prestige", "limit": None}, data)
        self.assertEqual(result["artifact"]["rows"][0]["title"], "The Prestige")

    def test_the_answer_names_wikidata_and_leaves_gaps_open(self):
        data, _ = client()
        result = run_lookup({"title": "the prestige", "limit": None}, data)
        self.assertEqual(result["artifact"]["dataset"], DATASET_WIKIDATA)
        self.assertIn(DATASET_WIKIDATA, result["message"])
        self.assertIn("community wiki", result["message"])

    def test_nothing_found_is_an_upstream_error(self):
        data, _ = client(films=[])
        with self.assertRaises(UpstreamError):
            run_lookup({"title": "nothing at all", "limit": None}, data)

    def test_an_impossible_title_is_rejected_before_any_request(self):
        data, calls = client()
        with self.assertRaises(ValueError):
            run_lookup({"title": " ", "limit": None}, data)
        self.assertEqual(calls, [])

    def test_the_limit_is_clamped_not_trusted(self):
        data, _ = client()
        result = run_lookup({"title": "the prestige", "limit": 99}, data)
        self.assertLessEqual(len(result["artifact"]["rows"]), 12)


class FilmmakerTests(unittest.TestCase):
    def test_a_filmography_comes_back_oldest_first_with_its_span(self):
        data, _ = client()
        result = run_filmmaker({"person": "christopher nolan"}, data)
        artifact = result["artifact"]
        self.assertEqual(artifact["person"]["name"], "Christopher Nolan")
        self.assertEqual([row["title"] for row in artifact["rows"]],
                         ["Following", "Memento", "Inception"])
        self.assertEqual((artifact["first_year"], artifact["last_year"]), (1998, 2010))

    def test_a_missing_runtime_is_left_out_not_invented(self):
        data, _ = client()
        result = run_filmmaker({"person": "christopher nolan"}, data)
        self.assertIsNone(result["artifact"]["rows"][2]["runtime"])
        self.assertIn("Inception", result["message"])

    def test_a_person_wikidata_does_not_know_is_an_upstream_error(self):
        data, _ = client(directors=[])
        with self.assertRaises(UpstreamError):
            run_filmmaker({"person": "nobody at all"}, data)

    def test_no_credits_is_an_upstream_error(self):
        data, _ = client(filmography=[])
        with self.assertRaises(UpstreamError):
            run_filmmaker({"person": "christopher nolan"}, data)


class WatchTests(unittest.TestCase):
    def test_the_archive_shelf_comes_back_most_downloaded_first(self):
        data, _ = client()
        result = run_watch({"keyword": "noir", "decade": 1940, "limit": None}, data)
        artifact = result["artifact"]
        self.assertEqual([row["identifier"] for row in artifact["rows"]],
                         ["scarlet_street_1945", "the_stranger_1946"])
        self.assertEqual(artifact["found"], 1381)

    def test_the_decade_narrows_the_query_upstream(self):
        data, calls = client()
        run_watch({"keyword": "noir", "decade": 1940, "limit": None}, data)
        query = calls[0]["url"]
        self.assertIn("year%3A%5B1940+TO+1949%5D", query)
        self.assertIn("collection%3A%28feature_films%29", query)
        # The repeated fl[] list survives encoding: one key per field.
        self.assertGreaterEqual(query.count("fl%5B%5D="), 6)

    def test_the_answer_says_the_shelf_is_mixed(self):
        data, _ = client()
        result = run_watch({"keyword": "noir", "decade": 1940, "limit": None}, data)
        self.assertIn("not as free to reuse", result["message"])
        self.assertEqual(result["artifact"]["dataset"], DATASET_ARCHIVE)

    def test_a_shelf_with_nothing_is_an_upstream_error(self):
        data, _ = client(archive={"response": {"numFound": 0, "docs": []}})
        with self.assertRaises(UpstreamError):
            run_watch({"keyword": "nothing", "decade": None, "limit": None}, data)


class ItemTests(unittest.TestCase):
    def test_an_item_comes_back_with_its_metadata_and_film_files(self):
        data, _ = client()
        result = run_item({"identifier": "scarlet_street_1945"}, data)
        artifact = result["artifact"]
        self.assertEqual(artifact["title"], "Scarlet Street")
        self.assertEqual(artifact["year"], "1945")
        self.assertEqual([f["name"] for f in artifact["files"]],
                         ["scarlet_street_1945.mp4", "scarlet_street_1945.ogv"])
        self.assertEqual(artifact["files"][0]["size_mb"], 740.0)

    def test_a_description_is_one_plain_paragraph(self):
        data, _ = client()
        result = run_item({"identifier": "scarlet_street_1945"}, data)
        description = result["artifact"]["description"]
        self.assertNotIn("<", description)
        self.assertNotIn("http", description)
        self.assertIn("noir classic", description)

    def test_a_subject_sent_as_a_string_is_still_a_list(self):
        data, _ = client()
        result = run_watch({"keyword": None, "decade": None, "limit": None}, data)
        self.assertEqual(result["artifact"]["rows"][1]["subjects"], ["noir"])

    def test_an_impossible_identifier_is_rejected_before_any_request(self):
        data, calls = client()
        with self.assertRaises(ValueError):
            run_item({"identifier": "a!"}, data)
        self.assertEqual(calls, [])




class AgentTests(unittest.TestCase):

    def test_the_card_lists_every_skill_in_order(self):
        skills = [skill["id"] for skill in FilmsAgent.card_skills]
        self.assertEqual(skills, list(SKILLS))
        self.assertEqual(FilmsAgent.datasets, (DATASET_WIKIDATA, DATASET_ARCHIVE))
        self.assertEqual(FilmsAgent.watch_kinds, ())









if __name__ == "__main__":
    unittest.main(verbosity=2)
