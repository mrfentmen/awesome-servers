"""Tests for the 7Timer stargazing server.

    python3 servers/stargazing/tests/test_agent.py

No test touches the network: the client is given a fake `fetch`, so the caching,
the error mapping and every shaping step stay real. The fixture is 7Timer's real
payload shape - taken from a live read on 2026-09-29, `init` 2026092900, first
slot timepoint 3 with cloudcover 9, seeing 6, transparency 5 - so a change that
read a low cloud index as "clear" would fail here rather than ship.
"""

from __future__ import annotations

import datetime
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
    SKILL_BEST,
    SKILL_COMPARE,
    SKILL_FORECAST,
    SKILL_TONIGHT,
    StargazingAgent,
    _clearest,
    hours_from_text,
    parse,
    places_from_text,
)
from data import (  # noqa: E402
    ASTRO_PATH,
    CLOUD_SCALE,
    DATASET,
    HORIZON_HOURS,
    PLACES,
    SEEING_SCALE,
    SLOT_HOURS,
    SLOTS,
    TRANSPARENCY_SCALE,
    StargazingClient,
    UpstreamError,
    coordinates_from_text,
    describe_cloud,
    describe_seeing,
    describe_transparency,
    parse_init,
    place_from_text,
    precipitation_word,
)


def slot(timepoint: int, cloudcover=9, seeing=6, transparency=5, prec_type="none",
         direction="NW", speed=2) -> dict:
    """One real 7Timer slot: real index values, real field names."""
    return {
        "timepoint": timepoint,
        "cloudcover": cloudcover,
        "seeing": seeing,
        "transparency": transparency,
        "lifted_index": 6,
        "wind10m": {"direction": direction, "speed": speed},
        "temp2m": 15,
        "rh2m": "70%",
        "prec_type": prec_type,
        "prec_amount": 0,
    }


#: 7Timer's real 72-hour run: 24 slots of 3 hours, oldest slot at +3h.
RUN = [slot(hour) for hour in range(3, (SLOTS * SLOT_HOURS) + 1, SLOT_HOURS)]

PAYLOAD = {"product": "astro", "init": "2026092900", "dataseries": RUN}


def _no_network(*args, **kwargs):
    raise AssertionError("this test must not touch the network")


class FakeTimer(StargazingClient):
    """Same interface, no network: validation, shaping and errors stay real."""

    def __init__(self, payload=None) -> None:
        super().__init__(fetch=_no_network)
        self.payload = PAYLOAD if payload is None else payload
        self.calls = []
        self._fetch = self._answer

    def _answer(self, url: str, params: dict, headers: dict):
        self.calls.append((url, dict(params or {})))
        return self.payload


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


BEST_DATA = {
    "latitude": 40.7128,
    "longitude": -74.006,
    "product": "astro",
    "init": "2026092900",
    "startedUtc": "2026-09-29T00:00:00Z",
    "slotHours": SLOT_HOURS,
    "slotCount": 24,
    "horizonHours": 72,
    "minCloud": 6,
    "eligibleSlots": 9,
    "rated": [{"timepoint": 3, "cloudcover": 9, "eligible": True, "score": 26}],
    "windows": [
        {"startUtc": "2026-09-29T15:00:00Z", "endUtc": "2026-09-30T00:00:00Z", "slots": 4,
         "hours": 12, "meanScore": 24.5, "bestScore": 26, "worstCloud": 7},
        {"startUtc": "2026-10-01T06:00:00Z", "endUtc": "2026-10-01T09:00:00Z", "slots": 2,
         "hours": 6, "meanScore": 21.0, "bestScore": 23, "worstCloud": 6},
    ],
    "windowCount": 2,
    "bestWindow": {"startUtc": "2026-09-29T15:00:00Z", "endUtc": "2026-09-30T00:00:00Z",
                   "slots": 4, "hours": 12, "meanScore": 24.5, "bestScore": 26, "worstCloud": 7},
    "coversDaylight": False,
    "coversMoon": False,
    "daylightCaveat": "A window is a run of good SKY conditions, not a run of darkness.",
    "method": "paged 7Timer reads",
}


def agent_with(payload=None, gateway=None) -> tuple[StargazingAgent, FakeTimer]:
    client = FakeTimer(payload)
    return StargazingAgent(client=client, gateway=gateway), client


