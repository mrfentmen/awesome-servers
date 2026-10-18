#!/usr/bin/env python3
"""watchd — run this repo's watch question for you, all day, and tell you when it happens.

The paywall is gone from the packages; what a hosted service could sell is *operation*: the
packages watch nothing between editor sessions, and a flood stage does not care whether you
opened an editor. watchd answers that by polling the same keyless feeds, evaluating plain
thresholds and notifying through whatever channel you give it.

    watchd.py --config conditions.json --loop --state state.json
    watchd.py --config conditions.json --once        # cron-friendly single pass

conditions.json shape:

    {
      "every_s": 120,
      "notifiers": {"console": true, "file": {"path": "alerts.jsonl"}},
      "checks": [
        {"name": "denver-air",
         "kind": "air", "place": "Denver", "threshold": 150, "when": "above"},
        {"name": "bay-quakes",
         "kind": "quakes", "place": "37.77,-122.42", "radius_km": 120,
         "magnitude": 4.5, "when": "above"},
        {"name": "parkman-flood",
         "kind": "flood", "gauge": "EADM7", "threshold_m": 20, "when": "above"}
      ]
    }

Checks are honest about their sources: an alert names the reading it actually saw, and a
feed that did not answer is logged as a feed problem, not as "conditions met".
"""

from __future__ import annotations

import argparse
import datetime
import json
import logging
import math
import os
import re
import sys
import time
from urllib import parse, request

log = logging.getLogger("watchd")

# --- feeds (keyless, same ones the subtree agents were verified against) -------------------

AIR = "https://air-quality-api.open-meteo.com/v1/air-quality"
QUAKES = "https://earthquake.usgs.gov/fdsnws/event/1/query"
GEOCODE = "https://geocoding-api.open-meteo.com/v1/search"

USER_AGENT = "awesome-watchd/0.1 (+https://github.com/mrfentmen/awesome-servers)"


class FeedError(RuntimeError):
    """A feed did not answer; a check cannot be evaluated, which is worth knowing."""


