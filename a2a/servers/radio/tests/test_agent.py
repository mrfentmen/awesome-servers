"""Tests for the radio-browser server.

    python3 servers/radio/tests/test_agent.py
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


from agent import (  # noqa: E402
    CARD_SKILLS,
    KNOWN_TAGS,
    SKILL_STATION_ROSTER,
    RadioBrowserAgent,
    country_from_text,
    parse,
    tags_from_text,
)
from data import (  # noqa: E402
    BYUUID_PATH,
    DATASET,
    TAGS_TOP_PATH,
    RadioBrowserClient,
    station_health,
    station_tags,
)

JAZZ = {
    "stationuuid": "0f6d4b1a-1111-2222-3333-444455556666",
    "name": "Classic Vinyl HD",
    "url": "http://example.invalid/classic",
    "url_resolved": "http://stream.example.invalid/classic.mp3",
    "homepage": "https://example.invalid/classic",
    "favicon": "",
    "country": "United States",
    "countrycode": "US",
    "state": "California",
    "language": "english",
    "tags": "jazz,oldies,vintage,smooth jazz",
    "codec": "MP3",
    "bitrate": 128,
    "hls": False,
    "lastcheckok": 1,
    "lastchecktime": "1780000000",
    "lastcheckoktime": "2026-09-27T10:00:00",
    "clickcount": 795,
    "clicktrend": -1,
    "votes": 412,
    "geo_lat": 34.0522,
    "geo_long": -118.2437,
    "geo_distance": 12.4,
}

SMOOTH = {
    "stationuuid": "1a2b3c4d-2222-3333-4444-555566667777",
    "name": "  SMOOTH JAZZ: Sax, piano",
    "url": "http://example.invalid/smooth",
    "url_resolved": "",
    "homepage": "",
    "favicon": "",
    "country": "Mexico",
    "countrycode": "MX",
    "state": "Ciudad de México",
    "language": "spanish",
    "tags": "jazz,smooth jazz,piano jazz",
    "codec": "AAC+",
    "bitrate": 48,
    "hls": False,
    "lastcheckok": 0,
    "lastchecktime": "1780000000",
    "lastcheckoktime": "2026-09-27T11:00:00",
    "clickcount": 58,
    "clicktrend": 0,
    "votes": 222,
    "geo_lat": 19.4326,
    "geo_long": -99.1332,
    "geo_distance": 3011.9,
}

BLUES = {
    **JAZZ,
    "stationuuid": "9f8e7d6c-3333-4444-5555-666677778888",
    "name": "Adroit Blues",
    "country": "United States",
    "countrycode": "US",
    "state": "Mississippi",
    "tags": "blues,delta blues",
    "codec": "AAC",
    "bitrate": 64,
    "votes": 120,
    "clickcount": 335,
    "geo_lat": 32.2988,
    "geo_long": -90.1848,
    "geo_distance": 250.7,
}

#: The same station under two tags: the roster has to remove one of them.
DUPLICATE_JAZZ = {**BLUES, "tags": "jazz,blues"}

TAGS_PAYLOAD = [
    {"name": "### top 40 club ###", "stationcount": 1},
    {"name": "jazz", "stationcount": 9001},
    {"name": "#top200", "stationcount": 5},
    {"name": "blues", "stationcount": 4200},
    {"name": "pop", "stationcount": 12000},
    {"name": "electronic", "stationcount": 6000},
]

LANGUAGES_PAYLOAD = [{"name": "english", "stationcount": 20000}, {"name": "german", "stationcount": 8000}]


def _no_network(*args, **kwargs):
    raise AssertionError("FakeRadio must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        path = url.split("?")[0]
        if path.endswith("/search"):
            return payloads["search"](params) if callable(payloads["search"]) else payloads["search"]
        if "/byuuid/" in path:
            return payloads["byuuid"]
        if path.endswith(TAGS_TOP_PATH):
            return payloads["tags"]
        if path.endswith("/languages"):
            return payloads["languages"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


def client(**payloads):
    base = {"search": [], "byuuid": [JAZZ], "tags": TAGS_PAYLOAD, "languages": LANGUAGES_PAYLOAD}
    base.update(payloads)
    return RadioBrowserClient(fetch=fetch_from(base))


class ValidationTests(unittest.TestCase):
    def test_check_tag_country_order(self):
        self.assertEqual(RadioBrowserClient.check_tag(" Jazz "), "jazz")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_tag("")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_tag("!!")
        self.assertEqual(RadioBrowserClient.check_country("us"), "US")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_country("USA")
        self.assertEqual(RadioBrowserClient.check_order("clickcount"), "clickcount")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_order("vibes")

    def test_check_limit_and_healthy(self):
        self.assertEqual(RadioBrowserClient.check_limit(None, default=25), 25)
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_limit("0")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_limit("101")
        self.assertTrue(RadioBrowserClient.check_healthy("yes"))
        self.assertFalse(RadioBrowserClient.check_healthy(None))
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_healthy("maybe")

    def test_check_point_and_uuid(self):
        self.assertEqual(RadioBrowserClient.check_point(" 40.7006, -74.0142 "), (40.7006, -74.0142))
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_point("somewhere")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_point("91.0,-74.0")
        self.assertEqual(RadioBrowserClient.check_uuid("7c1a1a1a-1111-2222-3333-444455556666"),
                         "7c1a1a1a-1111-2222-3333-444455556666")
        with self.assertRaises(ValueError):
            RadioBrowserClient.check_uuid("nope")

    def test_health_and_tag_helpers(self):
        self.assertIn("worked", station_health(JAZZ))
        self.assertIn("failed", station_health(SMOOTH))
        self.assertIn("not reported", station_health({}))
        self.assertEqual(station_tags(JAZZ)[:2], ["jazz", "oldies"])
        self.assertEqual(station_tags({"tags": None}), [])
        self.assertEqual(station_tags({"tags": "a, ,b"}, limit=2), ["a", "b"])


class ReaderTests(unittest.TestCase):
    def test_a_positional_search_asks_for_stations_with_coordinates(self):
        calls = []
        api = RadioBrowserClient(fetch=fetch_from({"search": [], "tags": TAGS_PAYLOAD,
                                                  "languages": LANGUAGES_PAYLOAD}, calls))
        api.search(point="40.7006,-74.0142")
        params = calls[0][1]
        self.assertEqual(params["has_geo_info"], "true",
                         "without this the mirror answers with stations that hold no coordinates")
        self.assertEqual(params["latitude"], 40.7006)

    def test_a_positional_search_reads_a_wider_page(self):
        calls = []
        api = RadioBrowserClient(fetch=fetch_from({"search": [], "tags": TAGS_PAYLOAD,
                                                  "languages": LANGUAGES_PAYLOAD}, calls))
        api.search(point="40.7006,-74.0142", limit=10)
        self.assertEqual(calls[0][1]["limit"], 50,
                         "sorting after the cut would just return the most-clicked stations on Earth")

    def test_distance_is_computed_from_the_directorys_coordinates(self):
        near = {**BLUES, "geo_distance": None}
        api = client(search=[near])
        stations = api.search(point="40.7006,-74.0142")
        self.assertIsNotNone(stations[0]["distance_km"])
        self.assertEqual(stations[0]["distance_source"],
                         "computed from the directory's own coordinates")

    def test_search_passes_only_the_filters_given(self):
        calls = []
        api = RadioBrowserClient(fetch=fetch_from({"search": [JAZZ, SMOOTH], "tags": TAGS_PAYLOAD,
                                                  "languages": LANGUAGES_PAYLOAD}, calls))
        stations = api.search(tag="jazz", country="us", limit=5)
        self.assertEqual(len(stations), 2)
        params = calls[0][1]
        self.assertEqual(params["tag"], "jazz")
        self.assertEqual(params["countrycode"], "US")
        self.assertEqual(params["order"], "votes")
        self.assertEqual(params["reverse"], "true")
        self.assertEqual(params["limit"], 5)
        self.assertNotIn("hidebroken", params, "no healthy filter asked for, so none is sent")

    def test_search_maps_health_and_distance(self):
        api = client(search=[JAZZ, SMOOTH])
        stations = api.search(tag="jazz", country="US")
        self.assertTrue(stations[0]["healthy"])
        self.assertEqual(stations[0]["health"], "stream worked on the last check")
        self.assertEqual(stations[0]["distance_km"], 12.4)
        self.assertEqual(stations[0]["stream_url"], "http://stream.example.invalid/classic.mp3")
        self.assertFalse(stations[1]["healthy"])
        self.assertIn("failed", stations[1]["health"])
        # An empty url_resolved falls back to url rather than reporting nothing.
        self.assertEqual(stations[1]["stream_url"], "http://example.invalid/smooth")

    def test_search_with_healthy_sets_hidebroken(self):
        calls = []
        api = RadioBrowserClient(fetch=fetch_from({"search": [], "tags": TAGS_PAYLOAD,
                                                  "languages": LANGUAGES_PAYLOAD}, calls))
        api.search(tag="jazz", healthy=True)
        self.assertEqual(calls[0][1]["hidebroken"], "true")

    def test_search_without_a_filter_is_refused(self):
        with self.assertRaises(ValueError):
            client().search()

    def test_station_by_uuid(self):
        calls = []
        api = RadioBrowserClient(fetch=fetch_from({"byuuid": [JAZZ], "search": [], "tags": TAGS_PAYLOAD,
                                                  "languages": LANGUAGES_PAYLOAD}, calls))
        station = api.station("0f6d4b1a-1111-2222-3333-444455556666")
        self.assertEqual(station["name"], "Classic Vinyl HD")
        self.assertIn(BYUUID_PATH.format(uuid=JAZZ["stationuuid"]), calls[0][0])

    def test_station_not_held_is_none(self):
        self.assertIsNone(client(byuuid=[]).station("0f6d4b1a-1111-2222-3333-444455556666"))

    def test_top_tags_are_sorted_by_station_count(self):
        tags = client().top_tags(limit=3)
        self.assertEqual([row["tag"] for row in tags], ["pop", "jazz", "electronic"])
        self.assertEqual(tags[0]["stations"], 12000)

    def test_top_tags_filtered_to_the_known_vocabulary(self):
        tags = client().top_tags(limit=10, only_known=True)
        names = [row["tag"] for row in tags]
        self.assertNotIn("### top 40 club ###", names)
        self.assertNotIn("#top200", names)
        for name in names:
            self.assertIn(name, KNOWN_TAGS)

    def test_languages_sorted_by_station_count(self):
        rows = client().languages(limit=5)
        self.assertEqual(rows[0]["language"], "english")
        self.assertEqual(rows[0]["stations"], 20000)

    def test_a_bad_mirror_payload_is_upstream_error(self):
        from a2a_kit import UpstreamError

        def bad(url, params, headers):
            return {"error": "boom"}

        with self.assertRaises(UpstreamError):
            RadioBrowserClient(fetch=bad).search(tag="jazz")


class ParseTests(unittest.TestCase):
    def text(self, value):
        return parse({"parts": [{"kind": "text", "text": value}]})

    def test_genre_wording_finds_a_tag(self):
        request = self.text("find jazz radio stations")
        self.assertEqual(request["skill"], "stations-find")
        self.assertEqual(request["params"]["tag"], "jazz")

    def test_country_by_name_and_code(self):
        self.assertEqual(self.text("blues stations in the US")["params"]["country"], "US")
        self.assertEqual(self.text("radio stations in Germany called wdr")["params"]["country"], "DE")
        self.assertEqual(self.text("radio stations in GB")["params"]["country"], "GB")

    def test_station_name_after_called(self):
        request = self.text("radio stations in Germany called wdr")
        self.assertEqual(request["params"]["station"], "wdr")

    def test_near_a_point(self):
        request = self.text("which radio stations are near 40.7006,-74.0142?")
        self.assertEqual(request["skill"], "stations-near")
        self.assertEqual(request["params"]["point"], "40.7006,-74.0142")

    def test_genre_list_wording(self):
        self.assertEqual(self.text("what genres of radio station are there?")["skill"], "genre-list")
        request = self.text("list the common radio-browser tags")
        self.assertEqual(request["skill"], "genre-list")
        self.assertTrue(request["params"]["known_only"])

    def test_uuid_is_detail(self):
        request = self.text("station detail for uuid 7c1a1a1a-1111-2222-3333-444455556666")
        self.assertEqual(request["skill"], "station-detail")
        self.assertEqual(request["params"]["uuid"], "7c1a1a1a-1111-2222-3333-444455556666")

    def test_roster_wording_keeps_several_genres(self):
        request = self.text("give me a roster of jazz, blues and soul stations for tonight")
        self.assertEqual(request["skill"], SKILL_STATION_ROSTER)
        self.assertEqual(request["params"]["tags"], "jazz,blues,soul")

    def test_help_and_empty(self):
        self.assertEqual(self.text("")["skill"], "help")
        self.assertEqual(self.text("what can you do?")["skill"], "help")

    def test_explicit_json_wins(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "stations-find", "tag": "blues", "country": "US", "limit": 4}}]})
        self.assertEqual(request["skill"], "stations-find")
        self.assertEqual(request["params"]["limit"], 4)
        self.assertTrue(request["explicit"])

    def test_a_named_station_beats_an_inferred_genre(self):
        request = self.text("radio stations called Jazz FM in the US")
        self.assertEqual(request["params"]["station"], "Jazz FM")
        self.assertNotIn("tag", request["params"], "a name and a tag together over-filter")

    def test_tag_and_country_helpers(self):
        self.assertEqual(tags_from_text("jazz, blues and soul stations"), ["jazz", "blues", "soul"])
        self.assertEqual(tags_from_text("i want hip hop"), ["hip hop"])
        self.assertEqual(tags_from_text("stations in the US"), [])
        self.assertEqual(country_from_text("stations in Germany"), "DE")
        self.assertEqual(country_from_text("stations in the US"), "US")
        self.assertIsNone(country_from_text("stations somewhere"))


class SkillTests(unittest.TestCase):



    def test_find_without_a_filter_asks(self):
        agent = RadioBrowserAgent(client=client())
        self.assertEqual(agent.missing("stations-find", {}), ["filter"])
        result = agent.run({"skill": "stations-find", "params": {}, "missing": ["filter"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("genre", result["message"])




    def test_detail_without_a_uuid_asks(self):
        agent = RadioBrowserAgent(client=client())
        self.assertEqual(agent.missing("station-detail", {}), ["uuid"])
        result = agent.run({"skill": "station-detail", "params": {}, "missing": ["uuid"]})
        self.assertIn("radio-browser uuid", result["message"])



    def test_near_without_a_point_asks(self):
        agent = RadioBrowserAgent(client=client())
        self.assertEqual(agent.missing("stations-near", {}), ["point"])
        result = agent.run({"skill": "stations-near", "params": {}, "missing": ["point"]})
        self.assertIn("lat,lon", result["message"])







#: Shape copied from a live `radio_station_roster` answer for jazz, blues and soul.
ROSTER_PAYLOAD = {
    "tags": ["jazz", "blues", "soul"],
    "country": "US",
    "candidatesFound": 180,
    "duplicatesRemoved": 12,
    "returned": 2,
    "distinctCountries": 1,
    "medianBitrate": 96,
    "perTag": [
        {"tag": "jazz", "candidates": 100, "added": 100, "duplicates": 0},
        {"tag": "blues", "candidates": 60, "added": 48, "duplicates": 12},
        {"tag": "soul", "candidates": 20, "added": 20, "duplicates": 0},
    ],
    "stations": [
        {"name": "Classic Vinyl HD", "country": "US", "countryName": "United States",
         "state": "California", "language": "english", "codec": "MP3", "bitrate": 128,
         "votes": 412, "clickCount": 795, "tags": ["jazz", "oldies"], "matchedTags": ["jazz"],
         "streamUrl": "http://stream.example.invalid/classic.mp3", "homepage": "",
         "lastChecked": "2026-09-27T10:00:00", "uuid": JAZZ["stationuuid"]},
        {"name": "Adroit Blues", "country": "US", "countryName": "United States",
         "state": "Mississippi", "language": "english", "codec": "AAC", "bitrate": 64,
         "votes": 120, "clickCount": 335, "tags": ["blues", "delta blues"],
         "matchedTags": ["blues", "soul"], "streamUrl": "http://example.invalid/adroit",
         "homepage": "", "lastChecked": "2026-09-27T11:00:00", "uuid": BLUES["stationuuid"]},
    ],
}

TOOL_ERROR_TEXT = "`radio_station_roster` failed: the upstream returned HTTP 429"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class StationRosterTests(unittest.TestCase):
    """The premium skill: parsing stays local, the filtering comes from the gateway."""


    def test_the_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(_message("find jazz radio stations"))["skill"], "stations-find")
        self.assertEqual(parse(_message("which radio stations are near 40.7,-74.0?"))["skill"],
                         "stations-near")
        self.assertEqual(parse(_message("what genres of radio station are there?"))["skill"],
                         "genre-list")
        self.assertEqual(parse(_message("station detail for uuid "
                                        "7c1a1a1a-1111-2222-3333-444455556666"))["skill"],
                         "station-detail")

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_STATION_ROSTER, "tags": "jazz,blues",
                                      "country": "US", "limit": 10}}]))
        self.assertEqual(parsed["skill"], SKILL_STATION_ROSTER)
        self.assertEqual(parsed["params"]["tags"], "jazz,blues")
        self.assertEqual(parsed["params"]["limit"], 10)




    def test_roster_without_genres_asks(self):
        agent = RadioBrowserAgent(client=client())
        self.assertEqual(agent.missing("station-roster", {}), ["tags"])
        result = agent.run({"skill": "station-roster", "params": {}, "missing": ["tags"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("Name up to four", result["message"])






if __name__ == "__main__":
    unittest.main()
