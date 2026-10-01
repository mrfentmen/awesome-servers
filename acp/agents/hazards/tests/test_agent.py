"""Tests for the hazards ACP agent: data reader, routing, skills, permissions.

    python3 agents/hazards/tests/test_agent.py
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
HAZARDS_DIR = AGENT_DIR
for path in (str(REPO_ROOT), str(HAZARDS_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import (  # noqa: E402
    AcpClient,
    Connection,
    GatewayClient,
    STOP_END_TURN,
    STOP_REFUSAL,
)

from agent import CITY_POINTS, HazardsAgent, human_hours, route, state_from_text  # noqa: E402
from data import (  # noqa: E402
    NWS_DATASET,
    USGS_DATASET,
    HazardData,
    HazardDataError,
)

ALERT_FEATURE = {
    "properties": {
        "id": "urn:oid:2.49.0.1.840.0.abc123",
        "areaDesc": "New York (Manhattan); Bronx",
        "event": "Severe Thunderstorm Warning",
        "severity": "Severe",
        "certainty": "Likely",
        "urgency": "Expected",
        "onset": "2026-09-22T18:00:00-04:00",
        "ends": "2026-09-22T20:00:00-04:00",
        "headline": "Severe Thunderstorm Warning issued September 22 at 5:20PM EDT",
        "instruction": "Move indoors.",
        "senderName": "NWS New York NY",
    }
}
MINOR_FEATURE = {
    "properties": {
        "id": "urn:oid:2.49.0.1.840.0.def456",
        "areaDesc": "Coastal Waters",
        "event": "Small Craft Advisory",
        "severity": "Minor",
        "onset": "2026-09-22T10:00:00-04:00",
    }
}
QUAKE_FEATURE = {
    "id": "us7000abcd",
    "properties": {
        "mag": 4.6,
        "place": "10 km NE of Somewhere, Japan",
        "time": 1790036000000,
        "tsunami": 0,
        "alert": "green",
        "sig": 326,
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
    },
    "geometry": {"type": "Point", "coordinates": [139.7, 35.7, 42.5]},
}
QUAKE = HazardData._one_quake(QUAKE_FEATURE)
ALERT = {field: ALERT_FEATURE["properties"][field]
         for field in ALERT_FEATURE["properties"]
         if field in ("id", "areaDesc", "event", "severity", "onset", "ends", "headline", "instruction")}


class FakeData(HazardData):
    """Same interface as HazardData, no network."""

    def __init__(self, alerts=None, quakes=None, counts=None, raise_error: bool = False):
        self._alerts = list(alerts if alerts is not None else [ALERT])
        self._quakes = list(quakes if quakes is not None else [QUAKE])
        self._counts = dict(counts or {"total": 386, "land": 361, "marine": 25, "areas": {"NY": 4, "TX": 22}})
        self.raise_error = raise_error
        self.calls: list[dict] = []

    def weather_alerts(self, state=None, point=None, severity=None, event_contains=None, limit=20):
        if self.raise_error:
            raise HazardDataError("NWS feed offline")
        self.calls.append({"kind": "alerts", "state": state, "severity": severity, "event_contains": event_contains})
        rows = [row for row in self._alerts if not severity or row.get("severity") == severity]
        rows = [row for row in rows if not event_contains or event_contains.lower() in (row.get("event") or "").lower()]
        return rows[:limit]

    def alert_counts(self):
        if self.raise_error:
            raise HazardDataError("NWS feed offline")
        return dict(self._counts)

    def recent_quakes(self, min_magnitude=2.5, hours=24, limit=10):
        if self.raise_error:
            raise HazardDataError("USGS feed offline")
        self.calls.append({"kind": "recent", "min_magnitude": min_magnitude, "hours": hours})
        return [row for row in self._quakes if row["magnitude"] >= min_magnitude][:limit]

    def quakes_near(self, point, radius_km=300, min_magnitude=2.0, hours=720, limit=10):
        if self.raise_error:
            raise HazardDataError("USGS feed offline")
        self.calls.append({"kind": "near", "point": point, "radius_km": radius_km, "hours": hours})
        return [row for row in self._quakes if row["magnitude"] >= min_magnitude][:limit]

    def freshness(self, dataset_key):
        return "2026-09-22T12:00:00Z"


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


class ValidationTests(unittest.TestCase):
    def test_check_state(self):
        self.assertEqual(HazardData.check_state("ny"), "NY")
        with self.assertRaises(ValueError):
            HazardData.check_state("New York")

    def test_check_point(self):
        # Canonical form is numeric, so trailing zeros collapse.
        self.assertEqual(HazardData.check_point("40.7128, -74.0060"), "40.7128,-74.006")
        self.assertEqual(HazardData.check_point("40.7128,-74.0060"), HazardData.check_point("40.71280, -74.006"))
        with self.assertRaises(ValueError):
            HazardData.check_point("40.7128")
        with self.assertRaises(ValueError):
            HazardData.check_point("91.0,-74.0")

    def test_check_magnitude_hours_radius(self):
        self.assertEqual(HazardData.check_magnitude("4.55"), 4.5)
        with self.assertRaises(ValueError):
            HazardData.check_magnitude("nope")
        self.assertEqual(HazardData.check_hours("24"), 24.0)
        with self.assertRaises(ValueError):
            HazardData.check_hours("0.1")
        self.assertEqual(HazardData.check_radius_km("300"), 300.0)
        with self.assertRaises(ValueError):
            HazardData.check_radius_km("0")

    def test_place_label(self):
        self.assertEqual(HazardData.place_label("NY"), "New York")
        self.assertEqual(HazardData.place_label(point="40.7,-74.0"), "the point 40.7,-74.0")
        self.assertEqual(HazardData.place_label(), "the United States")

    def test_human_hours(self):
        self.assertEqual(human_hours(24), "24 hours")
        self.assertEqual(human_hours(168), "7 days")
        self.assertEqual(human_hours(720), "30 days")
        self.assertEqual(human_hours(1), "1 hour")

    def test_freshness_rejects_unknown_key(self):
        with self.assertRaises(ValueError):
            HazardData().freshness("nope")


class ReaderTests(unittest.TestCase):
    def test_weather_alerts_maps_and_sorts(self):
        seen = {}

        def fetch(url, params):
            seen["url"] = url
            seen["params"] = params
            return {"features": [MINOR_FEATURE, ALERT_FEATURE]}

        alerts = HazardData(fetch=fetch).weather_alerts(state="ny", limit=5)
        self.assertTrue(seen["url"].endswith("/alerts/active"))
        self.assertEqual(seen["params"]["area"], "NY")
        self.assertEqual([alert["severity"] for alert in alerts], ["Severe", "Minor"])
        self.assertEqual(alerts[0]["event"], "Severe Thunderstorm Warning")
        self.assertNotIn("senderName", alerts[1])  # absent upstream fields are simply not invented

    def test_alert_counts(self):
        payload = {"total": 386, "land": 361, "marine": 25, "areas": {"NY": 4}}
        counts = HazardData(fetch=lambda url, params: payload).alert_counts()
        self.assertEqual(counts["total"], 386)
        self.assertEqual(counts["areas"]["NY"], 4)

    def test_recent_quakes_builds_params_and_maps(self):
        seen = {}

        def fetch(url, params):
            seen["url"] = url
            seen["params"] = params
            return {"features": [QUAKE_FEATURE]}

        quakes = HazardData(fetch=fetch).recent_quakes(min_magnitude=4.5, hours=24)
        self.assertTrue(seen["url"].endswith("/fdsnws/event/1/query"))
        self.assertEqual(seen["params"]["minmagnitude"], "4.5")
        self.assertEqual(seen["params"]["orderby"], "time")
        self.assertEqual(quakes[0]["magnitude"], 4.6)
        self.assertEqual(quakes[0]["depth_km"], 42.5)
        self.assertEqual(quakes[0]["time"], "2026-09-22T00:13:20Z")

    def test_quake_counts(self):
        client = HazardData(fetch=lambda url, params: {"count": 41, "maxAllowed": 20000})
        counts = client.quake_counts()
        self.assertEqual(counts["last_24h_m1.0"], 41)

    def test_bad_payloads_raise(self):
        with self.assertRaises(HazardDataError):
            HazardData(fetch=lambda url, params: {"nope": 1}).weather_alerts()
        with self.assertRaises(HazardDataError):
            HazardData(fetch=lambda url, params: {"nope": 1}).recent_quakes()


class RouteTests(unittest.TestCase):
    def test_state_code(self):
        skill, params = route("any weather alerts in NY right now?")
        self.assertEqual(skill, "alerts-active")
        self.assertEqual(params["state"], "NY")

    def test_lowercase_state_after_preposition(self):
        self.assertEqual(state_from_text("any alerts for nm right now"), "NM")
        self.assertIsNone(state_from_text("is it in or out"))

    def test_counts(self):
        skill, _ = route("how many alerts are active nationwide?")
        self.assertEqual(skill, "alerts-counts")

    def test_severity_and_event(self):
        skill, params = route("any severe thunderstorm alerts in Texas?")
        self.assertEqual(skill, "alerts-active")
        self.assertEqual(params["state"], "TX")
        self.assertEqual(params["severity"], "Severe")
        self.assertEqual(params["event_contains"], "Thunderstorm")

    def test_recent_quakes(self):
        skill, params = route("any earthquakes above magnitude 4.5 in the last 24 hours?")
        self.assertEqual(skill, "quakes-recent")
        self.assertEqual(params["min_magnitude"], 4.5)
        self.assertEqual(params["hours"], 24)

    def test_quakes_near_city(self):
        skill, params = route("has anything shaken near Tokyo this month?")
        self.assertEqual(skill, "quakes-near")
        self.assertEqual(params["point"], f"{CITY_POINTS['tokyo'][0]},{CITY_POINTS['tokyo'][1]}")
        self.assertEqual(params["hours"], 720)

    def test_quakes_near_point_with_radius(self):
        skill, params = route("any quakes within 500 km of 35.68,139.69?")
        self.assertEqual(skill, "quakes-near")
        self.assertEqual(params["point"], "35.68,139.69")
        self.assertEqual(params["radius_km"], "500")

    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("hello there")[0], "help")


class HazardsTurnTests(unittest.TestCase):
    def turn(self, text: str, data: FakeData | None = None, permission: str = "allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = HazardsAgent(agent_conn, data or FakeData())
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_alerts_answer_cites_dataset(self):
        turn, client = self.turn("any weather alerts in NY right now?")
        self.assertEqual(turn["stopReason"], STOP_END_TURN)
        self.assertIn(NWS_DATASET, turn["text"])
        self.assertIn("Severe Thunderstorm Warning", turn["text"])
        self.assertIn("read live", turn["text"])
        tools = [u for u in turn["updates"] if u.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "alerts-active")
        self.assertEqual(tools[0]["kind"], "fetch")
        self.assertEqual(len(client.permission_requests), 1)

    def test_streaming_is_chunked(self):
        turn, _ = self.turn("any weather alerts in NY right now?")
        chunks = [u for u in turn["updates"] if u.get("sessionUpdate") == "agent_message_chunk"]
        self.assertGreater(len(chunks), 1)
        self.assertEqual(len({chunk["messageId"] for chunk in chunks}), 1)

    def test_counts_answer(self):
        turn, _ = self.turn("how many alerts are active nationwide?")
        self.assertIn("386 active alerts nationwide", turn["text"])
        self.assertIn("Busiest areas", turn["text"])

    def test_quakes_answer(self):
        turn, _ = self.turn("any earthquakes above magnitude 4.5 in the last 24 hours?")
        self.assertIn(USGS_DATASET, turn["text"])
        self.assertIn("M4.6", turn["text"])

    def test_quakes_near_answer(self):
        turn, _ = self.turn("has anything shaken near Tokyo this month?")
        self.assertIn("within 300 km of Tokyo", turn["text"])
        self.assertIn("in the last 30 days", turn["text"])
        self.assertIn("read live", turn["text"])

    def test_quiet_window_is_honest(self):
        turn, _ = self.turn("any severe alerts in NY?", data=FakeData(alerts=[]))
        self.assertIn("No active NWS alerts for New York", turn["text"])

    def test_help_does_not_ask_permission(self):
        turn, client = self.turn("what can you do?")
        self.assertIn("weather alerts", turn["text"])
        self.assertEqual(client.permission_requests, [])

    def test_permission_denied(self):
        turn, _ = self.turn("any weather alerts in NY right now?", permission="reject")
        self.assertEqual(turn["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", turn["text"])

    def test_feed_failure_is_reported(self):
        turn, _ = self.turn("any weather alerts in NY right now?", data=FakeData(raise_error=True))
        self.assertIn("could not read the feed", turn["text"])
        statuses = [u.get("status") for u in turn["updates"] if u.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)


# ---------------------------------------------------------------------------
# The premium skill: quakes-seismicity
#
# No network: the licence check and the analysis both happen on the gateway, and
# the gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `quakes_seismicity` answers for a thinning catalogue around Tokyo.
SEISMICITY_DATA = {
    "area": {"point": "35.68,139.69", "radius_km": 300},
    "window": {"hours": 720, "min_magnitude": 2.0, "span_days": 8.5},
    "events": 24,
    "events_m4_plus": 3,
    "truncated": False,
    "magnitude": {"max": 6.1, "min": 2.5, "median": 2.8},
    "mainshock": {
        "id": "us6100",
        "magnitude": 6.1,
        "place": "near the trench",
        "time": "2026-09-24T00:00:00",
        "depth_km": 20.0,
        "tsunami_flag": False,
        "felt_reports": 12,
        "status": "reviewed",
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us6100",
    },
    "aftershocks": {"count": 3, "largest": 4.2,
                    "window": "within 7 days of the mainshock, which is a time count "
                              "and not a sequence id"},
    "b_value": 0.86,
    "magnitude_bins": [{"magnitude": 2.5, "at_or_above": 24}],
    "depth_km": {"min": 20.0, "median": 30.0, "max": 40.0},
    "source": "USGS FDSNWS event catalog (earthquake.usgs.gov)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`quakes_seismicity` is a premium tool, but that licence key was rejected. "
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

    def turn(self, text: str, fetch, key: str):
        agent_conn, client_conn = connected_pair()
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = HazardsAgent(agent_conn, FakeData(), gateway=gateway)
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
        turn, client = self.turn("was there an aftershock sequence near Tokyo?", fetch, "")
        self.assertEqual(turn["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", turn["text"])
        self.assertIn("MCP_LICENSE_KEY", turn["text"])
        self.assertEqual(len(client.permission_requests), 1)
        self.assertEqual(fetch.calls, [])

    def test_a_bad_key_returns_the_gateways_own_wording(self):
        fetch = gateway_answer(GATEWAY_DENIAL, is_error=True,
                               structured={"licenceRefusal": True, "reason": "denied"})
        turn, _ = self.turn("was there an aftershock sequence near Tokyo?", fetch, "not-a-real-key")
        self.assertEqual(turn["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, turn["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "quakes_seismicity")

    def test_a_good_key_returns_the_analysis(self):
        fetch = gateway_answer(json.dumps(SEISMICITY_DATA))
        turn, _ = self.turn("was there an aftershock sequence near Tokyo?", fetch, "k_paid")
        self.assertEqual(turn["stopReason"], STOP_END_TURN)
        self.assertIn("24 event(s)", turn["text"])
        self.assertIn("largest: M6.1", turn["text"])
        self.assertIn("aftershocks: 3 within a week of it", turn["text"])
        self.assertIn("Gutenberg-Richter b-value: 0.86", turn["text"])
        self.assertIn("3 at M4 or above", turn["text"])
        self.assertIn("not an official sequence membership", turn["text"])
        self.assertIn("USGS FDSNWS event catalog", turn["text"])
        tools = [u for u in turn["updates"] if u.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "quakes-seismicity")

    def test_a_good_key_sends_the_area_and_window_it_was_asked_for(self):
        fetch = gateway_answer(json.dumps(SEISMICITY_DATA))
        self.turn("was there an aftershock sequence near Tokyo within 200 km in the last 48 hours?",
                  fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(arguments, {"point": "35.68,139.69", "radius_km": 200.0,
                                     "hours": 48.0, "min_magnitude": 2.0})

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        turn, _ = self.turn("was there an aftershock sequence near Tokyo?", fetch, "k_paid")
        self.assertEqual(turn["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read the feed", turn["text"])

    def test_a_gateway_with_nothing_to_say_is_still_an_answer(self):
        fetch = gateway_answer("the catalogue was empty")
        turn, _ = self.turn("was there an aftershock sequence near Tokyo?", fetch, "k_paid")
        self.assertEqual(turn["stopReason"], STOP_END_TURN)
        self.assertIn("did not send back any seismicity", turn["text"])

    def test_the_routing_is_narrow(self):
        for text in ("was there an aftershock sequence near Tokyo?",
                     "what is the b-value near Tokyo?",
                     "is there a seismic swarm near Tokyo within 200 km?",
                     "were those Tokyo earthquakes a cluster?"):
            skill, params = route(text)
            self.assertEqual(skill, "quakes-seismicity", text)
            self.assertEqual(params["point"], "35.68,139.69", text)
            self.assertEqual(params["place"], "tokyo", text)

        free = [
            ("has anything shaken near Tokyo this month?", "quakes-near"),
            ("how many earthquakes near Tokyo?", "quakes-near"),
            ("any earthquakes above magnitude 4.5 in the last 24 hours?", "quakes-recent"),
            ("any weather alerts in NY right now?", "alerts-active"),
            ("how many alerts are active nationwide?", "alerts-counts"),
            ("any weather alerts in NY right now?", "alerts-active"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("quakes-seismicity", SKILLS)


if __name__ == "__main__":
    unittest.main()
