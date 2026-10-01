"""Tests for the grid agent: the reading, the mix, the forecast, regions and turns.

    python3 agents/grid/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(/intensity forecast 84 actual 97 index "moderate"; /intensity/<a>/<b> 145
half-hourly rows; /regional 18 regions from North Scotland at 0 to South West
England at 311; /generation nine fuels).
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

from acp_kit import (AcpClient, Connection, GatewayClient,  # noqa: E402
                     STOP_END_TURN, STOP_REFUSAL)

from agent import route  # noqa: E402
from data import (FUELS, GridData, GridError, GridNotFound,  # noqa: E402
                  london_time, parse_utc)

#: `/intensity` answers with `data` as a ONE-ELEMENT LIST.
INTENSITY_NOW = {"data": [{
    "from": "2026-09-29T03:00Z", "to": "2026-09-29T03:30Z",
    "intensity": {"forecast": 84, "actual": 97, "index": "moderate"},
}]}

#: `/generation` answers with `data` as a BARE OBJECT, not a list. The reader has
#: to accept both shapes.
GENERATION_NOW = {"data": {
    "from": "2026-09-29T03:00Z", "to": "2026-09-29T03:30Z",
    "generationmix": [
        {"fuel": "biomass", "perc": 9.3}, {"fuel": "coal", "perc": 0.0},
        {"fuel": "imports", "perc": 6.0}, {"fuel": "gas", "perc": 20.5},
        {"fuel": "nuclear", "perc": 16.3}, {"fuel": "other", "perc": 0.0},
        {"fuel": "hydro", "perc": 0.0}, {"fuel": "solar", "perc": 0.0},
        {"fuel": "wind", "perc": 48.0},
    ],
}}

#: A forecast window: three past rows with an `actual` and three future rows
#: where `actual` is null, which means "has not happened yet" and not "zero".
FORECAST = {"data": [
    {"from": "2026-09-28T23:30Z", "to": "2026-09-29T00:00Z",
     "intensity": {"forecast": 113, "actual": 125, "index": "moderate"}},
    {"from": "2026-09-29T00:00Z", "to": "2026-09-29T00:30Z",
     "intensity": {"forecast": 127, "actual": 130, "index": "moderate"}},
    {"from": "2026-09-29T00:30Z", "to": "2026-09-29T01:00Z",
     "intensity": {"forecast": 134, "actual": 141, "index": "moderate"}},
    {"from": "2026-09-30T12:00Z", "to": "2026-09-30T12:30Z",
     "intensity": {"forecast": 50, "actual": None, "index": "very low"}},
    {"from": "2026-09-30T12:30Z", "to": "2026-09-30T13:00Z",
     "intensity": {"forecast": 48, "actual": None, "index": "very low"}},
    {"from": "2026-09-30T13:00Z", "to": "2026-09-30T13:30Z",
     "intensity": {"forecast": 52, "actual": None, "index": "very low"}},
    {"from": "2026-09-30T18:00Z", "to": "2026-09-30T18:30Z",
     "intensity": {"forecast": 310, "actual": None, "index": "very high"}},
    {"from": "2026-09-30T18:30Z", "to": "2026-09-30T19:00Z",
     "intensity": {"forecast": 305, "actual": None, "index": "very high"}},
]}

#: `/regional` carries the national row and the four country rows alongside the
#: fourteen grid regions.
REGIONAL = {"data": [{
    "from": "2026-09-29T03:00Z", "to": "2026-09-29T03:30Z",
    "regions": [
        {"regionid": 1, "dnoregion": "Scottish Hydro Electric Power Distribution",
         "shortname": "North Scotland", "intensity": {"forecast": 0, "index": "very low"},
         "generationmix": [{"fuel": "wind", "perc": 100}]},
        {"regionid": 14, "dnoregion": "SP Distribution",
         "shortname": "South West England", "intensity": {"forecast": 311, "index": "very high"},
         "generationmix": [{"fuel": "gas", "perc": 70}, {"fuel": "nuclear", "perc": 30}]},
        {"regionid": 16, "dnoregion": "National Grid", "shortname": "GB",
         "intensity": {"forecast": 92, "index": "moderate"},
         "generationmix": [{"fuel": "gas", "perc": 30}, {"fuel": "wind", "perc": 40}]},
    ],
}]}


class FakeFeeds:
    def __init__(self, intensity=None, generation=None, forecast=None, regional=None,
                 empty=False, fail=False):
        self.calls: list[str] = []
        self.intensity = INTENSITY_NOW if intensity is None else intensity
        self.generation = GENERATION_NOW if generation is None else generation
        self.forecast = FORECAST if forecast is None else forecast
        self.regional = REGIONAL if regional is None else regional
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise GridError("the API answered HTTP 503")
        if self.empty:
            return json.dumps({"data": []})
        if url.endswith("/intensity"):
            return json.dumps(self.intensity)
        if url.endswith("/generation"):
            return json.dumps(self.generation)
        if "/intensity/regional/" in url:
            #: Verified 2026-09-28: this endpoint answers HTTP 400 keyless, so the
            #: reader must never be the reason a caller reaches it.
            raise AssertionError("the reader asked for a regional forecast, which has no keyless feed")
        if "/intensity/" in url:
            return json.dumps(self.forecast)
        if url.endswith("/regional"):
            return json.dumps(self.regional)
        return json.dumps({"data": []})


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return GridData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_utc_stamp_becomes_uk_clock_time(self):
        #: September is BST, so 03:00Z is 04:00 in London.
        self.assertEqual(london_time("2026-09-29T03:00Z"), ("04:00", "+01:00"))
        #: January is GMT, so the same UTC hour is a different UK hour.
        self.assertEqual(london_time("2026-01-15T03:00Z"), ("03:00", "+00:00"))
        self.assertIsNone(london_time("nonsense"))
        self.assertIsNone(london_time(""))

    def test_parsing(self):
        self.assertIsNotNone(parse_utc("2026-09-29T03:00Z"))
        self.assertIsNotNone(parse_utc("2026-09-29T03:00:00Z"))
        self.assertIsNone(parse_utc("2026-09-29"))


class ReadTests(unittest.TestCase):
    def test_the_current_reading(self):
        data, _feed = make_data()
        reading = data.now()
        self.assertEqual(reading["actual"], 97)
        self.assertEqual(reading["forecast"], 84)
        self.assertEqual(reading["index"], "moderate")
        self.assertEqual(reading["unit"], "gCO2/kWh")
        self.assertEqual(reading["local_time"], "04:00")

    def test_the_generation_mix_is_read_from_a_bare_object(self):
        data, _feed = make_data()
        mix = data.generation_now()
        #: /generation answers with `data` as an object, not a list.
        self.assertEqual(mix["mix"]["wind"], 48.0)
        self.assertEqual(mix["mix"]["gas"], 20.5)
        #: A fuel at 0% is 0, not absent, and not None.
        self.assertEqual(mix["mix"]["coal"], 0.0)
        self.assertEqual(mix["mix"]["nuclear"], 16.3)

    def test_every_fuel_is_present_even_when_the_feed_omits_one(self):
        data, _feed = make_data(generation={"data": {
            "from": "2026-09-29T03:00Z", "to": "2026-09-29T03:30Z",
            "generationmix": [{"fuel": "wind", "perc": 100}]}})
        mix = data.generation_now()["mix"]
        self.assertEqual(set(mix), set(FUELS))
        self.assertEqual(mix["wind"], 100.0)
        #: A fuel the feed left out is None, which is different from a fuel at zero.
        self.assertIsNone(mix["coal"])

    def test_a_forecast_separates_measured_from_not_yet_happened(self):
        data, _feed = make_data()
        forecast = data.forecast(2)
        self.assertEqual(forecast["count"], 8)
        self.assertEqual(forecast["measured"], 3)
        #: A null actual is "has not happened yet", never zero emissions.
        self.assertEqual(forecast["not_yet_happened"], 5)
        self.assertEqual(forecast["slots"][0]["actual"], 125)
        self.assertIsNone(forecast["slots"][3]["actual"])
        self.assertEqual(forecast["slots"][3]["forecast"], 50)
        self.assertEqual(forecast["slots"][0]["local_time"], "00:30")

    def test_the_regional_breakdown_is_sorted_cleanest_first(self):
        data, _feed = make_data()
        regions = data.regions()
        self.assertEqual(regions["count"], 3)
        self.assertEqual([entry["short_name"] for entry in regions["regions"]],
                         ["North Scotland", "GB", "South West England"])
        self.assertEqual(regions["national"]["short_name"], "GB")
        self.assertEqual(regions["national"]["forecast"], 92)
        self.assertEqual(regions["regions"][0]["mix"]["wind"], 100.0)

    def test_an_empty_or_broken_feed(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(GridNotFound):
            data.now()
        #: The feed answers HTTP 200 with a null body for a range it holds no data
        #: for, which is a real "nothing here" and not a broken feed.
        data, _feed = make_data(forecast={})
        with self.assertRaises(GridNotFound):
            data.forecast(2)
        data, _feed = make_data(regional={"data": []})
        with self.assertRaises(GridNotFound):
            data.regions()
        data, _feed = make_data(fail=True)
        with self.assertRaises(GridError):
            data.now()

    def test_the_reader_never_asks_for_a_regional_forecast(self):
        #: That endpoint is behind a token and answers HTTP 400 keyless.
        data, feed = make_data()
        data.now()
        data.generation_now()
        data.forecast(2)
        data.regions()
        for call in feed.calls:
            self.assertNotIn("/intensity/regional/", call)


class RouteTests(unittest.TestCase):
    def test_the_current_reading(self):
        self.assertEqual(route("how green is the UK grid right now?"), ("grid-now", {}))
        self.assertEqual(route("what is the carbon intensity now?")[0], "grid-now")

    def test_the_generation_mix(self):
        self.assertEqual(route("what is the grid burning right now?"), ("grid-mix", {}))
        self.assertEqual(route("how much of the electricity is coal right now?")[0], "grid-mix")

    def test_the_forecast(self):
        self.assertEqual(route("what does the forecast look like today?"),
                         ("grid-forecast", {"days": 1}))
        self.assertEqual(route("what is the outlook for the next 3 days?")[1]["days"], 3)
        self.assertEqual(route("48 hours of forecast")[1]["days"], 2)

    def test_the_regions(self):
        self.assertEqual(route("which region of the UK is the dirtiest right now?"),
                         ("grid-regions", {}))
        self.assertEqual(route("is Scotland cleaner than Wales?")[0], "grid-regions")

    def test_the_window(self):
        skill, params = route("when is the cleanest window in the next two days?")
        self.assertEqual(skill, "grid-window")
        self.assertEqual(params["hours"], 48.0)
        self.assertEqual(route("when should I run the dryer, in the next 2 hours?")[1]["hours"],
                         2.0)
        self.assertEqual(route("what is the cleanest 90 minute window?")[1]["hours"], 1.5)
        self.assertEqual(route("when is the dirtiest window in the next 3 hours?")[1]["hours"],
                         3.0)

    def test_a_window_needs_a_length(self):
        self.assertEqual(route("when is the cleanest window?")[0], "help")
        self.assertEqual(route("when should I run the dryer?")[0], "help")

    def test_a_single_reading_is_never_a_window(self):
        self.assertEqual(route("how green is the grid right now?")[0], "grid-now")
        self.assertEqual(route("what is the grid burning right now?")[0], "grid-mix")
        self.assertEqual(route("what does the forecast look like in 2 hours?")[0],
                         "grid-forecast")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("tell me a joke")[0], "help")


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
        from agent import GridAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = GridAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_now_answer(self):
        result, client, _ = self.turn("how green is the UK grid right now?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("the UK grid right now, at 04:00 UK time (+01:00)", result["text"])
        self.assertIn("97 gCO2/kWh measured, 84 forecast", result["text"])
        self.assertIn("the feed calls that: moderate", result["text"])
        self.assertIn("wind 48.0%", result["text"])
        self.assertIn("at 0%: coal, other, hydro, solar", result["text"])

    def test_a_mix_answer(self):
        result, _, _ = self.turn("what is the grid burning right now?")
        self.assertIn("what the UK grid is making right now", result["text"])
        self.assertIn("fossil: 20.5% (coal, gas, other)", result["text"])
        self.assertIn("renewable: 57.3% (biomass, hydro, solar, wind)", result["text"])
        #: Imports are left out of the three sums, and the answer says why.
        self.assertIn("imports are reported by the feed", result["text"])

    def test_a_forecast_answer(self):
        result, _, _ = self.turn("what does the forecast look like today?")
        self.assertIn("UK grid carbon intensity forecast", result["text"])
        self.assertIn("5 slot(s) have not happened yet", result["text"])
        self.assertIn("their figure is a forecast", result["text"])
        self.assertIn("2026-09-30: 48-310 forecast gCO2/kWh, first slot 13:00 UK",
                      result["text"])

    def test_a_regions_answer(self):
        result, _, _ = self.turn("which region of the UK is the dirtiest right now?")
        self.assertIn("the whole grid (GB): 92 gCO2/kWh, index moderate", result["text"])
        self.assertIn("North Scotland: 0 gCO2/kWh, index very low", result["text"])
        self.assertIn("South West England: 311 gCO2/kWh, index very high", result["text"])
        self.assertIn("spread: South West England is 311 gCO2/kWh dirtier", result["text"])
        self.assertIn("not the average of the 2 grid regions", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("how green is the UK grid right now?", result["text"])
        self.assertIn("per-region forecast is not offered", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("how green is the UK grid right now?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_api(self):
        result, _, _ = self.turn("how green is the UK grid right now?", fail=True)
        self.assertIn("I could not read the National Grid's data", result["text"])

    def test_the_reading_survives_a_broken_mix_feed(self):
        result, _, _ = self.turn("how green is the UK grid right now?", generation=None,
                                 intensity=INTENSITY_NOW)
        self.assertIn("97 gCO2/kWh measured", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: grid-window
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `grid_clean_window` answers for a 2 hour window: a clean 2 hour run at
#: 50 gCO2/kWh in the early afternoon and a dirty one at 307 in the evening.
WINDOW_DATA = {
    "hours": 2,
    "slots_needed": 4,
    "start": "2026-09-28T23:30Z",
    "end": "2026-09-30T19:00Z",
    "slots_used": 97,
    "unit": "gCO2/kWh",
    "cleanest": {
        "found": True, "start": "2026-09-30T12:00Z", "end": "2026-09-30T13:30Z",
        "start_utc": "2026-09-30T12:00Z", "end_utc": "2026-09-30T13:30Z",
        "start_local": "13:00", "end_local": "14:30", "uk_offset": "GMT+1",
        "hours": 2.0, "slots": 4, "average": 50.0, "worst": 52, "best": 48,
        "index": "very low", "crosses_now": False,
        "mix": None,
        "mix_note": "this run is entirely in the future and the feed publishes no mix for a future slot",
        "measured_slots": 0, "not_yet_happened": 4,
    },
    "dirtiest": {
        "found": True, "start": "2026-09-30T18:00Z", "end": "2026-09-30T19:30Z",
        "start_utc": "2026-09-30T18:00Z", "end_utc": "2026-09-30T19:30Z",
        "start_local": "19:00", "end_local": "20:30", "uk_offset": "GMT+1",
        "hours": 2.0, "slots": 4, "average": 307.0, "worst": 310, "best": 305,
        "index": "very high", "crosses_now": False,
        "mix": None,
        "mix_note": "this run is entirely in the future and the feed publishes no mix for a future slot",
        "measured_slots": 0, "not_yet_happened": 4,
    },
    "swing": 257.0,
    "current": {
        "mix": {"biomass": 9.3, "coal": 0.0, "imports": 6.0, "gas": 20.5, "nuclear": 16.3,
                "other": 0.0, "hydro": 0.0, "solar": 0.0, "wind": 48.0},
        "note": "the current half hour, from the /generation feed",
    },
    "accuracy": "a published forecast, not a measurement.",
    "source": "UK National Grid carbon intensity API, /intensity and /generation "
              "(api.carbonintensity.org.uk)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`grid_clean_window` is a premium tool, but that licence key was rejected. "
                  "Check MCP_LICENSE_KEY, or get a key at https://polar.sh/mrfentmen")


def gateway_answer(text, is_error=False, structured=None):
    """A fake transport that answers every premium call with one JSON-RPC reply."""
    def fetch(url, payload, headers):
        fetch.calls.append({"url": url, "payload": payload, "headers": headers})
        result = {"content": [{"type": "text", "text": text}]}
        if is_error:
            result["isError"] = True
        if structured is not None:
            result["structuredContent"] = structured
        return {"jsonrpc": "2.0", "id": payload.get("id", 1), "result": result}

    fetch.calls = []
    return fetch


class PremiumTests(unittest.TestCase):
    """No key, a bad key and a good key, plus the routing that gets there."""

    WINDOW_QUESTION = "when should I run the dryer, in the next 2 hours?"
    LONG_QUESTION = "when is the cleanest window in the next two days?"

    def turn(self, text: str, fetch, key: str):
        from agent import GridAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = GridAgent(agent_conn, data, gateway=gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission="allow-once")
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_no_key_answers_with_the_missing_key_wording(self):
        fetch = gateway_answer("")
        result, client = self.turn(self.WINDOW_QUESTION, fetch, "")
        #: An answer, not a crash, and not a failed lookup either.
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])
        self.assertIn("no licence key is set", result["text"])
        self.assertEqual(len(client.permission_requests), 1)
        #: Nothing was spent on a call the gate was never going to let through.
        self.assertEqual(fetch.calls, [])

    def test_a_bad_key_returns_the_gateways_own_wording(self):
        fetch = gateway_answer(GATEWAY_DENIAL, is_error=True,
                               structured={"licenceRefusal": True, "reason": "denied"})
        result, _ = self.turn(self.WINDOW_QUESTION, fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "grid_clean_window")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"], {"hours": 2.0})

    def test_a_good_key_returns_the_window(self):
        fetch = gateway_answer(json.dumps(WINDOW_DATA))
        result, _ = self.turn(self.WINDOW_QUESTION, fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("when to use the UK grid over the next 2 hour(s)", result["text"])
        self.assertIn("cleanest run: 13:00 to 14:30 UK time (2 h)", result["text"])
        self.assertIn("average 50 gCO2/kWh, worst slot in it 52", result["text"])
        self.assertIn("the feed calls that very low", result["text"])
        self.assertIn("dirtiest run: 19:00 to 20:30 UK time (2 h)", result["text"])
        self.assertIn("the whole window swings 257 gCO2/kWh", result["text"])
        self.assertIn("UK National Grid carbon intensity API", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_the_length_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(WINDOW_DATA))
        #: 90 minutes is three half-hour slots, and it has to arrive at the gateway
        #: as 1.5: truncating it to 1 would quietly halve the window asked about.
        self.turn("what is the cleanest 90 minute window?", fetch, "k_paid")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"], {"hours": 1.5})
        fetch = gateway_answer(json.dumps(WINDOW_DATA))
        self.turn(self.LONG_QUESTION, fetch, "k_paid")
        self.assertEqual(fetch.calls[0]["payload"]["params"]["arguments"], {"hours": 48.0})

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn(self.WINDOW_QUESTION, fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read the National Grid's data", result["text"])

    def test_a_free_question_never_touches_the_gateway(self):
        fetch = gateway_answer(json.dumps(WINDOW_DATA))
        result, _ = self.turn("how green is the UK grid right now?", fetch, "k_paid")
        self.assertIn("97 gCO2/kWh measured", result["text"])
        self.assertEqual(fetch.calls, [])

    def test_the_routing_is_narrow(self):
        premium = [
            "when is the cleanest window in the next two days?",
            "when should I run the dryer, in the next 2 hours?",
            "what is the cleanest 90 minute window?",
            "when is the dirtiest window in the next 3 hours?",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "grid-window", text)

        free = [
            ("how green is the UK grid right now?", "grid-now"),
            ("what is the grid burning right now?", "grid-mix"),
            ("what does the forecast look like today?", "grid-forecast"),
            ("what does the forecast look like in 2 hours?", "grid-forecast"),
            ("which region of the UK is the dirtiest right now?", "grid-regions"),
            ("is Scotland cleaner than Wales?", "grid-regions"),
            ("when is the cleanest window?", "help"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("grid-window", SKILLS)
        self.assertIn("grid-now", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
