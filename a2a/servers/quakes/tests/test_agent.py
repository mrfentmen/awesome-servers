"""Tests for the USGS earthquake server.

    python3 servers/quakes/tests/test_agent.py
"""

from __future__ import annotations

import json
import sys
import unittest
import uuid
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit import (  # noqa: E402
    UNREACHABLE,
    A2AHandler,
    GatewayClient,
    GatewayError,
    PushWatcher,
    TaskStore,
)

from agent import (  # noqa: E402
    CARD_SKILLS,
    CITY_POINTS,
    SKILL_QUAKES_AFTERSHOCKS,
    USGSQuakeAgent,
    detect_city,
    magnitude_from_text,
    parse,
    run_quakes_aftershocks,
    window_from_text,
)
from data import USGSQuakeClient  # noqa: E402

FEATURE = {
    "type": "Feature",
    "id": "us7000abcd",
    "properties": {
        "mag": 4.6,
        "place": "10 km NE of Somewhere, Japan",
        "time": 1790036000000,
        "updated": 1790036600000,
        "tsunami": 0,
        "alert": "green",
        "sig": 326,
        "felt": 12,
        "type": "earthquake",
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
    },
    "geometry": {"type": "Point", "coordinates": [139.7, 35.7, 42.5]},
}
QUAKE = {
    "id": "us7000abcd",
    "magnitude": 4.6,
    "place": "10 km NE of Somewhere, Japan",
    "time": "2026-09-22T00:13:20Z",
    "updated": "2026-09-22T00:23:20Z",
    "depth_km": 42.5,
    "latitude": 35.7,
    "longitude": 139.7,
    "tsunami": 0,
    "alert": "green",
    "significance": 326,
    "felt": 12,
    "type": "earthquake",
    "detail_url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
}
SECOND_QUAKE = dict(QUAKE, id="us7000efgh", time="2026-09-22T01:00:00Z", place="20 km S of Elsewhere", magnitude=5.1)


class FakeQuake(USGSQuakeClient):
    """Same interface as the real client, no network."""

    def __init__(self, quakes=None, counts=None):
        self._quakes = list(quakes if quakes is not None else [QUAKE])
        self._counts = dict(counts or {"last_24h_m2.5": 132, "last_24h_m4.5": 7, "last_7d_m6.0": 4})
        self.calls: list[dict] = []

    def recent_quakes(self, min_magnitude=2.5, hours=24.0, limit=10, order="time"):
        self.calls.append({"kind": "recent", "min_magnitude": min_magnitude, "hours": hours, "limit": limit})
        rows = [row for row in self._quakes if row["magnitude"] >= min_magnitude]
        return rows[:limit]

    def quakes_near(self, point, radius_km=100.0, min_magnitude=1.0, hours=720.0, limit=10):
        self.calls.append({"kind": "near", "point": point, "radius_km": radius_km,
                           "min_magnitude": min_magnitude, "hours": hours, "limit": limit})
        rows = [row for row in self._quakes if row["magnitude"] >= min_magnitude]
        return rows[:limit]

    def counts(self):
        return self._counts

    def freshness(self):
        return "2026-09-22T12:00:00Z"


def message(text, **extra):
    payload = {
        "kind": "message",
        "role": "user",
        "messageId": str(uuid.uuid4()),
        "parts": [{"kind": "text", "text": text}],
    }
    payload.update(extra)
    return payload


