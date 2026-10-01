"""Tests for the asteroids agent: a window, the hazardous ones, a lookup and the turns.

    python3 agents/asteroids/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(a 7-day window returned 31 objects, 4 hazardous, 2 on the Sentry list; 523934
(1998 FF14) = 0.2007-0.4488 km across, closest approach 2026-09-28 at
15393500.9 km = 0.1029 AU = 40.03 lunar distances, 23.4785 km/s; the detail endpoint
returns the object at the TOP LEVEL, not under `object`, with 16 approaches from 1925
to 2179).
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

from agent import route, span_from_text  # noqa: E402
from data import (LUNAR_DISTANCE_KM, MAX_DAYS, AsteroidData, AsteroidError,  # noqa: E402
                  AsteroidNotFound, AsteroidRateLimited, designation_in, window_dates)


def approach(date, miss_km, au, lunar, km_s=23.4785):
    return {"close_approach_date": date, "close_approach_date_full": f"{date} 13:19",
            "epoch_date_close_approach": 1790601540000, "orbiting_body": "Earth",
            "miss_distance": {"astronomical": str(au), "kilometers": str(miss_km),
                              "lunar": str(lunar), "miles": str(miss_km / 1.609344)},
            "relative_velocity": {"kilometers_per_hour": str(km_s * 3600.0),
                                  "kilometers_per_second": str(km_s),
                                  "miles_per_hour": str(km_s * 2236.94)}}


def neo(name, date, miss_km, au, lunar, low=None, high=None, hazardous=False,
        sentry=False, object_id=1, extra_approaches=()):
    diameter = {"kilometers": {"estimated_diameter_min": low, "estimated_diameter_max": high},
                "feet": {"estimated_diameter_min": 100.0, "estimated_diameter_max": 200.0},
                "meters": {}, "miles": {}}
    return {"id": object_id, "name": name, "designation": None,
            "absolute_magnitude_h": 20.61, "is_potentially_hazardous_asteroid": hazardous,
            "is_sentry_object": sentry, "estimated_diameter": diameter,
            "close_approach_data": [approach(date, miss_km, au, lunar)] + list(extra_approaches),
            "nasa_jpl_url": f"https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr={object_id}",
            "neo_reference_id": object_id}


FF14 = neo("523934 (1998 FF14)", "2026-09-28", 15393500.9, 0.1029, 40.0278,
           0.2007035141, 0.4487867009, hazardous=True, object_id=2523934)
SMALL = neo("2026 AB1", "2026-09-28", 3000000.0, 0.02, 7.8, 0.05, 0.12, object_id=11)
FAR = neo("2026 XY9", "2026-09-29", 40000000.0, 0.267, 104.0, 1.9, 4.4, sentry=True, object_id=22)

#: The date keys really do come back unordered, so the reader has to sort them.
FEED = {"element_count": 3, "links": {"self": "..."}, "near_earth_objects": {
    "2026-09-29": [FAR],
    "2026-09-28": [SMALL, FF14],
}}

#: The detail endpoint puts the object at the top level, not under `object`.
DETAIL = {
    "id": 2523934, "name": "523934 (1998 FF14)", "designation": "523934",
    "absolute_magnitude_h": 20.61, "is_potentially_hazardous_asteroid": True,
    "is_sentry_object": False, "neo": None,
    "estimated_diameter": {"kilometers": {"estimated_diameter_min": 0.2007035141,
                                          "estimated_diameter_max": 0.4487867009}},
    "orbital_data": {"orbit_id": "a", "epoch_mjd": "61000"},
    "close_approach_data": [
        approach("1925-09-15", 24602864.6, 0.1644, 63.97, 20.92),
        approach("2026-09-28", 15393500.9, 0.1029, 40.03),
        approach("2179-10-02", 41100000.0, 0.2747, 106.9, 22.0),
    ],
}


class FakeNeo:
    def __init__(self, feed=None, detail=None, empty=False, fail=None):
        self.calls: list[dict] = []
        self.feed = FEED if feed is None else feed
        self.detail = DETAIL if detail is None else detail
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str, params: dict):
        self.calls.append(dict(params or {}))
        if self.fail == "dead":
            raise AsteroidError("request failed: connection refused")
        if self.fail == "rate":
            raise AsteroidRateLimited(
                "NASA's shared DEMO_KEY is rate-limited to 30 requests an hour per address "
                "and this call was refused (HTTP 429). Put a free key from "
                "https://api.nasa.gov/ in NASA_API_KEY and ask again")
        if self.fail == "seven_day":
            raise AsteroidError("NASA's feed takes at most 7 days at a time, so the window "
                                "was cut to 7 days: Date Format Exception - The Feed date "
                                "limit is only 7 Days")
        if self.fail == "not_json":
            return "<html>not json</html>"
        #: The feed URL itself contains "/neo/", so the detail branch has to match the
        #: longer path or every feed read is answered with an object instead.
        if url.endswith(tuple(str(n) for n in range(10))) and "/neo/rest/v1/neo/" in url:
            return json.dumps(self.detail)
        if self.empty:
            return json.dumps({"element_count": 0, "near_earth_objects": {}})
        return json.dumps(self.feed)


def make_data(**kw):
    feed = FakeNeo(**kw)
    return AsteroidData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_window_is_never_longer_than_seven_days(self):
        #: NASA answers HTTP 400 above 7 days, so the span is cut here, not sent.
        start, end = window_dates(days=30)
        self.assertEqual((datetime.date.fromisoformat(end)
                          - datetime.date.fromisoformat(start)).days + 1, MAX_DAYS)
        start, end = window_dates(days=3)
        self.assertEqual((datetime.date.fromisoformat(end)
                          - datetime.date.fromisoformat(start)).days + 1, 3)
        #: Reversed dates are put the right way round, then still capped at 7.
        start, end = window_dates("2026-01-10", "2026-01-01")
        self.assertEqual((start, end), ("2026-01-01", "2026-01-07"))
        self.assertEqual(window_dates("rubbish", None)[0],
                         datetime.date.today().isoformat())

    def test_a_designation_is_read_from_the_question(self):
        self.assertEqual(designation_in("how big is 2026 AB?"), "2026 AB")
        self.assertEqual(designation_in("tell me about 523934"), "523934")
        self.assertEqual(designation_in("what about (1998 FF14)?"), "1998 FF14")
        self.assertIsNone(designation_in("which asteroids pass Earth this week?"))

    def test_the_span_a_question_asks_for(self):
        self.assertEqual(span_from_text("this week")["days"], 7)
        self.assertEqual(span_from_text("over the next 3 days")["days"], 3)
        self.assertEqual(span_from_text("this month")["days"], MAX_DAYS)
        self.assertEqual(span_from_text("the last 2 weeks")["days"], MAX_DAYS)

    def test_the_moon_distance_scale_is_a_real_number(self):
        self.assertEqual(LUNAR_DISTANCE_KM, 384400.0)


class ReadTests(unittest.TestCase):
    def test_a_window_is_grouped_by_day_and_sorted(self):
        data, feed = make_data()
        overview = data.feed("2026-09-28", "2026-10-04")
        self.assertEqual(feed.calls[-1]["start_date"], "2026-09-28")
        self.assertEqual(feed.calls[-1]["end_date"], "2026-10-04")
        #: The feed sent 2026-09-29 first; the reader sorts rather than echoing it.
        self.assertEqual([day["date"] for day in overview["days"]],
                         ["2026-09-28", "2026-09-29"])
        self.assertEqual(overview["count"], 3)
        self.assertEqual(overview["hazardous"], 1)
        self.assertEqual(overview["sentry"], 1)
        self.assertEqual(overview["days"][0]["count"], 2)
        #: Inside a day, nearest first: 3.0e6 km before 1.5e7 km.
        first_day = [r for r in overview["records"] if r["approach_date"] == "2026-09-28"]
        self.assertEqual([row["name"] for row in first_day],
                         ["2026 AB1", "523934 (1998 FF14)"])

    def test_a_diameter_is_a_range_not_a_point(self):
        data, _feed = make_data()
        rows = {row["name"]: row for row in data.feed("2026-09-28", "2026-10-04")["records"]}
        row = rows["523934 (1998 FF14)"]
        self.assertAlmostEqual(row["diameter_km_min"], 0.2007035141)
        self.assertAlmostEqual(row["diameter_km_max"], 0.4487867009)
        self.assertAlmostEqual(row["diameter_km"], (0.2007035141 + 0.4487867009) / 2)

    def test_a_lookup_matches_a_name_or_a_number(self):
        data, feed = make_data()
        row = data.lookup("523934", "2026-09-28", "2026-10-04")
        self.assertEqual(row["name"], "523934 (1998 FF14)")
        row = data.lookup("2026 AB1", "2026-09-28", "2026-10-04")
        self.assertEqual(row["name"], "2026 AB1")

    def test_an_object_outside_the_window_says_so(self):
        data, _feed = make_data()
        with self.assertRaises(AsteroidNotFound) as caught:
            data.lookup("2026 ZZ9", "2026-09-28", "2026-10-04")
        self.assertIn("only publishes objects that come close", str(caught.exception))
        with self.assertRaises(ValueError):
            data.lookup("   ")

    def test_the_detail_object_is_at_the_top_level(self):
        data, feed = make_data()
        row = data.detail("2523934")
        self.assertIn("api_key", feed.calls[-1])
        self.assertEqual(row["name"], "523934 (1998 FF14)")
        self.assertEqual(row["designation"], "523934")
        self.assertEqual(row["approach_count"], 3)
        self.assertEqual(row["earliest_approach"], "1925-09-15")
        self.assertAlmostEqual(row["closest"]["miss_km"], 15393500.9)

    def test_an_empty_window_is_a_real_answer(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(AsteroidNotFound) as caught:
            data.feed("2026-09-28", "2026-10-04")
        self.assertIn("empty window is a real answer", str(caught.exception))

    def test_a_rate_limited_key_is_said_plainly_and_not_retried(self):
        data, feed = make_data(fail="rate")
        with self.assertRaises(AsteroidRateLimited) as caught:
            data.feed("2026-09-28", "2026-10-04")
        self.assertIn("NASA_API_KEY", str(caught.exception))
        self.assertIn("30 requests an hour", str(caught.exception))
        self.assertEqual(len(feed.calls), 1)

    def test_a_window_over_seven_days_is_never_sent(self):
        #: NASA answers HTTP 400 above 7 days, so the reader cuts the window itself
        #: rather than passing a month to the feed and surfacing the error page.
        data, feed = make_data()
        data.feed("2026-09-20", "2026-10-19")
        start = datetime.date.fromisoformat(feed.calls[-1]["start_date"])
        end = datetime.date.fromisoformat(feed.calls[-1]["end_date"])
        self.assertEqual((end - start).days + 1, MAX_DAYS)

    def test_a_feed_that_is_not_json(self):
        data, _feed = make_data(fail="not_json")
        with self.assertRaises(AsteroidError):
            data.feed("2026-09-28", "2026-10-04")

    def test_a_dead_feed(self):
        data, _feed = make_data(fail="dead")
        with self.assertRaises(AsteroidError):
            data.feed("2026-09-28", "2026-10-04")


class RouteTests(unittest.TestCase):
    def test_a_window_question(self):
        skill, params = route("which asteroids pass Earth this week?")
        self.assertEqual(skill, "asteroids-window")
        self.assertEqual((datetime.date.fromisoformat(params["end_date"])
                          - datetime.date.fromisoformat(params["start_date"])).days + 1, 7)

    def test_a_hazardous_question(self):
        self.assertEqual(route("any hazardous asteroids passing this month?")[0],
                         "asteroids-hazardous")

    def test_a_lookup_question(self):
        self.assertEqual(route("how big is 2026 AB?")[0], "asteroids-lookup")
        self.assertEqual(route("tell me about 523934")[0], "asteroids-lookup")

    def test_a_history_question(self):
        self.assertEqual(route("has 523934 ever come this close before?")[0],
                         "asteroids-approach-history")
        self.assertEqual(route("which asteroids are the riskiest this week?")[0],
                         "asteroids-approach-history")

    def test_help_and_nonsense(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Kansas?")[0], "help")


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
        from agent import AsteroidsAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = AsteroidsAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_free_window_answer(self):
        result, client, _ = self.turn("which asteroids pass Earth this week?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("3 object(s) in the window, 1 flagged potentially hazardous", result["text"])
        self.assertIn("1 on the Sentry list", result["text"])
        self.assertIn("523934 (1998 FF14)", result["text"])
        self.assertIn("0.201-0.449 km across", result["text"])
        self.assertIn("40.03 Moon distances", result["text"])
        self.assertIn("not a prediction of an impact", result["text"])

    def test_a_hazardous_only_answer_shows_only_those(self):
        result, _, _ = self.turn("any hazardous asteroids passing this month?")
        self.assertIn("potentially hazardous close approaches NASA lists", result["text"])
        self.assertIn("523934 (1998 FF14)", result["text"])
        #: The non-hazardous object is left out entirely, day line included.
        self.assertNotIn("2026 XY9", result["text"])
        self.assertNotIn("2026-09-29:", result["text"])
        self.assertIn("1 hazardous object(s) only", result["text"])

    def test_a_rate_limited_key_is_answered_not_hidden(self):
        result, _, _ = self.turn("which asteroids pass Earth this week?", fail="rate")
        self.assertIn("I could not read NASA's NEO feed", result["text"])
        self.assertIn("NASA_API_KEY", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Near-Earth Object feed", result["text"])
        self.assertIn("at most 7 days", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied(self):
        result, _, _ = self.turn("which asteroids pass Earth this week?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)

    def test_a_dead_feed(self):
        result, _, _ = self.turn("which asteroids pass Earth this week?", fail="dead")
        self.assertIn("I could not read NASA's NEO feed", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: asteroids-approach-history
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `asteroids_approach_history_board` answers for a 7-day window.
HISTORY_DATA = {
    "start_date": "2026-09-28",
    "end_date": "2026-10-04",
    "objects_ranked": 3,
    "approaches_read": 42,
    "closer_than_window": 5,
    "objects": [
        {"name": "523934 (1998 FF14)", "designation": "523934",
         "window_approach_date": "2026-09-28", "window_miss_km": 15393500.9,
         "closest_ever_km": 15393500.9, "closest_ever_date": "2026-09-28", "years_ago": 0.0,
         "approach_count": 16, "first_approach_date": "1925-09-15",
         "last_approach_date": "2179-10-02", "been_closer": "no - this window is the closest "
         "on record", "diameter_km_min": 0.2007, "diameter_km_max": 0.4488,
         "hazardous": True, "sentry": False},
        {"name": "2026 AB1", "designation": None,
         "window_approach_date": "2026-09-28", "window_miss_km": 3000000.0,
         "closest_ever_km": 1200000.0, "closest_ever_date": "1961-04-02", "years_ago": 65.4,
         "approach_count": 4, "first_approach_date": "1961-04-02",
         "last_approach_date": "2026-09-28", "been_closer": "yes, 4 time(s) in the record",
         "diameter_km_min": 0.05, "diameter_km_max": 0.12, "hazardous": False, "sentry": False},
    ],
    "source": "NASA Near-Earth Object feed (api.nasa.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`asteroids_approach_history_board` is a premium tool, but that licence key "
                  "was rejected. Check MCP_LICENSE_KEY, or get a key at "
                  "https://polar.sh/mrfentmen")


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
        from agent import AsteroidsAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = AsteroidsAgent(agent_conn, data, gateway=gateway)
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
        result, client = self.turn("has 523934 ever come this close before?", fetch, "")
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
        result, _ = self.turn("has 523934 ever come this close before?", fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"],
                         "asteroids_approach_history_board")

    def test_a_good_key_returns_the_history(self):
        fetch = gateway_answer(json.dumps(HISTORY_DATA))
        result, _ = self.turn("has 523934 ever come this close before?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("3 object(s) ranked, 42 recorded approach(es) read", result["text"])
        self.assertIn("closest ever: 15393501 km on 2026-09-28", result["text"])
        self.assertIn("recorded approaches: 16, from 1925-09-15 to 2179-10-02", result["text"])
        self.assertIn("no - this window is the closest", result["text"])
        self.assertIn("yes, 4 time(s) in the record", result["text"])
        self.assertIn("5 of 42", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_the_window_asked_for_is_the_window_sent(self):
        fetch = gateway_answer(json.dumps(HISTORY_DATA))
        self.turn("which asteroids are the riskiest over the next 3 days?", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        start = datetime.date.fromisoformat(arguments["start_date"])
        end = datetime.date.fromisoformat(arguments["end_date"])
        self.assertEqual((end - start).days + 1, 3)
        self.assertNotIn("designation", arguments)

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("has 523934 ever come this close before?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read NASA's NEO feed", result["text"])

    def test_the_routing_is_narrow(self):
        premium = [
            "has 523934 ever come this close before?",
            "which asteroids are the riskiest this week?",
            "what is the close-approach history for near earth objects this week?",
            "which near earth objects are on the Sentry risk list?",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "asteroids-approach-history", text)

        free = [
            ("which asteroids pass Earth this week?", "asteroids-window"),
            ("any hazardous asteroids passing this month?", "asteroids-hazardous"),
            ("how big is 2026 AB?", "asteroids-lookup"),
            ("tell me about 523934", "asteroids-lookup"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("asteroids-approach-history", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
