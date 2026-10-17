"""Tests for the postal code server.

    python3 servers/place/tests/test_agent.py
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
    SKILL_CATCHMENT_AREA,
    PlaceAgent,
    country_from_text,
    parse,
)
from data import (  # noqa: E402
    UK_DATASET,
    WORLD_DATASET,
    PlaceClient,
    haversine_km,
    normalise_uk_postcode,
)

BUCKINGHAM_PALACE = {
    "postcode": "SW1A 1AA", "quality": 1, "eastings": 529090, "northings": 179645,
    "country": "England", "nhs_ha": "London", "longitude": -0.141563, "latitude": 51.50101,
    "european_electoral_region": "London", "primary_care_trust": "Westminster", "region": "London",
    "lsoa": "Westminster 018C", "msoa": "Westminster 018", "incode": "1AA", "outcode": "SW1A",
    "parliamentary_constituency": "Cities of London and Westminster",
    "admin_district": "Westminster", "admin_ward": "St James's",
    "parish": "Westminster, unparished area",
    "admin_county": None, "date_of_introduction": "198001", "date_of_termination": None,
}
EDINBURGH = {
    "postcode": "EH12 0AA", "quality": 1, "country": "Scotland", "region": "Scotland",
    "longitude": -3.188267, "latitude": 55.941696, "outcode": "EH12", "incode": "0AA",
    "admin_district": "City of Edinburgh", "admin_ward": "Craigmillar",
    "parish": "Edinburgh", "lsoa": None, "msoa": None,
    "parliamentary_constituency": "Edinburgh East",
    "european_electoral_region": "Scotland", "nhs_ha": "Lothian", "primary_care_trust": None,
    "eastings": None, "northings": None, "date_of_introduction": None, "admin_county": None,
}

UK_SEARCH_ROWS = [BUCKINGHAM_PALACE, {**EDINBURGH, "postcode": "EH12 5AB",
                                       "admin_ward": "Ferniehill", "admin_district": "Edinburgh"}]

#: The world feed's own field names, spaces and all.
WORLD_PAYLOAD = {
    "country": "United States", "country abbreviation": "US", "post code": "11235",
    "places": [{"place name": "Brooklyn", "longitude": "-73.9536", "latitude": "40.5839",
                "state": "New York", "state abbreviation": "NY"}],
}
JAPAN_PAYLOAD = {
    "country": "Japan", "country abbreviation": "JP", "post code": "100-0001",
    "places": [{"place name": "Chiyoda", "longitude": "139.7559", "latitude": "35.6845",
                "state": "Toukyouto", "state abbreviation": ""}],
}


def _no_network(*args, **kwargs):
    raise AssertionError("this client must not touch the network")


def not_found():
    """The 404 both feeds answer for an unknown code, phrased as urllib phrases it."""
    from a2a_kit import UpstreamError

    return UpstreamError("PLACE request failed: HTTP Error 404: Not Found")


def local_fetch(uk_one=None, uk_search=None, uk_nearest=None, world=None, calls=None):
    """A JsonApiClient `fetch` that serves both feeds, so data.py runs for real.

    The query arrives as `params`, not in the URL, so the search and the reverse
    lookup are told apart by the parameters they were called with.
    """

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if "zippopotam" in url:
            if world is None:
                raise not_found()
            return world
        if params.get("q") is not None:
            return {"status": 200, "result": uk_search}
        if params.get("lon") is not None:
            return {"status": 200, "result": uk_nearest}
        if uk_one is None:
            raise not_found()
        return {"status": 200, "result": uk_one}

    return fetch


class FakePlace(PlaceClient):
    """Same interface as PlaceClient, served from memory. The real reads run."""

    def __init__(self, **feeds) -> None:
        self.reads: list[str] = []
        super().__init__(fetch=local_fetch(calls=self.reads, **feeds))


class ValidationTests(unittest.TestCase):
    def test_normalise_uk_postcode(self):
        self.assertEqual(normalise_uk_postcode("sw1a1aa"), "SW1A 1AA")
        self.assertEqual(normalise_uk_postcode("  m1   1ae "), "M1 1AE")
        for bad in ("SW1A", "12345", "", "SW1A 1A"):
            with self.assertRaises(ValueError):
                normalise_uk_postcode(bad)

    def test_looks_like_uk_postcode(self):
        self.assertTrue(PlaceClient.looks_like_uk_postcode("SW1A1AA"))
        self.assertFalse(PlaceClient.looks_like_uk_postcode("11235"))
        self.assertFalse(PlaceClient.looks_like_uk_postcode("EH12"))

    def test_check_country_and_code(self):
        self.assertEqual(PlaceClient.check_country(" us "), "us")
        with self.assertRaises(ValueError):
            PlaceClient.check_country("USA")
        self.assertEqual(PlaceClient.check_world_code(" 100-0001 "), "100-0001")
        with self.assertRaises(ValueError):
            PlaceClient.check_world_code("<script>")

    def test_check_point_radius_limit(self):
        self.assertEqual(PlaceClient.check_point("51.5010, -0.1416"), (51.501, -0.1416))
        with self.assertRaises(ValueError):
            PlaceClient.check_point("51.5")
        self.assertEqual(PlaceClient.check_radius_km("2"), 2.0)
        for bad in ("0", "30", "near"):
            with self.assertRaises(ValueError):
                PlaceClient.check_radius_km(bad)
        self.assertEqual(PlaceClient.check_limit(5), 5)
        with self.assertRaises(ValueError):
            PlaceClient.check_limit(0)

    def test_haversine(self):
        self.assertAlmostEqual(haversine_km(51.5, -0.14, 51.5, -0.14), 0.0, places=6)
        self.assertGreater(haversine_km(51.50101, -0.141563, 55.941696, -3.188267), 500)


class ReaderTests(unittest.TestCase):
    def test_uk_postcode_picks_the_ons_fields(self):
        client = FakePlace(uk_one=BUCKINGHAM_PALACE)
        row = client.uk_postcode("sw1a1aa")
        self.assertEqual(row["postcode"], "SW1A 1AA")
        self.assertEqual(row["admin_ward"], "St James's")
        self.assertEqual(row["parliamentary_constituency"], "Cities of London and Westminster")
        self.assertEqual(row["dataset"], UK_DATASET)
        self.assertIsNone(row["admin_county"], "a field the feed leaves null stays null")

    def test_uk_postcode_space_is_encoded(self):
        calls = []
        client = PlaceClient(fetch=local_fetch(uk_one=BUCKINGHAM_PALACE, calls=calls))
        client.uk_postcode("SW1A 1AA")
        self.assertEqual(calls[0][0], f"{client.base_url}/postcodes/SW1A%201AA")

    def test_uk_postcode_not_found_is_none_not_a_failure(self):
        client = FakePlace(uk_one=None)
        self.assertIsNone(client.uk_postcode("ZZ99 9ZZ"))

    def test_uk_search(self):
        calls = []
        client = PlaceClient(fetch=local_fetch(uk_search=UK_SEARCH_ROWS, calls=calls))
        rows = client.uk_search("sw1a", limit=2)
        self.assertEqual([row["postcode"] for row in rows], ["SW1A 1AA", "EH12 5AB"])
        self.assertEqual(calls[0][1]["q"], "sw1a")
        self.assertEqual(calls[0][1]["limit"], 2)

    def test_uk_search_with_no_match_is_empty(self):
        # postcodes.io answers a search that matched nothing with 200 and a null result.
        client = FakePlace(uk_search=None)
        self.assertEqual(client.uk_search("QQ99"), [])

    def test_uk_search_rejects_junk(self):
        client = FakePlace(uk_search=[])
        with self.assertRaises(ValueError):
            client.uk_search("not a postcode at all")

    def test_uk_nearest_sorts_and_applies_the_radius(self):
        rows = [
            {**BUCKINGHAM_PALACE, "postcode": "SW1A 1AA", "latitude": 51.50101, "longitude": -0.141563},
            {**EDINBURGH, "postcode": "EH12 0AA", "latitude": 55.941696, "longitude": -3.188267},
            {**BUCKINGHAM_PALACE, "postcode": "SW1A 2AA", "latitude": 51.50500, "longitude": -0.141563},
        ]
        calls = []
        client = PlaceClient(fetch=local_fetch(uk_nearest=rows, calls=calls))
        found = client.uk_nearest("51.5010,-0.1416", radius_km=2, limit=10)
        self.assertEqual([row["postcode"] for row in found], ["SW1A 1AA", "SW1A 2AA"])
        self.assertLess(found[0]["distance_km"], 0.01)
        self.assertGreater(found[1]["distance_km"], found[0]["distance_km"])
        self.assertEqual(calls[0][1]["radius"], 2000)
        self.assertEqual(client.uk_nearest("51.5010,-0.1416", radius_km=0.1, limit=10)[0]["postcode"],
                         "SW1A 1AA")

    def test_world_postcode_rebuilds_spaced_field_names(self):
        client = FakePlace(world=WORLD_PAYLOAD)
        places = client.world_postcode("us", "11235")
        self.assertEqual(len(places), 1)
        self.assertEqual(places[0]["place"], "Brooklyn")
        self.assertEqual(places[0]["state_code"], "NY")
        self.assertEqual(places[0]["latitude"], 40.5839)
        self.assertEqual(places[0]["dataset"], WORLD_DATASET)

    def test_world_postcode_encodes_the_path(self):
        calls = []
        client = PlaceClient(fetch=local_fetch(world=JAPAN_PAYLOAD, calls=calls))
        places = client.world_postcode("JP", "100-0001")
        self.assertTrue(calls[0][0].endswith("/jp/100-0001"), calls[0][0])
        self.assertEqual(places[0]["place"], "Chiyoda")

    def test_world_postcode_not_found_is_none(self):
        client = FakePlace(world=None)
        self.assertIsNone(client.world_postcode("us", "ZZZZZ"))

    def test_world_postcode_refuses_the_uk_rather_than_claiming_it_is_missing(self):
        client = FakePlace(world=WORLD_PAYLOAD)
        with self.assertRaises(ValueError) as caught:
            client.world_postcode("gb", "SW1A1AA")
        self.assertIn("does not cover the United Kingdom", str(caught.exception))


class ParseTests(unittest.TestCase):
    def message(self, text):
        return {"parts": [{"kind": "text", "text": text}]}

    def test_uk_postcode(self):
        for text, code in (("what is in postcode SW1A 1AA?", "SW1A 1AA"),
                           ("where is M1 1AE?", "M1 1AE"),
                           ("SW1A1AA", "SW1A 1AA")):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], "uk-postcode", text)
            self.assertEqual(request["params"]["postcode"], code, text)

    def test_outward_code(self):
        for text in ("what postcodes are in SW1A?", "list the EH12 postcodes", "what is in M1?"):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], "outward-code", text)
            self.assertTrue(request["params"]["outward_code"], text)

    def test_nearest_postcode(self):
        for text, point in (("which postcodes are near 51.5010,-0.1416?", "51.5010,-0.1416"),
                            ("what is the nearest postcode to 53.4808,-2.2426?", "53.4808,-2.2426"),
                            ("which postcodes are around 51.5010,-0.1416?", "51.5010,-0.1416")):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], "nearest-postcode", text)
            self.assertEqual(request["params"]["point"], point, text)

    def test_zip_code_with_and_without_a_country(self):
        request = parse(self.message("what is ZIP code 11235?"))
        self.assertEqual(request["skill"], "zip-code")
        self.assertEqual(request["params"]["postcode"], "11235")
        self.assertEqual(request["params"]["country"], "us", '"zip" is United States terminology')
        request = parse(self.message("where is 100-0001 in Japan?"))
        self.assertEqual(request["params"]["postcode"], "100-0001")
        self.assertEqual(request["params"]["country"], "jp")
        request = parse(self.message("postcode 10115, Germany"))
        self.assertEqual(request["params"]["country"], "de")


    def test_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(self.message("what is in postcode SW1A 1AA?"))["skill"], "uk-postcode")
        self.assertEqual(parse(self.message("what postcodes are in SW1A?"))["skill"], "outward-code")
        self.assertEqual(parse(self.message("which postcodes are near 51.5010,-0.1416?"))["skill"],
                         "nearest-postcode")
        self.assertEqual(parse(self.message("what is ZIP code 11235?"))["skill"], "zip-code")

    def test_explicit_json_wins(self):
        message = {"parts": [{"kind": "text", "text": "anything"},
                             {"kind": "data", "data": {"skill": SKILL_CATCHMENT_AREA,
                                                       "point": "51.5010,-0.1416",
                                                       "radius_km": 5}}]}
        request = parse(message)
        self.assertEqual(request["skill"], SKILL_CATCHMENT_AREA)
        self.assertEqual(request["params"]["radius_km"], 5)
        self.assertTrue(request["explicit"])

    def test_help_and_country_extraction(self):
        self.assertEqual(parse(self.message(""))["skill"], "help")
        self.assertEqual(parse(self.message("what can you do?"))["skill"], "help")
        self.assertEqual(country_from_text("where is 10115 in Germany?"), "de")
        self.assertEqual(country_from_text("postcode 10115, Germany"), "de")
        self.assertIsNone(country_from_text("what is in SW1A 1AA?"))


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = PlaceAgent(client=client or FakePlace())
        return agent.run({"skill": skill, "params": params, "missing": agent.missing(skill, params)})

    def test_uk_postcode_lists_the_admin_geography(self):
        result = self.run_skill("uk-postcode", client=FakePlace(uk_one=BUCKINGHAM_PALACE),
                                postcode="SW1A 1AA")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("51.50101", result["message"])
        self.assertIn("England", result["message"])
        self.assertIn("admin district: Westminster", result["message"])
        self.assertIn("ward: St James's", result["message"])
        self.assertIn("parliamentary constituency: Cities of London and Westminster", result["message"])
        self.assertIn(UK_DATASET, result["message"])
        self.assertEqual(result["artifact"]["postcode_record"]["postcode"], "SW1A 1AA")

    def test_uk_postcode_that_does_not_exist(self):
        result = self.run_skill("uk-postcode", client=FakePlace(uk_one=None), postcode="ZZ99 9ZZ")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("holds no UK postcode", result["message"])

    def test_uk_postcode_with_a_broken_code_is_a_question(self):
        result = self.run_skill("uk-postcode", client=FakePlace(), postcode="SW1A")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("outward code and an inward code", result["message"])

    def test_outward_code(self):
        result = self.run_skill("outward-code", client=FakePlace(uk_search=UK_SEARCH_ROWS),
                                outward_code="SW1A", limit=5)
        self.assertIn("2 UK postcode(s) under SW1A", result["message"])
        self.assertIn("SW1A 1AA", result["message"])
        self.assertIn("EH12 5AB", result["message"])
        self.assertIn(UK_DATASET, result["message"])

    def test_outward_code_with_no_match(self):
        result = self.run_skill("outward-code", client=FakePlace(uk_search=None), outward_code="QQ99")
        self.assertIn("no postcode under the outward code", result["message"])

    def test_nearest_postcode(self):
        rows = [
            {**BUCKINGHAM_PALACE, "postcode": "SW1A 1AA"},
            {**BUCKINGHAM_PALACE, "postcode": "SW1A 2AA", "latitude": 51.505},
        ]
        result = self.run_skill("nearest-postcode", client=FakePlace(uk_nearest=rows),
                                point="51.5010,-0.1416", limit=5)
        self.assertIn("2 UK postcode(s) within 2.0 km", result["message"])
        self.assertIn("nearest first", result["message"])
        self.assertIn(UK_DATASET, result["message"])

    def test_nearest_postcode_outside_the_uk(self):
        result = self.run_skill("nearest-postcode", client=FakePlace(uk_nearest=[]),
                                point="40.7580,-73.9855")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no postcode within", result["message"])

    def test_nearest_postcode_says_when_the_feed_is_capped(self):
        rows = [{**BUCKINGHAM_PALACE, "postcode": f"SW1A {index:2d}AA"} for index in range(100)]
        result = self.run_skill("nearest-postcode", client=FakePlace(uk_nearest=rows),
                                point="51.5010,-0.1416", limit=100)
        self.assertIn("caps this lookup at 100", result["message"])

    def test_zip_code(self):
        result = self.run_skill("zip-code", client=FakePlace(world=WORLD_PAYLOAD),
                                postcode="11235", country="us")
        self.assertIn("11235, United States", result["message"])
        self.assertIn("Brooklyn, New York", result["message"])
        self.assertIn("40.5839", result["message"])
        self.assertIn("not an administrative breakdown", result["message"])
        self.assertEqual(result["artifact"]["dataset"], WORLD_DATASET)

    def test_zip_code_with_a_state_but_no_abbreviation(self):
        result = self.run_skill("zip-code", client=FakePlace(world=JAPAN_PAYLOAD),
                                postcode="100-0001", country="JP")
        self.assertIn("Chiyoda, Toukyouto", result["message"])

    def test_zip_code_that_does_not_exist(self):
        result = self.run_skill("zip-code", client=FakePlace(world=None),
                                postcode="ZZZZZ", country="us")
        self.assertIn("holds no postal code", result["message"])

    def test_zip_code_without_a_country_asks(self):
        result = self.run_skill("zip-code", client=FakePlace(world=WORLD_PAYLOAD), postcode="10115")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("which country", result["message"])

    def test_a_uk_code_sent_to_the_world_feed_is_explained(self):
        result = self.run_skill("zip-code", client=FakePlace(world=WORLD_PAYLOAD),
                                postcode="SW1A 1AA")
        self.assertIn("does not cover the United Kingdom", result["message"])

    def test_the_gb_country_is_refused_with_a_reason(self):
        result = self.run_skill("zip-code", client=FakePlace(world=WORLD_PAYLOAD),
                                postcode="SW1A1AA", country="gb")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("does not cover the United Kingdom", result["message"])

    def test_missing_prompts(self):
        agent = PlaceAgent(client=FakePlace())
        self.assertEqual(agent.missing("uk-postcode", {}), ["postcode"])
        self.assertEqual(agent.missing("outward-code", {}), ["outward_code"])
        self.assertEqual(agent.missing("nearest-postcode", {}), ["point"])
        self.assertEqual(agent.missing("catchment-area", {}), ["point"])
        self.assertIn("51.5010,-0.1416", agent.input_prompt("catchment-area", ["point"]))

    def test_help_does_not_touch_the_feeds(self):
        client = FakePlace()
        result = self.run_skill("help", client=client)
        self.assertIn("postcodes.io", result["message"])
        self.assertIn("zippopotam", result["message"])
        self.assertIsNone(result["artifact"])
        self.assertEqual(client.reads, [])

    def test_card_and_upstream_failure(self):
        from a2a_kit import UpstreamError

        agent = PlaceAgent(client=FakePlace())
        self.assertEqual([skill["id"] for skill in CARD_SKILLS],
                         ["uk-postcode", "outward-code", "nearest-postcode", "zip-code",
                          "catchment-area"])
        self.assertEqual(agent.env_prefix, "PLACE")
        self.assertEqual(agent.datasets, (UK_DATASET, WORLD_DATASET))
        self.assertEqual(agent.watch_kinds, ())

        class Broken(FakePlace):
            def uk_postcode(self, postcode):
                raise UpstreamError("PLACE request failed: HTTP Error 503")

        result = PlaceAgent(client=Broken()).run(
            {"skill": "uk-postcode", "params": {"postcode": "SW1A 1AA"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("503", result["message"])


#: Shape copied from a live gateway `a2a_place_catchment` answer for Manchester.
CATCHMENT_PAYLOAD = {
    "dataset": "api.postcodes.io",
    "product": "postcodes.io UK postcode and administrative-area data",
    "source": "postcodes.io / ONS Open Postcode Directory",
    "centre": {"latitude": 53.4808, "longitude": -2.2426},
    "radius_km": 5,
    "postcodes_in_radius": 100,
    "postcodes_returned_by_feed": 100,
    "nearest": {"postcode": "M2 4NG", "quality": 1, "country": "England", "region": "North West",
                "admin_district": "Manchester", "admin_county": None, "admin_ward": "Deansgate",
                "parish": "Manchester, unparished area",
                "parliamentary_constituency": "Manchester Central",
                "european_electoral_region": "North West", "lsoa": None, "msoa": None,
                "latitude": 53.4808, "longitude": -2.2426, "distance_km": 0},
    "farthest": {"postcode": "M2 1EE", "distance_km": 0.199},
    "coverage": {
        "regions": [{"name": "North West", "postcodes": 100, "share": 100.0}],
        "admin_districts": [{"name": "Manchester", "postcodes": 100, "share": 100.0}],
        "counties": [],
        "wards": [{"name": "Deansgate", "postcodes": 100, "share": 100.0}],
        "parishes": [{"name": "Manchester, unparished area", "postcodes": 100, "share": 100.0}],
        "parliamentary_constituencies": [{"name": "Manchester Central", "postcodes": 100,
                                           "share": 100.0}],
        "electoral_regions": [{"name": "North West", "postcodes": 100, "share": 100.0}],
    },
    "postcodes": [{"postcode": "M2 4NG", "admin_ward": "Deansgate", "distance_km": 0}],
}

TOOL_ERROR_TEXT = "`a2a_place_catchment` failed: postcodes.io refused that request: HTTP 503"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class CatchmentSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the tally comes from the gateway."""

    def catchment(self, client=None, gateway=None, **params):
        return PlaceAgent(client=client or FakePlace(), gateway=gateway).run(
            {"skill": SKILL_CATCHMENT_AREA, "params": params, "missing": []})











if __name__ == "__main__":
    unittest.main()