def message(text: str) -> dict:
    return {"parts": [{"kind": "text", "text": text}]}


# -- reading a question ----------------------------------------------------


class TestPlacesFromText(unittest.TestCase):
    def test_two_places_in_order(self):
        self.assertEqual(places_from_text("compare New York and Los Angeles tonight"),
                         ["new york", "los angeles"])

    def test_longest_name_wins(self):
        self.assertEqual(places_from_text("what about Mexico City?"), ["mexico city"])

    def test_no_repeat(self):
        self.assertEqual(places_from_text("London or London?"), ["london"])

    def test_no_place(self):
        self.assertEqual(places_from_text("when is the best time to stargaze?"), [])

    def test_place_from_text_returns_coordinates_and_a_label(self):
        latitude, longitude, label = place_from_text("stargazing in Berlin")
        self.assertEqual(label, "Berlin, Germany")
        self.assertAlmostEqual(latitude, 52.52, places=2)
        self.assertAlmostEqual(longitude, 13.405, places=2)


class TestCoordinates(unittest.TestCase):
    def test_a_plain_pair(self):
        self.assertEqual(coordinates_from_text("stargazing at 40.7128,-74.0060"),
                         (40.7128, -74.006))

    def test_north_and_west_suffixes_carry_the_sign(self):
        self.assertEqual(coordinates_from_text("stargazing at 51.5N, 0.1W"), (51.5, -0.1))

    def test_south_and_east_suffixes(self):
        self.assertEqual(coordinates_from_text("33.9S, 151.2E"), (-33.9, 151.2))

    def test_out_of_range_is_dropped(self):
        self.assertIsNone(coordinates_from_text("stargazing at 95.0, 10.0"))

    def test_nothing_to_read(self):
        self.assertIsNone(coordinates_from_text("is tonight good in New York?"))


class TestHours(unittest.TestCase):
    def test_an_hour_count(self):
        self.assertEqual(hours_from_text("the next 24 hours"), 24)

    def test_a_day_count_becomes_hours(self):
        self.assertEqual(hours_from_text("the next 2 days"), 48)

    def test_three_days_is_the_whole_run(self):
        self.assertEqual(hours_from_text("three day outlook"), HORIZON_HOURS)

    def test_the_default_when_nothing_is_said(self):
        self.assertEqual(hours_from_text("is tonight good in New York?"), 12)

    def test_an_absurd_count_is_clamped_to_the_run(self):
        self.assertEqual(hours_from_text("the next 900 hours"), HORIZON_HOURS)


class TestInit(unittest.TestCase):
    def test_the_real_init_parses_as_utc(self):
        self.assertEqual(parse_init("2026092900"),
                         datetime.datetime(2026, 9, 29, 0, 0, tzinfo=datetime.timezone.utc))

    def test_a_wrong_length_is_none(self):
        self.assertIsNone(parse_init("20260929"))

    def test_a_non_digit_is_none(self):
        self.assertIsNone(parse_init("2026-09-29"))

    def test_an_impossible_date_is_none(self):
        self.assertIsNone(parse_init("2026130100"))

    def test_missing(self):
        self.assertIsNone(parse_init(None))


class TestScales(unittest.TestCase):
    def test_every_cloud_value_has_a_word(self):
        for value in range(1, 10):
            self.assertEqual(describe_cloud(value), CLOUD_SCALE[value])

    def test_the_trap_is_worded_the_right_way_round(self):
        self.assertEqual(describe_cloud(1), "fully covered")
        self.assertEqual(describe_cloud(9), "no cloud at all")

    def test_seeing_and_transparency(self):
        self.assertEqual(describe_seeing(8), SEEING_SCALE[8])
        self.assertEqual(describe_transparency(7), TRANSPARENCY_SCALE[7])

    def test_an_unpublished_value_is_not_reported(self):
        self.assertEqual(describe_cloud(0), "not reported")
        self.assertEqual(describe_cloud(None), "not reported")
        self.assertEqual(describe_seeing("lots"), "not reported")

    def test_precipitation_none_is_worded(self):
        self.assertEqual(precipitation_word("none"), "none forecast")
        self.assertEqual(precipitation_word(None), "none forecast")
        self.assertEqual(precipitation_word("rain"), "rain")


