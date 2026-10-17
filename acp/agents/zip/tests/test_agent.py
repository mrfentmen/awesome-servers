"""Tests for the zip agent: place lists, records, coverage, routing and turns.

    python3 agents/zip/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(us/11235 = Brooklyn NY at 40.5839/-73.9536, nl/1012 = Amsterdam, jp/100-0001 =
Chiyoda), plus a 404 and a 200-with-no-places response.
"""

from __future__ import annotations

import json
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

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL

from agent import route  # noqa: E402
from data import (COUNTRIES, NO_COVERAGE, ZipData, ZipError, ZipNotFound,  # noqa: E402
                  compass_point, country_code_from_text, normalise, postal_code_from_text)

US_11235 = {
    "country": "United States", "country abbreviation": "US", "post code": "11235",
    "places": [{"place name": "Brooklyn", "longitude": "-73.9536", "latitude": "40.5839",
                "state": "New York", "state abbreviation": "NY"}],
}

#: Coordinates arrive as strings, so this is the real shape and a coordinate
#: reader that forgets to convert would print a string.
NL_1012 = {
    "country": "Netherlands", "country abbreviation": "NL", "post code": "1012",
    "places": [{"place name": "Amsterdam Binnenstad en Oostelijk Havengebied",
                "longitude": "4.9027", "latitude": "52.3666",
                "state": "Noord-Holland", "state abbreviation": "NH"}],
}

#: A place with no state, which a Japanese record has, and no coordinates.
JP_NO_COORDS = {
    "country": "Japan", "country abbreviation": "JP", "post code": "100-0001",
    "places": [{"place name": "Chiyoda", "longitude": "", "latitude": "",
                "state": "Toukyouto", "state abbreviation": ""}],
}

#: A code the directory holds but gives no place for.
EMPTY_PLACES = {"country": "United States", "country abbreviation": "US",
                "post code": "00000", "places": []}


class FakeFeeds:
    def __init__(self, records=None, empty=False, fail=False, no_places=False):
        self.calls: list[str] = []
        self.records = records if records is not None else {
            "us/11235": US_11235, "nl/1012": NL_1012, "jp/100-0001": JP_NO_COORDS}
        self.empty = empty
        self.fail = fail
        self.no_places = no_places

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise ZipError("the directory answered HTTP 503")
        if self.empty:
            return json.dumps({})
        if self.no_places:
            return json.dumps(EMPTY_PLACES)
        for key, payload in self.records.items():
            if url.endswith(f"/{key}"):
                return json.dumps(payload)
        return json.dumps({})


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return ZipData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_postal_code_is_found_with_or_without_its_separator(self):
        self.assertEqual(postal_code_from_text("what places are in ZIP 11235?"), "11235")
        self.assertEqual(postal_code_from_text("where is 100-0001 in Japan?"), "100-0001")
        self.assertEqual(postal_code_from_text("the Dutch 1012"), "1012")
        #: A bare number is too short to be a postal code, and a word is not one.
        self.assertIsNone(postal_code_from_text("what is in 1"))
        self.assertIsNone(postal_code_from_text("what is the weather?"))

    def test_a_country_is_matched_by_name_or_by_caps_code(self):
        self.assertEqual(country_code_from_text("where is 100-0001 in Japan?"), "jp")
        self.assertEqual(country_code_from_text("in the United States, 11235"), "us")
        self.assertEqual(country_code_from_text("for US ZIP 11235"), "us")
        self.assertEqual(country_code_from_text("Netherlands 1012"), "nl")
        #: Every ISO alpha-2 code is also an English word, so a lower-case token is
        #: not a code: "what is in 11235" must not be read as the country `in`.
        self.assertIsNone(country_code_from_text("what places are in ZIP 11235?"))
        self.assertIsNone(country_code_from_text("is 100-0001 a postcode"))
        self.assertIsNone(country_code_from_text(""))

    def test_the_country_table_is_the_directories_own_coverage(self):
        codes = {code for code, _example, _name in COUNTRIES}
        self.assertIn("us", codes)
        self.assertIn("jp", codes)
        self.assertEqual(len(COUNTRIES), len(codes))
        #: The countries the directory answered 404 for are named as missing.
        self.assertIn("gb", NO_COVERAGE)

    def test_normalising(self):
        self.assertEqual(normalise(" 100-0001 "), "100-0001")
        self.assertEqual(normalise("10 00 01"), "100001")

    def test_a_bearing_and_a_compass_point(self):
        #: Brooklyn to Manhattan runs roughly north-north-west, 349 degrees.
        self.assertEqual(compass_point(349), "N")
        self.assertEqual(compass_point(180), "S")
        #: A missing bearing is the honest "not reported", not a guess of north.
        self.assertEqual(compass_point(None), "not reported")


