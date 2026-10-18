"""Tests for watchd: threshold evaluation, refire discipline, and the transport honesty.

    python3 watchd/tests/test_watchd.py

No network: every read_ helper is patched at the module level with canned answers, because
watchd's own logic (compare, rate-limit, notify) is what needs proving.
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import watchd  # noqa: E402


class ThresholdTests(unittest.TestCase):
    def setUp(self):
        self._saved = {k: getattr(watchd, k) for k in ("read_air", "read_quakes", "read_flood")}

    def tearDown(self):
        for k, v in self._saved.items():
            setattr(watchd, k, v)

    def test_above_thresold_fires(self):
        watchd.read_air = lambda place: 162.0
        fire, wording = watchd.evaluate({"kind": "air", "place": "Denver", "threshold": 150}, None)
        self.assertTrue(fire)
        self.assertIn("US AQI 162", wording)
        self.assertIn("over your threshold 150", wording)

    def test_at_threshold_does_not_fire(self):
        watchd.read_air = lambda place: 150.0
        fire, _ = watchd.evaluate({"kind": "air", "place": "Denver", "threshold": 150}, None)
        self.assertFalse(fire)

    def test_quake_atMagnitude_fires_and_carries_place(self):
        watchd.read_quakes = lambda place, radius: {"magnitude": 4.9, "where": "12 km from Fresno",
                                                    "distance_km": 12.0, "ago_min": 3}
        fire, wording = watchd.evaluate(
            {"kind": "quakes", "place": "36.7,-119.7", "radius_km": 50, "magnitude": 4.5}, None)
        self.assertTrue(fire)
        self.assertIn("M4.9", wording)
        self.assertIn("12 km from Fresno", wording)

    def test_quake_silence_is_not_a_fire(self):
        watchd.read_quakes = lambda place, radius: None
        fire, wording = watchd.evaluate({"kind": "quakes", "place": "0,0", "magnitude": 4}, None)
        self.assertFalse(fire)
        self.assertIn("no quake", wording)

    def test_flood_over_stage_fires(self):
        watchd.read_flood = lambda gauge: (16.9, 16.6)
        fire, wording = watchd.evaluate({"kind": "flood", "gauge": "EADM7"}, None)
        self.assertTrue(fire)
        self.assertIn("16.9 m", wording)  # observed stage named in the wording

    def test_flood_under_stage_does_not_fire(self):
        watchd.read_flood = lambda gauge: (13.1, 16.6)
        self.assertFalse(watchd.evaluate({"kind": "flood", "gauge": "EADM7"}, None)[0])

    def test_unknown_kind_is_an_error_not_a_fire(self):
        with self.assertRaises(watchd.FeedError):
            watchd.evaluate({"kind": "meteorite"}, None)


class TickTests(unittest.TestCase):
    def setUp(self):
        self._saved = {k: getattr(watchd, k) for k in ("read_air", "send")}
        watchd.read_air = lambda place: 999.0
        self.sent = []
        watchd.send = lambda notifiers, check, wording: self.sent.append((check.get("name"), wording))

    def tearDown(self):
        for k, v in self._saved.items():
            setattr(watchd, k, v)

    def test_fire_then_refire_window_holds(self):
        config = {"checks": [{"name": "air-hot", "kind": "air",
                              "place": "Denver", "threshold": 100}],
                  "notifiers": {"console": True}}
        state = {}
        fires = watchd.tick(config, state)
        self.assertEqual(len(fires), 1)
        self.assertEqual(self.sent[0][0], "air-hot")
        # immediately again: the refire window keeps it silent
        self.assertEqual(watchd.tick(config, state), [])
        # and a expired window fires again
        state["air-hot"]["at"] = 0
        self.assertEqual(len(watchd.tick(config, state)), 1)

    def test_bad_threshold_type_does_not_crash_the_pass(self):
        config = {"checks": [{"name": "broken", "kind": "air", "place": "X", "threshold": "way-high"}]}
        self.assertEqual(watchd.tick(config, {}), [])  # crashed check logged, pass continues

    def test_unknown_kind_logged_not_fired(self):
        config = {"checks": [{"name": "nope", "kind": "meteorite"}]}
        self.assertEqual(watchd.tick(config, {}), [])


class NotifierTests(unittest.TestCase):
    def test_file_notifier_writes_jsonl(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "alerts.jsonl"
            watchd.send({"file": {"path": str(path)}},
                        {"name": "air-hot"}, "US AQI 162 (over your threshold 150)")
            row = json.loads(path.read_text().splitlines()[-1])
            self.assertEqual(row["alert"], "air-hot")
            self.assertIn("162", row["text"])

    def test_webhook_failure_is_swallowed(self):
        # a dead webhook must not raise; the run just logs it
        watchd.log.disabled = True
        try:
            watchd.send({"webhook": {"url": "http://127.0.0.1:9/nothing"}, "console": True},
                        {"name": "air-hot"}, "wording")
        finally:
            watchd.log.disabled = False
        self.assertTrue(True)  # reaching here IS the test: no exception escaped


if __name__ == "__main__":
    unittest.main()
