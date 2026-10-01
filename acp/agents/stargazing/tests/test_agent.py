"""Tests for the stargazing agent: tonight, the run, a comparison, routing and turns.

    python3 agents/stargazing/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(product 'astro', init '2026092818' = 2026-09-28 18:00 UTC, 24 slots of 3 hours; slot
timepoint 3 = cloudcover 9, seeing 7, transparency 5, lifted_index 10, temp2m 15).
"""

from __future__ import annotations

import datetime
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

from agent import hours_from_text, route  # noqa: E402
from data import (SLOT_HOURS, SLOTS, StargazingData, StargazingError,  # noqa: E402
                  StargazingNotFound, coordinates_from_text, describe_cloud,
                  describe_seeing, describe_transparency, parse_init, place_from_text)


def slot(timepoint, cloud, seeing, transparency, **extra):
    row = {"timepoint": timepoint, "cloudcover": cloud, "seeing": seeing,
           "transparency": transparency, "lifted_index": 6, "rh2m": 12, "temp2m": 15,
           "wind10m": {"direction": "N", "speed": 3}, "prec_type": "none"}
    row.update(extra)
    return row


#: The live shape: 24 slots, three hours apart, cloud mostly 9 and a couple of bad ones.
DATASERIES = [
    slot(3, 9, 7, 5), slot(6, 9, 7, 5), slot(9, 7, 7, 5), slot(12, 7, 7, 4),
    slot(15, 9, 7, 7), slot(18, 9, 7, 6), slot(21, 9, 6, 4), slot(24, 9, 7, 3),
]
PAYLOAD = {"product": "astro", "init": "2026092818", "dataseries": DATASERIES}

#: A second point with a genuinely different sky, for the comparison skill.
CLOUDY = {"product": "astro", "init": "2026092818", "dataseries": [
    slot(3, 2, 3, 2), slot(6, 1, 2, 1), slot(9, 3, 4, 2), slot(12, 2, 3, 1),
]}

#: A slot with the fields missing - 7Timer omits them rather than sending zero.
SPARSE = {"product": "astro", "init": "2026092818", "dataseries": [
    {"timepoint": 3, "cloudcover": None, "seeing": None, "transparency": None},
]}


class Fake7Timer:
    def __init__(self, payload=None, empty=False, fail=False, error=None):
        self.calls: list[dict] = []
        self.payload = PAYLOAD if payload is None else payload
        self.empty = empty
        self.fail = fail
        self.error = error

    def __call__(self, url: str, params: dict):
        self.calls.append(dict(params or {}))
        if self.fail:
            raise StargazingError("7Timer is unreachable")
        if self.error is not None:
            return json.dumps(self.error)
        if self.empty:
            return json.dumps({"product": "astro", "init": "2026092818", "dataseries": []})
        return json.dumps(self.payload)


