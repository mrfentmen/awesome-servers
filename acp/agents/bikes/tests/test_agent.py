"""Tests for the bikes agent: GBFS join, routing, skills, permissions.

    python3 agents/bikes/tests/test_agent.py
"""

from __future__ import annotations

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

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL  # noqa: E402

from agent import BikesAgent, route, station_name_from_text  # noqa: E402
from data import DATASET, BikesData, BikesError, distance_km  # noqa: E402

#: Citi Bike mixes numeric and UUID station ids; the fixtures carry one of each on purpose.
UUID_ID = "9c2f-some-uuid-id"

INFO_PAYLOAD = {"data": {"stations": [
    {"station_id": "1", "name": "Grand Central", "lat": 40.7523, "lon": -73.9772, "capacity": 40},
    {"station_id": "2", "name": "Broadway & 42 St", "lat": 40.7550, "lon": -73.9850, "capacity": 30},
    {"station_id": "3", "name": "Atlantic Ave", "lat": 40.6905, "lon": -73.9770, "capacity": 24},
    {"station_id": UUID_ID, "name": "New Lots Ave & Van Sinderen Ave", "lat": 40.6645,
     "lon": -73.8880, "capacity": 20},
]}}

STATUS_PAYLOAD = {"data": {"stations": [
    {"station_id": "1", "num_bikes_available": 12, "num_ebikes_available": 3,
     "num_docks_available": 25, "is_renting": 1, "last_reported": 1790107000},
    {"station_id": "2", "num_bikes_available": 5, "num_ebikes_available": 2,
     "num_docks_available": 20, "is_renting": 1, "last_reported": 1790106900},
    {"station_id": "3", "num_bikes_available": 0, "num_ebikes_available": 0,
     "num_docks_available": 24, "is_renting": 0, "last_reported": 1790106800},
    {"station_id": UUID_ID, "num_bikes_available": 0, "num_ebikes_available": 0,
     "num_docks_available": 12, "is_renting": 0, "last_reported": 1790106700},
]}}


def dispatch(url: str, params: dict):
    return INFO_PAYLOAD if "station_information" in url else STATUS_PAYLOAD


class FakeData(BikesData):
    """Same interface as the real reader, no network."""

    def __init__(self, raise_error: bool = False):
        self.raise_error = raise_error
        self.calls: list[dict] = []

    def stations(self) -> list[dict]:
        if self.raise_error:
            raise BikesError("GBFS is offline")
        return [
            {"id": "1", "name": "Grand Central", "lat": 40.7523, "lon": -73.9772, "capacity": 40,
             "bikes": 12, "ebikes": 3, "docks": 25, "renting": 1, "last_reported": 1790107000},
            {"id": "2", "name": "Broadway & 42 St", "lat": 40.7550, "lon": -73.9850, "capacity": 30,
             "bikes": 5, "ebikes": 2, "docks": 20, "renting": 1, "last_reported": 1790106900},
        ]

    def station(self, query: str) -> dict:
        if self.raise_error:
            raise BikesError("GBFS is offline")
        self.calls.append({"kind": "station", "query": query})
        return {"dataset": DATASET, "match_count": 1, "station": {
            "id": "1", "name": "Grand Central", "lat": 40.7523, "lon": -73.9772, "capacity": 40,
            "bikes": 12, "ebikes": 3, "docks": 25, "renting": 1, "last_reported": 1790107000}}

    def nearby(self, point: str, limit: int = 3) -> dict:
        if self.raise_error:
            raise BikesError("GBFS is offline")
        self.calls.append({"kind": "nearby", "point": point})
        return {"dataset": DATASET, "point": point, "rows": [
            {"station": {"name": "Grand Central", "lat": 40.7523, "lon": -73.9772, "capacity": 40,
                         "bikes": 12, "ebikes": 3, "docks": 25, "renting": 1,
                         "last_reported": 1790107000}, "distance_km": 4.87},
            {"station": {"name": "Broadway & 42 St", "lat": 40.7550, "lon": -73.9850, "capacity": 30,
                         "bikes": 5, "ebikes": 2, "docks": 20, "renting": 1,
                         "last_reported": 1790106900}, "distance_km": 5.1},
        ]}

    def system(self) -> dict:
        if self.raise_error:
            raise BikesError("GBFS is offline")
        return {"dataset": DATASET, "system": "Citi Bike (New York City, Jersey City, Hoboken)",
                "stations": 2, "bikes": 17, "ebikes": 5, "docks": 45, "renting": 2}


