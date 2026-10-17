"""Tests for the CelesTrak satellites server.

    python3 servers/satellites/tests/test_agent.py

No test here touches the network: the client is either given a fake `fetch` or
subclassed, and the propagator is checked against analytic invariants that do
not depend on any feed at all.
"""

from __future__ import annotations

import json
import math
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


# The Kepler solver is private to data.py; the matrix-form reference below needs it.
from data import _kepler  # noqa: E402

from agent import (  # noqa: E402
    CARD_SKILLS,
    GATEWAY_TOOL,
    SKILL_CATALOG,
    SKILL_ORBIT_ELEMENTS,
    SKILL_OVERHEAD,
    SKILL_PASSES,
    SKILL_PASS_WINDOWS,
    CelesTrakAgent,
    parse,
    satellite_name_from_text,
)
from data import (  # noqa: E402
    DATASET,
    MU,
    R_EARTH_KM,
    SATCAT_DATASET,
    CelesTrakClient,
    UpstreamError,
    gmst,
    haversine_km,
    julian_date,
    look_angles,
    prepare,
    propagate,
    propagate_prepared,
)

#: A real ISS element set, used verbatim so the fixture cannot drift from reality.
ISS = {
    "OBJECT_NAME": "ISS (ZARYA)", "OBJECT_ID": "1998-067A", "NORAD_CAT_ID": 25544,
    "INTERNATIONAL_DESIGNATOR": "1998-067A", "EPOCH": "2026-09-28T11:09:16.121952",
    "MEAN_MOTION": 15.48680135, "ECCENTRICITY": 0.00071596, "INCLINATION": 51.6312,
    "RA_OF_ASC_NODE": 148.9632, "ARG_OF_PERICENTER": 198.226, "MEAN_ANOMALY": 161.8473,
    "BSTAR": 0.00011847787, "CLASSIFICATION_TYPE": "U",
}
ISS_MODULE = {**ISS, "OBJECT_NAME": "ISS (UNITY)", "NORAD_CAT_ID": 25551}
TIANHE = {
    **ISS, "OBJECT_NAME": "CSS (TIANHE)", "NORAD_CAT_ID": 48274, "MEAN_MOTION": 15.8,
    "INCLINATION": 41.5, "RA_OF_ASC_NODE": 10.0, "ARG_OF_PERICENTER": 30.0,
    "MEAN_ANOMALY": 90.0, "ECCENTRICITY": 0.0004,
}
ISS_CATALOG = {
    "OBJECT_NAME": "ISS (ZARYA)", "NORAD_CAT_ID": 25544, "OBJECT_ID": "1998-067A",
    "OBJECT_TYPE": "PAY", "OPS_STATUS_CODE": "+", "OWNER": "ISS",
    "LAUNCH_DATE": "1998-11-20", "LAUNCH_SITE": "TYMSC", "DECAY_DATE": "",
    "PERIOD": 92.98, "INCLINATION": 51.63, "APOGEE": 425, "PERIGEE": 416,
    "ORBIT_TYPE": "ORB", "ORBIT_CENTER": "EA",
}