def make_data(**kw):
    feed = Fake7Timer(**kw)
    return StargazingData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_every_index_runs_bigger_is_better(self):
        #: The trap in this feed: cloud cover 1 is fully covered, 9 is no cloud at all.
        self.assertEqual(describe_cloud(1), "fully covered")
        self.assertEqual(describe_cloud(9), "no cloud at all")
        self.assertEqual(describe_seeing(8), "very good")
        self.assertEqual(describe_transparency(7), "excellent")
        self.assertEqual(describe_cloud(None), "not reported")
        self.assertEqual(describe_seeing("x"), "not reported")

    def test_init_is_a_clock_utc_not_an_hour_of_the_day(self):
        started = parse_init("2026092818")
        self.assertEqual(started, datetime.datetime(2026, 9, 28, 18, 0,
                                                    tzinfo=datetime.timezone.utc))
        #: A timepoint is hours AFTER init, so timepoint 3 in that run is 21:00 UTC.
        self.assertEqual((started + datetime.timedelta(hours=3)).hour, 21)
        self.assertIsNone(parse_init("202609281"))
        self.assertIsNone(parse_init("rubbish"))
        self.assertIsNone(parse_init(None))

    def test_the_run_is_72_hours_of_24_slots(self):
        self.assertEqual((SLOTS, SLOT_HOURS), (24, 3))
        self.assertEqual(SLOTS * SLOT_HOURS, 72)

    def test_a_place(self):
        latitude, longitude, label = place_from_text("is tonight good in New York?")
        self.assertAlmostEqual(latitude, 40.7128)
        self.assertEqual(label, "New York, New York")
        self.assertIsNone(place_from_text("is tonight good in Reykjavik?"))

    def test_coordinates_with_compass_letters(self):
        self.assertEqual(coordinates_from_text("at 51.5N, 0.1W"), (51.5, -0.1))
        self.assertEqual(coordinates_from_text("at 33.9S, 151.2E"), (-33.9, 151.2))
        self.assertEqual(coordinates_from_text("near 40.7 -74.0"), (40.7, -74.0))
        self.assertIsNone(coordinates_from_text("is tonight good?"))

    def test_how_far_ahead_the_question_looks(self):
        self.assertEqual(hours_from_text("over the next 24 hours"), 24)
        self.assertEqual(hours_from_text("next 6 h"), 6)
        self.assertEqual(hours_from_text("three day forecast for London"), 72)
        self.assertEqual(hours_from_text("tonight in New York"), 12)
        #: A silly request is bounded rather than obeyed.
        self.assertEqual(hours_from_text("over the next 900 hours"), 72)