class ClientTests(unittest.TestCase):
    def test_check_point(self):
        self.assertEqual(USGSQuakeClient.check_point("35.68, 139.69"), (35.68, 139.69))
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_point("35.68")
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_point("95.0,139.0")

    def test_check_magnitude(self):
        self.assertEqual(USGSQuakeClient.check_magnitude("4.55"), 4.5)
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_magnitude("nope")
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_magnitude("12")

    def test_check_hours_and_radius_and_limit(self):
        self.assertEqual(USGSQuakeClient.check_hours("24"), 24.0)
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_hours("0.1")
        self.assertEqual(USGSQuakeClient.check_radius_km("300"), 300.0)
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_radius_km("0")
        self.assertEqual(USGSQuakeClient.check_limit("5"), 5)
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_limit("1000")

    def test_check_order_and_id(self):
        self.assertEqual(USGSQuakeClient.check_order("Magnitude"), "magnitude")
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_order("random")
        self.assertEqual(USGSQuakeClient.check_id(" us7000abcd "), "us7000abcd")
        with self.assertRaises(ValueError):
            USGSQuakeClient.check_id("!!")

    def test_query_builds_params_and_maps_features(self):
        seen = {}

        def fetch(url, params, headers):
            seen["url"] = url
            seen["params"] = params
            return {"type": "FeatureCollection", "features": [FEATURE]}

        client = USGSQuakeClient(fetch=fetch)
        rows = client.recent_quakes(min_magnitude=4.5, hours=24, limit=10)
        self.assertTrue(seen["url"].endswith("/fdsnws/event/1/query"))
        self.assertEqual(seen["params"]["minmagnitude"], "4.5")
        self.assertEqual(seen["params"]["orderby"], "time")
        self.assertIn("starttime", seen["params"])
        self.assertEqual(rows[0]["id"], "us7000abcd")
        self.assertEqual(rows[0]["magnitude"], 4.6)
        self.assertEqual(rows[0]["depth_km"], 42.5)
        self.assertEqual(rows[0]["time"], "2026-09-22T00:13:20Z")
        self.assertEqual(rows[0]["updated"], "2026-09-22T00:23:20Z")

    def test_count_reads_count_endpoint(self):
        client = USGSQuakeClient(fetch=lambda url, params, headers: {"count": 132, "maxAllowed": 20000})
        self.assertEqual(client.count(2.5, 24), 132)

    def test_bad_payload_raises(self):
        client = USGSQuakeClient(fetch=lambda url, params, headers: {"nope": 1})
        with self.assertRaises(Exception):
            client.recent_quakes()


class TextParsingTests(unittest.TestCase):
    def test_magnitude_variants(self):
        self.assertEqual(magnitude_from_text("any quakes above m4.5?"), 4.5)
        self.assertEqual(magnitude_from_text("magnitude 6 or higher"), 6.0)
        self.assertEqual(magnitude_from_text("big ones 5.0+"), 5.0)
        self.assertIsNone(magnitude_from_text("any earthquakes lately?"))

    def test_window_variants(self):
        self.assertEqual(window_from_text("in the last 3 days"), 72.0)
        self.assertEqual(window_from_text("past week"), 168.0)
        self.assertEqual(window_from_text("last month"), 720.0)
        self.assertIsNone(window_from_text("recently"))

    def test_detect_city_prefers_longest_name(self):
        self.assertEqual(detect_city("quakes near new york please"), "new york")
        self.assertEqual(detect_city("anything near tokyo?"), "tokyo")
        self.assertIsNone(detect_city("anywhere at all"))


