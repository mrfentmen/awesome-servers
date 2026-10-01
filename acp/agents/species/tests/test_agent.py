"""Tests for the species agent: feed reader, routing, skills, permissions.

    python3 agents/species/tests/test_agent.py
"""

from __future__ import annotations

import json
import os
from unittest.mock import Mock, patch
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

from acp_kit import GatewayClient, GatewayError
from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL  # noqa: E402

from agent import SpeciesAgent, route, taxon_from_text  # noqa: E402
from data import DATASET, SpeciesData, SpeciesError  # noqa: E402

COUNT_PAYLOAD = {
    "total_results": 548321,
    "results": [{
        "quality_grade": "research",
        "observed_on": "2026-09-20",
        "place_guess": "Mexico City",
        "user": {"login": "mariposa"},
        "taxon": {"name": "Danaus plexippus", "preferred_common_name": "Monarch"},
        "uri": "https://www.inaturalist.org/observations/1",
    }],
}

RECENT_PAYLOAD = {
    "total_results": 12345,
    "results": [
        {"quality_grade": "research", "observed_on": "2026-09-21",
         "place_guess": "Prospect Park, Brooklyn", "user": {"login": "naturalist1"},
         "taxon": {"name": "Danaus plexippus", "preferred_common_name": "Monarch"},
         "uri": "https://www.inaturalist.org/observations/2"},
        {"quality_grade": "needs_id", "observed_on": "2026-09-20",
         "place_guess": "Cape May", "user": {"login": "shorebird"},
         "taxon": {"name": "Danaus plexippus", "preferred_common_name": "Monarch"},
         "uri": "https://www.inaturalist.org/observations/3"},
    ],
}

NEAR_PAYLOAD = {
    "total_results": 7890,
    "results": [{
        "quality_grade": "research", "observed_on": "2026-09-21",
        "place_guess": "Manhattan", "user": {"login": "urbanbirder"},
        "taxon": {"name": "Apis mellifera", "preferred_common_name": "Western Honey Bee"},
        "uri": "https://www.inaturalist.org/observations/4",
    }],
}


class FakeData(SpeciesData):
    """Same interface as the real reader, no network."""

    def __init__(self, raise_error: bool = False):
        self.raise_error = raise_error
        self.calls: list[dict] = []

    def count(self, taxon: str) -> dict:
        if self.raise_error:
            raise SpeciesError("iNaturalist is offline")
        self.calls.append({"kind": "count", "taxon": taxon})
        return {"dataset": DATASET, "taxon": taxon, "total": 548321,
                "sample": {"observed_on": "2026-09-20", "place": "Mexico City", "quality": "research"}}

    def recent(self, taxon: str, limit: int = 5) -> dict:
        if self.raise_error:
            raise SpeciesError("iNaturalist is offline")
        self.calls.append({"kind": "recent", "taxon": taxon, "limit": limit})
        rows = [
            {"name": "Danaus plexippus", "common": "Monarch", "observed_on": "2026-09-21",
             "place": "Prospect Park, Brooklyn", "user": "naturalist1", "quality": "research",
             "uri": "https://www.inaturalist.org/observations/2"},
            {"name": "Danaus plexippus", "common": "Monarch", "observed_on": "2026-09-20",
             "place": "Cape May", "user": "shorebird", "quality": "needs_id",
             "uri": "https://www.inaturalist.org/observations/3"},
        ]
        return {"dataset": DATASET, "taxon": taxon, "total": 12345, "rows": rows[:limit]}

    def nearby(self, point: str, radius_km: int = 10, limit: int = 5, taxon: str | None = None) -> dict:
        if self.raise_error:
            raise SpeciesError("iNaturalist is offline")
        self.calls.append({"kind": "nearby", "point": point, "radius_km": radius_km, "taxon": taxon})
        return {"dataset": DATASET, "point": point, "radius_km": radius_km, "taxon": taxon,
                "total": 7890, "rows": [{
                    "name": "Apis mellifera", "common": "Western Honey Bee",
                    "observed_on": "2026-09-21", "place": "Manhattan", "user": "urbanbirder",
                    "quality": "research", "uri": "https://www.inaturalist.org/observations/4",
                }]}


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
    def test_taxon_validation(self):
        self.assertEqual(SpeciesData.check_taxon("  Danaus   plexippus "), "Danaus plexippus")
        with self.assertRaises(ValueError):
            SpeciesData.check_taxon("x")

    def test_radius_validation(self):
        self.assertEqual(SpeciesData.check_radius("10"), 10)
        with self.assertRaises(ValueError):
            SpeciesData.check_radius(0)
        with self.assertRaises(ValueError):
            SpeciesData.check_radius(100)

    def test_points_and_places(self):
        self.assertEqual(SpeciesData.check_point("40.71,-74.01"), "40.71,-74.01")
        with self.assertRaises(ValueError):
            SpeciesData.check_point("40.71")
        self.assertEqual(SpeciesData.point_from_place("New York"), "40.71,-74.01")
        self.assertIsNone(SpeciesData.point_from_place("Atlantis"))
        self.assertEqual(SpeciesData.place_from_text("what lives in London?"), "london")

    def test_count_reads_the_total(self):
        data = SpeciesData(fetch=lambda url, params: COUNT_PAYLOAD)
        result = data.count("monarch butterfly")
        self.assertEqual(result["total"], 548321)
        self.assertEqual(result["sample"]["observed_on"], "2026-09-20")

    def test_recent_reads_the_rows(self):
        data = SpeciesData(fetch=lambda url, params: RECENT_PAYLOAD)
        result = data.recent("Danaus plexippus", limit=2)
        self.assertEqual(len(result["rows"]), 2)
        self.assertEqual(result["rows"][0]["user"], "naturalist1")
        self.assertEqual(result["rows"][1]["quality"], "needs_id")

    def test_nearby_sends_the_radius(self):
        seen = {}

        def fetch(url, params):
            seen.update(params)
            return NEAR_PAYLOAD

        data = SpeciesData(fetch=fetch)
        result = data.nearby("40.71,-74.01", 10)
        self.assertEqual(seen["lat"], "40.71")
        self.assertEqual(seen["radius"], "10")
        self.assertEqual(result["total"], 7890)

    def test_a_payload_without_results_is_an_error(self):
        data = SpeciesData(fetch=lambda url, params: {"total_results": 1})
        with self.assertRaises(SpeciesError):
            data.count("monarch butterfly")


