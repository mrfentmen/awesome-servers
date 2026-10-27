"""Tests for the GB grid carbon server.

    python3 servers/grid/tests/test_agent.py
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
    SKILL_CLEAN_WINDOWS,
    GridAgent,
    parse,
    postcode_from_text,
)
from data import (  # noqa: E402
    DATASET,
    INTENSITY_BANDS,
    REGION_COUNT,
    GridClient,
    iso_minute,
    parse_stamp,
)

NOW_SLOT = {
    "from": "2026-09-29T03:30Z", "to": "2026-09-29T04:00Z",
    "intensity": {"forecast": 91, "actual": 97, "index": "moderate"},
}

FORECAST_ROWS = [
    {"from": "2026-09-29T03:30Z", "to": "2026-09-29T04:00Z",
     "intensity": {"forecast": 91, "actual": None, "index": "moderate"}},
    {"from": "2026-09-29T04:00Z", "to": "2026-09-29T04:30Z",
     "intensity": {"forecast": 88, "actual": None, "index": "low"}},
    {"from": "2026-09-29T04:30Z", "to": "2026-09-29T05:00Z",
     "intensity": {"forecast": 240, "actual": None, "index": "high"}},
    {"from": "2026-09-29T05:00Z", "to": "2026-09-29T05:30Z",
     "intensity": {"forecast": 50, "actual": None, "index": "low"}},
]

MEASURED_ROWS = [
    {"from": "2026-09-28T03:30Z", "to": "2026-09-28T04:00Z",
     "intensity": {"forecast": 159, "actual": 195, "index": "high"}},
    {"from": "2026-09-28T04:00Z", "to": "2026-09-28T04:30Z",
     "intensity": {"forecast": 162, "actual": 204, "index": "high"}},
]

MIX = [{"fuel": "wind", "perc": 48.0}, {"fuel": "gas", "perc": 20.5},
       {"fuel": "nuclear", "perc": 16.3}, {"fuel": "biomass", "perc": 9.3},
       {"fuel": "coal", "perc": 0}, {"fuel": "solar", "perc": 1.2},
       {"fuel": "hydro", "perc": 0.4}, {"fuel": "imports", "perc": 3.4},
       {"fuel": "other", "perc": 0.9}]

GENERATION = {"from": "2026-09-29T03:30Z", "to": "2026-09-29T04:00Z", "generationmix": MIX}


def region(region_id, short_name, dno, forecast, band, **mix):
    return {"regionid": region_id, "dnoregion": dno, "shortname": short_name,
            "intensity": {"forecast": forecast, "index": band},
            "generationmix": mix.get("mix", MIX)}


REGIONS = [
    region(13, "London", "UKPN London", 121, "moderate"),
    region(8, "West Midlands", "WPD West Midlands", 46, "very low"),
    region(11, "South West England", "WPD South West", 295, "very high"),
    region(12, "South England", "SSE South", 123, "moderate"),
    region(7, "South Wales", "WPD South Wales", 297, "very high"),
    region(1, "North Scotland", "Scottish Hydro Electric Power Distribution", 0, "very low"),
]
REGIONAL = {"from": "2026-09-29T03:30Z", "to": "2026-09-29T04:00Z", "regions": REGIONS}

POSTCODE_REGIONAL = {"data": [{
    "regionid": 13, "dnoregion": "UKPN London", "shortname": "London", "postcode": "SW1A",
    "data": [{"from": "2026-09-29T03:30Z", "to": "2026-09-29T04:00Z",
              "intensity": {"forecast": 121, "index": "moderate"},
              "generationmix": MIX}],
}]}


def _no_network(*args, **kwargs):
    raise AssertionError("this client must not touch the network")


def local_fetch(now=None, forward=None, backward=None, regional=None, postcode=None,
                generation=None, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""
    answers = {
        "now": {"data": [NOW_SLOT]} if now is None else now,
        "forward": {"data": list(FORECAST_ROWS)} if forward is None else forward,
        "backward": {"data": list(MEASURED_ROWS)} if backward is None else backward,
        "regional": {"data": [REGIONAL]} if regional is None else regional,
        "postcode": POSTCODE_REGIONAL if postcode is None else postcode,
        "generation": {"data": GENERATION} if generation is None else generation,
    }

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.endswith("/intensity"):
            return answers["now"]
        if "/fw48h" in url or "/fw24h" in url:
            return answers["forward"]
        if "/pt24h" in url:
            return answers["backward"]
        if "/regional/postcode/" in url:
            return answers["postcode"]
        if url.endswith("/regional"):
            return answers["regional"]
        if url.endswith("/generation"):
            return answers["generation"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


class FakeGrid(GridClient):
    """Same interface as GridClient, served from memory. The real reads run."""

    def __init__(self, **feeds) -> None:
        self.reads: list[str] = []
        super().__init__(fetch=local_fetch(calls=self.reads, **feeds))


class ValidationTests(unittest.TestCase):
    def test_check_outward(self):
        self.assertEqual(GridClient.check_outward("sw1a 1aa"), "SW1A")
        self.assertEqual(GridClient.check_outward(" SW1A "), "SW1A")
        for bad in ("12345", "", "postcode"):
            with self.assertRaises(ValueError):
                GridClient.check_outward(bad)

    def test_check_hours_threshold_series_limit(self):
        self.assertEqual(GridClient.check_hours("12"), 12)
        for bad in ("0", "49", "two"):
            with self.assertRaises(ValueError):
                GridClient.check_hours(bad)
        self.assertEqual(GridClient.check_threshold("100.25"), 100.2)
        for bad in ("-1", "1001", "clean"):
            with self.assertRaises(ValueError):
                GridClient.check_threshold(bad)
        self.assertEqual(GridClient.check_series("Actual"), "actual")
        with self.assertRaises(ValueError):
            GridClient.check_series("guessed")
        self.assertEqual(GridClient.check_limit(6), 6)
        with self.assertRaises(ValueError):
            GridClient.check_limit(0)

    def test_stamps(self):
        self.assertEqual(iso_minute(parse_stamp("2026-09-29T02:00Z")),
                         iso_minute(parse_stamp("2026-09-29T02:00Z")))
        self.assertIsNone(parse_stamp("not a stamp"))
        self.assertIsNone(parse_stamp(""))


class ReaderTests(unittest.TestCase):
    def test_now_reads_the_current_half_hour(self):
        client = FakeGrid()
        slot = client.now()
        self.assertEqual(slot["forecast"], 91)
        self.assertEqual(slot["actual"], 97)
        self.assertEqual(slot["band"], "moderate")
        self.assertIsInstance(slot["minutes_in"], int)

    def test_now_with_no_half_hour(self):
        client = FakeGrid(now={"data": []})
        self.assertIsNone(client.now())

    def test_now_missing_band_is_reported_not_guessed(self):
        client = FakeGrid(now={"data": [{"from": "2026-09-29T03:30Z", "to": "2026-09-29T04:00Z",
                                         "intensity": {"forecast": 91, "actual": None}}]})
        self.assertEqual(client.now()["band"], "not reported")

    def test_error_envelope_becomes_an_upstream_error(self):
        from a2a_kit import UpstreamError

        client = FakeGrid(now={"error": {"code": "400 Bad Request", "message": "bad datetime"}})
        with self.assertRaises(UpstreamError) as caught:
            client.now()
        self.assertIn("bad datetime", str(caught.exception))

    def test_series_trims_by_count_and_sorts(self):
        calls = []
        client = GridClient(fetch=local_fetch(calls=calls))
        slots = client.series("fw48h", hours=1)
        self.assertEqual(len(slots), 2)
        self.assertEqual([slot["from"] for slot in slots],
                         ["2026-09-29T03:30Z", "2026-09-29T04:00Z"])
        self.assertEqual(calls[0][0].split("/")[-1], "fw48h")
        self.assertIn("fw48h", calls[0][0])
        self.assertIn("Z", calls[0][0])

    def test_measured_series_comes_from_the_other_path(self):
        calls = []
        client = GridClient(fetch=local_fetch(calls=calls))
        slots = client.series("pt24h", hours=1)
        self.assertEqual(len(slots), 2)
        self.assertEqual(slots[0]["actual"], 195)
        self.assertTrue(calls[0][0].endswith("/pt24h"))

    def test_series_rejects_a_direction_it_has_no_path_for(self):
        with self.assertRaises(ValueError):
            FakeGrid().series("sideways")

    def test_generation_mix_sorts_by_share(self):
        mix = FakeGrid().generation_mix()
        self.assertEqual(mix["from"], "2026-09-29T03:30Z")
        self.assertEqual(mix["mix"][0], {"fuel": "wind", "percent": 48.0})
        self.assertEqual(len(mix["mix"]), len(MIX))
        self.assertAlmostEqual(sum(entry["percent"] for entry in mix["mix"]), 100.0, places=1)

    def test_regions_are_flattened_and_mixed_in(self):
        rows = FakeGrid().regions()
        self.assertEqual(len(rows), len(REGIONS))
        self.assertEqual(rows[0]["short_name"], "London")
        self.assertEqual(rows[0]["band"], "moderate")
        self.assertEqual(rows[0]["mix"][0]["fuel"], "wind")

    def test_region_by_id(self):
        client = FakeGrid()
        self.assertEqual(client.region(8)["short_name"], "West Midlands")
        self.assertIsNone(client.region(99))
        with self.assertRaises(ValueError):
            client.region("London")

    def test_region_for_a_postcode(self):
        region = FakeGrid().region_for_postcode("SW1A 1AA")
        self.assertEqual(region["short_name"], "London")
        self.assertEqual(region["outward_code"], "SW1A")
        self.assertEqual(region["forecast"], 121)

    def test_a_postcode_the_feed_does_not_hold_is_none_not_a_failure(self):
        from a2a_kit import UpstreamError

        def failing(url, params, headers):
            raise UpstreamError("GRID request failed: HTTP Error 400: Bad Request")

        client = GridClient(fetch=failing)
        self.assertIsNone(client.region_for_postcode("ZZ99"))

    def test_regions_with_an_unexpected_payload(self):
        from a2a_kit import UpstreamError

        client = FakeGrid(regional={"data": None})
        with self.assertRaises(UpstreamError):
            client.regions()


class ParseTests(unittest.TestCase):
    def message(self, text):
        return {"parts": [{"kind": "text", "text": text}]}

    def test_default_is_now(self):
        for text in ("how dirty is the grid right now?", "grid now", "hello"):
            self.assertEqual(parse(self.message(text))["skill"], "grid-now", text)

    def test_forecast(self):
        request = parse(self.message("what's the carbon intensity forecast for the next 12 hours?"))
        self.assertEqual(request["skill"], "grid-forecast")
        self.assertEqual(request["params"]["hours"], "12")
        self.assertEqual(request["params"]["series"], "forecast")

    def test_a_question_about_the_past_asks_for_actuals(self):
        request = parse(self.message("what was the grid like over the past 6 hours?"))
        self.assertEqual(request["params"]["series"], "actual")
        self.assertEqual(request["params"]["hours"], "6")

    def test_regional(self):
        for text in ("where is the grid dirtiest?", "carbon intensity in the North West",
                     "grid intensity in London?"):
            request = parse(self.message(text))
            self.assertEqual(request["skill"], "grid-regional", text)
        request = parse(self.message("which region is SW1A in?"))
        self.assertEqual(request["params"]["postcode"], "SW1A")

    def test_generation_mix_beats_a_bare_right_now(self):
        for text in ("what is the UK generating right now?",
                     "how much carbon is the UK generating right now?"):
            self.assertEqual(parse(self.message(text))["skill"], "grid-mix", text)


    def test_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(self.message("how dirty is the grid right now?"))["skill"], "grid-now")
        self.assertEqual(parse(self.message("what's the carbon intensity forecast for the next 12 hours?"))["skill"],
                         "grid-forecast")
        self.assertEqual(parse(self.message("where is the grid dirtiest?"))["skill"], "grid-regional")
        self.assertEqual(parse(self.message("what is the UK generating right now?"))["skill"], "grid-mix")

    def test_explicit_json_wins(self):
        message = {"parts": [{"kind": "text", "text": "anything"},
                             {"kind": "data", "data": {"skill": SKILL_CLEAN_WINDOWS,
                                                       "threshold": 100, "hours": 12}}]}
        request = parse(message)
        self.assertEqual(request["skill"], SKILL_CLEAN_WINDOWS)
        self.assertEqual(request["params"]["threshold"], 100)
        self.assertTrue(request["explicit"])

    def test_help_and_postcode_extraction(self):
        self.assertEqual(parse(self.message(""))["skill"], "help")
        self.assertEqual(parse(self.message("what can you do?"))["skill"], "help")
        self.assertEqual(postcode_from_text("which region is SW1A in?"), "SW1A")
        self.assertEqual(postcode_from_text("what about SW1A 1AA?"), "SW1A 1AA")
        self.assertIsNone(postcode_from_text("how dirty is the grid right now?"))


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, client=None, **params):
        agent = GridAgent(client=client or FakeGrid())
        return agent.run({"skill": skill, "params": params, "missing": agent.missing(skill, params)})

    def test_grid_now(self):
        result = self.run_skill("grid-now", client=FakeGrid())
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("91 gCO2/kWh forecast", result["message"])
        self.assertIn("band moderate", result["message"])
        self.assertIn("measured for this half-hour is 97", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertEqual(result["artifact"]["slot"]["forecast"], 91)

    def test_grid_now_when_the_feed_publishes_nothing(self):
        result = self.run_skill("grid-now", client=FakeGrid(now={"data": []}))
        self.assertIn("no half-hour for right now", result["message"])

    def test_grid_forecast(self):
        result = self.run_skill("grid-forecast", client=FakeGrid(), hours=2, limit=4)
        self.assertIn("4 half-hour(s)", result["message"])
        self.assertIn("2026-09-29T03:30Z", result["message"])
        self.assertIn("cleanest 50 gCO2/kWh", result["message"])
        self.assertIn("dirtiest 240", result["message"])
        self.assertEqual(result["artifact"]["series"], "forecast")

    def test_grid_forecast_of_actuals(self):
        result = self.run_skill("grid-forecast", client=FakeGrid(), hours=1, series="actual", limit=2)
        self.assertIn("actual carbon intensity", result["message"])
        self.assertIn("measured 195", result["message"])

    def test_grid_forecast_rejects_a_bad_horizon(self):
        result = self.run_skill("grid-forecast", client=FakeGrid(), hours=200)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("between 1 and 48", result["message"])

    def test_grid_forecast_with_nothing_published(self):
        result = self.run_skill("grid-forecast", client=FakeGrid(forward={"data": []}), hours=4)
        self.assertIn("published no forecast half-hours", result["message"])

    def test_regional_ranks_dirtiest_first(self):
        result = self.run_skill("grid-regional", client=FakeGrid(), limit=3)
        self.assertIn("6 GB region(s)", result["message"])
        self.assertLess(result["message"].index("South Wales"), result["message"].index("North Scotland"))
        self.assertIn("Dirtiest: South Wales at 297", result["message"])
        self.assertIn("Cleanest: North Scotland at 0", result["message"])
        self.assertIn("only publishes the current half-hour", result["message"])
        self.assertEqual(result["artifact"]["count"], len(REGIONS))

    def test_regional_by_name(self):
        result = self.run_skill("grid-regional", client=FakeGrid(), region="West Midlands")
        self.assertIn("West Midlands", result["message"])
        self.assertNotIn("South Wales", result["message"])

    def test_regional_by_a_name_that_is_not_a_region(self):
        result = self.run_skill("grid-regional", client=FakeGrid(), region="Atlantis")
        self.assertIn("No GB region matches", result["message"])
        self.assertIn("NESO publishes", result["message"])

    def test_regional_by_postcode(self):
        result = self.run_skill("grid-regional", client=FakeGrid(), postcode="SW1A 1AA")
        self.assertIn("London region (UKPN London)", result["message"])
        self.assertIn("121 gCO2/kWh", result["message"])
        self.assertIn("wind 48%", result["message"])

    def test_regional_for_a_postcode_the_feed_does_not_hold(self):
        def failing(url, params, headers):
            from a2a_kit import UpstreamError

            raise UpstreamError("GRID request failed: HTTP Error 400: Bad Request")

        result = GridAgent(client=GridClient(fetch=failing)).run(
            {"skill": "grid-regional", "params": {"postcode": "ZZ99"}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("no regional record", result["message"])

    def test_regional_needs_nothing(self):
        agent = GridAgent(client=FakeGrid())
        self.assertEqual(agent.missing("grid-regional", {}), [],
                         "every region is always answerable")

    def test_generation_mix(self):
        result = self.run_skill("grid-mix", client=FakeGrid())
        self.assertIn("wind 48%", result["message"])
        self.assertIn("gas 20.5%", result["message"])
        self.assertIn("% of the mix is wind, solar, hydro, nuclear or biomass", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertEqual(len(result["artifact"]["generation_mix"]["mix"]), len(MIX))

    def test_generation_mix_with_nothing_published(self):
        result = self.run_skill("grid-mix", client=FakeGrid(generation={"data": None}))
        self.assertIn("no generation mix", result["message"])

    def test_help_does_not_touch_the_feed(self):
        client = FakeGrid()
        result = self.run_skill("help", client=client)
        self.assertIn("National Grid ESO", result["message"])
        self.assertIsNone(result["artifact"])
        self.assertEqual(client.reads, [])

    def test_card_and_upstream_failure(self):
        from a2a_kit import UpstreamError

        agent = GridAgent(client=FakeGrid())
        self.assertEqual([skill["id"] for skill in CARD_SKILLS],
                         ["grid-now", "grid-forecast", "grid-regional", "grid-mix", "clean-windows"])
        self.assertEqual(agent.env_prefix, "GRID")
        self.assertEqual(agent.watch_kinds, ())
        self.assertEqual(INTENSITY_BANDS[-1], "very high")
        self.assertEqual(REGION_COUNT, 18)

        class Broken(FakeGrid):
            def now(self):
                raise UpstreamError("the Carbon Intensity API refused that request: no data")

        result = GridAgent(client=Broken()).run({"skill": "grid-now", "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("refused that request", result["message"])


#: Shape copied from a live gateway `a2a_grid_clean_windows` answer over 48 hours.
WINDOWS_PAYLOAD = {
    "dataset": "api.carbonintensity.org.uk",
    "product": "Great Britain carbon intensity forecast (National Energy System Operator)",
    "source": "National Energy System Operator (NESO), carbonintensity.org.uk",
    "series": "forecast",
    "generated_at": "2026-09-29T04:01:32.703Z",
    "window": {"from": "2026-09-29T03:30Z", "to": "2026-10-01T03:30Z", "requested_hours": 48},
    "half_hours_read": 96,
    "threshold": 90,
    "threshold_source": "the boundary between the feed's 'low' and 'moderate' bands",
    "intensity": {"min": 50, "max": 121, "first": 91, "last": 121, "mean": 76.8,
                  "min_band": "low", "max_band": "moderate"},
    "clean_half_hours": 68,
    "clean_share": 70.8,
    "window_count": 2,
    "longest_window": {"start": "2026-09-29T07:00Z", "end": "2026-09-30T16:30Z", "half_hours": 67,
                       "hours": 33.5, "lowest": 50, "lowest_at": "2026-09-30T12:30Z"},
    "windows": [
        {"start": "2026-09-29T06:00Z", "end": "2026-09-29T06:30Z", "half_hours": 1, "hours": 0.5,
         "lowest": 88, "lowest_at": "2026-09-29T06:00Z"},
        {"start": "2026-09-29T07:00Z", "end": "2026-09-29T07:30Z", "half_hours": 1, "hours": 0.5,
         "lowest": 50, "lowest_at": "2026-09-29T07:00Z"},
    ],
    "windows_omitted": 0,
    "cleanest": {"at": "2026-09-30T12:30Z", "value": 50, "band": "low"},
    "dirtiest": {"at": "2026-10-01T03:00Z", "value": 121, "band": "moderate"},
    "bands": list(INTENSITY_BANDS),
}

TOOL_ERROR_TEXT = ("`a2a_grid_clean_windows` failed: the Carbon Intensity API refused that request: "
                   "Please enter a valid start and end datetime")


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class WindowsSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the windows come from the gateway."""

    def windows(self, client=None, gateway=None, **params):
        return GridAgent(client=client or FakeGrid(), gateway=gateway).run(
            {"skill": SKILL_CLEAN_WINDOWS, "params": params, "missing": []})













if __name__ == "__main__":
    unittest.main()