class ReadTests(unittest.TestCase):
    def test_a_postal_code_record(self):
        data, feed = make_data()
        record = data.postal_code("us", "11235")
        self.assertEqual(record["country"], "United States")
        self.assertEqual(record["postal_code"], "11235")
        self.assertEqual(record["count"], 1)
        self.assertEqual(record["places"][0]["name"], "Brooklyn")
        #: Coordinates arrive as strings and have to become numbers.
        self.assertEqual(record["places"][0]["latitude"], 40.5839)
        self.assertEqual(record["places"][0]["longitude"], -73.9536)
        self.assertEqual(record["places"][0]["state"], "New York")
        self.assertTrue(feed.calls[-1].endswith("/us/11235"))

    def test_the_country_is_part_of_the_key(self):
        data, feed = make_data()
        record = data.postal_code("NL", "1012")
        self.assertEqual(record["country"], "Netherlands")
        self.assertTrue(feed.calls[-1].endswith("/nl/1012"))

    def test_a_place_with_no_coordinates_is_kept_and_reported_as_such(self):
        data, _feed = make_data()
        record = data.postal_code("jp", "100-0001")
        place = record["places"][0]
        self.assertEqual(place["name"], "Chiyoda")
        self.assertIsNone(place["latitude"])
        self.assertEqual(place["state"], "Toukyouto")

    def test_a_code_the_directory_does_not_hold(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(ZipNotFound):
            data.postal_code("us", "99999")

    def test_a_code_with_no_places(self):
        data, _feed = make_data(no_places=True)
        with self.assertRaises(ZipNotFound):
            data.postal_code("us", "00000")

    def test_bad_input_is_a_value_error(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.postal_code("us", "  ")
        with self.assertRaises(ValueError):
            #: A postal code without a country is not a lookup key here.
            data.postal_code("", "11235")
        with self.assertRaises(ValueError):
            data.postal_code("usa", "11235")

    def test_a_dead_api(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(ZipError):
            data.postal_code("us", "11235")

    def test_the_country_table_costs_nothing(self):
        data, feed = make_data()
        rows = data.countries()
        self.assertEqual(len(rows), len(COUNTRIES))
        self.assertIn({"country": "United States", "code": "us",
                       "example_postal_code": "11235"}, rows)
        self.assertEqual(feed.calls, [])


class RouteTests(unittest.TestCase):
    def test_a_place_list(self):
        self.assertEqual(route("what places are in ZIP 11235?"),
                         ("zip-places", {"code": "11235", "country": "us"}))
        self.assertEqual(route("which places does 1012 cover?")[1]["country"], "")

    def test_a_plain_record(self):
        self.assertEqual(route("where is 100-0001 in Japan?"),
                         ("zip-where", {"code": "100-0001", "country": "jp"}))
        self.assertEqual(route("what are the coordinates of 11235?")[0], "zip-where")

    def test_the_country_list(self):
        self.assertEqual(route("which countries does this directory cover?"),
                         ("zip-countries", {}))
        self.assertEqual(route("list every country you know")[0], "zip-countries")

    def test_the_distance(self):
        skill, params = route("how far is ZIP 11235 from ZIP 10001?")
        self.assertEqual(skill, "zip-reach")
        self.assertEqual(params["from"], "11235")
        self.assertEqual(params["to"], "10001")
        self.assertEqual(params["country"], "us")

    def test_a_one_code_question_is_never_a_distance(self):
        self.assertEqual(route("what places are in ZIP 11235?")[0], "zip-places")
        self.assertEqual(route("where is 11235?")[0], "zip-where")
        self.assertEqual(route("how far is 11235 from London?")[0], "zip-where")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("tell me a joke")[0], "help")
        self.assertEqual(route("what is the weather?")[0], "help")


class QueueReader:
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


class TurnTests(unittest.TestCase):
    def turn(self, text: str, permission: str = "allow-once", **kw):
        from agent import ZipAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = ZipAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_place_list_answer(self):
        result, client, _ = self.turn("what places are in ZIP 11235?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("11235, United States (1 place(s) in the directory)", result["text"])
        self.assertIn("Brooklyn, New York, NY at 40.5839, -73.9536", result["text"])

    def test_a_record_answer(self):
        result, _, _ = self.turn("where is 100-0001 in Japan?")
        self.assertIn("100-0001 in Japan (directory code JP)", result["text"])
        self.assertIn("covers 1 place(s) in this directory: Chiyoda", result["text"])
        self.assertIn("region: Toukyouto", result["text"])
        #: The coordinates really are missing, and the answer says so.
        self.assertIn("coordinates not published", result["text"])
        self.assertIn("not a boundary", result["text"])

    def test_the_country_list(self):
        result, client, feed = self.turn("which countries does this directory cover?")
        self.assertIn("this directory covers 30 countries", result["text"])
        self.assertIn("United States (us) - example 11235", result["text"])
        self.assertIn("Japan (jp) - example 100-0001", result["text"])
        self.assertIn("Canada", result["text"])
        self.assertEqual(feed.calls, [])

    def test_a_code_with_no_country_says_so(self):
        result, _, _ = self.turn("where is 1012?")
        self.assertIn("tell me the country too", result["text"])
        self.assertIn("1012 is an Amsterdam postcode and 101 is Icelandic", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("what places are in ZIP 11235?", result["text"])
        self.assertIn("what is the ZIP for Aspen", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("what places are in ZIP 11235?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("what places are in ZIP 11235?", fail=True)
        self.assertIn("I could not read the postal code directory", result["text"])

    def test_a_code_the_directory_does_not_hold(self):
        result, _, _ = self.turn("what places are in ZIP 99999?", empty=True)
        self.assertIn("I could not read the postal code directory", result["text"])
        self.assertIn("no record for", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `zip_reach` answers for 11235 to 10001: 18.65 km, 11.59 miles, bearing
#: 349 degrees, which is almost due north across the river.
REACH_DATA = {
    "from": "11235",
    "to": "10001",
    "country": "United States",
    "same_country": True,
    "from_place": "Brooklyn",
    "to_place": "New York City",
    "from_point": {"latitude": 40.5839, "longitude": -73.9536, "place": "Brooklyn"},
    "to_point": {"latitude": 40.7484, "longitude": -73.9967, "place": "New York City"},
    "distance_km": 18.65,
    "distance_miles": 11.59,
    "bearing_deg": 349.0,
    "bearing": "349 degrees",
    "compass": "N",
    "walk_kmh": 5.0,
    "drive_kmh": 80.0,
    "walk_hours": 3.73,
    "drive_hours": 0.23,
    "walk_note": "a straight-line walk at 5 km/h; a real route is longer and climbs",
    "drive_note": "a straight-line drive at 80 km/h; real roads, traffic and ferries are not in this number",
    "sides": [
        {"code": "11235", "country": "United States", "place": "Brooklyn", "state": "New York",
         "latitude": 40.5839, "longitude": -73.9536},
        {"code": "10001", "country": "United States", "place": "New York City",
         "state": "New York", "latitude": 40.7484, "longitude": -73.9967},
    ],
    "unit": "km and miles, straight line between the directory points",
    "accuracy": "a great-circle distance between the two codes' published points",
    "source": "Zippopotam postal code directory (api.zippopotam.us)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