class ParseTests(unittest.TestCase):
    def test_recent_by_default(self):
        parsed = parse(message("any earthquakes above magnitude 4.5 in the last 24 hours?"))
        self.assertEqual(parsed["skill"], "quakes-recent")
        self.assertEqual(parsed["params"]["min_magnitude"], 4.5)
        self.assertEqual(parsed["params"]["hours"], 24)

    def test_near_from_point(self):
        parsed = parse(message("quakes within 200 km of 35.68,139.69"))
        self.assertEqual(parsed["skill"], "quakes-near")
        self.assertEqual(parsed["params"]["point"], "35.68,139.69")
        self.assertEqual(parsed["params"]["radius_km"], "200")

    def test_near_from_city(self):
        parsed = parse(message("anything shaking near Lima this month?"))
        self.assertEqual(parsed["skill"], "quakes-near")
        self.assertEqual(parsed["params"]["place"], "lima")
        self.assertEqual(parsed["params"]["point"], f"{CITY_POINTS['lima'][0]},{CITY_POINTS['lima'][1]}")
        self.assertEqual(parsed["params"]["hours"], 720)

    def test_summary(self):
        parsed = parse(message("how many earthquakes today?"))
        self.assertEqual(parsed["skill"], "quakes-summary")
        self.assertTrue(parsed["explicit"])

    def test_watch(self):
        parsed = parse(message("tell me when there is a quake near Tokyo"))
        self.assertEqual(parsed["skill"], "quakes-watch")
        self.assertEqual(parsed["params"]["point"], "35.68,139.69")
        self.assertNotIn("min_magnitude", parsed["params"])

    def test_watch_global_magnitude(self):
        parsed = parse(message("notify me about magnitude 5.5+ quakes"))
        self.assertEqual(parsed["skill"], "quakes-watch")
        self.assertEqual(parsed["params"]["min_magnitude"], 5.5)
        self.assertNotIn("point", parsed["params"])

    def test_days_data_param_becomes_hours(self):
        payload = {
            "kind": "message",
            "role": "user",
            "messageId": "m1",
            "parts": [{"kind": "data", "data": {"skill": "quakes-near", "point": "35.68,139.69", "days": 30}}],
        }
        parsed = parse(payload)
        self.assertEqual(parsed["params"]["hours"], 720.0)
        self.assertEqual(parsed["skill"], "quakes-near")


