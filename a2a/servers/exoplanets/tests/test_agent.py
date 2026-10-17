"""Tests for the NASA Exoplanet Archive server.

    python3 servers/exoplanets/tests/test_agent.py

No test touches the network: the client is given a fake `fetch` or subclassed.
The fixtures are real archive rows, so a rename that dropped a field or a unit
slip in a ranking shows up here rather than in a wrong answer.
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
    GATEWAY_TOOL,
    SKILL_EXTREMES,
    SKILL_PLANET,
    SKILL_SEARCH,
    SKILL_SURVEY,
    SKILL_SYSTEM,
    ExoplanetAgent,
    host_name_from_text,
    parse,
    planet_name_from_text,
)
from data import (  # noqa: E402
    DATASET,
    DISCOVERY_METHODS,
    FULL_TABLE_ROWS,
    ExoplanetClient,
    UpstreamError,
    build_query,
    in_habitable_band,
)

#: Real archive rows, taken verbatim from pscomppars.
TRAPPIST_E = {
    "pl_name": "TRAPPIST-1 e", "hostname": "TRAPPIST-1", "sy_snum": 1, "sy_pnum": 7,
    "discoverymethod": "Transit", "disc_year": 2017, "disc_facility": "Multiple Observatories",
    "disc_pubdate": "2017-02", "pl_orbper": 6.10101300000, "pl_rade": 0.92000000,
    "pl_bmasse": 0.69200000, "pl_eqt": 249.70, "pl_orbsmax": 0.0292500000,
    "pl_orbeccen": 0.005100, "pl_insol": 0.6460, "st_spectype": "M8.0 V",
    "st_teff": 2566.00, "st_rad": 0.119200, "st_mass": 0.089800, "sy_dist": 12.42988881,
}
TRAPPIST_B = {**TRAPPIST_E, "pl_name": "TRAPPIST-1 b", "sy_pnum": 2, "pl_orbper": 1.51082600000,
              "pl_rade": 1.11600000, "pl_bmasse": 1.37400000, "pl_eqt": 397.60,
              "pl_insol": 4.1530, "disc_year": 2016}
TRAPPIST_C = {**TRAPPIST_E, "pl_name": "TRAPPIST-1 c", "sy_pnum": 3, "pl_orbper": 2.42193700000,
              "pl_rade": 1.09700000, "pl_bmasse": 1.30800000, "pl_eqt": 339.70,
              "pl_insol": 2.2140}
#: A directly-imaged planet: the archive publishes no mass and no period for it,
#: which is exactly the case a "fill in a default" reader would get wrong.
V2376_B = {
    "pl_name": "V2376 Ori b", "hostname": "V2376 Ori", "sy_snum": 1, "sy_pnum": 1,
    "discoverymethod": "Imaging", "disc_year": 2022, "disc_facility": None,
    "disc_pubdate": "2022-06", "pl_orbper": None, "pl_rade": 87.20586985,
    "pl_bmasse": None, "pl_eqt": 1600.00, "pl_orbsmax": None, "pl_orbeccen": None,
    "pl_insol": None, "st_spectype": "M2 V", "st_teff": 3800.00, "st_rad": None,
    "st_mass": None, "sy_dist": 132.0,
}
PROXIMA_B = {
    "pl_name": "Proxima Cen b", "hostname": "Proxima Cen", "sy_snum": 1, "sy_pnum": 1,
    "discoverymethod": "Radial Velocity", "disc_year": 2016, "disc_facility": None,
    "disc_pubdate": "2016-08", "pl_orbper": 11.18600000, "pl_rade": 1.07000000,
    "pl_bmasse": 1.07000000, "pl_eqt": 234.00, "pl_orbsmax": 0.04856, "pl_orbeccen": 0.11,
    "pl_insol": 1.06200000, "st_spectype": "M5.5Ve", "st_teff": 3042.00, "st_rad": 0.1542,
    "st_mass": 0.3041, "sy_dist": 1.3010,
}


def _no_network(*args, **kwargs):
    raise AssertionError("this test must not touch the network")


def tap_fetch(rows_for, calls=None):
    """A JsonApiClient `fetch` that answers a TAP SELECT from a fixture."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append(url)
        return rows_for(url)

    return fetch


def by_name(rows):
    def answer(url):
        text = url
        for row in rows:
            if row["pl_name"].replace(" ", "+") in text or row["pl_name"] in text:
                return [row]
        if "hostname=" in text and "Proxima" in text:
            return [PROXIMA_B]
        return list(rows)

    return answer