# -- validation ------------------------------------------------------------


class TestValidation(unittest.TestCase):
    def test_coordinates_are_rounded(self):
        self.assertEqual(StargazingClient.check_coordinates(40.71284, -74.00601),
                         (40.7128, -74.006))

    def test_latitude_bounds(self):
        with self.assertRaises(ValueError):
            StargazingClient.check_coordinates(91, 0)
        with self.assertRaises(ValueError):
            StargazingClient.check_coordinates(-91, 0)

    def test_longitude_bounds(self):
        with self.assertRaises(ValueError):
            StargazingClient.check_coordinates(0, 181)

    def test_non_numeric(self):
        with self.assertRaises(ValueError):
            StargazingClient.check_coordinates("north", "west")

    def test_hours_must_be_a_whole_number(self):
        client = FakeTimer()
        with self.assertRaises(ValueError):
            client.upcoming(40.71, -74.01, hours="soon")

    def test_hours_bounds(self):
        client = FakeTimer()
        with self.assertRaises(ValueError):
            client.upcoming(40.71, -74.01, hours=1)
        with self.assertRaises(ValueError):
            client.upcoming(40.71, -74.01, hours=HORIZON_HOURS + 1)


# -- reads -----------------------------------------------------------------


class TestForecast(unittest.TestCase):
    def test_request_shape(self):
        client = FakeTimer()
        client.forecast(40.7128, -74.0060)
        url, params = client.calls[0]
        self.assertIn(ASTRO_PATH, url)
        self.assertEqual(params["product"], "astro")
        self.assertEqual(params["output"], "json")
        self.assertEqual(params["lat"], "40.7128")
        self.assertEqual(params["lon"], "-74.0060")

    def test_slots_carry_utc_times_built_from_init(self):
        run = FakeTimer().forecast(40.7128, -74.006)
        self.assertEqual(run["started_utc"], "2026-09-29T00:00:00+00:00")
        self.assertEqual(run["slots"][0]["utc"], "2026-09-29T03:00:00Z")
        self.assertEqual(run["slots"][1]["utc"], "2026-09-29T06:00:00Z")

    def test_the_run_is_24_slots_of_3_hours_so_72_hours(self):
        run = FakeTimer().forecast(40.7128, -74.006)
        self.assertEqual(run["count"], SLOTS)
        self.assertEqual(run["slot_hours"], SLOT_HOURS)
        self.assertEqual(run["horizon_hours"], HORIZON_HOURS)
        self.assertEqual(run["horizon_hours"], 72)

    def test_every_index_is_stamped_with_its_published_word(self):
        first = FakeTimer().forecast(40.7128, -74.006)["slots"][0]
        self.assertEqual(first["cloudcover"], 9)
        self.assertEqual(first["cloud_word"], "no cloud at all")
        self.assertEqual(first["seeing_word"], SEEING_SCALE[6])
        self.assertEqual(first["transparency_word"], TRANSPARENCY_SCALE[5])
        self.assertEqual(first["precipitation"], "none forecast")

    def test_the_run_says_it_covers_neither_daylight_nor_moon(self):
        run = FakeTimer().forecast(40.7128, -74.006)
        self.assertFalse(run["covers_daylight"])
        self.assertFalse(run["covers_moon"])

    def test_slots_are_returned_oldest_first_even_when_the_payload_is_not(self):
        payload = {**PAYLOAD, "dataseries": [slot(9), slot(3), slot(6)]}
        run = FakeTimer(payload).forecast(40.7128, -74.006)
        self.assertEqual([entry["timepoint"] for entry in run["slots"]], [3, 6, 9])

    def test_a_junk_entry_is_skipped_and_the_good_ones_kept(self):
        payload = {**PAYLOAD, "dataseries": ["nonsense", {"no": "timepoint"}, slot(3)]}
        run = FakeTimer(payload).forecast(40.7128, -74.006)
        self.assertEqual([entry["timepoint"] for entry in run["slots"]], [3])

    def test_no_dataseries_is_an_error(self):
        with self.assertRaises(UpstreamError):
            FakeTimer({"init": "2026092900", "dataseries": []}).forecast(40.7128, -74.006)

    def test_an_error_key_is_an_error(self):
        with self.assertRaises(UpstreamError):
            FakeTimer({"error": "invalid coordinates"}).forecast(40.7128, -74.006)

    def test_a_non_dict_payload_is_an_error(self):
        with self.assertRaises(UpstreamError):
            FakeTimer([]).forecast(40.7128, -74.006)

    def test_a_run_with_no_usable_slot_is_an_error(self):
        with self.assertRaises(UpstreamError):
            FakeTimer({"init": "2026092900", "dataseries": [{"cloudcover": 9}]}) \
                .forecast(40.7128, -74.006)