class RouteTests(unittest.TestCase):
    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")

    def test_count(self):
        skill, params = route("how many monarch butterflies are there?")
        self.assertEqual(skill, "species-count")
        self.assertEqual(params["taxon"], "monarch butterflies")

    def test_recent(self):
        skill, params = route("recent sightings of Danaus plexippus")
        self.assertEqual(skill, "species-recent")
        self.assertEqual(params["taxon"], "danaus plexippus")

    def test_near_a_point(self):
        skill, params = route("what has been seen near 40.71,-74.01 within 10 km?")
        self.assertEqual(skill, "species-near")
        self.assertEqual(params["point"], "40.71,-74.01")
        self.assertEqual(params["radius_km"], 10)

    def test_near_an_unknown_place(self):
        skill, params = route("what butterflies have been seen near Prospect Park?")
        self.assertEqual(skill, "species-near")
        self.assertEqual(params["place"], "prospect park")
        self.assertNotIn("point", params)

    def test_taxon_extraction_is_conservative(self):
        self.assertIsNone(taxon_from_text("how many are there?"))
        self.assertEqual(taxon_from_text("how many observations of monarch butterflies are there?"),
                         "monarch butterflies")


class TurnTests(unittest.TestCase):
    def turn(self, text: str, data: FakeData | None = None, permission: str = "allow-once", gateway=None):
        agent_conn, client_conn = connected_pair()
        agent = SpeciesAgent(agent_conn, data or FakeData(), gateway=gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_count_names_the_feed_and_the_total(self):
        result, client = self.turn("how many monarch butterflies are there?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("iNaturalist holds 548,321 observations of monarch butterflies.", result["text"])
        self.assertIn("Mexico City", result["text"])
        self.assertIn(DATASET, result["text"])
        tools = [update for update in result["updates"] if update.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "species-count")
        self.assertEqual(len(client.permission_requests), 1)

    def test_recent_lists_the_newest_records(self):
        result, _ = self.turn("recent sightings of Danaus plexippus")
        self.assertIn("Monarch (Danaus plexippus) at Prospect Park, Brooklyn "
                      "(research, by naturalist1)", result["text"])
        self.assertIn("(12,345 on file)", result["text"])

    def test_near_answers_with_the_window(self):
        result, _ = self.turn("what has been seen near 40.71,-74.01 within 10 km?")
        self.assertIn("within 10 km of 40.71,-74.01 (7,890 on file)", result["text"])
        self.assertIn("Western Honey Bee (Apis mellifera) at Manhattan (research)", result["text"])

    def test_missing_species_asks_for_one(self):
        result, _ = self.turn("how many are there?")
        self.assertIn("Which species should I count?", result["text"])

    def test_unknown_place_is_refused_not_guessed(self):
        result, _ = self.turn("what has been seen near Prospect Park?")
        self.assertIn("I do not know the place 'prospect park'", result["text"])

    def test_help_does_not_ask_permission(self):
        result, client = self.turn("what can you do?")
        self.assertIn("iNaturalist", result["text"])
        self.assertEqual(client.permission_requests, [])

    def test_permission_denied(self):
        result, _ = self.turn("how many monarch butterflies are there?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", result["text"])

    def test_a_feed_failure_is_reported(self):
        result, _ = self.turn("how many monarch butterflies are there?", data=FakeData(raise_error=True))
        self.assertIn("could not read the iNaturalist feed", result["text"])
        statuses = [update.get("status") for update in result["updates"]
                    if update.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)


    def test_premium_turn_renders_board(self):
        gateway = Mock()
        gateway.call.return_value = PremiumTests.payload
        result, _ = self.turn(PremiumTests.question, gateway=gateway)
        self.assertIn("300 region observations", result["text"])
        gateway.call.assert_called_once_with("species_region_board", PremiumTests.arguments)

    def test_premium_turn_reports_gateway_failure(self):
        gateway = Mock()
        gateway.call.side_effect = GatewayError("unreachable", "gateway offline")
        result, _ = self.turn(PremiumTests.question, gateway=gateway)
        self.assertIn("gateway offline", result["text"])



class PremiumTests(unittest.TestCase):
    question = "region board place 1 taxon 47158 observer 1 from 2024-01 to 2024-03"
    arguments = {"place_id": 1, "taxon_id": 47158, "user_id": 1,
                 "start_month": "2024-01", "end_month": "2024-03"}
    payload = {"monthly": [
        {"month": "2024-01", "region_count": 100, "taxon_count": 10, "observer_count": 4,
         "taxon_share_percent": 10, "observer_share_percent": 40},
        {"month": "2024-02", "region_count": 0, "taxon_count": 0, "observer_count": 0,
         "taxon_share_percent": None, "observer_share_percent": None},
        {"month": "2024-03", "region_count": 200, "taxon_count": 40, "observer_count": 20,
         "taxon_share_percent": 20, "observer_share_percent": 50}],
        "totals": {"region": 300, "taxon": 50, "observer": 24},
        "taxon_net_change": 30, "observer_net_change": 16}

    def run_premium(self, gateway):
        return SpeciesAgent(data=FakeData(), gateway=gateway)._run_skill(*route(self.question))

    def test_no_key_attempts_premium_and_preserves_wording(self):
        with patch.dict(os.environ, {}, clear=True):
            fetch = Mock(side_effect=AssertionError("must not authorize"))
            gateway = GatewayClient(fetch=fetch)
            with self.assertRaises(GatewayError) as expected:
                gateway.call("species_region_board", self.arguments)
            with patch.object(gateway, "call", wraps=gateway.call) as call:
                answer, artifact = self.run_premium(gateway)
                call.assert_called_once_with("species_region_board", self.arguments)
            self.assertEqual(answer, str(expected.exception))
            self.assertIn("MCP_LICENSE_KEY", answer)
            self.assertEqual(artifact["reason"], "missing_key")
            fetch.assert_not_called()

    def test_rejected_key_preserves_gateway_wording(self):
        message = "Gateway key revoked. Buy at https://example.test/buy"
        fetch = Mock(return_value={"result": {"isError": True,
                     "structuredContent": {"licenceRefusal": True, "reason": "revoked"},
                     "content": [{"type": "text", "text": message}]}})
        answer, artifact = self.run_premium(GatewayClient(key="lic_live_but_rejected", fetch=fetch))
        self.assertEqual(answer, message)
        self.assertEqual(artifact["reason"], "denied")
        self.assertEqual(fetch.call_args.args[2]["Authorization"], "Bearer lic_live_but_rejected")

    def test_good_key_reports_gateway_numbers(self):
        fetch = Mock(return_value={"result": {"content": [{"type": "text", "text": json.dumps(self.payload)}]}})
        answer, artifact = self.run_premium(GatewayClient(key="test-good", fetch=fetch))
        self.assertEqual(fetch.call_count, 1)
        self.assertEqual(fetch.call_args.args[1]["params"],
                         {"name": "species_region_board", "arguments": self.arguments})
        for text in ("300 region observations", "50 taxon", "24 by this observer", "50% of taxon", "+30", "+16"):
            self.assertIn(text, answer)
        self.assertTrue(artifact["premium"])

    def test_free_question_never_calls_gateway(self):
        gateway = Mock()
        agent = SpeciesAgent(data=FakeData(), gateway=gateway)
        answer, _ = agent._run_skill(*route("how many monarch butterflies are there?"))
        self.assertIn("548,321", answer)
        gateway.call.assert_not_called()

    def test_unreadable_payload_has_no_invented_numbers(self):
        for payload in ({}, {"monthly": [None]}, "bad", {**self.payload, "totals": {}}):
            gateway = Mock()
            gateway.call.return_value = payload
            answer, artifact = self.run_premium(gateway)
            self.assertIn("no readable", answer)
            self.assertTrue(artifact["failed"])

    def test_route_and_missing_parameters(self):
        self.assertEqual(route(self.question), ("species-board", self.arguments))
        gateway = Mock()
        answer, _ = SpeciesAgent(gateway=gateway)._run_skill(*route("region board"))
        self.assertIn("supply iNaturalist IDs", answer)
        gateway.call.assert_not_called()


if __name__ == "__main__":
    unittest.main()