class QueueReader:
    """One side's inbox: an iterator of lines, plus push to add one."""

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


class ReaderTests(unittest.TestCase):
    def test_the_join_keeps_named_stations(self):
        data = BikesData(fetch=dispatch)
        rows = data.stations()
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[0]["name"], "Grand Central")
        self.assertEqual(rows[0]["bikes"], 12)

    def test_the_join_keeps_uuid_station_ids(self):
        data = BikesData(fetch=dispatch)
        rows = data.stations()
        self.assertIn(UUID_ID, [row["id"] for row in rows])

    def test_a_payload_without_stations_is_an_error(self):
        data = BikesData(fetch=lambda url, params: {"data": {}})
        with self.assertRaises(BikesError):
            data.stations()

    def test_station_match_is_case_insensitive(self):
        data = BikesData(fetch=dispatch)
        result = data.station("grand central")
        self.assertEqual(result["station"]["name"], "Grand Central")
        self.assertEqual(result["match_count"], 1)

    def test_station_with_no_match_is_an_error(self):
        data = BikesData(fetch=dispatch)
        with self.assertRaises(BikesError):
            data.station("nowhere at all")

    def test_nearby_is_sorted_by_distance(self):
        data = BikesData(fetch=dispatch)
        result = data.nearby("40.71,-74.01", limit=4)
        self.assertEqual(len(result["rows"]), 4)
        # Atlantic Ave (40.6905,-73.9770) is the closest of the fixtures.
        self.assertEqual(result["rows"][0]["station"]["name"], "Atlantic Ave")
        self.assertEqual(result["rows"][0]["distance_km"],
                         round(distance_km("40.71,-74.01", "40.6905,-73.9770"), 3))

    def test_system_totals(self):
        data = BikesData(fetch=dispatch)
        system = data.system()
        self.assertEqual(system["bikes"], 17)
        self.assertEqual(system["ebikes"], 5)
        self.assertEqual(system["renting"], 2)

    def test_points_are_validated(self):
        self.assertEqual(BikesData.check_point("40.71,-74.01"), "40.71,-74.01")
        with self.assertRaises(ValueError):
            BikesData.check_point("Grand Central")


class RouteTests(unittest.TestCase):
    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")

    def test_system_status(self):
        self.assertEqual(route("how many citibikes are available right now?")[0], "bikes-status")

    def test_station_by_name(self):
        skill, params = route("what is at the Grand Central station?")
        self.assertEqual(skill, "bikes-station")
        self.assertEqual(params["station"], "Grand Central")

    def test_nearest_to_a_point(self):
        skill, params = route("nearest citibike stations to 40.71,-74.01?")
        self.assertEqual(skill, "bikes-near")
        self.assertEqual(params["point"], "40.71,-74.01")

    def test_borough_name(self):
        skill, params = route("how are the bikes in Brooklyn?")
        self.assertEqual(skill, "bikes-near")
        self.assertEqual(params["place"], "brooklyn")
        self.assertEqual(params["point"], "40.6782,-73.9442")

    def test_station_name_extraction(self):
        self.assertEqual(station_name_from_text("bikes at Grand Central"), "Grand Central")
        self.assertIsNone(station_name_from_text("how many bikes are there?"))