class TestUpcoming(unittest.TestCase):
    def test_the_window_cuts_the_run(self):
        run = FakeTimer().upcoming(40.7128, -74.006, hours=12)
        self.assertEqual(run["window_hours"], 12)
        self.assertEqual([entry["timepoint"] for entry in run["slots"]], [3, 6, 9, 12])
        self.assertEqual(run["count"], 4)

    def test_a_long_window_keeps_the_whole_run(self):
        run = FakeTimer().upcoming(40.7128, -74.006, hours=HORIZON_HOURS)
        self.assertEqual(run["count"], SLOTS)


class TestClearest(unittest.TestCase):
    def test_highest_cloud_index_wins(self):
        slots = [{"cloudcover": 3, "seeing": 8, "transparency": 7},
                 {"cloudcover": 9, "seeing": 2, "transparency": 2}]
        self.assertEqual(_clearest(slots)["cloudcover"], 9)

    def test_cloud_is_compared_before_seeing(self):
        slots = [{"cloudcover": 8, "seeing": 8, "transparency": 7},
                 {"cloudcover": 9, "seeing": 1, "transparency": 1}]
        self.assertEqual(_clearest(slots)["cloudcover"], 9)

    def test_seeing_breaks_a_cloud_tie(self):
        slots = [{"cloudcover": 9, "seeing": 3, "transparency": 3},
                 {"cloudcover": 9, "seeing": 7, "transparency": 2}]
        self.assertEqual(_clearest(slots)["seeing"], 7)

    def test_an_unpublished_cloud_cover_is_never_clear(self):
        slots = [{"cloudcover": None, "seeing": 8, "transparency": 7}]
        self.assertIsNone(_clearest(slots))

    def test_no_slots(self):
        self.assertIsNone(_clearest([]))


# -- the agent -------------------------------------------------------------