def _no_network(*args, **kwargs):
    raise AssertionError("this test must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if "satcat" in url:
            return payloads["satcat"]
        if "gp.php" in url:
            return payloads["gp"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


class FakeCelesTrak(CelesTrakClient):
    """Same interface, no network. The readers it does not override stay real."""

    def __init__(self, elements=(ISS,), catalog=(ISS_CATALOG,), overhead=None, passes=None) -> None:
        super().__init__(fetch=_no_network)
        self.elements = list(elements)
        self.catalog_rows = list(catalog)
        self.overhead_rows = overhead if overhead is not None else []
        self.pass_rows = passes if passes is not None else []
        self.calls = 0

    def by_catnr(self, catnr):
        for row in self.elements:
            if str(row.get("NORAD_CAT_ID")) == str(catnr):
                return row
        return None

    def by_name(self, name, limit=10):
        needle = name.lower()
        return [self.element_summary(row) for row in self.elements
                if needle in (row.get("OBJECT_NAME") or "").lower()][:limit]

    def _elements(self, query, ttl=None):
        self.calls += 1
        return list(self.elements)

    def catalog(self, group=None, catnr=None, name=None, limit=10):
        rows = list(self.catalog_rows)
        if catnr:
            rows = [r for r in rows if str(r.get("NORAD_CAT_ID")) == str(catnr)]
        if name:
            rows = [r for r in rows if name.lower() in (r.get("OBJECT_NAME") or "").lower()]
        from data import CATALOG_KEYS
        return [{name: r[upstream] for upstream, name in CATALOG_KEYS.items() if upstream in r}
                | {"dataset": SATCAT_DATASET} for r in rows[:limit]]

    def overhead(self, point, min_elevation=10.0, group="stations", limit=10):
        self.calls += 1
        return list(self.overhead_rows)[:limit]

    def passes(self, row, point, min_elevation=10.0, days=2, limit=10):
        self.calls += 1
        return list(self.pass_rows)[:limit]

    def group_passes(self, point, min_elevation=10.0, group="stations", days=2, limit=10):
        self.calls += 1
        return {"group": group, "passes": list(self.pass_rows)[:limit],
                "passes_found": len(self.pass_rows), "satellites_swept": len(self.elements),
                "satellites_in_group": len(self.elements)}


def _message(text, **data):
    parts = [{"kind": "text", "text": text}]
    if data:
        parts.append({"kind": "data", "data": data})
    return {"parts": parts}


TOOL_ERROR_TEXT = ("`a2a_satellites_pass_windows` failed: CelesTrak returned an unexpected "
                   "element-set payload")




#: Shape copied from a live gateway `a2a_satellites_pass_windows` answer.
WINDOW_PAYLOAD = {
    "location": {"latitude": 51.5074, "longitude": -0.1278},
    "group": "stations", "days": 2, "minElevationDeg": 20.0,
    "from": "2026-09-29T12:00:00Z", "to": "2026-09-30T12:00:00Z",
    "satellitesConsidered": 3, "satelliteNames": ["ISS (ZARYA)", "CSS (TIANHE)", "POISK"],
    "passCount": 9,
    "windowCount": 4,
    "totalMinutes": 51, "totalHours": 0.85, "coveragePct": 1.8,
    "longestWindow": {
        "start": "2026-09-29T20:04:00Z", "end": "2026-09-29T20:19:00Z", "minutes": 15,
        "bestSatellite": "ISS (ZARYA)", "bestNoradId": 25544, "maxElevationDeg": 71.4,
        "bestAt": "2026-09-29T20:11:00Z", "rangeKm": 512, "satelliteCount": 2,
        "satellites": ["ISS (ZARYA)", "CSS (TIANHE)"],
    },
    "windows": [
        {"start": "2026-09-29T12:05:00Z", "end": "2026-09-29T12:12:00Z", "minutes": 7,
         "bestSatellite": "CSS (TIANHE)", "bestNoradId": 48274, "maxElevationDeg": 33.0,
         "bestAt": "2026-09-29T12:08:00Z", "rangeKm": 1180, "satelliteCount": 1,
         "satellites": ["CSS (TIANHE)"]},
        {"start": "2026-09-29T20:04:00Z", "end": "2026-09-29T20:19:00Z", "minutes": 15,
         "bestSatellite": "ISS (ZARYA)", "bestNoradId": 25544, "maxElevationDeg": 71.4,
         "bestAt": "2026-09-29T20:11:00Z", "rangeKm": 512, "satelliteCount": 2,
         "satellites": ["ISS (ZARYA)", "CSS (TIANHE)"]},
    ],
    "windowsTruncated": 2,
    "gaps": [{"minutes": 466, "from": "2026-09-29T12:12:00Z", "to": "2026-09-29T20:04:00Z"}],
    "oldestElementSet": "2026-09-28T11:09:16Z",
    "method": "Two-body Kepler propagation with secular J2 rates, swept every 20 s. Not SGP4.",
}


class PropagationTests(unittest.TestCase):
    """The orbit maths, checked against invariants rather than against a feed.

    The mean motion in a TLE is revolutions per *day*, so a unit slip here shows
    up as a period in minutes instead of ninety-odd. That slip happened once
    during development, so the period is asserted against the real ISS value.
    """

    def test_epoch_and_sidereal_time_are_exact(self):
        j2000 = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        self.assertAlmostEqual(julian_date(j2000), 2451545.0, places=6)
        self.assertAlmostEqual(math.degrees(gmst(2451545.0)) % 360.0, 280.4606, places=3)
        self.assertAlmostEqual(julian_date(j2000 + timedelta(days=1)), 2451546.0, places=6)

    def test_the_iss_period_and_axis_match_the_space_catalogue(self):
        """SATCAT publishes period 92.98 min and 416-425 km for 25544."""
        summary = CelesTrakClient.element_summary(FakeCelesTrak(), ISS)
        self.assertAlmostEqual(summary["period_minutes"], 92.98, places=1)
        self.assertAlmostEqual(summary["semi_major_km"], (425 + 416) / 2 + R_EARTH_KM, places=0)
        self.assertAlmostEqual(summary["perigee_km"], 416, delta=1.0)
        self.assertAlmostEqual(summary["apogee_km"], 425, delta=1.0)

    def test_a_circular_orbit_advances_the_right_ascension_exactly(self):
        """Real TLE units: 10 rev/day is a 144 minute period."""
        row = {**ISS, "MEAN_MOTION": 10.0, "ECCENTRICITY": 0.0, "INCLINATION": 0.0,
               "RA_OF_ASC_NODE": 0.0, "ARG_OF_PERICENTER": 0.0, "MEAN_ANOMALY": 0.0,
               "EPOCH": "2000-01-01T12:00:00.000000"}
        base = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        period = 144.0 * 60.0
        for fraction in (0.0, 0.25, 0.5, 0.75):
            jd = julian_date(base + timedelta(seconds=fraction * period))
            position = propagate(row, jd)
            ra = (position["longitude"] + math.degrees(gmst(jd))) % 360.0
            self.assertAlmostEqual(ra, fraction * 360.0, delta=1.0)
            self.assertAlmostEqual(position["latitude"], 0.0, places=6)

    def test_inclination_sets_the_latitude_band(self):
        """A 51.6 degree orbit must never put the sub-point above 51.6 north."""
        base = julian_date(datetime(2026, 9, 28, 11, 9, 16, tzinfo=timezone.utc))
        for hours in range(0, 48, 2):
            latitude = propagate(ISS, base + hours / 24.0)["latitude"]
            self.assertLessEqual(abs(latitude), 51.6312 + 1e-6)

    def test_a_circle_of_zero_radius_stays_at_its_radius(self):
        position = propagate(ISS, julian_date(datetime(2026, 9, 28, 11, 9, 16, tzinfo=timezone.utc)))
        self.assertAlmostEqual(position["radius"], 6803.0, delta=8.0)
        self.assertAlmostEqual(position["altitude_km"], 424.9, delta=8.0)

    def test_prepared_and_one_shot_propagation_agree(self):
        base = julian_date(datetime(2026, 9, 28, 11, 9, 16, tzinfo=timezone.utc))
        prepared = prepare(ISS)
        for hours in (0.0, 1.0, 7.0, 24.0):
            a = propagate(ISS, base + hours / 24.0)
            b = propagate_prepared(prepared, base + hours / 24.0)
            for key in ("x", "y", "z", "latitude", "longitude", "altitude_km"):
                self.assertAlmostEqual(a[key], b[key], places=9)

    def test_the_closed_form_rotation_matches_the_matrix_product(self):
        """The fast path is only allowed if it equals the literal product."""
        def matrix_form(row, jd):
            orbit = prepare(row)
            node = orbit["nodeo"] - orbit["k"] * math.cos(orbit["inclination"]) * (
                (jd - orbit["epoch"]) * 86400.0)
            argp = orbit["argpo"] + 0.5 * orbit["k"] * (
                5 * math.cos(orbit["inclination"]) ** 2 - 1) * ((jd - orbit["epoch"]) * 86400.0)
            m = (orbit["mean_anomaly"] + orbit["mean_motion"] * (jd - orbit["epoch"]) * 86400.0)
            e = orbit["eccentricity"]
            ea = _kepler(m % (2 * math.pi), e)
            nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(ea / 2),
                                math.sqrt(1 - e) * math.cos(ea / 2))
            r = orbit["semi_major"] * (1 - e * math.cos(ea))
            xp, yp = r * math.cos(nu), r * math.sin(nu)
            def rz(t):
                c, s = math.cos(t), math.sin(t)
                return [[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]]
            def rx(t):
                c, s = math.cos(t), math.sin(t)
                return [[1.0, 0.0, 0.0], [0.0, c, -s], [0.0, s, c]]
            def mm(p, q):
                return [[sum(p[i][k] * q[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
            matrix = mm(mm(rz(node), rx(orbit["inclination"])), rz(argp))
            return [sum(matrix[i][k] * [xp, yp, 0.0][k] for k in range(3)) for i in range(3)]

        base = julian_date(datetime(2026, 9, 28, 11, 9, 16, tzinfo=timezone.utc))
        for row in (ISS, TIANHE, {**ISS, "ECCENTRICITY": 0.0021, "INCLINATION": 12.5}):
            position = propagate(row, base + 0.37)
            expected = matrix_form(row, base + 0.37)
            for got, want in zip((position["x"], position["y"], position["z"]), expected):
                self.assertAlmostEqual(got, want, places=6)

    def test_a_broken_element_set_is_an_upstream_error_not_a_crash(self):
        for bad in ({"MEAN_MOTION": 15.0}, {**ISS, "EPOCH": "not-a-date"},
                    {**ISS, "MEAN_MOTION": 0.0}, {**ISS, "INCLINATION": "x"}):
            with self.assertRaises(UpstreamError):
                prepare(bad)

    def test_look_angles_are_right_at_the_obvious_moments(self):
        """Straight up must read 90 degrees, and the far side below the horizon."""
        observer_lat, observer_lon = 51.5074, -0.1278
        # Directly overhead means the sub-point is the observer's own position.
        overhead = {"radius": R_EARTH_KM + 420.0, "x": 0.0, "y": 0.0, "z": R_EARTH_KM + 420.0,
                    "latitude": observer_lat, "longitude": observer_lon}
        angles = look_angles(overhead, observer_lat, observer_lon)
        self.assertAlmostEqual(angles["elevation_deg"], 90.0, delta=0.5)
        self.assertAlmostEqual(angles["range_km"], 420.0, delta=1.0)
        opposite = {**overhead, "longitude": observer_lon + 180.0}
        self.assertLess(look_angles(opposite, observer_lat, observer_lon)["elevation_deg"], 0.0)

    def test_haversine(self):
        self.assertAlmostEqual(haversine_km(51.5074, -0.1278, 51.5074, -0.1278), 0.0, places=6)
        self.assertAlmostEqual(haversine_km(51.5074, -0.1278, 40.7006, -74.0142), 5570, delta=40)


class ReaderTests(unittest.TestCase):
    def test_elements_are_renamed_and_derived(self):
        calls = []
        client = CelesTrakClient(fetch=fetch_from({"gp": [ISS]}, calls))
        rows = client.group_elements("stations", limit=5)
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row["object_name"], "ISS (ZARYA)")
        self.assertEqual(row["norad_cat_id"], 25544)
        self.assertEqual(row["inclination_deg"], 51.6312)
        self.assertEqual(row["dataset"], DATASET)
        self.assertAlmostEqual(row["period_minutes"], 92.98, places=1)
        self.assertIsNotNone(row["element_set_age_hours"])
        url, params = calls[0]
        self.assertIn("gp.php", url)
        self.assertEqual(params["GROUP"], "stations")
        self.assertEqual(params["FORMAT"], "json")

    def test_a_group_is_fetched_once_and_then_served_from_cache(self):
        calls = []
        client = CelesTrakClient(fetch=fetch_from({"gp": [ISS, TIANHE]}, calls))
        client.group_elements("stations")
        client.group_elements("stations")
        self.assertEqual(len([c for c in calls if "gp.php" in c[0]]), 1)

    def test_an_unknown_name_or_number_is_an_empty_list_not_an_outage(self):
        """CelesTrak answers HTTP 404 for a name or number it does not know."""
        from urllib import error as urlerror

        def not_found(url, params, headers):
            raise UpstreamError("SATELLITES request failed: HTTP Error 404: Not Found") \
                from urlerror.HTTPError(url, 404, "Not Found", {}, None)

        client = CelesTrakClient(fetch=not_found)
        self.assertEqual(client.by_catnr("999999"), None)
        self.assertEqual(client.by_name("NOTASATELLITE"), [])

    def test_a_real_outage_still_raises(self):
        def broken(url, params, headers):
            raise UpstreamError("SATELLITES request failed: HTTP Error 500") from None

        client = CelesTrakClient(fetch=broken)
        with self.assertRaises(UpstreamError):
            client.group_elements("stations")

    def test_catalog_records_are_renamed(self):
        client = CelesTrakClient(fetch=fetch_from({"satcat": [ISS_CATALOG]}))
        records = client.catalog(catnr="25544")
        self.assertEqual(records[0]["owner"], "ISS")
        self.assertEqual(records[0]["launch_date"], "1998-11-20")
        self.assertEqual(records[0]["apogee_km"], 425)
        self.assertEqual(records[0]["dataset"], SATCAT_DATASET)

    def test_a_catalogue_lookup_needs_something_to_look_up(self):
        client = CelesTrakClient(fetch=_no_network)
        with self.assertRaises(ValueError):
            client.catalog()

    def test_validation_rejects_bad_input(self):
        client = CelesTrakClient(fetch=_no_network)
        self.assertEqual(client.check_catnr(" 25544 "), "25544")
        for bad in ("", "abcdef", "1234567"):
            with self.assertRaises(ValueError):
                client.check_catnr(bad)
        with self.assertRaises(ValueError):
            client.check_group("not-a-group")
        with self.assertRaises(ValueError):
            client.check_point("51.5")
        with self.assertRaises(ValueError):
            client.check_point("91.0,0.0")
        with self.assertRaises(ValueError):
            client.check_elevation(-1)
        with self.assertRaises(ValueError):
            client.check_elevation(91)
        with self.assertRaises(ValueError):
            client.check_days(8)
        with self.assertRaises(ValueError):
            client.check_limit(0)
        self.assertEqual(client.check_point("51.5074, -0.1278"), (51.5074, -0.1278))

    def test_an_ambiguous_name_is_left_to_the_caller(self):
        client = FakeCelesTrak(elements=(ISS, ISS_MODULE))
        row, candidates = client.resolve(name="ISS")
        self.assertIsNone(row)
        self.assertEqual(len(candidates), 2)
        row, candidates = client.resolve(name="ISS (ZARYA)")
        self.assertIsNotNone(row)
        self.assertEqual(row["NORAD_CAT_ID"], 25544)
        self.assertEqual([c["norad_cat_id"] for c in candidates], [25544])


class ParseTests(unittest.TestCase):
    def test_elements_questions(self):
        request = parse(_message("what are the orbit elements for 25544?"))
        self.assertEqual(request["skill"], SKILL_ORBIT_ELEMENTS)
        self.assertEqual(request["params"]["catnr"], "25544")
        request = parse(_message("list the visual group"))
        self.assertEqual(request["params"]["group"], "visual")

    def test_a_latitude_is_not_read_as_a_catalogue_number(self):
        """40.7006,-74.0142 is a place, not satellite 40."""
        request = parse(_message("what is overhead at 40.7006,-74.0142?"))
        self.assertEqual(request["skill"], SKILL_OVERHEAD)
        self.assertEqual(request["params"]["point"], "40.7006,-74.0142")
        self.assertIsNone(request["params"].get("catnr"))

    def test_a_day_count_is_not_read_as_a_catalogue_number(self):
        request = parse(_message("how many hours of usable passes do I have from 51.5074,-0.1278?"))
        self.assertEqual(request["skill"], SKILL_PASS_WINDOWS)
        self.assertIsNone(request["params"].get("catnr"))

    def test_passes_and_catalog_and_overhead_route_apart(self):
        self.assertEqual(parse(_message("when does the ISS pass over 51.5074,-0.1278?"))["skill"],
                         SKILL_PASSES)
        self.assertEqual(parse(_message("who owns satellite 25544?"))["skill"], SKILL_CATALOG)
        self.assertEqual(parse(_message("when was the ISS launched and from where?"))["skill"],
                         SKILL_CATALOG)
        self.assertEqual(parse(_message("anything visible from 51.5074,-0.1278 right now?"))["skill"],
                         SKILL_OVERHEAD)


    def test_explicit_json_wins(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": SKILL_PASS_WINDOWS, "point": "51.5074,-0.1278", "days": 3,
            "min_elevation": 20}}]})
        self.assertEqual(request["skill"], SKILL_PASS_WINDOWS)
        self.assertEqual(request["params"]["days"], 3)
        self.assertEqual(request["params"]["min_elevation"], 20)
        self.assertTrue(request["explicit"])

    def test_help_and_empty(self):
        self.assertEqual(parse(_message(""))["skill"], "help")
        self.assertEqual(parse(_message("what can you do?"))["skill"], "help")
        self.assertEqual(parse(_message("hello there"))["skill"], SKILL_ORBIT_ELEMENTS)

    def test_name_extraction_is_conservative(self):
        self.assertEqual(satellite_name_from_text("orbital elements for the ISS", None), "ISS")
        self.assertIsNone(satellite_name_from_text("orbital elements for 25544", "25544"))
        self.assertIsNone(satellite_name_from_text("orbital elements for", None))








if __name__ == "__main__":
    unittest.main()
