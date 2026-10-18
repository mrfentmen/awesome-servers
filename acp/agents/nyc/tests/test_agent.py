"""Tests for the nyc pack: restaurants, film permits, street works - offline.

    python3 agents/nyc/tests/test_agent.py

No network: the Socrata transport is injected with payloads shaped exactly like the live
ones checked 2026-09-21 in the a2a repo's verified catalog.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

import agent  # noqa: E402
from datasets import NycData  # noqa: E402

RESTAURANTS = [
    {"dba": "Brooklyn Pizza Crew", "inspection_date": "2026-10-01T00:00:00.000", "grade": "A",
     "score": "12", "critical_flag": "N", "violation_description": "", "street": "410 Court St"},
    {"dba": "Court Street Diner", "inspection_date": "2026-09-28T00:00:00.000", "grade": "B",
     "score": "24", "critical_flag": "Y", "violation_description": "Food not protected from potential source of contamination",
     "street": "401 Court St"},
    {"dba": "Gowanus Tacos", "inspection_date": "2026-09-20T00:00:00.000", "grade": "A",
     "score": "9", "critical_flag": "N", "violation_description": "", "street": "112 3rd Ave"},
]
FILM = [
    {"eventid": "1", "eventtype": "Shoot/Production", "category": "Feature", "borough": "Manhattan",
     "subcategoryname": "PF - Film Permit", "startdatetime": "2026-10-20T07:00:00-04:00",
     "enddatetime": "2026-10-22T19:00:00-04:00", "eventagency": "Mayoral-MASTRE", "parkingheld": "2"},
]
STREETS = [
    {"permitnumber": "SP-1", "permittypedesc": "Utility", "permitissuedate": "2026-10-10T00:00:00.000",
     "boroughname": "BROOKLYN", "onstreetname": "Fourth Ave", "fromstreetname": "Bergen St",
     "issuedworkstartdate": "2026-10-18T07:00:00-04:00"},
]


class FakeTransport(NycData):
    """The real readers with a canned transport: every call is one canned answer."""

    def __init__(self, payload=None, fail=False):
        super().__init__(user_agent="test/1.0")
        self.payload = payload
        self.fail = fail
        self.calls: list[tuple[str, dict]] = []
        if fail:
            self._fetch = self._fail_fetch
        elif payload is not None:
            self._fetch = self._canned

    def _canned(self, url, params):
        self.calls.append((url, params))
        return self.payload

    def _fail_fetch(self, url, params):
        from datasets import NycError
        raise NycError("request failed: [Errno 61] Connection refused")


class RouteTests(unittest.TestCase):
    def test_restaurants_with_zip(self):
        skill, params = agent.route("restaurant grades for 11231")
        self.assertEqual((skill, params), ("restaurants", {"zipcode": "11231"}))

    def test_restaurants_without_zip_routed_then_asks(self):
        skill, params = agent.route("restaurant grades please")
        self.assertEqual((skill, params), ("restaurants", {"zipcode": None}))

    def test_film_with_borough_and_window(self):
        skill, params = agent.route("what is filming in Brooklyn this week?")
        self.assertEqual((skill, params), ("film", {"borough": "Brooklyn", "days": 7}))

    def test_streets_with_borough_and_days(self):
        skill, params = agent.route("street work in Manhattan next 3 days")
        self.assertEqual((skill, params), ("streets", {"borough": "Manhattan", "days": 3}))

    def test_mixed_two_skills_is_help(self):
        self.assertEqual(agent.route("restaurants and what is filming")[0], "help")

    def test_help_and_empty(self):
        self.assertEqual(agent.route("what can you do")[0], "help")
        self.assertEqual(agent.route("  ")[0], "help")


class RestaurantsTests(unittest.TestCase):
    def test_tally_and_critical_first(self):
        data = FakeTransport(RESTAURANTS)
        reading = data.restaurants("11231")
        self.assertEqual(reading["tally"], {"A": 2, "B": 1})
        self.assertEqual(reading["read"], 3)
        self.assertEqual(reading["critical"][0]["dba"], "Court Street Diner")
        wording = agent.render_restaurants(reading)
        self.assertIn("A - no or few violations", wording)
        self.assertIn("Court Street Diner", wording)

    def test_empty_zip_is_honest(self):
        data = FakeTransport([])
        reading = data.restaurants("10001")
        self.assertEqual(reading["read"], 0)
        self.assertIn("no recently inspected", agent.render_restaurants(reading))

    def test_bad_zip_refused(self):
        data = FakeTransport(RESTAURANTS)
        with self.assertRaises(ValueError):
            data.restaurants("12abc")

    def test_feed_failure_raises(self):
        data = FakeTransport(fail=True)
        with self.assertRaises(Exception) as caught:
            data.restaurants("11231")
        self.assertIn("request failed", str(caught.exception))


class FilmAndStreetsTests(unittest.TestCase):
    def test_film_window_counts(self):
        data = FakeTransport(FILM)
        reading = data.film(days=7)
        self.assertEqual(reading["in_window"], 1)
        wording = agent.render_film(reading)
        self.assertIn("1 in window", wording)
        self.assertIn("Feature", wording)

    def test_film_far_future_excluded(self):
        rows = [dict(FILM[0], startdatetime="2126-01-01T07:00:00-05:00")]
        data = FakeTransport(rows)
        self.assertEqual(data.film(days=7)["in_window"], 0)

    def test_streets_lists_types_and_rows(self):
        data = FakeTransport(STREETS)
        reading = data.streetworks("Brooklyn", days=3)
        self.assertEqual(reading["read"], 1)
        self.assertIn("Utility", reading["permit_types"])
        self.assertIn("Fourth Ave", agent.render_streets(reading))

    def test_streets_borrowed_window_sql_carries_borough(self):
        data = FakeTransport(STREETS)
        data.streetworks("Brooklyn", days=2)
        payload = data.calls[-1][1]
        self.assertIn("BROOKLYN", payload["$where"])


if __name__ == "__main__":
    unittest.main()
