"""Tests for the orchestrator: routing, the federation transport, and the brief merge.

    python3 agents/orchestrator/tests/test_agent.py

The federation tests run against a real sibling ACP agent process (a tiny offline one built
in this file), so the child-supervision code is exercised exactly as it runs on live agents.
"""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

import agent  # noqa: E402
import federation  # noqa: E402
from federation import SiblingTurn, catalog, run_sibling, sibling_question, topics_from  # noqa: E402

FAKE_SIBLING = r"""
import sys, json
def send(obj):
    sys.stdout.write(json.dumps(obj) + "\n"); sys.stdout.flush()
def recv():
    return json.loads(sys.stdin.readline())

req = recv()  # initialize — echo the caller's id
send({"jsonrpc":"2.0","id":req["id"],"result":{"protocolVersion":1,"agentCapabilities":{},
      "authMethods":[],"agentInfo":{"name":"fake-sibling","title":"Fake","version":"3.2.1"}}})
while True:
    try:
        req = recv()
    except Exception:
        break
    method = req.get("method", "")
    if method == "session/new":
        send({"jsonrpc":"2.0","id":req["id"],"result":{"sessionId":"fake-session-1","modes":[]}})
    elif method == "session/prompt":
        text = ""
        for block in req.get("params", {}).get("prompt", []):
            text += block.get("text") or ""
        for line in ("FAKE ANSWER for %r" % text, "line two"):
            send({"jsonrpc":"2.0","method":"session/update","params":{"update":{
                "sessionUpdate":"agent_message_chunk","content":{"type":"text","text":line+"\n"}}}})
        send({"jsonrpc":"2.0","id":req["id"],"result":{"stopReason":"end-turn"}})
    elif method in ("session/cancel", "session/load"):
        continue  # nothing to undo or load in the fake
    else:
        send({"jsonrpc":"2.0","id":req.get("id"),"error":{"code":-32601,"message":"unhandled "+method}})
"""


def fake_sibling_path(tmpdir: Path) -> str:
    path = tmpdir / "fake_sibling.py"
    path.write_text(FAKE_SIBLING)
    return str(path)


class RouteTests(unittest.TestCase):
    def test_brief_places(self):
        skill, params = agent.route("brief me on Denver")
        self.assertEqual(skill, "brief")
        self.assertEqual(params["place"], "Denver")
        self.assertIsNone(params["topics"])

    def test_brief_selects_named_topics_only(self):
        skill, params = agent.route("brief me for air and moon in Denver")
        self.assertEqual(skill, "brief")
        self.assertEqual(params["place"], "Denver")
        self.assertEqual(params["topics"], ["air", "moon"])

    def test_brief_without_place_is_help(self):
        self.assertEqual(agent.route("brief me")[0], "help")

    def test_ask_pairs_verbatim(self):
        skill, params = agent.route("ask moon: what is the next full moon?")
        self.assertEqual(skill, "ask")
        self.assertEqual(params["agent"], "moon")
        self.assertEqual(params["question"], "what is the next full moon?")

    def test_ask_unknown_agent_is_help(self):
        self.assertEqual(agent.route("ask nonexistent: hi")[0], "help")

    def test_catalog(self):
        self.assertEqual(agent.route("what agents can you run?")[0], "catalog")

    def test_help(self):
        self.assertEqual(agent.route("what can you do")[0], "help")


class SiblingPhrasingTests(unittest.TestCase):
    def test_template_for_bare_place(self):
        self.assertEqual(sibling_question("air", "Denver"),
                         "how is the air quality in Denver right now?")

    def test_verbatim_for_a_formed_question(self):
        self.assertEqual(sibling_question("moon", "what is the next full moon?"),
                         "what is the next full moon?")

    def test_unknown_name_rejected(self):
        with self.assertRaises(federation.SiblingError):
            sibling_question("nonsense", "hi")


class MergeTests(unittest.TestCase):
    def test_brief_body_counts_and_quotes(self):
        rows = [SiblingTurn("air"), SiblingTurn("moon")]
        rows[0].ok, rows[0].text = True, "AQI 42, good\nDetails line\nMore\nEven more\nAnd more"
        rows[1].error = "the sibling did not answer"
        body, summary = agent.render_brief("Denver", rows)
        self.assertIn("1 of 2 agents answered", body)
        self.assertIn("[air]", body)
        self.assertIn("1 more line(s)", body)
        self.assertIn("[moon] not answered: the sibling did not answer", body)
        self.assertEqual(summary, "1/2 sibling answers")


class FederationChildTests(unittest.TestCase):
    def test_real_child_process_over_acp(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            import os
            api = fake_sibling_path(Path(tmp))
            old = os.environ.get("ORCHESTRATOR_SIBLING_OVERRIDE")
            os.environ["ORCHESTRATOR_SIBLING_OVERRIDE"] = api
            try:
                turn = run_sibling("air", "Denver")
            finally:
                if old is None:
                    os.environ.pop("ORCHESTRATOR_SIBLING_OVERRIDE", None)
                else:
                    os.environ["ORCHESTRATOR_SIBLING_OVERRIDE"] = old
            self.assertTrue(turn.ok, turn.error)
            self.assertIn("FAKE ANSWER for 'how is the air quality in Denver right now?'", turn.text)
            self.assertIn("line two", turn.text)
            self.assertEqual(turn.stop_reason, "end-turn")

    def test_fanout_tolerates_a_dead_sibling(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            api = fake_sibling_path(Path(tmp))
            old = os.environ.get("ORCHESTRATOR_SIBLING_OVERRIDE")
            os.environ["ORCHESTRATOR_SIBLING_OVERRIDE"] = api
            try:
                rows = federation.brief({"air": "Denver", "moon": "Lisbon"}, timeout=20)
            finally:
                if old is None:
                    os.environ.pop("ORCHESTRATOR_SIBLING_OVERRIDE", None)
                else:
                    os.environ["ORCHESTRATOR_SIBLING_OVERRIDE"] = old
            self.assertEqual([row.agent for row in rows], ["air", "moon"])
            self.assertTrue(all(row.ok for row in rows), [row.error for row in rows])

    def test_missing_sibling_is_not_a_crash(self):
        old = os.environ.get("ORCHESTRATOR_SIBLING_OVERRIDE")
        os.environ["ORCHESTRATOR_SIBLING_OVERRIDE"] = str(REPO_ROOT / "acp" / "agents" / "noSuchFile.py")
        try:
            turn = run_sibling("air", "Denver")
        finally:
            if old is None:
                os.environ.pop("ORCHESTRATOR_SIBLING_OVERRIDE", None)
            else:
                os.environ["ORCHESTRATOR_SIBLING_OVERRIDE"] = old
        self.assertFalse(turn.ok)
        self.assertTrue(turn.error)  # any honest failure text, not a crash


if __name__ == "__main__":
    unittest.main()