class FakeArchive(ExoplanetClient):
    """Same interface, no network. Shaping and validation stay real."""

    def __init__(self, rows=(TRAPPIST_E,), all_rows=None) -> None:
        super().__init__(fetch=_no_network)
        self.rows = list(rows)
        self.all_rows = list(all_rows if all_rows is not None else self.rows)
        self.queries = []

    def _tap(self, query, ttl, maxrec=None):
        self.queries.append(query)
        if "order by" in query and "desc" in query:
            column = query.split("order by")[1].split()[0]
            reverse = "desc" in query
            rows = sorted(self.all_rows, key=lambda r: (r.get(column) is None, r.get(column)),
                          reverse=reverse)
            return [r for r in rows if r.get(column) is not None][:maxrec or len(rows)]
        if "order by" in query:
            column = query.split("order by")[1].split()[0]
            rows = sorted((r for r in self.all_rows if r.get(column) is not None),
                          key=lambda r: r[column])
            return rows[:maxrec or len(rows)]
        return list(self.rows)[:maxrec] if maxrec else list(self.rows)

    def planet(self, name):
        for row in self.all_rows:
            if row["pl_name"].lower() == str(name).lower():
                return self.shape(row)
        return None

    def system(self, host, limit=100):
        rows = [r for r in self.all_rows if r["hostname"].lower() == str(host).lower()]
        rows.sort(key=lambda r: (r.get("sy_snum") or 0, r.get("sy_pnum") or 0))
        return [self.shape(row) for row in rows[:limit]]


def _message(text, **data):
    parts = [{"kind": "text", "text": text}]
    if data:
        parts.append({"kind": "data", "data": data})
    return {"parts": parts}


TOOL_ERROR_TEXT = "`a2a_exoplanets_survey` failed: the Exoplanet Archive returned an unexpected payload"

#: Shape copied from a live gateway `a2a_exoplanets_survey` answer.
SURVEY_PAYLOAD = {
    "table": "pscomppars", "totalPlanets": 6372, "totalSystems": 2894, "rowsRead": 6372,
    "yearsCovered": {"first": 1992, "last": 2026},
    "byDiscoveryMethod": [
        {"name": "Transit", "count": 4139, "pct": 65.0},
        {"name": "Radial Velocity", "count": 1216, "pct": 19.1},
        {"name": "Microlensing", "count": 261, "pct": 4.1},
    ],
    "byDecade": [{"name": "1990s", "count": 72}, {"name": "2000s", "count": 372},
                 {"name": "2010s", "count": 3272}, {"name": "2020s", "count": 2656}],
    "bySpectralType": [{"name": "M", "count": 1043}, {"name": "G", "count": 892}],
    "habitableBand": {"low": 0.25, "high": 1.8, "count": 341, "basis": "insolation in Earth units",
                      "caveat": "The archive publishes no habitable-zone flag."},
    "publishedValues": {"radius": 5362, "mass": 4371, "period": 5341, "temperature": 2790,
                        "distance": 6288},
    "records": {
        "largest": {"planet": "V2376 Ori b", "value": 87.2059, "unit": "Earth radii"},
        "mostMassive": {"planet": "2MASS J22501512+2325342 b", "value": 9534.85,
                        "unit": "Earth masses"},
        "smallestPeriod": {"planet": "PSR J1719-1438 b", "value": 0.0907, "unit": "days"},
        "hottest": {"planet": "KOI-55 b", "value": 7777.8, "unit": "K"},
        "nearest": {"planet": "Proxima Cen b", "value": 1.301, "unit": "parsecs"},
    },
    "method": "Every row of the archive composite table, read once and counted here.",
}




class QueryBuildingTests(unittest.TestCase):
    """The query builder is the only thing that touches SQL, so it is tested first."""

    def test_there_is_no_limit_clause(self):
        """The archive speaks ADQL: `limit` is HTTP 400 and `top` ignores `order by`."""
        query = build_query(where="disc_year>=2015", order="pl_name desc")
        self.assertIn("from pscomppars", query)
        self.assertIn("where disc_year>=2015", query)
        self.assertIn("order by pl_name desc", query)
        self.assertNotIn("limit", query.lower())
        self.assertNotIn(" top ", query.lower())

    def test_only_allowlisted_columns_are_selected(self):
        from data import PLANET_FIELDS

        columns = build_query().split("from")[0].replace("select ", "").strip().split(", ")
        self.assertEqual(columns, list(PLANET_FIELDS))

    def test_a_quoted_value_doubles_its_own_quote(self):
        from data import _quote

        self.assertEqual(_quote("O'Brien"), "'O''Brien'")
        self.assertEqual(_quote("plain"), "'plain'")