class TestCard(unittest.TestCase):
    def test_four_skills_with_unique_ids(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(set(ids), {SKILL_TONIGHT, SKILL_FORECAST, SKILL_COMPARE, SKILL_BEST})

    def test_exactly_one_premium_skill(self):
        premium = [skill for skill in CARD_SKILLS if "premium" in skill["tags"]]
        self.assertEqual([skill["id"] for skill in premium], [SKILL_BEST])

    def test_every_skill_has_examples(self):
        for skill in CARD_SKILLS:
            self.assertTrue(skill["examples"], skill["id"])

    def test_the_gateway_tool_name_is_stable(self):
        self.assertEqual(GATEWAY_TOOL, "a2a_stargazing_best_window")

    def test_the_card_admits_what_is_missing(self):
        description = StargazingAgent.card_description
        self.assertIn("bigger-is-better", description)
        self.assertIn("no moon phase", description)


class TestRouting(unittest.TestCase):
    def test_a_plain_night_question_is_tonight(self):
        routed = parse(message("is tonight good for stargazing in New York?"))
        self.assertEqual(routed["skill"], SKILL_TONIGHT)
        self.assertEqual(routed["params"]["latitude"], PLACES["new york"][0])
        self.assertEqual(routed["params"]["label"], "New York, New York")

    def test_a_weather_question_with_a_place_is_tonight(self):
        routed = parse(message("what is the cloud cover in Chicago tonight?"))
        self.assertEqual(routed["skill"], SKILL_TONIGHT)
        self.assertEqual(routed["params"]["label"], "Chicago, Illinois")

    def test_coordinates_work_without_a_named_place(self):
        routed = parse(message("stargazing at 51.5N, 0.1W"))
        self.assertEqual(routed["skill"], SKILL_TONIGHT)
        self.assertEqual(routed["params"]["latitude"], 51.5)
        self.assertEqual(routed["params"]["longitude"], -0.1)
        self.assertIsNone(routed["params"]["label"])

    def test_a_72_hour_question_is_the_forecast(self):
        routed = parse(message("three day stargazing forecast for London"))
        self.assertEqual(routed["skill"], SKILL_FORECAST)
        self.assertEqual(routed["params"]["hours"], HORIZON_HOURS)

    def test_two_places_compared(self):
        routed = parse(message("compare stargazing in New York and Los Angeles tonight"))
        self.assertEqual(routed["skill"], SKILL_COMPARE)
        self.assertEqual(routed["params"]["places"], ["new york", "los angeles"])
        self.assertEqual(routed["params"]["latitude_b"], PLACES["los angeles"][0])
        self.assertEqual(routed["params"]["label_b"], "Los Angeles, California")

    def test_better_of_two_places_compares(self):
        routed = parse(message("is London or Edinburgh better for stargazing tonight?"))
        self.assertEqual(routed["skill"], SKILL_COMPARE)
        self.assertEqual(routed["params"]["places"], ["london", "edinburgh"])

    def test_a_when_question_is_the_premium_best_window(self):
        routed = parse(message("when is the best time to stargaze in New York?"))
        self.assertEqual(routed["skill"], SKILL_BEST)
        self.assertEqual(routed["params"]["hours"], HORIZON_HOURS)
        self.assertTrue(routed["explicit"])

    def test_the_best_window_scans_the_whole_run_by_default(self):
        routed = parse(message('{"skill": "sky-best-window", "lat": 40.7, "lon": -74.0}'))
        self.assertEqual(routed["skill"], SKILL_BEST)
        self.assertEqual(routed["params"]["hours"], HORIZON_HOURS)

    def test_help(self):
        self.assertEqual(parse(message("what can you do?"))["skill"], "help")

    def test_no_text_is_help(self):
        self.assertEqual(parse(message(""))["skill"], "help")

    def test_a_data_part_wins_over_the_text(self):
        routed = parse({"parts": [
            {"kind": "text", "text": "is tonight good in New York?"},
            {"kind": "data", "data": {"skill": SKILL_FORECAST, "place": "berlin"}},
        ]})
        self.assertEqual(routed["skill"], SKILL_FORECAST)
        self.assertEqual(routed["params"]["latitude"], PLACES["berlin"][0])

    def test_an_hour_count_in_the_text_is_read(self):
        routed = parse(message("stargazing in New York for the next 24 hours"))
        self.assertEqual(routed["params"]["hours"], 24)


class TestMissingInputs(unittest.TestCase):
    def test_every_place_skill_needs_a_place(self):
        agent, _ = agent_with()
        for skill in (SKILL_TONIGHT, SKILL_FORECAST, SKILL_BEST):
            self.assertEqual(agent.missing(skill, {}), ["place"], skill)
        self.assertEqual(agent.missing(SKILL_TONIGHT, {"latitude": 40.0}), ["place"])

    def test_compare_needs_two(self):
        agent, _ = agent_with()
        self.assertEqual(agent.missing(SKILL_COMPARE, {"latitude": 40.0}), ["places"])
        self.assertEqual(
            agent.missing(SKILL_COMPARE, {"latitude": 40.0, "latitude_b": 34.0}), [])

    def test_prompts_name_what_is_needed(self):
        agent, _ = agent_with()
        self.assertIn("Which place", agent.input_prompt(SKILL_TONIGHT, ["place"]))
        self.assertIn("two places", agent.input_prompt(SKILL_COMPARE, ["places"]))


class TestRunTonight(unittest.TestCase):
    def test_no_place_is_input_required(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_TONIGHT, "params": {}, "missing": ["place"]})
        self.assertEqual(answer["final_state"], "input-required")
        self.assertIsNone(answer["artifact"])

    def test_the_coming_hours_are_printed_with_their_words(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_TONIGHT,
                            "params": {"latitude": 40.7128, "longitude": -74.006,
                                       "label": "New York, New York", "hours": 12},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("New York, New York", answer["message"])
        self.assertIn("cloud 9 (no cloud at all)", answer["message"])
        self.assertIn("the next 12 hour(s)", answer["message"])
        self.assertEqual(answer["artifact"]["count"], 4)

    def test_the_answer_warns_which_way_the_scale_runs(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_TONIGHT,
                            "params": {"latitude": 40.71, "longitude": -74.01}, "missing": []})
        self.assertIn("Bigger is better", answer["message"])
        self.assertIn("weather to stay in", answer["message"])

    def test_the_answer_admits_the_missing_moon_and_daylight(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_TONIGHT,
                            "params": {"latitude": 40.71, "longitude": -74.01}, "missing": []})
        self.assertIn("no moon data", answer["message"])
        self.assertIn("no daylight flag", answer["message"])
        self.assertFalse(answer["artifact"]["covers_moon"])
        self.assertFalse(answer["artifact"]["covers_daylight"])

    def test_the_clearest_slot_is_named(self):
        payload = {**PAYLOAD, "dataseries": [slot(3, cloudcover=2), slot(6, cloudcover=9)]}
        agent, _ = agent_with(payload)
        answer = agent.run({"skill": SKILL_TONIGHT,
                            "params": {"latitude": 40.7128, "longitude": -74.006,
                                       "hours": 12},
                            "missing": []})
        self.assertIn("2026-09-29T06:00:00Z — cloud 9", answer["message"])
        self.assertEqual(answer["artifact"]["best_slot"]["cloudcover"], 9)

    def test_a_window_with_no_published_cloud_is_not_ranked(self):
        payload = {**PAYLOAD, "dataseries": [slot(3, cloudcover=None)]}
        agent, _ = agent_with(payload)
        answer = agent.run({"skill": SKILL_TONIGHT,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("nothing to rank", answer["message"])

    def test_an_upstream_failure_is_a_failed_task(self):
        agent, _ = agent_with({"error": "invalid coordinates"})
        answer = agent.run({"skill": SKILL_TONIGHT,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertEqual(answer["final_state"], "failed")


class TestRunForecast(unittest.TestCase):
    def test_the_whole_run_is_listed_and_the_72_hours_stated(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_FORECAST,
                            "params": {"latitude": 51.5074, "longitude": -0.1278,
                                       "label": "London, United Kingdom"},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("24 slots of 3 hours, so 72 hours", answer["message"])
        self.assertIn("suggests", answer["message"])
        self.assertEqual(answer["artifact"]["horizon_hours"], 72)
        self.assertEqual(answer["artifact"]["slot_hours"], 3)

    def test_every_slot_appears(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_FORECAST,
                            "params": {"latitude": 51.5074, "longitude": -0.1278},
                            "missing": []})
        self.assertEqual(answer["message"].count("  • "), SLOTS)

    def test_a_label_falls_back_to_the_point_it_used(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_FORECAST,
                            "params": {"latitude": 51.5074, "longitude": -0.1278},
                            "missing": []})
        self.assertIn("51.5074, -0.1278", answer["message"])


class TestRunCompare(unittest.TestCase):
    def test_one_place_asks_for_two(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_COMPARE,
                            "params": {"places": ["london"], "latitude": 51.5}, "missing": []})
        self.assertEqual(answer["final_state"], "input-required")
        self.assertIn("two places", answer["message"])

    def test_the_clearer_place_is_named(self):
        calls = {"count": 0}

        def fetch(url, params, headers):
            calls["count"] += 1
            # First read is New York (cloudier), second is Los Angeles (clearer).
            cloud = 4 if calls["count"] == 1 else 9
            return {**PAYLOAD, "dataseries": [slot(3, cloudcover=cloud)]}

        client = StargazingClient(fetch=fetch)
        agent = StargazingAgent(client=client)
        answer = agent.run({"skill": SKILL_COMPARE,
                            "params": {"places": ["new york", "los angeles"],
                                       "latitude": 40.7128, "longitude": -74.006,
                                       "latitude_b": 34.0522, "longitude_b": -118.2437,
                                       "label": "New York, New York",
                                       "label_b": "Los Angeles, California", "hours": 12},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("Los Angeles, California is clearer at its best slot", answer["message"])
        self.assertIn("a lower number is cloudier", answer["message"])

    def test_a_tie_is_reported_as_a_tie(self):
        client = StargazingClient(
            fetch=lambda url, params, headers: {**PAYLOAD, "dataseries": [slot(3, cloudcover=7)]})
        agent = StargazingAgent(client=client)
        answer = agent.run({"skill": SKILL_COMPARE,
                            "params": {"places": ["london", "edinburgh"],
                                       "latitude": 51.5, "longitude": -0.13,
                                       "latitude_b": 55.95, "longitude_b": -3.19,
                                       "hours": 12},
                            "missing": []})
        self.assertIn("They tie on cloud cover", answer["message"])

    def test_both_places_are_in_the_artifact(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": SKILL_COMPARE,
                            "params": {"places": ["new york", "los angeles"],
                                       "latitude": 40.7128, "longitude": -74.006,
                                       "latitude_b": 34.0522, "longitude_b": -118.2437,
                                       "hours": 12},
                            "missing": []})
        self.assertEqual(len(answer["artifact"]["compared"]), 2)
        self.assertEqual(answer["artifact"]["hours"], 12)


class TestRunBestWindow(unittest.TestCase):
    def test_no_key_refuses_and_fabricates_no_ranking(self):
        agent, client = agent_with(gateway=GatewayClient(key="", url="https://gw.test/mcp"))
        answer = agent.run({"skill": SKILL_BEST,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("premium skill", answer["message"])
        self.assertIn("MCP_LICENSE_KEY", answer["message"])
        self.assertTrue(answer["artifact"]["premium"])
        self.assertEqual(client.calls, [])

    def test_a_licence_refusal_is_handed_back_as_an_answer(self):
        gateway = GatewayClient(fetch=refusal_fetch(), key="polar_bad", url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_BEST,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("premium", answer["artifact"])

    def test_a_good_key_renders_the_ranked_windows(self):
        calls = []
        gateway = GatewayClient(fetch=survey_fetch(BEST_DATA, calls), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, client = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_BEST,
                            "params": {"latitude": 40.7128, "longitude": -74.006,
                                       "label": "New York, New York"},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("Window 1: 2026-09-29T15:00:00Z", answer["message"])
        self.assertIn("mean score 24.5", answer["message"])
        self.assertIn("9 of them usable", answer["message"])
        self.assertIn("best of them starts 2026-09-29T15:00:00Z", answer["message"])
        self.assertEqual(answer["artifact"]["window_count"], 2)
        self.assertEqual(calls[0]["params"]["name"], GATEWAY_TOOL)
        self.assertEqual(calls[0]["params"]["arguments"]["lat"], 40.7128)
        self.assertEqual(client.calls, [])

    def test_a_window_run_is_not_dressed_up_as_a_night(self):
        gateway = GatewayClient(fetch=survey_fetch(BEST_DATA), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_BEST,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertIn("run of good sky, not a run of night", answer["message"])
        self.assertFalse(answer["artifact"]["covers_moon"])

    def test_no_usable_window_at_all_is_said_plainly(self):
        data = {**BEST_DATA, "windows": [], "windowCount": 0, "bestWindow": None}
        gateway = GatewayClient(fetch=survey_fetch(data), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_BEST,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("No contiguous run of usable slots", answer["message"])

    def test_a_gateway_answer_without_a_ranking_fails_rather_than_invents(self):
        gateway = GatewayClient(fetch=survey_fetch({"latitude": 40.7}), key="polar_ok",
                                url="https://gw.test/mcp")
        agent, _ = agent_with(gateway=gateway)
        answer = agent.run({"skill": SKILL_BEST,
                            "params": {"latitude": 40.7128, "longitude": -74.006},
                            "missing": []})
        self.assertEqual(answer["final_state"], "failed")
        self.assertIn("nothing to report", answer["message"])


class TestAgentShape(unittest.TestCase):
    def test_help_is_returned_off_card(self):
        agent, _ = agent_with()
        answer = agent.run({"skill": "help", "params": {}, "missing": []})
        self.assertEqual(answer["final_state"], "completed")
        self.assertIn("7Timer", answer["message"])
        self.assertIn("premium", answer["message"])

    def test_the_agent_records_its_dataset(self):
        self.assertEqual(StargazingAgent.datasets, (DATASET,))

    def test_places_are_usable_coordinates(self):
        for name, (latitude, longitude, label) in PLACES.items():
            self.assertLessEqual(abs(latitude), 90, name)
            self.assertLessEqual(abs(longitude), 180, name)
            self.assertTrue(label, name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
