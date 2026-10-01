"""Air — air quality inside your editor.

Every ACP agent on the vendors' list writes code. This one answers the question you ask
when you open a window in August: what am I breathing, and when does it get worse. It
reads Open-Meteo's CAMS air quality feed (keyless) and answers with the provider's own
numbers, the EPA category they fall in, and the hour the model says the peak arrives.

Deterministic on purpose: routing is rules, the numbers are the feed's, and nothing is
guessed. It reports a plan, opens one tool call per lookup, asks permission before its
first read, streams the answer, and closes the tool call with a one-line summary.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (  # noqa: E402
    STOP_END_TURN,
    STOP_REFUSAL,
    AcpAgent,
    GatewayClient,
    GatewayError,
    SessionContext,
    empty_premium_answer,
    premium_call,
    prompt_text,
)

from data import DATASET, AirQualityData, AirQualityError, aqi_band, pm25_band  # noqa: E402

HELP = (
    "I read Open-Meteo's air quality feed (CAMS model output, keyless). Ask me:\n"
    "  • how is the air quality in Delhi right now?\n"
    "  • what is the pm2.5 at 40.71,-74.01?\n"
    "  • when does the air get worse today in Phoenix?\n"
    "Answers carry the provider's numbers, the EPA category, and the hour of the peak. "
    "I read a model, not a monitor, and I am not medical advice.\n"
    "Ask for a multi-day window (this week, next 3 days) for the premium outlook, which "
    "grades every day of the window on the gateway."
)

PERMISSION_KEY = "air-read-public-airquality"

SKILLS = ("air-now", "air-hours", "air-outlook", "help")

#: The premium outlook is the only skill that grades a whole multi-day window, so it
#: claims just the phrasings that name one. "the next few hours" is a free air-hours
#: question and must never get pulled across.
_OUTLOOK_RE = re.compile(
    r"\b\d{1,2}\s*-?\s*(?:day|days|week|weeks)\b"
    r"|\b(?:multi-?day|several days|few days|this week|next week|the week|coming days|whole week)\b",
    re.IGNORECASE,
)
_SPAN_RE = re.compile(r"\b(\d{1,2})\s*-?\s*(day|days|week|weeks)\b", re.IGNORECASE)

_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\b")
_HOURS_WORDS = re.compile(
    r"\b(later|today|tonight|tomorrow|next|hours?|forecast|outlook|get(?:s)? worse|improve|"
    r"peak|when|trend|rest of)\b", re.IGNORECASE)

#: Words that mean a captured "in ..." phrase is not a place at all.
_STOP_PLACE_WORDS = frozenset({
    "the", "a", "an", "my", "our", "your", "this", "that", "these", "those", "next", "last",
    "here", "there", "today", "tomorrow", "tonight", "now", "right", "few", "some", "hours",
    "hour", "days", "day", "week", "weeks", "morning", "afternoon", "evening", "general",
})
_PLACE_PHRASE_RE = re.compile(r"\b(?:in|at|near|for)\s+([A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*){0,2})")


def unknown_place_from_text(text: str) -> str | None:
    """A place name the built-in list does not know, so the answer can say so by name."""
    match = _PLACE_PHRASE_RE.search(text)
    if not match:
        return None
    words = match.group(1).strip(" .,?!").split()
    while words and words[-1].lower() in _STOP_PLACE_WORDS:
        words.pop()
    if not words or words[0].lower() in _STOP_PLACE_WORDS:
        return None
    return " ".join(words).lower()


def hours_from_text(text: str) -> int | None:
    match = re.search(r"\b(?:next|in|over)\s+(\d{1,2})\s*hours?\b", text, re.IGNORECASE)
    if match:
        try:
            return AirQualityData.check_hours(match.group(1))
        except ValueError:
            return None
    return None


def outlook_days_from_text(text: str) -> int:
    """How many days the premium window covers, clamped to what the gateway accepts.

    The gateway summarises at most seven days, so "next 2 weeks" is capped to one
    window here - clamping keeps the answer honest about what was actually read.
    """
    match = _SPAN_RE.search(text)
    if not match:
        return 7
    try:
        span = int(match.group(1))
    except ValueError:
        return 7
    if match.group(2).lower().startswith("week"):
        span *= 7
    return min(7, max(1, span))


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE):
        return "help", {}

    params: dict = {}
    match = _POINT_RE.search(text)
    if match:
        try:
            params["point"] = AirQualityData.check_point(f"{match.group(1)},{match.group(2)}")
        except ValueError:
            pass
    place = AirQualityData.place_from_text(text)
    if place:
        params["place"] = place
        params.setdefault("point", AirQualityData.point_from_place(place))
    elif not params.get("point"):
        # A named place we do not have coordinates for - answer that plainly instead of guessing.
        unknown = unknown_place_from_text(text)
        if unknown:
            params["place"] = unknown
    hours = hours_from_text(text)
    if hours:
        params["hours"] = hours

    # Before the free hourly skill, and only for a named multi-day window with a
    # point we can actually read. Anything vaguer stays with the free skills.
    if _OUTLOOK_RE.search(text) and "point" in params:
        params.pop("hours", None)
        params["days"] = outlook_days_from_text(text)
        return "air-outlook", params

    if _HOURS_WORDS.search(text) and "point" in params:
        params.setdefault("hours", 24)
        return "air-hours", params
    if _HOURS_WORDS.search(text) and "place" in params:
        params.setdefault("hours", 24)
        return "air-hours", params
    if _HOURS_WORDS.search(text):
        return "air-hours", params
    return "air-now", params


class AirAgent(AcpAgent):
    name = "air"
    title = "Air — Open-Meteo air quality"
    version = "1.0.0"

    def __init__(self, connection=None, data: AirQualityData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or AirQualityData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Air session opened. " + HELP.split("\n", 1)[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Resolve the place to a latitude/longitude point", "medium"),
            ("Read the air quality feed and label the numbers", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I read one product: Open-Meteo's air quality API, which carries CAMS "
                        "model output for any point on Earth. It is a model, so a monitor down "
                        "the road can disagree with it.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Read Open-Meteo air quality for {skill}", kind="fetch", name=skill,
                      raw_input={"skill": skill, **params})
        if not ctx.ask_permission(tool, "Allow Air to read Open-Meteo's public air quality data?",
                                 remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public air quality feed before I can answer.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except (AirQualityError, ValueError, GatewayError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the air quality feed: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        # Every skill is a single HTTP read; nothing long-running to interrupt.
        return None

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "air-hours":
            return self._hours(params)
        if skill == "air-outlook":
            return self._outlook(params)
        if skill == "air-now":
            return self._now(params)
        return HELP, {"summary": "help", "dataset": None}

    def _point_or_ask(self, params: dict) -> tuple[str | None, tuple[str, dict] | None]:
        """The point to read, or the answer to send when we do not know the place."""
        if params.get("point"):
            try:
                return AirQualityData.check_point(params["point"]), None
            except ValueError as exc:
                return None, (f"{exc}.", {"summary": "bad point", "dataset": DATASET})
        if params.get("place"):
            return None, (
                f"I do not know the place {params['place']!r}, so I will not guess coordinates for it. "
                "Give me a latitude/longitude point, or a city from my list (New York, Delhi, Beijing, "
                "Lagos, Sao Paulo, Sydney and so on).",
                {"summary": "unknown place", "dataset": DATASET, "known": False},
            )
        return None, (
            "I need a place to read the air quality for - a latitude/longitude point like "
            "40.71,-74.01, or a city name from my list (New York, Delhi, Beijing, Nairobi, "
            "Sao Paulo, Sydney and so on).",
            {"summary": "no place given", "dataset": DATASET, "known": False},
        )

    def _now(self, params: dict) -> tuple[str, dict]:
        point, ask = self._point_or_ask(params)
        if ask:
            return ask
        current = self.data.current(point)
        reading = current["current"]

        def value(field: str) -> str:
            number = reading.get(field)
            return "not reported" if number is None else f"{number:g}"

        artifact = {
            "summary": f"{DATASET}: US AQI {reading.get('us_aqi')} ({current['us_aqi_band']}), "
                       f"PM2.5 {reading.get('pm2_5')} ug/m3 at {current['point']}",
            "dataset": DATASET,
            "point": current["point"],
            "time": current["time"],
            "us_aqi": reading.get("us_aqi"),
            "us_aqi_band": current["us_aqi_band"],
            "european_aqi": reading.get("european_aqi"),
            "pm2_5": reading.get("pm2_5"),
            "pm2_5_band": current["pm2_5_band"],
            "pm10": reading.get("pm10"),
            "ozone": reading.get("ozone"),
            "nitrogen_dioxide": reading.get("nitrogen_dioxide"),
            "sulphur_dioxide": reading.get("sulphur_dioxide"),
            "carbon_monoxide": reading.get("carbon_monoxide"),
            "uv_index": reading.get("uv_index"),
        }
        lines = [
            f"Air quality at {current['point']} as of {current['time']} UTC:",
            f"  • US AQI {value('us_aqi')} - {current['us_aqi_band']} "
            f"(European AQI {value('european_aqi')}, a different scale)",
            f"  • PM2.5 {value('pm2_5')} ug/m3 - {current['pm2_5_band']}; PM10 {value('pm10')} ug/m3",
            f"  • Ozone {value('ozone')} ug/m3, NO2 {value('nitrogen_dioxide')} ug/m3, "
            f"SO2 {value('sulphur_dioxide')} ug/m3, CO {value('carbon_monoxide')} ug/m3",
            f"  • UV index {value('uv_index')}",
        ]
        aqi = reading.get("us_aqi")
        if aqi is not None and aqi > 100:
            lines.append("  • Above 100: sensitive groups should cut down long outdoor effort.")
        elif aqi is not None and aqi > 50:
            lines.append("  • Moderate: fine for most people; unusual symptoms are possible.")
        lines.append(
            f"\nSource: {DATASET} (CAMS model output through Open-Meteo, read live). It is a "
            "model on a ~11 km grid, not the monitor on your roof, and the AQI bands are the "
            "US EPA categories. Ask me about the next hours for the peak."
        )
        return "\n".join(lines), artifact

    def _hours(self, params: dict) -> tuple[str, dict]:
        point, ask = self._point_or_ask(params)
        if ask:
            return ask
        window = int(params.get("hours") or 24)
        hourly = self.data.hourly(point, window)
        artifact = {
            "summary": f"{DATASET}: {window}h at {hourly['point']}, peak PM2.5 "
                       f"{hourly['peak_pm2_5']} at {hourly['peak_pm2_5_time']}, worst AQI "
                       f"{hourly['worst_aqi']}",
            "dataset": DATASET,
            "point": hourly["point"],
            "window_hours": hourly["window_hours"],
            "peak_pm2_5": hourly["peak_pm2_5"],
            "peak_pm2_5_time": hourly["peak_pm2_5_time"],
            "worst_aqi": hourly["worst_aqi"],
            "hours_above_aqi_100": hourly["hours_above_aqi_100"],
            "first_dirty_hour": hourly["first_dirty_hour"],
            "rows": hourly["rows"],
        }
        lines = [f"PM2.5 and US AQI for the next {hourly['window_hours']} hours at "
                 f"{hourly['point']} (UTC):"]
        for row in hourly["rows"][:12]:
            aqi = row.get("us_aqi")
            lines.append(f"  • {row['time']}: PM2.5 {row.get('pm2_5')} ug/m3, "
                         f"AQI {aqi if aqi is not None else 'n/a'}"
                         + (f" - {aqi_band(aqi)}" if aqi is not None and aqi > 50 else ""))
        if len(hourly["rows"]) > 12:
            lines.append(f"  • ... {len(hourly['rows']) - 12} more hours in the artifact")
        lines.append(f"\nPeak PM2.5 in the window: {hourly['peak_pm2_5']} ug/m3 at "
                     f"{hourly['peak_pm2_5_time']} ({pm25_band(hourly['peak_pm2_5'])}).")
        if hourly["hours_above_aqi_100"]:
            lines.append(f"{hourly['hours_above_aqi_100']} hour(s) above AQI 100, first at "
                         f"{hourly['first_dirty_hour']}.")
        else:
            lines.append("No hour in the window goes above AQI 100.")
        lines.append(
            f"\nSource: {DATASET} (hourly CAMS model output through Open-Meteo, read live). "
            "Model output, not a measurement, and smoke or dust can move faster than the model."
        )
        return "\n".join(lines), artifact

    def _outlook(self, params: dict) -> tuple[str, dict]:
        """Premium: the gateway grades every day of a multi-day window.

        Nothing is computed here. The window is summarised on the gateway behind the
        licence check, so a copy of this repository still cannot answer the question.
        """
        point, ask = self._point_or_ask(params)
        if ask:
            return ask
        try:
            latitude, longitude = (float(part) for part in AirQualityData.check_point(point).split(","))
        except ValueError as exc:
            return f"{exc}.", {"summary": "bad point", "dataset": DATASET}
        days = int(params.get("days") or 7)

        data, refused = premium_call(
            self.gateway,
            "air_outlook",
            {"latitude": latitude, "longitude": longitude, "days": days},
            {"agent": "air", "skill": "air-outlook", "point": point},
        )
        if refused:
            return refused
        daily = data.get("daily") if isinstance(data, dict) else None
        if not isinstance(daily, list) or not daily:
            return empty_premium_answer(
                "The licence gateway graded no days for that window, so I have nothing to "
                "report. Try a point inside the model's grid.",
                {"agent": "air", "skill": "air-outlook", "dataset": DATASET},
            )

        def shown(value, suffix: str = "") -> str:
            return "not reported" if value is None else f"{value}{suffix}"

        worst = data.get("worstDay") or {}
        cleanest = data.get("cleanestDay") or {}
        artifact = {
            "summary": f"premium outlook, {len(daily)}d at {point}: worst {shown(worst.get('maxAqi'))} "
                       f"({shown(worst.get('band'))}) on {shown(worst.get('date'))}, "
                       f"cleanest {shown(cleanest.get('maxAqi'))} on {shown(cleanest.get('date'))}",
            "dataset": DATASET,
            "premium": True,
            "point": point,
            "days": len(daily),
            "worst_day": worst,
            "cleanest_day": cleanest,
            "trend": data.get("trend"),
            "missing_hours": data.get("missingHours"),
            "daily": daily,
        }
        lines = [f"Premium {len(daily)}-day air-quality outlook for {point} "
                 f"(gateway-graded, {data.get('timezone') or 'UTC'}):"]
        for day in daily:
            lines.append(
                f"  • {shown(day.get('date'))}: worst AQI {shown(day.get('maxAqi'))} "
                f"({shown(day.get('maxAqiBand'))}) at {shown(day.get('maxAqiHour'))}; "
                f"mean {shown(day.get('meanAqi'))}, peak PM2.5 {shown(day.get('maxPm25'))} ug/m3"
            )
        lines.append(f"\nWorst day: {shown(worst.get('date'))} at AQI {shown(worst.get('maxAqi'))} "
                     f"({shown(worst.get('band'))}).")
        lines.append(f"Cleanest day: {shown(cleanest.get('date'))} at AQI {shown(cleanest.get('maxAqi'))} "
                     f"({shown(cleanest.get('band'))}).")
        if data.get("trend"):
            lines.append(f"Trend: {data['trend']}.")
        if data.get("missingHours"):
            lines.append(f"{data['missingHours']} hour(s) in the window were not reported and are "
                         "left out of the daily figures.")
        lines.append(
            f"\nSource: {DATASET}, summarised on the licence gateway. Same CAMS model as the free "
            "skills - the gateway adds the per-day grading, not new observations."
        )
        return "\n".join(lines), artifact


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        AirAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