class AgentTests(unittest.TestCase):
    def test_card_skills_are_complete(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["quakes-recent", "quakes-near", "quakes-summary", "quakes-watch",
                               "quakes-aftershocks"])
        for skill in CARD_SKILLS:
            self.assertTrue(skill["description"])
            self.assertTrue(skill["examples"])

    def test_missing_rules(self):
        agent = USGSQuakeAgent(FakeQuake())
        self.assertEqual(agent.missing("quakes-recent", {}), [])
        self.assertEqual(agent.missing("quakes-summary", {}), [])
        self.assertEqual(agent.missing("quakes-near", {}), ["location"])
        self.assertEqual(agent.missing("quakes-near", {"point": "1,1"}), [])
        self.assertEqual(agent.missing("quakes-watch", {}), ["location or magnitude"])
        self.assertEqual(agent.missing("quakes-watch", {"point": "1,1"}), [])
        self.assertEqual(agent.missing("quakes-watch", {"min_magnitude": 5}), [])

    def test_recent_lists_quakes(self):
        agent = USGSQuakeAgent(FakeQuake())
        result = agent.run({"skill": "quakes-recent", "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("M2.5+", result["message"])
        self.assertIn("earthquake.usgs.gov", result["artifact"]["dataset"])
        self.assertTrue(result["artifact"]["freshness"])
        self.assertIsNone(result["watch"])

    def test_recent_when_quiet(self):
        agent = USGSQuakeAgent(FakeQuake(quakes=[]))
        result = agent.run({"skill": "quakes-recent", "params": {"min_magnitude": 7, "hours": 48}, "missing": []})
        self.assertIn("No M7.0+ earthquakes", result["message"])
        self.assertEqual(result["artifact"]["count"], 0)

    def test_near_labels_the_place(self):
        agent = USGSQuakeAgent(FakeQuake())
        result = agent.run(
            {"skill": "quakes-near", "params": {"point": "35.68,139.69", "place": "tokyo", "radius_km": 300}, "missing": []}
        )
        self.assertIn("within 300 km of tokyo", result["message"])
        self.assertEqual(result["artifact"]["radius_km"], 300.0)

    def test_summary_reports_counts(self):
        agent = USGSQuakeAgent(FakeQuake())
        result = agent.run({"skill": "quakes-summary", "params": {}, "missing": []})
        self.assertIn("132 earthquakes at M2.5+", result["message"])
        self.assertIn("4 at M6.0+", result["message"])
        self.assertEqual(result["artifact"]["counts"]["last_24h_m4.5"], 7)

    def test_watch_records_observation(self):
        agent = USGSQuakeAgent(FakeQuake())
        result = agent.run({"skill": "quakes-watch", "params": {"min_magnitude": 4.0}, "missing": []})
        watch = result["watch"]
        self.assertEqual(watch["kind"], "quakes-watch")
        self.assertEqual(watch["min_magnitude"], 4.0)
        self.assertEqual(watch["observed"]["newest_id"], "us7000abcd")
        self.assertEqual(watch["observed"]["ids"], ["us7000abcd"])
        self.assertNotIn("observed", result["artifact"]["watching"])

    def test_watch_quiet(self):
        agent = USGSQuakeAgent(FakeQuake(quakes=[]))
        result = agent.run({"skill": "quakes-watch", "params": {"min_magnitude": 6.0}, "missing": []})
        self.assertEqual(result["watch"]["observed"]["count"], 0)
        self.assertIn("Nothing matching", result["message"])

    def test_input_required_prompt(self):
        agent = USGSQuakeAgent(FakeQuake())
        result = agent.run({"skill": "quakes-near", "params": {}, "missing": ["location"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("Where?", result["message"])

    def test_probe_and_describe(self):
        agent = USGSQuakeAgent(FakeQuake())
        observed = agent.probe_watch({"min_magnitude": 4.0, "window_hours": 168})
        self.assertEqual(observed["count"], 1)
        text = agent.describe_watch_change({"place": "worldwide"}, {"newest_time": ""}, observed)
        self.assertIn("New earthquake for worldwide", text)
        quieter = agent.describe_watch_change({"place": "worldwide"}, {"newest_time": observed["newest_time"], "count": 5}, {"newest_time": observed["newest_time"], "count": 1})
        self.assertIn("leaving the window", quieter)


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        self.store = TaskStore(":memory:")

    def tearDown(self):
        self.store.close()

    def test_lifecycle_and_artifact(self):
        handler = A2AHandler(self.store, USGSQuakeAgent(FakeQuake()))
        task = handler.handle("message/send", {"message": message("how many earthquakes today?")})
        self.assertEqual(task["status"]["state"], "completed")
        data = task["artifacts"][-1]["parts"][0]["data"]
        self.assertEqual(data["dataset"], "earthquake.usgs.gov/fdsnws/event/1")
        self.assertEqual(data["counts"]["last_24h_m2.5"], 132)

    def test_near_input_required_then_follow_up(self):
        handler = A2AHandler(self.store, USGSQuakeAgent(FakeQuake()))
        first = handler.handle("message/send", {"message": message("any quakes near me?")})
        self.assertEqual(first["status"]["state"], "input-required")
        follow = handler.handle(
            "message/send",
            {"message": message("35.68,139.69", taskId=first["id"], contextId=first["contextId"])},
        )
        self.assertEqual(follow["status"]["state"], "completed")
        data = follow["artifacts"][-1]["parts"][0]["data"]
        self.assertEqual(data["point"], "35.68,139.69")


class WatchTests(unittest.TestCase):
    def setUp(self):
        self.store = TaskStore(":memory:")

    def tearDown(self):
        self.store.close()

    def test_watcher_fires_when_a_new_quake_appears(self):
        client = FakeQuake()
        agent = USGSQuakeAgent(client)
        task = A2AHandler(self.store, agent).handle(
            "message/send", {"message": message("tell me when there is a quake near Tokyo")}
        )
        self.store.set_push_config(task["id"], {"id": "cfg", "url": "https://example.com/hook", "token": "t"})

        posted = []
        watcher = PushWatcher(
            self.store, agent, interval=5,
            http_post=lambda url, payload, headers: posted.append(payload) or 200,
        )
        self.assertEqual(watcher.tick(), 0)  # nothing new

        client._quakes = [SECOND_QUAKE] + client._quakes
        self.assertEqual(watcher.tick(), 1)
        self.assertEqual(len(posted), 1)
        self.assertEqual(self.store.get_task(task["id"])["metadata"]["last_observed"]["newest_id"], "us7000efgh")
        self.assertEqual(watcher.tick(), 0)  # same set


# ---------------------------------------------------------------------------
# quakes-aftershocks: the sequence is measured on the licence gateway
# ---------------------------------------------------------------------------

#: What the gateway's `quake_aftershock_window` tool hands back.
AFTERSHOCK_PAYLOAD = {
    "mainshock": {"id": "us7000abcd", "magnitude": 5.6, "place": "74 km ESE of Kokopo",
                  "time": "2026-09-26T14:08:17Z", "latitude": -4.6952, "longitude": 152.8383,
                  "depthKm": 57.78},
    "window": {"hours": 54, "requestedHours": 72, "endsAt": "2026-09-28T20:14:07Z",
               "cappedAtNow": True, "radiusKm": 50, "minMagnitude": 3.6},
    "count": 2,
    "largest": {"id": "us7000efgh", "magnitude": 4.9, "place": "78 km ESE of Kokopo",
                "time": "2026-09-26T21:49:27Z"},
    "magnitudeHistogram": [{"atLeast": 4.0, "count": 2}, {"atLeast": 4.5, "count": 1}],
    "perSixHours": [{"from": "2026-09-26T14:08:17Z", "hours": 6, "count": 0},
                    {"from": "2026-09-26T20:08:17Z", "hours": 6, "count": 1}],
    "hoursSinceLastEvent": 4.4,
    "decay": "the sequence is decaying: 1 in the first six hours against 0.2 per six hours afterwards",
}

DENIED_TEXT = ("`quake_aftershock_window` is a premium tool, but that license key has expired. "
               "Get a key at https://buy.example")


def fake_gateway(payload=None, error=None, key="polar_test_key"):
    """A GatewayClient whose HTTP POST is a function, so no test touches the network."""
    calls: list[dict] = []

    def fetch(url, request_payload, headers):
        calls.append({"url": url, "payload": request_payload, "headers": headers})
        if error is not None:
            raise error
        if payload is None:
            # What the gateway says when a key is refused: the message is the point. The
            # licenceRefusal marker is the gateway's own, and it is what tells a refusal
            # apart from a tool that failed after the gate let it through.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "invalid"},
                               "isError": True}}
        return {"jsonrpc": "2.0", "id": 1,
                "result": {"content": [{"type": "text", "text": json.dumps(payload)}]}}

    return GatewayClient(fetch=fetch, key=key), calls


class AftershockTests(unittest.TestCase):
    def test_route_and_defaults(self):
        parsed = parse(message("how many aftershocks did us6000ty73 have?"))
        self.assertEqual(parsed["skill"], "quakes-aftershocks")
        self.assertEqual(parsed["params"]["quake_id"], "us6000ty73")
        # A sequence is measured over days, not over the feed's 24 hours.
        self.assertEqual(parsed["params"]["hours"], 72)

    def test_aftershocks_outrank_the_count_words(self):
        self.assertEqual(parse(message("how many aftershocks in the last week?"))["skill"],
                         "quakes-aftershocks")
        # ... but a plain count still belongs to quakes-summary.
        self.assertEqual(parse(message("how many earthquakes today?"))["skill"], "quakes-summary")

    def test_the_skill_does_not_need_a_location(self):
        agent = USGSQuakeAgent(FakeQuake(), fake_gateway(payload=AFTERSHOCK_PAYLOAD)[0])
        self.assertEqual(agent.missing(SKILL_QUAKES_AFTERSHOCKS, {}), [])

    def test_no_key_is_an_answer_that_says_which_key_to_set(self):
        gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD, key="")
        result = run_quakes_aftershocks({"quake_id": "us7000abcd"}, FakeQuake(), gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertTrue(result["artifact"]["premium"])
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(calls, [], "a missing key must not reach the network")
        self.assertNotIn("count", result["artifact"], "no figures may leak without a licence")

    def test_a_denied_key_repeats_the_gateway_wording(self):
        gateway, calls = fake_gateway(payload=None)
        result = run_quakes_aftershocks({"quake_id": "us7000abcd"}, FakeQuake(), gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["reason"], "denied")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertIn("buy.example", result["message"], "the buy link must survive")
        self.assertEqual(len(calls), 1)

    def test_the_sequence_is_measured_on_the_gateway(self):
        gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD)
        result = run_quakes_aftershocks({"quake_id": "us7000abcd"}, FakeQuake(), gateway)
        self.assertEqual(result["final_state"], "completed")

        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "quake_aftershock_window")
        self.assertEqual(sent["arguments"], {"quake_id": "us7000abcd", "hours": 72, "radius_km": 50})

        self.assertIn("Aftershocks of M5.6", result["message"])
        self.assertIn("2 event(s) at or above M3.6 within 50 km", result["message"])
        self.assertIn("M4.9", result["message"])
        self.assertIn("Six-hour buckets", result["message"])
        self.assertIn("stops at now", result["message"], "a capped window has to be said out loud")

        artifact = result["artifact"]
        self.assertEqual(artifact["count"], 2)
        self.assertEqual(artifact["mainshock_chosen"], "as asked")
        self.assertEqual(len(artifact["magnitude_histogram"]), 2)
        self.assertEqual(artifact["per_six_hours"][1]["count"], 1)
        self.assertIn("decaying", artifact["decay"])
        self.assertEqual(artifact["hours_since_last_event"], 4.4)

    def test_an_asked_for_window_is_passed_through(self):
        gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD)
        run_quakes_aftershocks(
            {"quake_id": "us7000abcd", "hours": 24, "radius_km": 120, "min_magnitude": 4.2},
            FakeQuake(), gateway)
        self.assertEqual(calls[0]["payload"]["params"]["arguments"],
                         {"quake_id": "us7000abcd", "hours": 24.0, "radius_km": 120.0,
                          "min_magnitude": 4.2})

    def test_without_a_mainshock_the_largest_recent_quake_is_measured(self):
        client = FakeQuake()
        gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD)
        result = run_quakes_aftershocks({}, client, gateway)
        self.assertEqual(client.calls[-1]["min_magnitude"], 4.5)
        self.assertEqual(client.calls[-1]["hours"], 48)
        self.assertEqual(calls[0]["payload"]["params"]["arguments"]["quake_id"], "us7000abcd")
        self.assertIn("largest quake of the last 48 hours", result["artifact"]["mainshock_chosen"])

    def test_nothing_large_enough_means_nothing_is_measured(self):
        small = dict(QUAKE, magnitude=2.1)
        gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD)
        result = run_quakes_aftershocks({}, FakeQuake(quakes=[small]), gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["reason"], "no_mainshock")
        self.assertIn("us6000ty73", result["message"], "the answer should say how to name one")
        self.assertEqual(calls, [])

    def test_a_dead_gateway_is_a_failed_task(self):
        gateway, _ = fake_gateway(
            error=GatewayError(UNREACHABLE, "the licence gateway could not be reached (timed out)"))
        result = run_quakes_aftershocks({"quake_id": "us7000abcd"}, FakeQuake(), gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertEqual(result["artifact"]["reason"], UNREACHABLE)

    def test_an_empty_gateway_answer_fails_cleanly(self):
        gateway, _ = fake_gateway(payload={})
        result = run_quakes_aftershocks({"quake_id": "us7000abcd"}, FakeQuake(), gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("without a sequence", result["message"])

    def test_bounds_are_checked_before_the_gateway_is_called(self):
        for params in ({"quake_id": "us7000abcd", "hours": 999},
                       {"quake_id": "us7000abcd", "radius_km": 9999}):
            gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD)
            result = run_quakes_aftershocks(params, FakeQuake(), gateway)
            self.assertEqual(result["final_state"], "failed")
            self.assertEqual(calls, [], "an impossible ask must not cost a gateway call")

    def test_the_agent_dispatches_the_premium_skill(self):
        gateway, calls = fake_gateway(payload=AFTERSHOCK_PAYLOAD)
        agent = USGSQuakeAgent(FakeQuake(), gateway)
        task = A2AHandler(TaskStore(), agent).handle(
            "message/send", {"message": message("how many aftershocks did us7000abcd have?")}
        )
        self.assertEqual(task["status"]["state"], "completed")
        self.assertEqual(len(calls), 1, "the protocol path must reach the gateway too")


if __name__ == "__main__":
    unittest.main()
