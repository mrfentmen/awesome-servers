"""Tests for the NYC street-flooding (FloodNet) server.

    python3 servers/nycflood/tests/test_agent.py
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
    A2AHandler,
    GatewayClient,
    PushWatcher,
    TaskStore,
)

from agent import CARD_SKILLS, SKILL_FLOOD_HOTSPOTS, FloodAgent, parse  # noqa: E402
from data import FloodClient  # noqa: E402

SENSOR = {
    "sensor_id": "BK-richardson-st-n-11th-st-1x59w1",
    "sensor_name": "BK - Richardson St/N 11th St",
    "street_name": "North 11th Street",
    "borough": "Brooklyn",
    "zipcode": "11211",
    "latitude": "40.718566",
    "longitude": "-73.952866",
    "dataset": "kb2e-tjy3",
}

EVENT = {
    "sensor_id": "BK-richardson-st-n-11th-st-1x59w1",
    "sensor_name": "BK - Richardson St/N 11th St",
    "flood_start_time": "2026-09-08T00:14:50.000",
    "flood_end_time": "2026-09-08T02:10:50.000",
    "max_depth_inches": "2.36",
    "duration_mins": "116",
    "dataset": "aq7i-eu5q",
}


class FakeFlood(FloodClient):
    """Same interface as the real client, no network."""

    def __init__(self, events=None, sensors=None):
        self.events = list(events if events is not None else [EVENT])
        self.sensor_rows = list(sensors if sensors is not None else [SENSOR])

    def sensors(self, zip_code=None, borough=None, limit=25):
        return self.sensor_rows[:limit]

    def sensor(self, sensor_id):
        for row in self.sensor_rows:
            if row["sensor_id"] == sensor_id:
                return row
        return None

    def recent_events(self, sensor_ids=None, hours=72, limit=20):
        return self.events[:limit]

    def latest_event(self, sensor_ids=None):
        return self.events[0] if self.events else None

    def freshness(self, dataset=None):
        return "2026-09-22T00:00:00Z"


def message(text, **extra):
    payload = {
        "kind": "message",
        "role": "user",
        "messageId": str(uuid.uuid4()),
        "parts": [{"kind": "text", "text": text}],
    }
    payload.update(extra)
    return payload


class ClientValidationTests(unittest.TestCase):
    def test_check_zip(self):
        self.assertEqual(FloodClient.check_zip("11211"), "11211")
        with self.assertRaises(ValueError):
            FloodClient.check_zip("1234")

    def test_check_borough(self):
        self.assertEqual(FloodClient.check_borough("queens"), "Queens")
        with self.assertRaises(ValueError):
            FloodClient.check_borough("Jersey City")

    def test_check_sensor_id(self):
        self.assertEqual(
            FloodClient.check_sensor_id("BK-richardson-st-n-11th-st-1x59w1"),
            "BK-richardson-st-n-11th-st-1x59w1",
        )
        with self.assertRaises(ValueError):
            FloodClient.check_sensor_id("BK richardson")


class ParseTests(unittest.TestCase):
    def test_sensor_words_mean_sensor_listing(self):
        parsed = parse(message("Which flood sensors cover 11211?"))
        self.assertEqual(parsed["skill"], "flood-sensors")
        self.assertEqual(parsed["params"]["zip_code"], "11211")
        self.assertTrue(parsed["explicit"])

    def test_borough_detected(self):
        parsed = parse(message("how many sensors are in Queens?"))
        self.assertEqual(parsed["params"]["borough"], "Queens")

    def test_watch_words_mean_watch(self):
        parsed = parse(message("tell me when 11211 floods again"))
        self.assertEqual(parsed["skill"], "flood-watch")
        self.assertTrue(parsed["explicit"])

    def test_window_parsed_from_text(self):
        parsed = parse(message("which streets flooded in the last 30 days?"))
        self.assertEqual(parsed["skill"], "flood-recent")
        self.assertEqual(parsed["params"]["hours"], 720)
        self.assertFalse(parsed["explicit"])

    def test_sensor_id_detected(self):
        parsed = parse(message("watch sensor BK-richardson-st-n-11th-st-1x59w1"))
        self.assertEqual(parsed["skill"], "flood-watch")
        self.assertEqual(parsed["params"]["sensor_id"], "BK-richardson-st-n-11th-st-1x59w1")

    def test_data_part_wins(self):
        payload = {
            "kind": "message",
            "role": "user",
            "messageId": "m1",
            "parts": [{"kind": "data", "data": {"skill": "flood-recent", "zip_code": "11211", "hours": 6}}],
        }
        parsed = parse(payload)
        self.assertEqual(parsed["skill"], "flood-recent")
        self.assertEqual(parsed["params"]["hours"], 6)


class AgentTests(unittest.TestCase):
    def test_card_skills_are_complete(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["flood-recent", "flood-sensors", "flood-watch", "flood-hotspots"])
        for skill in CARD_SKILLS:
            self.assertTrue(skill["description"])
            self.assertTrue(skill["examples"])

    def test_missing_rules(self):
        agent = FloodAgent(FakeFlood())
        self.assertEqual(agent.missing("flood-recent", {}), [])
        self.assertEqual(agent.missing("flood-sensors", {}), ["location"])
        self.assertEqual(agent.missing("flood-sensors", {"zip_code": "11211"}), [])
        self.assertEqual(agent.missing("flood-watch", {}), ["location"])
        self.assertEqual(agent.missing("flood-watch", {"sensor_id": "BK-x-1"}), [])

    def test_recent_when_no_events(self):
        agent = FloodAgent(FakeFlood(events=[]))
        result = agent.run({"skill": "flood-recent", "params": {"hours": 24}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("No street-flooding events", result["message"])
        self.assertEqual(result["artifact"]["count"], 0)

    def test_recent_when_events(self):
        agent = FloodAgent(FakeFlood())
        result = agent.run({"skill": "flood-recent", "params": {"hours": 72}, "missing": []})
        self.assertIn("1 street-flooding event", result["message"])
        self.assertEqual(result["artifact"]["events"][0]["max_depth_inches"], "2.36")

    def test_recent_with_no_sensors_in_place(self):
        agent = FloodAgent(FakeFlood(sensors=[]))
        result = agent.run({"skill": "flood-recent", "params": {"zip_code": "10001"}, "missing": []})
        self.assertIn("No FloodNet sensors", result["message"])
        self.assertEqual(result["artifact"]["sensor_count"], 0)

    def test_sensors_listing(self):
        agent = FloodAgent(FakeFlood())
        result = agent.run({"skill": "flood-sensors", "params": {"zip_code": "11211"}, "missing": []})
        self.assertEqual(result["artifact"]["count"], 1)
        self.assertIn("Richardson", result["message"])

    def test_watch_unknown_sensor(self):
        agent = FloodAgent(FakeFlood())
        result = agent.run({"skill": "flood-watch", "params": {"sensor_id": "BK-nope-1"}, "missing": []})
        self.assertFalse(result["artifact"]["found"])
        self.assertIsNone(result["watch"])

    def test_watch_sets_observation(self):
        agent = FloodAgent(FakeFlood())
        result = agent.run({"skill": "flood-watch", "params": {"zip_code": "11211"}, "missing": []})
        watch = result["watch"]
        self.assertEqual(watch["kind"], "flood-watch")
        self.assertEqual(watch["sensor_ids"], [SENSOR["sensor_id"]])
        self.assertEqual(watch["observed"]["last_start"], EVENT["flood_start_time"])

    def test_watch_with_no_events_yet(self):
        agent = FloodAgent(FakeFlood(events=[]))
        result = agent.run({"skill": "flood-watch", "params": {"zip_code": "11211"}, "missing": []})
        self.assertEqual(result["watch"]["observed"]["last_start"], "")
        self.assertIn("No flood event", result["message"])

    def test_probe_and_describe(self):
        agent = FloodAgent(FakeFlood())
        observed = agent.probe_watch({"sensor_ids": [SENSOR["sensor_id"]]})
        self.assertEqual(observed["max_depth_inches"], "2.36")
        self.assertIsNone(agent.probe_watch({"sensor_ids": []}))
        text = agent.describe_watch_change({}, {"last_start": ""}, observed)
        self.assertIn("New street-flooding event", text)


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        self.store = TaskStore(":memory:")

    def tearDown(self):
        self.store.close()

    def test_lifecycle_and_artifact(self):
        handler = A2AHandler(self.store, FloodAgent(FakeFlood()))
        task = handler.handle("message/send", {"message": message("which flood sensors cover 11211?")})
        self.assertEqual(task["status"]["state"], "completed")
        self.assertEqual(task["artifacts"][-1]["parts"][0]["data"]["dataset"], "kb2e-tjy3")

    def test_watch_input_required_then_follow_up(self):
        handler = A2AHandler(self.store, FloodAgent(FakeFlood()))
        first = handler.handle("message/send", {"message": message("watch for flooding")})
        self.assertEqual(first["status"]["state"], "input-required")
        follow = handler.handle(
            "message/send",
            {"message": message("11211", taskId=first["id"], contextId=first["contextId"])},
        )
        self.assertEqual(follow["status"]["state"], "completed")
        self.assertEqual(follow["metadata"]["watch"]["kind"], "flood-watch")
        self.assertEqual(follow["metadata"]["last_observed"]["last_start"], EVENT["flood_start_time"])


class WatchTests(unittest.TestCase):
    def setUp(self):
        self.store = TaskStore(":memory:")

    def tearDown(self):
        self.store.close()

    def test_watcher_fires_when_a_new_event_appears(self):
        client = FakeFlood(events=[])
        agent = FloodAgent(client)
        task = A2AHandler(self.store, agent).handle("message/send", {"message": message("watch 11211")})
        self.store.set_push_config(task["id"], {"id": "cfg", "url": "https://example.com/hook", "token": "t"})

        posted = []
        watcher = PushWatcher(
            self.store, agent, interval=5,
            http_post=lambda url, payload, headers: posted.append(payload) or 200,
        )
        self.assertEqual(watcher.tick(), 0)  # no event yet

        client.events = [EVENT]
        self.assertEqual(watcher.tick(), 1)
        self.assertEqual(len(posted), 1)
        self.assertEqual(
            self.store.get_task(task["id"])["metadata"]["last_observed"]["last_start"],
            EVENT["flood_start_time"],
        )
        self.assertEqual(watcher.tick(), 0)  # same event, nothing new


#: Shape copied from a live gateway `flood_hotspot_ranking` answer.
HOTSPOT_PAYLOAD = {
    "windowDays": 90,
    "windowStart": "2026-06-01T00:00:00.000Z",
    "newestEvent": "2026-08-30T03:00:00.000Z",
    "daysSinceNewestEvent": 29.6,
    "events": 1180,
    "sensorsAffected": 96,
    "sensorEventsCapped": True,
    "byBorough": [{"borough": "Brooklyn", "events": 520, "deepestInches": 12.0},
                  {"borough": "Queens", "events": 380, "deepestInches": 9.5}],
    "tidallyInfluencedShare": 21.4,
    "busiestDays": [{"date": "2026-07-14", "events": 210},
                    {"date": "2026-08-02", "events": 160}],
    "topSensors": [
        {"sensorName": "BK - Richardson St/N 11th St", "borough": "Brooklyn",
         "tidallyInfluenced": "No", "events": 41, "deepestInches": 12.0,
         "medianDurationMinutes": 88.5},
        {"sensorName": "QN - 153rd St/133rd Ave", "borough": "Queens",
         "tidallyInfluenced": "Yes", "events": 33, "deepestInches": 9.5,
         "medianDurationMinutes": 64.0},
    ],
    "deepestEvents": [
        {"sensorName": "BK - Richardson St/N 11th St", "borough": "Brooklyn",
         "depthInches": 12.0, "durationMinutes": 140.0, "startedAt": "2026-07-14T22:10:00.000Z"},
    ],
    "depthInches": {"min": 0.6, "mean": 2.8, "median": 2.1, "p90": 6.2, "max": 12.0},
    "durationMinutes": {"min": 5.0, "mean": 92.0, "median": 71.0, "p90": 190.0, "max": 640.0},
    "onsetMinutes": {"min": 0.0, "mean": 18.0, "median": 12.0, "p90": 44.0, "max": 210.0},
    "drainMinutes": {"min": 2.0, "mean": 54.0, "median": 40.0, "p90": 120.0, "max": 480.0},
    "note": "a depth is the deepest reading that sensor recorded in an event, and events are "
            "counted one per sensor per flooding period",
}

DENIED_TEXT = ("`flood_hotspot_ranking` is a premium tool, but that licence key has expired. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`flood_hotspot_ranking` failed: the FloodNet dataset published no events"


def fake_gateway(payload=None, error=None, text=None, tool_error=None, key="polar_test_key"):
    """A GatewayClient whose HTTP POST is a function, so no test touches the network."""
    calls: list[dict] = []

    def fetch(url, request_payload, headers):
        calls.append({"url": url, "payload": request_payload, "headers": headers})
        if error is not None:
            raise error
        if tool_error is not None:
            # Failed after the gate let it through: no licenceRefusal marker.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": tool_error}], "isError": True}}
        if payload is None and text is None:
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "expired"},
                               "isError": True}}
        body = text if text is not None else json.dumps(payload)
        return {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": body}]}}

    return GatewayClient(fetch=fetch, key=key), calls


class FloodHotspotSkillTests(unittest.TestCase):
    """The premium skill: parsing stays local, the ranking comes from the gateway."""

    def agent(self, gateway) -> FloodAgent:
        return FloodAgent(FakeFlood(), gateway=gateway)

    def test_hotspot_questions_route_to_the_premium_skill(self):
        for text in ("Which streets flooded the most in the last 90 days?",
                     "what are the flood hotspots?",
                     "how often does it flood, and how deep?"):
            self.assertEqual(parse(message(text))["skill"], SKILL_FLOOD_HOTSPOTS, text)
        self.assertEqual(parse(message("flood hotspots over the last 30 days"))["params"]["days"],
                         "30")

    def test_the_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(message("what flooded in the last 24 hours?"))["skill"],
                         "flood-recent")
        self.assertEqual(parse(message("which sensors cover 11211?"))["skill"], "flood-sensors")
        self.assertEqual(parse(message("Tell me when any sensor in 11211 floods again."))["skill"],
                         "flood-watch")
        # A named place keeps the place-shaped answers: the ranking is city-wide, so it cannot
        # answer for one borough.
        self.assertNotEqual(parse(message("which streets in Queens flooded the most?"))["skill"],
                            SKILL_FLOOD_HOTSPOTS)

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse({"parts": [{"kind": "data", "data": {"skill": SKILL_FLOOD_HOTSPOTS,
                                                                "days": 120}}]})
        self.assertEqual(parsed["skill"], SKILL_FLOOD_HOTSPOTS)
        self.assertEqual(parsed["params"]["days"], 120)

    def test_the_message_reports_the_gateways_ranking(self):
        gateway, calls = fake_gateway(HOTSPOT_PAYLOAD)
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("1180 street-flooding event(s) across 96 sensor(s) in the 90 days",
                      result["message"])
        self.assertIn("90th percentile 6.2, max 12.0", result["message"])
        self.assertIn("median 71.0 min, max 640.0 min", result["message"])
        self.assertIn("21.4% of these events", result["message"])
        self.assertIn("Brooklyn — 520 event(s), deepest 12.0 in", result["message"])
        self.assertIn("BK - Richardson St/N 11th St (Brooklyn) — 41 event(s), deepest 12.0 in, "
                      "median 88.5 min", result["message"])
        self.assertIn("2026-07-14 (210)", result["message"])
        self.assertIn("newest records rather than every flood in the window", result["message"])
        self.assertIn("one per sensor per flooding period", result["message"])
        self.assertIn("aq7i-eu5q", result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["events"], 1180)
        self.assertEqual(len(result["artifact"]["top_sensors"]), 2)

        # Both datasets were read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "flood_hotspot_ranking")
        self.assertEqual(sent["arguments"], {"days": 90})

    def test_no_note_and_no_cap_means_neither_line_is_shown(self):
        gateway, _ = fake_gateway({**HOTSPOT_PAYLOAD, "note": None, "sensorEventsCapped": False})
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertNotIn("newest records rather than", result["message"])

    def test_a_window_outside_the_tools_range_is_a_question_not_a_crash(self):
        gateway, calls = fake_gateway(HOTSPOT_PAYLOAD)
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {"days": 2}, "missing": []})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("between 7 and 365", result["message"])
        self.assertEqual(calls, [], "a bad argument must not reach the gateway")

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertNotIn("events", result["artifact"])
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_ranking(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("events"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = self.agent(gateway).run(
            {"skill": SKILL_FLOOD_HOTSPOTS, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("published no events", result["message"])


if __name__ == "__main__":
    unittest.main()
