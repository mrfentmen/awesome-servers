"""Tests for the iNaturalist species server.

    python3 servers/species/tests/test_agent.py

No test touches the network: the client is given a fake `fetch`, so caching,
the error mapping and all the shaping stay real. The fixtures are real
iNaturalist payload shapes, taken from live reads on 2026-09-29, so a rename
that dropped a field - or a grade quietly merged into another - shows up here
rather than in a wrong answer.
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

from a2a_kit import GatewayClient  # noqa: E402

from agent import (  # noqa: E402
    CARD_SKILLS,
    GATEWAY_TOOL,
    SKILL_COUNT,
    SKILL_INFO,
    SKILL_NEARBY,
    SKILL_RECENT,
    SKILL_SURVEY,
    SpeciesAgent,
    grade_from_text,
    parse,
    radius_from_text,
    taxon_from_text,
    unknown_place_from_text,
)
from data import (  # noqa: E402
    CITY_POINTS,
    DATASET,
    MAX_LIMIT,
    MAX_RADIUS_KM,
    OBSERVATIONS_PATH,
    QUALITY_GRADES,
    TAXA_PATH,
    SpeciesClient,
    UpstreamError,
    place_from_text,
    point_from_place,
)

#: A real research-grade monarch row, trimmed to the fields this server reads.
MONARCH_ROW = {
    "id": 543210987,
    "observed_on": "2026-09-27",
    "created_at": "2026-09-27T18:04:11+00:00",
    "place_guess": "Austin, TX, USA",
    "quality_grade": "research",
    "identifications_count": 3,
    "geoprivacy": None,
    "taxon_geoprivacy": None,
    "obscured": False,
    "uri": "https://www.inaturalist.org/observations/543210987",
    "user": {"login": "pollinatorpat"},
    "taxon": {"name": "Danaus plexippus", "preferred_common_name": "Monarch butterfly"},
}
#: A needs_id sighting: identified by nobody, so `identified` must be false.
NEEDS_ID_ROW = {
    **MONARCH_ROW,
    "id": 543210988,
    "observed_on": "2026-09-26",
    "quality_grade": "needs_id",
    "identifications_count": 0,
    "place_guess": None,
    "user": {"login": "newbirder"},
}
#: A protected taxon: iNaturalist hands back a point inside a cell, not the
#: real place. The row must carry that, never smooth it away.
OBSCURED_ROW = {
    **MONARCH_ROW,
    "id": 543210989,
    "quality_grade": "research",
    "obscured": True,
    "taxon_geoprivacy": "obscured",
    "place_guess": "Baja California, Mexico",
}

MONARCH_TAXA = {
    "total_results": 2,
    "results": [
        {
            "id": 48662,
            "name": "Danaus plexippus",
            "preferred_common_name": "Monarch butterfly",
            "rank": "species",
            "matched_term": "Monarch butterflies",
            "observations_count": 551385,
            "wikipedia_summary": "The monarch butterfly is a milkweed butterfly.\nMore text here.",
            "wikipedia_url": "https://en.wikipedia.org/wiki/Monarch_butterfly",
            "conservation_status": {"status_name": "Vulnerable"},
        },
        {
            "id": 48663,
            "name": "Danaus plexippus plexippus",
            "preferred_common_name": "North American Monarch",
            "rank": "subspecies",
            "matched_term": "monarch",
            "observations_count": 17873,
            "wikipedia_summary": None,
            "wikipedia_url": None,
            "conservation_status": None,
        },
    ],
}


def _no_network(*args, **kwargs):
    raise AssertionError("this test must not touch the network")


def observations(*rows, total=None):
    """An observations payload with the given rows."""
    return {"total_results": len(rows) if total is None else total, "results": list(rows)}


def survey_fetch(data, calls=None):
    """A GatewayClient `fetch` that answers one JSON-RPC tool call."""

    def fetch(url, payload, headers):
        if calls is not None:
            calls.append(payload)
        return {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "content": [{"type": "text", "text": json.dumps(data)}],
                "structuredContent": data,
                "isError": False,
            },
        }

    return fetch


def refusal_fetch():
    def fetch(url, payload, headers):
        return {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "content": [{"type": "text", "text": "`x` needs a licence key."}],
                "structuredContent": {"licenceRefusal": True, "reason": "missing"},
                "isError": True,
            },
        }

    return fetch


SURVEY_DATA = {
    "dataset": DATASET,
    "taxon": "Danaus plexippus",
    "totalMatches": 551385,
    "observedCount": 300,
    "pages": 6,
    "truncated": False,
    "byMonth": [{"name": "September", "count": 120}, {"name": "October", "count": 90}],
    "byYear": [{"name": "2026", "count": 200}, {"name": "2025", "count": 100}],
    "byGrade": [{"name": "research", "count": 250}, {"name": "needs_id", "count": 50}],
    "byCountry": [{"name": "United States", "count": 180}, {"name": "Mexico", "count": 60}],
    "withPosition": 240,
    "obscuredCount": 12,
    "observedSpan": {"first": "2025-01-04", "last": "2026-09-27"},
    "yearsCovered": ["2025", "2026"],
    "method": "paged observation reads",
}


class FakeSpecies(SpeciesClient):
    """Same interface, no network: validation, shaping and error mapping stay real.

    The fixtures are answered from `fetch`, the transport, so the real `get_json`
    path runs - including the mapping of an upstream `error` key to an
    `UpstreamError` and the per-URL cache.
    """

    def __init__(self, payloads=None) -> None:
        super().__init__(fetch=_no_network)
        self.payloads = dict(payloads or {})
        self.calls = []
        self._fetch = self._answer

    def _answer(self, url: str, params: dict, headers: dict):
        self.calls.append((url, dict(params or {})))
        for path, payload in self.payloads.items():
            if path in url:
                return payload(params) if callable(payload) else payload
        raise AssertionError(f"no fixture for {url}")


def agent_with(payloads=None, gateway=None) -> tuple[SpeciesAgent, FakeSpecies]:
    client = FakeSpecies(payloads)
    return SpeciesAgent(client=client, gateway=gateway), client


def message(text: str) -> dict:
    return {"parts": [{"kind": "text", "text": text}]}


# -- reading a question ----------------------------------------------------


class TestTaxonFromText(unittest.TestCase):
    def test_scientific_name_is_read_as_written(self):
        self.assertEqual(taxon_from_text("how many Danaus plexippus are there?"),
                         "Danaus plexippus")

    def test_how_many_a_common_name(self):
        self.assertEqual(taxon_from_text("how many monarch butterflies are there?"),
                         "monarch butterflies")

    def test_of_phrase(self):
        self.assertEqual(taxon_from_text("count the observations of red fox"), "red fox")

    def test_records_of_phrase(self):
        self.assertEqual(taxon_from_text("the red fox observations"), "red fox")

    def test_species_before_a_record_word(self):
        self.assertEqual(
            taxon_from_text("how do the red fox observations break down by month?"), "red fox")

    def test_what_is_a_name(self):
        self.assertEqual(taxon_from_text("what is a red fox?"), "red fox")

    def test_the_wrapper_goes_and_the_name_stays(self):
        self.assertEqual(taxon_from_text("overview of the monarch butterfly records"),
                         "monarch butterfly")

    def test_a_plain_question_names_no_species(self):
        self.assertIsNone(taxon_from_text("what can you do?"))

    def test_empty_text(self):
        self.assertIsNone(taxon_from_text(""))


class TestRadiusFromText(unittest.TestCase):
    def test_km(self):
        self.assertEqual(radius_from_text("what has been seen within 10 km?"), 10)

    def test_miles_are_converted(self):
        self.assertEqual(radius_from_text("within 5 miles"), 8)

    def test_out_of_range_is_dropped_not_clamped(self):
        self.assertIsNone(radius_from_text("within 500 km"))

    def test_absent(self):
        self.assertIsNone(radius_from_text("what is a red fox?"))


class TestGradeFromText(unittest.TestCase):
    def test_research(self):
        self.assertEqual(grade_from_text("research grade sightings"), "research")

    def test_needs_id(self):
        self.assertEqual(grade_from_text("needs id only"), "needs_id")

    def test_confirmed_means_research(self):
        self.assertEqual(grade_from_text("only confirmed records"), "research")

    def test_unrelated_word_is_none(self):
        self.assertIsNone(grade_from_text("what is a red fox?"))


class TestPlaces(unittest.TestCase):
    def test_longest_metro_name_wins(self):
        self.assertEqual(place_from_text("near mexico city please"), "mexico city")

    def test_metro_becomes_a_point(self):
        self.assertEqual(point_from_place("New York"), "40.71,-74.01")

    def test_unknown_place_is_named_back(self):
        self.assertEqual(unknown_place_from_text("observations near Grimsby"), "grimsby")

    def test_no_place(self):
        self.assertIsNone(place_from_text("how many monarch butterflies?"))
        self.assertIsNone(unknown_place_from_text("how many monarch butterflies?"))


# -- validation ------------------------------------------------------------


class TestValidation(unittest.TestCase):
    def test_taxon_accepts_common_and_scientific(self):
        self.assertEqual(SpeciesClient.check_taxon("  red   fox "), "red fox")
        self.assertEqual(SpeciesClient.check_taxon("Danaus plexippus"), "Danaus plexippus")

    def test_taxon_rejects_junk(self):
        with self.assertRaises(ValueError):
            SpeciesClient.check_taxon("")
        with self.assertRaises(ValueError):
            SpeciesClient.check_taxon("123456")
        with self.assertRaises(ValueError):
            SpeciesClient.check_taxon("a")

    def test_quality_accepts_the_published_grades(self):
        for grade in QUALITY_GRADES:
            self.assertEqual(SpeciesClient.check_quality(grade), grade)
        self.assertIsNone(SpeciesClient.check_quality(None))
        self.assertIsNone(SpeciesClient.check_quality("any"))

    def test_quality_refuses_an_unknown_grade(self):
        with self.assertRaises(ValueError):
            SpeciesClient.check_quality("excellent")

    def test_radius_bounds(self):
        self.assertEqual(SpeciesClient.check_radius(MAX_RADIUS_KM), MAX_RADIUS_KM)
        with self.assertRaises(ValueError):
            SpeciesClient.check_radius(0)
        with self.assertRaises(ValueError):
            SpeciesClient.check_radius(MAX_RADIUS_KM + 1)

    def test_limit_bounds(self):
        self.assertEqual(SpeciesClient.check_limit(MAX_LIMIT), MAX_LIMIT)
        with self.assertRaises(ValueError):
            SpeciesClient.check_limit(0)
        with self.assertRaises(ValueError):
            SpeciesClient.check_limit(MAX_LIMIT + 1)

    def test_point_accepts_lat_lon_and_normalises(self):
        self.assertEqual(SpeciesClient.check_point("40.7128,-74.0060"), "40.7128,-74.006")

    def test_point_refuses_out_of_range_coordinates(self):
        with self.assertRaises(ValueError):
            SpeciesClient.check_point("120,10")
        with self.assertRaises(ValueError):
            SpeciesClient.check_point("no point here")


# -- shaping ---------------------------------------------------------------


class TestRows(unittest.TestCase):
    def test_grade_is_kept_on_the_row(self):
        self.assertEqual(SpeciesClient._row(MONARCH_ROW)["quality_grade"], "research")
        self.assertEqual(SpeciesClient._row(NEEDS_ID_ROW)["quality_grade"], "needs_id")

    def test_identified_follows_the_identification_count(self):
        self.assertTrue(SpeciesClient._row(MONARCH_ROW)["identified"])
        self.assertFalse(SpeciesClient._row(NEEDS_ID_ROW)["identified"])

    def test_obscured_from_the_flag(self):
        self.assertTrue(SpeciesClient._row(OBSCURED_ROW)["coordinates_obscured"])
        self.assertFalse(SpeciesClient._row(MONARCH_ROW)["coordinates_obscured"])

    def test_obscured_from_taxon_geoprivacy(self):
        row = {**MONARCH_ROW, "obscured": False, "taxon_geoprivacy": "obscured"}
        self.assertTrue(SpeciesClient._row(row)["coordinates_obscured"])

    def test_missing_place_is_none_not_a_guess(self):
        self.assertIsNone(SpeciesClient._row(NEEDS_ID_ROW)["place"])

    def test_created_at_is_the_fallback_date(self):
        row = {k: v for k, v in MONARCH_ROW.items() if k != "observed_on"}
        self.assertEqual(SpeciesClient._row(row)["observed_on"], MONARCH_ROW["created_at"])


class TestPayloadHandling(unittest.TestCase):
    def test_errors_list_becomes_upstream_error(self):
        client = FakeSpecies({OBSERVATIONS_PATH: {"errors": [{"message": "bad taxon"}]}})
        with self.assertRaises(UpstreamError):
            client.count("red fox")

    def test_missing_results_list_is_an_error(self):
        client = FakeSpecies({OBSERVATIONS_PATH: {"total_results": 3}})
        with self.assertRaises(UpstreamError):
            client.count("red fox")

    def test_missing_total_is_an_error(self):
        client = FakeSpecies({OBSERVATIONS_PATH: {"results": [MONARCH_ROW]}})
        with self.assertRaises(UpstreamError):
            client.count("red fox")

    def test_a_string_error_key_is_an_error(self):
        client = FakeSpecies({OBSERVATIONS_PATH: {"error": "rate limited"}})
        with self.assertRaises(UpstreamError):
            client.count("red fox")


# -- reads -----------------------------------------------------------------


class TestCount(unittest.TestCase):
    def test_total_and_sample(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW, total=551871)})
        result = client.count("monarch butterfly")
        self.assertEqual(result["total"], 551871)
        self.assertEqual(result["grade"], "any")
        self.assertEqual(result["sample"]["taxon"], "Danaus plexippus")

    def test_the_grade_asked_for_is_sent_and_reported(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW, total=527019)})
        result = client.count("monarch butterfly", "research")
        self.assertEqual(result["grade"], "research")
        self.assertEqual(client.calls[0][1].get("quality_grade"), "research")

    def test_a_name_nobody_recorded_is_zero_not_an_error(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(total=0)})
        result = client.count("zzzznotathing")
        self.assertEqual(result["total"], 0)
        self.assertIsNone(result["sample"])


class TestRecent(unittest.TestCase):
    def test_rows_are_returned_newest_first_as_given(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW, NEEDS_ID_ROW)})
        result = client.recent("monarch butterfly", limit=2)
        self.assertEqual([row["id"] for row in result["rows"]],
                         [MONARCH_ROW["id"], NEEDS_ID_ROW["id"]])

    def test_the_limit_reaches_the_request(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW)})
        client.recent("monarch butterfly", limit=7)
        self.assertEqual(client.calls[0][1]["per_page"], 7)

    def test_a_bad_limit_raises_before_any_request(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW)})
        with self.assertRaises(ValueError):
            client.recent("monarch butterfly", limit=999)
        self.assertEqual(client.calls, [])


class TestNearby(unittest.TestCase):
    def test_point_radius_and_rows(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW, total=256646)})
        result = client.nearby("40.7128,-74.0060", radius_km=5, limit=5)
        self.assertEqual(result["point"], "40.7128,-74.006")
        self.assertEqual(result["radius_km"], 5)
        params = client.calls[0][1]
        self.assertEqual(params["lat"], "40.7128")
        self.assertEqual(params["lng"], "-74.006")
        self.assertEqual(params["radius"], 5)
        self.assertNotIn("taxon_name", params)

    def test_a_taxon_filter_is_passed_through(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW)})
        client.nearby("40.71,-74.01", taxon="red fox")
        self.assertEqual(client.calls[0][1]["taxon_name"], "red fox")

    def test_the_radius_cap_is_refused_not_widened(self):
        client = FakeSpecies({OBSERVATIONS_PATH: observations(MONARCH_ROW)})
        with self.assertRaises(ValueError):
            client.nearby("40.71,-74.01", radius_km=MAX_RADIUS_KM + 1)
        self.assertEqual(client.calls, [])


class TestTaxonLookup(unittest.TestCase):
    def test_exact_scientific_match_wins_over_the_subspecies(self):
        client = FakeSpecies({TAXA_PATH: MONARCH_TAXA})
        record = client.taxon("Danaus plexippus")
        self.assertEqual(record["name"], "Danaus plexippus")
        self.assertTrue(record["exact_match"])
        self.assertEqual(record["other_matches"], 1)

    def test_common_name_matches_exactly(self):
        client = FakeSpecies({TAXA_PATH: MONARCH_TAXA})
        record = client.taxon("Monarch butterfly")
        self.assertEqual(record["name"], "Danaus plexippus")
        self.assertTrue(record["exact_match"])

    def test_a_loose_name_is_reported_as_inexact(self):
        client = FakeSpecies({TAXA_PATH: MONARCH_TAXA})
        record = client.taxon("monarchs")
        self.assertFalse(record["exact_match"])

    def test_no_taxa_is_none(self):
        client = FakeSpecies({TAXA_PATH: {"total_results": 0, "results": []}})
        self.assertIsNone(client.taxon("zzzznotathing"))

    def test_a_payload_without_a_results_list_is_an_error(self):
        client = FakeSpecies({TAXA_PATH: {"total_results": 3}})
        with self.assertRaises(UpstreamError):
            client.taxon("red fox")


# -- the agent -------------------------------------------------------------


class TestCard(unittest.TestCase):
    def test_five_skills_with_unique_ids(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(set(ids),
                         {SKILL_COUNT, SKILL_RECENT, SKILL_NEARBY, SKILL_INFO, SKILL_SURVEY})

    def test_exactly_one_premium_skill(self):
        premium = [skill for skill in CARD_SKILLS if "premium" in skill["tags"]]
        self.assertEqual([skill["id"] for skill in premium], [SKILL_SURVEY])

    def test_free_skills_are_not_hidden_behind_a_key(self):
        for skill in CARD_SKILLS:
            if skill["id"] != SKILL_SURVEY:
                self.assertNotIn("premium", skill["tags"])

    def test_every_skill_has_examples(self):
        for skill in CARD_SKILLS:
            self.assertTrue(skill["examples"], skill["id"])

    def test_the_gateway_tool_name_is_stable(self):
        self.assertEqual(GATEWAY_TOOL, "a2a_species_range_survey")

    def test_dataset_is_recorded(self):
        self.assertEqual(SpeciesAgent.datasets, (DATASET,))


class TestRouting(unittest.TestCase):
    def test_how_many_routes_to_count(self):
        routed = parse(message("how many monarch butterflies are there?"))
        self.assertEqual(routed["skill"], SKILL_COUNT)
        self.assertEqual(routed["params"]["taxon"], "monarch butterflies")

    def test_latest_routes_to_recent(self):
        routed = parse(message("latest red fox sightings"))
        self.assertEqual(routed["skill"], SKILL_RECENT)

    def test_a_point_routes_to_nearby(self):
        routed = parse(message("what has been seen near 40.71,-74.01 within 10 km?"))
        self.assertEqual(routed["skill"], SKILL_NEARBY)
        self.assertEqual(routed["params"]["point"], "40.71,-74.01")
        self.assertEqual(routed["params"]["radius_km"], 10)

    def test_a_metro_routes_to_nearby(self):
        routed = parse(message("any observations around London?"))
        self.assertEqual(routed["skill"], SKILL_NEARBY)
        self.assertEqual(routed["params"]["point"], point_from_place("london"))

    def test_what_is_routes_to_info(self):
        routed = parse(message("what is a red fox?"))
        self.assertEqual(routed["skill"], SKILL_INFO)
        self.assertEqual(routed["params"]["taxon"], "red fox")

    def test_an_overview_routes_to_the_premium_survey(self):
        routed = parse(message("give me an overview of the monarch butterfly records"))
        self.assertEqual(routed["skill"], SKILL_SURVEY)
        self.assertEqual(routed["params"]["taxon"], "monarch butterfly")
        self.assertTrue(routed["explicit"])

    def test_by_month_routes_to_the_premium_survey(self):
        routed = parse(message("how do the red fox observations break down by month?"))
        self.assertEqual(routed["skill"], SKILL_SURVEY)
        self.assertEqual(routed["params"]["taxon"], "red fox")

    def test_help(self):
        self.assertEqual(parse(message("what can you do?"))["skill"], "help")

    def test_no_text_is_help_not_a_guess(self):
        self.assertEqual(parse(message(""))["skill"], "help")

    def test_a_data_part_wins_over_the_text(self):
        routed = parse({"parts": [
            {"kind": "text", "text": "how many monarch butterflies?"},
            {"kind": "data", "data": {"skill": SKILL_INFO, "taxon": "Vulpes vulpes"}},
        ]})
        self.assertEqual(routed["skill"], SKILL_INFO)
        self.assertEqual(routed["params"]["taxon"], "Vulpes vulpes")

    def test_a_grade_in_the_text_is_carried(self):
        routed = parse(message("how many monarch butterflies, research grade?"))
        self.assertEqual(routed["params"]["grade"], "research")


class TestMissingInputs(unittest.TestCase):
    def test_count_without_a_name_asks_for_one(self):
        agent, _ = agent_with()
        self.assertEqual(agent.missing(SKILL_COUNT, {}), ["taxon"])
        self.assertEqual(agent.missing(SKILL_SURVEY, {}), ["taxon"])

    def test_nearby_without_a_point_asks_for_one(self):
        agent, _ = agent_with()
        self.assertEqual(agent.missing(SKILL_NEARBY, {}), ["point"])

    def test_prompts_name_what_is_needed(self):
        agent, _ = agent_with()
        self.assertIn("latitude", agent.input_prompt(SKILL_NEARBY, ["point"]))
        self.assertIn("species", agent.input_prompt(SKILL_COUNT, ["taxon"]).lower())


class TestRunCount(unittest.TestCase):
    def test_no_taxon_is_input_required(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_COUNT, "params": {}, "missing": ["taxon"]})
        self.assertEqual(answer["final_state"], "input-required")
        self.assertIsNone(answer["artifact"])

    def test_a_real_count_is_reported_with_its_grade(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(MONARCH_ROW, total=551871)})
        answer = agent.run({"skill": SKILL_COUNT,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("551,871", answer["message"])
        self.assertIn("any grade", answer["message"])
        self.assertIn("not a population estimate", answer["message"])
        self.assertEqual(answer["artifact"]["total"], 551871)

    def test_a_research_count_says_which_grade_it_counted(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(MONARCH_ROW, total=527019)})
        answer = agent.run({"skill": SKILL_COUNT,
                            "params": {"taxon": "monarch butterfly", "grade": "research"},
                            "missing": []})
        self.assertIn("graded research", answer["message"])

    def test_an_empty_result_is_completed_not_failed(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(total=0)})
        answer = agent.run({"skill": SKILL_COUNT,
                            "params": {"taxon": "zzzznotathing"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("empty result and not an error", answer["message"])

    def test_an_upstream_failure_is_a_failed_task(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: {"errors": [{"message": "down"}]}})
        answer = agent.run({"skill": SKILL_COUNT,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertEqual(answer["final_state"], "failed")


class TestRunRecent(unittest.TestCase):
    def test_rows_keep_their_own_grade(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(MONARCH_ROW, NEEDS_ID_ROW)})
        answer = agent.run({"skill": SKILL_RECENT,
                            "params": {"taxon": "monarch butterfly", "limit": 5}, "missing": []})
        self.assertIn("research", answer["message"])
        self.assertIn("needs_id", answer["message"])
        self.assertEqual(answer["artifact"]["count"], 2)

    def test_an_obscured_position_is_flagged_on_the_line(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(OBSCURED_ROW)})
        answer = agent.run({"skill": SKILL_RECENT,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertIn("position obscured", answer["message"])

    def test_no_place_is_worded_not_left_blank(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(NEEDS_ID_ROW)})
        answer = agent.run({"skill": SKILL_RECENT,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertIn("no place given", answer["message"])


class TestRunNearby(unittest.TestCase):
    def test_an_unknown_place_is_named_back_and_not_guessed(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_NEARBY,
                            "params": {"place": "grimsby", "point": None}, "missing": []})
        self.assertEqual(answer["final_state"], "input-required")
        self.assertIn("grimsby", answer["message"])
        self.assertIn("will not guess", answer["message"])

    def test_no_point_at_all_asks_for_one(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_NEARBY, "params": {}, "missing": []})
        self.assertEqual(answer["final_state"], "input-required")
        self.assertIn("40.71,-74.01", answer["message"])

    def test_a_real_window_is_reported_with_its_point(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(MONARCH_ROW, total=256646)})
        answer = agent.run({"skill": SKILL_NEARBY,
                            "params": {"point": "40.7128,-74.0060", "radius_km": 5},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("within 5 km of 40.7128,-74.006", answer["message"])
        self.assertIn(str(MAX_RADIUS_KM), answer["message"])

    def test_an_empty_window_is_completed(self):
        agent, _ = agent_with({OBSERVATIONS_PATH: observations(total=0)})
        answer = agent.run({"skill": SKILL_NEARBY,
                            "params": {"point": "40.71,-74.01", "radius_km": 5}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("empty result, not a failure", answer["message"])


class TestRunInfo(unittest.TestCase):
    def test_a_taxon_record_is_reported(self):
        agent, _ = agent_with({TAXA_PATH: MONARCH_TAXA})
        answer = agent.run({"skill": SKILL_INFO,
                            "params": {"taxon": "Danaus plexippus"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("Danaus plexippus", answer["message"])
        self.assertIn("551,385", answer["message"])
        self.assertIn("Vulnerable", answer["message"])

    def test_an_inexact_match_says_so(self):
        agent, _ = agent_with({TAXA_PATH: MONARCH_TAXA})
        answer = agent.run({"skill": SKILL_INFO,
                            "params": {"taxon": "monarchs"}, "missing": []})
        self.assertIn("did not match this taxon exactly", answer["message"])
        self.assertFalse(answer["artifact"]["exact_match"])

    def test_other_matches_are_disclosed(self):
        agent, _ = agent_with({TAXA_PATH: MONARCH_TAXA})
        answer = agent.run({"skill": SKILL_INFO,
                            "params": {"taxon": "Danaus plexippus"}, "missing": []})
        self.assertIn("1 other taxon(s)", answer["message"])

    def test_not_found_is_completed_and_says_so(self):
        agent, _ = agent_with({TAXA_PATH: {"total_results": 0, "results": []}})
        answer = agent.run({"skill": SKILL_INFO,
                            "params": {"taxon": "zzzznotathing"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("no taxon for", answer["message"])
        self.assertFalse(answer["artifact"]["found"])


class TestRunSurvey(unittest.TestCase):
    def test_no_key_refuses_and_fabricates_nothing(self):
        agent, client = agent_with(gateway=GatewayClient(key="", url="https://gw.test/mcp"))
        answer = agent.run({"skill": SKILL_SURVEY,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("premium skill", answer["message"])
        self.assertIn("MCP_LICENSE_KEY", answer["message"])
        self.assertTrue(answer["artifact"]["premium"])
        # The free client must not have been asked for the survey data.
        self.assertEqual(client.calls, [])

    def test_a_licence_refusal_is_handed_back_as_an_answer(self):
        gateway = GatewayClient(fetch=refusal_fetch(), key="polar_bad", url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_SURVEY,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertTrue(answer["artifact"]["premium"])

    def test_a_good_key_renders_the_gateway_survey(self):
        calls = []
        gateway = GatewayClient(fetch=survey_fetch(SURVEY_DATA, calls), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, client = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_SURVEY,
                            "params": {"taxon": "monarch butterfly"}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("September 120", answer["message"])
        self.assertIn("research 250", answer["message"])
        self.assertIn("240 of 300 rows carried a position", answer["message"])
        self.assertIn("on the MCP gateway behind its licence check", answer["message"])
        self.assertEqual(answer["artifact"]["by_month"], SURVEY_DATA["byMonth"])
        self.assertEqual(calls[0]["params"]["name"], GATEWAY_TOOL)
        self.assertEqual(calls[0]["params"]["arguments"]["taxon"], "monarch butterfly")
        self.assertEqual(client.calls, [])

    def test_the_grade_asks_for_is_forwarded(self):
        calls = []
        gateway = GatewayClient(fetch=survey_fetch(SURVEY_DATA, calls), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        agent.run({"skill": SKILL_SURVEY,
                   "params": {"taxon": "red fox", "grade": "research"}, "missing": []})
        self.assertEqual(calls[0]["params"]["arguments"]["grade"], "research")

    def test_a_gateway_answer_without_a_survey_fails_rather_than_invents(self):
        gateway = GatewayClient(fetch=survey_fetch({"taxon": "red fox"}), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_SURVEY,
                            "params": {"taxon": "red fox"}, "missing": []})
        self.assertEqual(answer["final_state"], "failed")
        self.assertIn("nothing to report", answer["message"])


class TestAgentShape(unittest.TestCase):
    def test_help_is_returned_off_card(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": "help", "params": {}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("iNaturalist", answer["message"])

    def test_the_agent_has_a_card(self):
        self.assertTrue(SpeciesAgent.name)
        self.assertTrue(SpeciesAgent.card_description)

    def test_city_points_are_usable_coordinates(self):
        for name, (latitude, longitude) in CITY_POINTS.items():
            self.assertLessEqual(abs(latitude), 90, name)
            self.assertLessEqual(abs(longitude), 180, name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