class TurnTests(unittest.TestCase):
    def turn(self, text: str, data: FakeData | None = None, permission: str = "allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = BikesAgent(agent_conn, data or FakeData())
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_status_totals(self):
        result, client = self.turn("how many citibikes are available right now?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("17 bikes available across 2 stations", result["text"])
        self.assertIn("5 of those are e-bikes", result["text"])
        tools = [update for update in result["updates"] if update.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "bikes-status")
        self.assertEqual(len(client.permission_requests), 1)

    def test_station_answer(self):
        result, _ = self.turn("what is at the Grand Central station?")
        self.assertIn("Grand Central (matched 1 station(s)):", result["text"])
        self.assertIn("12 bikes available (3 e-bikes), capacity 40", result["text"])

    def test_nearby_answer(self):
        result, _ = self.turn("nearest citibike stations to 40.71,-74.01?")
        self.assertIn("Nearest Citi Bike stations to 40.71,-74.01:", result["text"])
        self.assertIn("4.87 km - Grand Central", result["text"])

    def test_unknown_place_is_refused_not_guessed(self):
        result, _ = self.turn("nearest bikes in Atlantis")
        self.assertIn("I do not know the place 'atlantis'", result["text"])

    def test_help_does_not_ask_permission(self):
        result, client = self.turn("what can you do?")
        self.assertIn("Citi Bike", result["text"])
        self.assertEqual(client.permission_requests, [])

    def test_permission_denied(self):
        result, _ = self.turn("how many citibikes are available right now?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", result["text"])

    def test_a_feed_failure_is_reported(self):
        result, _ = self.turn("how many citibikes are available right now?",
                              data=FakeData(raise_error=True))
        self.assertIn("could not read the GBFS feed", result["text"])
        statuses = [update.get("status") for update in result["updates"]
                    if update.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)


# Premium transport uses the real client, with an offline MCP response.
import json
import os
from unittest.mock import patch
from acp_kit import GatewayClient

BOARD_ROW = {"name": "Grand Central", "bikes": 12, "ebikes": 3, "docks": 25,
             "ebikeSharePct": 25, "occupancyPct": 30}
PREMIUM_PAYLOAD = {"eligibleStations": 2345, "ranked": [BOARD_ROW],
                   "emptiest": [BOARD_ROW], "fullest": [BOARD_ROW]}

class PremiumTests(unittest.TestCase):
    def gateway(self, key, payload=PREMIUM_PAYLOAD, refused=False):
        calls = []
        def fetch(url, body, headers):
            calls.append((body["params"], headers))
            result = {"content": [{"type": "text", "text": json.dumps(payload)}]}
            if refused:
                result.update(isError=True, structuredContent={"licenceRefusal": True})
            return {"result": result}
        gateway = GatewayClient(key=key, fetch=fetch)
        gateway.calls = calls
        return gateway

    def test_no_key_attempts_premium_client_call(self):
        with patch.dict(os.environ, {}, clear=True):
            gateway = self.gateway("")
            with patch.object(gateway, "call", wraps=gateway.call) as call:
                answer, artifact = BikesAgent(data=FakeData(), gateway=gateway)._run_skill(*route("Citi Bike capacity board"))
            call.assert_called_once_with("bikes_capacity_board", {"limit": 5})
            self.assertIn("MCP_LICENSE_KEY", answer)
            self.assertEqual(artifact["reason"], "missing_key")
            self.assertEqual(gateway.calls, [])

    def test_rejected_key_preserves_gateway_wording(self):
        wording = "Revoked by the gateway. Set MCP_LICENSE_KEY."
        gateway = self.gateway("lic_live_but_rejected", wording, True)
        answer, artifact = BikesAgent(data=FakeData(), gateway=gateway)._capacity({})
        self.assertEqual(answer, json.dumps(wording))
        self.assertEqual(artifact["reason"], "denied")

    def test_good_key_uses_gateway_numbers(self):
        gateway = self.gateway("lic_granted")
        answer, artifact = BikesAgent(data=FakeData(), gateway=gateway)._run_skill(*route("Citi Bike capacity board"))
        self.assertIn("2345 operational stations", answer)
        self.assertIn("12 bikes, 3 e-bikes", answer)
        self.assertTrue(artifact["premium"])
        self.assertEqual(len(gateway.calls), 1)
        self.assertEqual(gateway.calls[0][0], {"name": "bikes_capacity_board", "arguments": {"limit": 5}})
        self.assertEqual(gateway.calls[0][1]["Authorization"], "Bearer lic_granted")

    def test_free_questions_never_call_gateway(self):
        gateway = self.gateway("lic_granted")
        agent = BikesAgent(data=FakeData(), gateway=gateway)
        for question in ("how many citibikes are available right now?", "what is at Grand Central?", "nearest stations to 40.71,-74.01?"):
            agent._run_skill(*route(question))
        self.assertEqual(gateway.calls, [])

    def test_empty_payload_is_not_a_made_up_board(self):
        answer, artifact = BikesAgent(data=FakeData(), gateway=self.gateway("lic_granted", {}))._capacity({})
        self.assertIn("no readable capacity board", answer)
        self.assertTrue(artifact["failed"])


if __name__ == "__main__":
    unittest.main()