class ReadTests(unittest.TestCase):
    def test_the_run_is_read_with_real_timestamps(self):
        data, feed = make_data()
        run = data.forecast(40.7, -73.9)
        self.assertEqual(feed.calls[-1], {"lon": "-73.9000", "lat": "40.7000",
                                          "product": "astro", "output": "json"})
        self.assertEqual(run["count"], 8)
        self.assertEqual(run["slot_hours"], 3)
        self.assertEqual(run["started_utc"], "2026-09-28T18:00:00+00:00")
        self.assertEqual(run["slots"][0]["utc"], "2026-09-28T21:00:00Z")
        self.assertEqual(run["slots"][0]["timepoint"], 3)
        self.assertEqual(run["horizon_hours"], 24)
        #: This product says nothing about the Moon, and saying so is the point.
        self.assertFalse(run["covers_moon"])
        self.assertEqual(run["slots"][0]["precipitation"], "none forecast")

    def test_a_precipitation_word_is_kept(self):
        data, _feed = make_data(payload={"product": "astro", "init": "2026092818",
                                         "dataseries": [slot(3, 8, 6, 5, prec_type="rain")]})
        run = data.forecast(40.7, -73.9)
        self.assertEqual(run["slots"][0]["precipitation"], "rain")

    def test_slots_are_sorted_even_if_the_feed_is_not(self):
        shuffled = {"product": "astro", "init": "2026092818",
                    "dataseries": [slot(9, 7, 7, 5), slot(3, 9, 7, 5)]}
        data, _feed = make_data(payload=shuffled)
        run = data.forecast(40.7, -73.9)
        self.assertEqual([row["timepoint"] for row in run["slots"]], [3, 9])

    def test_a_slot_with_missing_fields_is_kept_and_says_not_reported(self):
        data, _feed = make_data(payload=SPARSE)
        run = data.forecast(40.7, -73.9)
        self.assertEqual(run["count"], 1)
        self.assertIsNone(run["slots"][0]["cloudcover"])

    def test_an_impossible_point_is_rejected(self):
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.forecast(91.0, 0.0)

    def test_no_forecast_is_a_real_answer(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(StargazingNotFound):
            data.forecast(40.7, -73.9)
        data, _feed = make_data(error={"error": "no data for that point"})
        with self.assertRaises(StargazingNotFound):
            data.forecast(40.7, -73.9)

    def test_a_dead_7timer(self):
        data, _feed = make_data(fail=True)
        with self.assertRaises(StargazingError):
            data.forecast(40.7, -73.9)


class RouteTests(unittest.TestCase):
    def test_tonight(self):
        self.assertEqual(route("is tonight good for stargazing in New York?"),
                         ("stargazing-tonight", {"latitude": 40.7128, "longitude": -74.006,
                                                 "label": "New York, New York", "hours": 12}))
        self.assertEqual(route("what is the cloud cover in Chicago tonight?")[0],
                         "stargazing-tonight")

    def test_the_whole_run(self):
        self.assertEqual(route("three day stargazing forecast for London")[0],
                         "stargazing-forecast")
        self.assertEqual(route("stargazing forecast in Berlin over the next 72 hours")[0],
                         "stargazing-forecast")

    def test_two_places(self):
        skill, params = route("compare stargazing in New York and Los Angeles tonight")
        self.assertEqual(skill, "stargazing-compare")
        self.assertEqual([place["label"] for place in params["places"]],
                         ["New York, New York", "Los Angeles, California"])

    def test_the_best_window(self):
        self.assertEqual(route("when is the best time to stargaze in New York tonight?")[0],
                         "stargazing-best-window")
        self.assertEqual(route("which hour is clearest in London?")[0],
                         "stargazing-best-window")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("how deep is the water table in Kansas?")[0], "help")
        self.assertEqual(route("is tonight good in Reykjavik?")[0], "help")


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
        from agent import StargazingAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = StargazingAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_answer_reads_the_indices_the_right_way_up(self):
        result, client, _ = self.turn("is tonight good for stargazing in New York?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("New York, New York over the next 12 h", result["text"])
        self.assertIn("2026-09-28T21:00:00Z UTC  cloud 9 (no cloud at all)", result["text"])
        self.assertIn("seeing 7 (good)", result["text"])
        self.assertIn("transparency 5 (average)", result["text"])
        self.assertIn("bigger is better", result["text"])
        self.assertIn("no moon phase in this product", result["text"])

    def test_the_whole_run_is_printed_when_three_days_are_asked_for(self):
        result, _, _ = self.turn("three day stargazing forecast for London")
        self.assertIn("8 slot(s) of 3 h", result["text"])
        self.assertIn("London, United Kingdom (51.5074, -0.1278) stargazing forecast",
                      result["text"])
        self.assertIn("2026-09-29T18:00:00Z UTC  cloud 9", result["text"])

    def test_a_low_cloud_cover_is_a_bad_night_not_a_clear_one(self):
        result, _, _ = self.turn("stargazing in New York", payload=CLOUDY)
        self.assertIn("cloud 2 (almost completely covered)", result["text"])
        self.assertIn("too cloudy", result["text"])

    def test_a_comparison_ranks_by_the_best_slot(self):
        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        from agent import StargazingAgent

        #: Two points, two different skies, two reads of the same feed.
        skies = {"-74.0060": PAYLOAD, "-118.2437": CLOUDY}
        data._fetch = lambda url, params: json.dumps(skies.get(params["lon"], PAYLOAD))
        agent = StargazingAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission="allow-once")
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            result = client.prompt("compare stargazing in New York and Los Angeles tonight",
                                   session_id)
        finally:
            client.stop()
        self.assertIn("Stargazing compared over the next 12 h", result["text"])
        self.assertIn("New York, New York", result["text"])
        self.assertIn("Los Angeles, California", result["text"])
        self.assertIn("cloud cover in these slots: 1 to 3", result["text"])
        self.assertIn("best slot 2026-09-29T03:00:00Z UTC: cloud 3, seeing 4",
                      result["text"])
        self.assertIn("9 is no cloud at all", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("7Timer's astronomical forecast", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("is tonight good for stargazing in New York?",
                                 permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_7timer(self):
        result, _, _ = self.turn("is tonight good for stargazing in New York?", fail=True)
        self.assertIn("I could not read 7Timer's forecast", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: stargazing-best-window
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `stargazing_best_window_board` answers for a clear run over 24 hours.
WINDOW_DATA = {
    "label": "New York, New York",
    "latitude": 40.7128,
    "longitude": -74.006,
    "hours": 24,
    "init": "2026092818",
    "started_utc": "2026-09-28T18:00:00Z",
    "slot_hours": 3,
    "slots_scored": 8,
    "weight_cloud": 0.5,
    "weight_seeing": 0.2,
    "weight_transparency": 0.3,
    "score_scale": "0-1, weighted mean of the three published indices",
    "windows": [
        {"from_utc": "2026-09-28T21:00:00Z", "to_utc": "2026-09-29T00:00:00Z",
         "length_hours": 6, "score": 0.81, "mean_cloudcover": 9, "mean_seeing": 7,
         "mean_transparency": 6, "verdict": "excellent"},
        {"from_utc": "2026-09-28T15:00:00Z", "to_utc": "2026-09-28T18:00:00Z",
         "length_hours": 3, "score": 0.78, "mean_cloudcover": 9, "mean_seeing": 7,
         "mean_transparency": 7, "verdict": "excellent"},
    ],
    "covers_moon": False,
    "source": "7Timer astronomical forecast (www.7timer.info)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`stargazing_best_window_board` is a premium tool, but that licence key was "
                  "rejected. Check MCP_LICENSE_KEY, or get a key at https://polar.sh/mrfentmen")


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

    def turn(self, text: str, fetch, key: str):
        from agent import StargazingAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = StargazingAgent(agent_conn, data, gateway=gateway)
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
        result, client = self.turn("when is the best time to stargaze in New York tonight?",
                                   fetch, "")
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
        result, _ = self.turn("when is the best time to stargaze in New York tonight?",
                              fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"],
                         "stargazing_best_window_board")

    def test_a_good_key_returns_the_ranked_windows(self):
        fetch = gateway_answer(json.dumps(WINDOW_DATA))
        result, _ = self.turn("when is the best time to stargaze in New York tonight?", fetch,
                              "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Observing windows for New York, New York", result["text"])
        self.assertIn("1. 2026-09-28T21:00:00Z to 2026-09-29T00:00:00Z", result["text"])
        self.assertIn("score 0.81", result["text"])
        self.assertIn("9 cloud, 7 seeing, 6 transparency, 6 h long", result["text"])
        self.assertIn("cloud 0.5, seeing 0.2, transparency 0.3", result["text"])
        self.assertIn("a chosen", result["text"])
        self.assertIn("a bright Moon could spoil a window", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_the_window_asked_for_is_the_window_sent(self):
        fetch = gateway_answer(json.dumps(WINDOW_DATA))
        self.turn("which hour is clearest in London over the next 72 hours?", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(arguments["hours"], 72)
        self.assertAlmostEqual(arguments["latitude"], 51.5074)
        self.assertEqual(arguments["label"], "London, United Kingdom")

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("when is the best time to stargaze in New York tonight?", fetch,
                              "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read 7Timer's forecast", result["text"])

    def test_the_routing_is_narrow(self):
        premium = [
            "when is the best time to stargaze in New York tonight?",
            "which hour is clearest in London?",
            "what is the optimal night for stargazing in Berlin?",
            "when should I go out stargazing in Tokyo?",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "stargazing-best-window", text)

        free = [
            ("is tonight good for stargazing in New York?", "stargazing-tonight"),
            ("what is the cloud cover in Chicago tonight?", "stargazing-tonight"),
            ("three day stargazing forecast for London", "stargazing-forecast"),
            ("compare stargazing in New York and Los Angeles tonight", "stargazing-compare"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("stargazing-best-window", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