def http_get(url: str, params: dict | None = None, timeout: float = 25.0) -> bytes:
    query = f"{url}?{parse.urlencode(params)}" if params else url
    req = request.Request(query, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as exc:
        raise FeedError(f"request failed: {exc}") from exc


def _point(spec: str) -> tuple[float, float]:
    text = str(spec or "").strip()
    match = re.fullmatch(r"\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*", text)
    if match:
        return float(match.group(1)), float(match.group(2))
    payload = json.loads(http_get(GEOCODE, {"name": text, "count": 1}))
    rows = payload.get("results") or []
    if not rows:
        raise FeedError(f"no place called {text!r}")
    return float(rows[0]["latitude"]), float(rows[0]["longitude"])


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r1, r2 = math.radians(lat1), math.radians(lat2)
    dlat, dlon = r2 - r1, math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(r1) * math.cos(r2) * math.sin(dlon / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(a))


def read_air(place: str) -> float:
    """One number: the US AQI the air-quality service publishes right now."""
    lat, lon = _point(place)
    body = json.loads(http_get(AIR, {"latitude": lat, "longitude": lon, "current": "us_aqi", "timezone": "UTC"}))
    aqi = ((body.get("current") or {}).get("us_aqi"))
    if aqi is None:
        raise FeedError("the air service named no current AQI for that point")
    return float(aqi)


def read_quakes(place: str, radius_km: float = 120.0) -> dict | None:
    """The largest recent quake inside the radius, or None when nothing is there to report."""
    lat, lon = _point(place)
    body = json.loads(http_get(QUAKES, {
        "format": "geojson", "latitude": lat, "longitude": lon,
        "maxradiuskm": radius_km, "minmagnitude": 1, "orderby": "magnitude", "limit": 12,
        "starttime": datetime.datetime.now(datetime.timezone.utc).isoformat()[:19]}))
    rows = (body.get("features") or [])
    for row in rows:
        props = row.get("properties") or {}
        if props.get("mag") is None:
            continue
        geo = ((row.get("geometry") or {}).get("coordinates") or [None, None])[:2]
        return {"magnitude": float(props["mag"]),
                "where": props.get("place") or "unknown",
                "distance_km": round(haversine_km(lat, lon, geo[1], geo[0]), 1),
                "ago_min": round((time.time() - props.get("time", 0) / 1000) / 60)}
    return None


def read_flood(gauge: str) -> tuple[float, float]:
    """(observed feet, flood-stage feet) from the NWPS gauge's own JSON (api.water.noaa.gov,
    the same verified read the floodwatch agent uses: v1/gauges/{LID} carries
    status.observed.primary and flood.categories.<level>.stage)."""
    identifier = str(gauge or "").strip().upper()
    body = json.loads(http_get(f"https://api.water.noaa.gov/nwps/v1/gauges/{identifier}"))
    if not isinstance(body, dict) or not body.get("name"):
        raise FeedError(f"NWPS returned no gauge named {identifier!r}")
    observed = ((body.get("status") or {}).get("observed") or {})
    categories = ((body.get("flood") or {}).get("categories") or {})
    obs = observed.get("primary")
    flood = None
    for key in ("minor", "moderate", "major", "action"):
        stage = (categories.get(key) or {}).get("stage")
        if stage is not None:
            flood = float(stage)
            break
    if obs is None or flood is None:
        raise FeedError(f"gauge {identifier} did not publish an observed or flood stage")
    return float(obs), flood


# --- checks --------------------------------------------------------------------------------

def evaluate(check: dict, state_cell: dict | None) -> tuple[bool, str]:
    """(fire, human wording) for one check. Feed problems raise FeedError."""
    kind = str(check.get("kind") or "").lower()
    when = str(check.get("when") or "above").lower()
    if kind == "air":
        reading = read_air(check.get("place"))
        threshold = float(check.get("threshold") or 100)
        met = reading > threshold if when == "above" else reading < threshold
        return met, f"US AQI {reading:g} ({_dir(when)} your threshold {threshold:g}) for {check.get('place')}"
    if kind == "quakes":
        row = read_quakes(check.get("place"), float(check.get("radius_km") or 120))
        threshold = float(check.get("magnitude") or 3)
        if row is None:
            return False, "no quake of any size inside the radius in the look-back"
        met = row["magnitude"] >= threshold if when == "above" else row["magnitude"] <= threshold
        return met, (f"M{row['magnitude']:g} — {row['where']}, {row['distance_km']} km away, "
                     f"{row['ago_min']} min ago (threshold {threshold:g})")
    if kind == "flood":
        obs, flood = read_flood(check.get("gauge"))
        met = obs >= flood if when == "above" else obs < flood
        return met, f"gauge {check.get('gauge')} observed {obs:g} m vs flood stage {flood:g} m"
    raise FeedError(f"unknown check kind: {kind!r}")


def _dir(when: str) -> str:
    return "over" if when == "above" else "under"


# --- notifiers -----------------------------------------------------------------------------

def send(notifiers: dict, check: dict, wording: str) -> None:
    name = check.get("name") or check.get("kind")
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = {"alert": name, "at": stamp, "text": wording}
    if not notifiers.get("console"):
        log.warning("no notifier is enabled; alert goes nowhere loudly: %s", payload)
    for kind, spec in notifiers.items():
        if kind == "console":
            print(f"[WATCHD] {stamp} {name}: {wording}", flush=True)
        elif kind == "file":
            path = str((spec or {}).get("path") or "alerts.jsonl")
            os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
            with open(path, "a", encoding="utf-8") as handle:
                handle.write(json.dumps(payload, default=str) + "\n")
        elif kind == "webhook":
            body = json.dumps(payload).encode()
            req = request.Request(str((spec or {}).get("url") or ""), data=body,
                                  headers={"Content-Type": "application/json",
                                           "User-Agent": USER_AGENT})
            try:
                request.urlopen(req, timeout=20).read(16)
            except Exception as exc:  # a dead webhook must not stop the watcher
                log.error("webhook %s failed: %s", name, exc)


# --- the runner ----------------------------------------------------------------------------

def load_state(path: str | None) -> dict:
    try:
        return json.loads(open(path or os.devnull, encoding="utf-8").read() or "{}")
    except (ValueError, OSError):
        return {}


def save_state(path: str | None, state: dict) -> None:
    if not path:
        return
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        handle.write(json.dumps(state, default=str))
    os.replace(tmp, path)


def tick(config: dict, state: dict, path: str | None = None) -> list[dict]:
    """One pass over the checks. Fires are job records; failures are returned as gifts too."""
    fired = []
    refire_s = int(config.get("refire_s") or 3 * 3600)
    for check in config.get("checks", []):
        name = str(check.get("name") or check.get("kind") or "check")
        try:
            met, wording = evaluate(check, state.get(name))
        except FeedError as exc:
            log.warning("check %s could not be evaluated: %s", name, exc)
            continue
        except Exception as exc:  # a broken check must not stop the watcher
            log.error("check %s crashed: %s", name, exc)
            continue
        last = float((state.get(name) or {}).get("at", 0))
        due = time.time() - last >= refire_s
        if met and due:
            send(config.get("notifiers", {}), check, wording)
            state[name] = {"at": time.time(), "reading": wording}
            fired.append({"name": name, "text": wording})
    save_state(path, state)
    return fired


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="threshold watcher over keyless public feeds")
    parser.add_argument("--config", required=True)
    parser.add_argument("--state", default="watchd-state.json")
    parser.add_argument("--once", action="store_true", help="one pass and exit (cron-friendly)")
    parser.add_argument("--loop", action="store_true", help="poll forever")
    parser.add_argument("--interval", type=int, default=0, help="override every_s")
    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    args = parser.parse_args(argv)
    config = json.load(open(args.config, encoding="utf-8"))
    every = args.interval or int(config.get("every_s") or 120)
    forever = args.loop and not args.once
    while True:
        fired = tick(config, load_state(args.state), args.state)
        log.info("pass done: %d fired", len(fired))
        if not forever:
            return 0
        time.sleep(every)


if __name__ == "__main__":
    raise SystemExit(main())