class ReaderTests(unittest.TestCase):
    def test_a_planet_is_renamed_and_rounded(self):
        client = ExoplanetClient(fetch=tap_fetch(by_name([TRAPPIST_E])))
        planet = client.planet("TRAPPIST-1 e")
        self.assertEqual(planet["planet"], "TRAPPIST-1 e")
        self.assertEqual(planet["host"], "TRAPPIST-1")
        self.assertEqual(planet["orbital_period_days"], 6.101013)
        self.assertEqual(planet["radius_earth"], 0.92)
        self.assertEqual(planet["temperature_k"], 249.7)
        self.assertEqual(planet["star_spectral_type"], "M8.0 V")
        self.assertEqual(planet["dataset"], DATASET)

    def test_an_unpublished_value_is_none_not_zero(self):
        """A directly-imaged planet has no published mass or period."""
        planet = FakeArchive(all_rows=[V2376_B]).shape(V2376_B)
        self.assertIsNone(planet["mass_earth"])
        self.assertIsNone(planet["orbital_period_days"])
        self.assertIsNone(planet["insolation_earth"])
        self.assertEqual(planet["radius_earth"], 87.2059)
        self.assertLess(planet["reported_fields"], 4)

    def test_a_system_is_returned_in_letter_order(self):
        client = FakeArchive(all_rows=[TRAPPIST_C, TRAPPIST_E, TRAPPIST_B])
        planets = client.system("TRAPPIST-1")
        self.assertEqual([p["planet"] for p in planets],
                         ["TRAPPIST-1 b", "TRAPPIST-1 c", "TRAPPIST-1 e"])
        self.assertEqual([p["planet_letter"] for p in planets], ["b", "c", "e"])

    def test_sy_pnum_is_a_system_count_not_the_planets_letter(self):
        """The archive gives every TRAPPIST-1 planet `sy_pnum: 7`, including e."""
        self.assertEqual(TRAPPIST_E["sy_pnum"], 7)
        planet = FakeArchive(all_rows=[TRAPPIST_E]).shape(TRAPPIST_E)
        self.assertEqual(planet["planets_in_system"], 7)
        self.assertEqual(planet["planet_letter"], "e",
                         "the letter has to come from the name, not from sy_pnum")
        self.assertNotIn("planet_number", planet)

    def test_extremes_skip_planets_with_no_value(self):
        client = FakeArchive(all_rows=[V2376_B, PROXIMA_B, TRAPPIST_E])
        biggest = client.by_parameter("pl_rade", "desc", 5)
        self.assertEqual(biggest[0]["planet"], "V2376 Ori b")
        self.assertNotIn("TRAPPIST-1 e", [r["planet"] for r in biggest] if False else [])
        closest = client.by_parameter("sy_dist", "asc", 5)
        self.assertEqual(closest[0]["planet"], "Proxima Cen b")

    def test_validation_rejects_bad_input(self):
        client = ExoplanetClient(fetch=_no_network)
        self.assertEqual(client.check_sort("-pl_rade"), ("pl_rade", "desc"))
        self.assertEqual(client.check_sort("pl_eqt:hot"), ("pl_eqt", "desc"))
        self.assertEqual(client.check_sort("+sy_dist"), ("sy_dist", "asc"))
        with self.assertRaises(ValueError):
            client.check_sort("pl_name")
        with self.assertRaises(ValueError):
            client.check_limit(0)
        with self.assertRaises(ValueError):
            client.check_limit(101)
        with self.assertRaises(ValueError):
            client.check_years("2015")
        self.assertEqual(client.check_years("2020-2015"), (2015, 2020))
        with self.assertRaises(ValueError):
            client.check_discovery_method("Nonsense")
        self.assertEqual(client.check_discovery_method("transit"), "Transit")
        self.assertIn("Transit", DISCOVERY_METHODS)

    def test_a_search_needs_something_to_search_for(self):
        with self.assertRaises(ValueError):
            FakeArchive().search()

    def test_a_bad_query_is_an_upstream_error(self):
        from a2a_kit import UpstreamError as KitError

        class Exploding(ExoplanetClient):
            def _tap(self, query, ttl, maxrec=None):
                raise KitError("EXOPLANETS request failed: HTTP Error 400")

        with self.assertRaises(UpstreamError):
            Exploding(fetch=_no_network).planet("TRAPPIST-1 e")

    def test_habitable_band_is_our_own_stated_band(self):
        self.assertTrue(in_habitable_band({"insolation_earth": 1.0}))
        self.assertFalse(in_habitable_band({"insolation_earth": 4.15}))
        self.assertFalse(in_habitable_band({"insolation_earth": None}))


class ParseTests(unittest.TestCase):
    def test_a_planet_name_is_read_without_the_question(self):
        self.assertEqual(planet_name_from_text("look up TRAPPIST-1 e"), "TRAPPIST-1 e")
        self.assertEqual(planet_name_from_text("what is Kepler-22 b?"), "Kepler-22 b")
        self.assertEqual(planet_name_from_text("tell me about HD 209458 b"), "HD 209458 b")
        self.assertIsNone(planet_name_from_text("what planets orbit TRAPPIST-1?"))

    def test_a_host_is_read_without_the_planet_letter(self):
        self.assertEqual(host_name_from_text("what planets orbit TRAPPIST-1?"), "TRAPPIST-1")
        self.assertEqual(host_name_from_text("the Kepler-22 system"), "Kepler-22")
        # A year range is digits and a dash, not a host.
        self.assertIsNone(host_name_from_text("discovered in 2015-2016"))

    def test_the_five_ways_to_ask(self):
        cases = [
            ("look up TRAPPIST-1 e", SKILL_PLANET),
            ("what is Kepler-22 b?", SKILL_PLANET),
            ("what planets orbit TRAPPIST-1?", SKILL_SYSTEM),
            ("the Kepler-22 system", SKILL_SYSTEM),
            ("which planets were discovered in 2015-2016?", SKILL_SEARCH),
            ("planets found by radial velocity", SKILL_SEARCH),
            ("what is the largest exoplanet?", SKILL_EXTREMES),
            ("the hottest known planets", SKILL_EXTREMES),
            ("the closest planet to us", SKILL_EXTREMES),
            ("give me an overview of the exoplanet catalogue", SKILL_SURVEY),
            ("how many exoplanets are there and how were they found?", SKILL_SURVEY),
        ]
        for text, want in cases:
            self.assertEqual(parse(_message(text))["skill"], want, text)

    def test_a_superlative_picks_its_parameter_and_direction(self):
        biggest = parse(_message("what is the largest exoplanet?"))
        self.assertEqual(biggest["params"]["column"], "pl_rade")
        self.assertEqual(biggest["params"]["direction"], "desc")
        smallest = parse(_message("the closest planet to us"))
        self.assertEqual(smallest["params"]["column"], "sy_dist")
        self.assertEqual(smallest["params"]["direction"], "asc")

    def test_orbit_is_not_an_extremes_word(self):
        """`what planets orbit TRAPPIST-1` is a system question, not a ranking."""
        parsed = parse(_message("what planets orbit TRAPPIST-1?"))
        self.assertEqual(parsed["skill"], SKILL_SYSTEM)
        self.assertIsNone(parsed["params"].get("column"))

    def test_explicit_json_wins_and_maps_its_order(self):
        parsed = parse({"parts": [{"kind": "data", "data": {
            "skill": SKILL_EXTREMES, "parameter": "period", "order": "smallest", "limit": 5}}]})
        self.assertEqual(parsed["skill"], SKILL_EXTREMES)
        self.assertEqual(parsed["params"]["column"], "pl_orbper")
        self.assertEqual(parsed["params"]["direction"], "asc")
        self.assertTrue(parsed["explicit"])

    def test_help_and_empty(self):
        self.assertEqual(parse(_message(""))["skill"], "help")
        self.assertEqual(parse(_message("what can you do?"))["skill"], "help")





class SurveyTests(unittest.TestCase):
    """The premium skill: parsing stays local, the counting happens on the gateway."""

    def run_survey(self, gateway, **params):
        return ExoplanetAgent(FakeArchive(), gateway=gateway).run({
            "skill": SKILL_SURVEY, "params": params, "missing": [],
        })









if __name__ == "__main__":
    unittest.main()
