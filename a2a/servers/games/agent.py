"""Games — the store, the player counts and the freebies as an A2A agent.

The A2A twin of the Games ACP agent. It reads Steam's keyless store API, SteamSpy's owner and
concurrent-player estimates, Steam's per-app news feed and Epic's public free-promotions feed.
The fifth skill, a cross-title price and popularity board, runs on a hosted service that was removed.

Deterministic on purpose: routing is rules, the prices are Steam's own cents, and nothing is
invented. SteamSpy publishes ownership as a range, so the answers quote the range; a playtime
field it reports as 0 is "not reported", not "zero minutes".
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from a2a_kit import SkillAgent
from a2a_kit.errors import UpstreamError  # noqa: E402

from data import (  # noqa: E402
    DATASET_EPIC,
    DATASET_STEAM,
    DATASET_STEAMSPY,
    DEFAULT_LIMIT,
    GamesClient,
)

SKILL_SEARCH = "game-search"
SKILL_STATS = "game-stats"
SKILL_NEWS = "game-news"
SKILL_FREE = "free-games"
SKILL_BOARD = "price-board"
SKILL_HELP = "help"
SKILLS = (SKILL_SEARCH, SKILL_STATS, SKILL_NEWS, SKILL_FREE, SKILL_BOARD, SKILL_HELP)

#: The gateway tool behind the premium skill.
PREMIUM_TOOL = "games_price_board"
MAX_BOARD_GAMES = 4

HELP = (
    "I read Steam's store, SteamSpy's player estimates, Steam's news feed and Epic's free "
    "games. Ask me:\n"
    "  • how much is portal 2 on steam\n"
    "  • how many people play rust right now\n"
    "  • is hades well reviewed\n"
    "  • what is free on epic this week\n"
    "  • any news for stardew valley\n"
    "  • compare elden ring and dark souls 3 (not implemented here)\n"
    "Prices are Steam's own US store prices in dollars; ownership is SteamSpy's published "
    "range, not a count."
)

_HELP_RE = re.compile(r"\b(help|what can you do|commands?)\b", re.IGNORECASE)
_FREE_RE = re.compile(r"\b(free|freebie|freebies|giveaway|giveaways|gratis)\b", re.IGNORECASE)
_EPIC_RE = re.compile(r"\b(epic|epicgames)\b", re.IGNORECASE)
_COMPARE_RE = re.compile(
    r"\b(compare|comparison|versus|vs\.?|which is better|better value|best value|price board|"
    r"side by side|worth it)\b", re.IGNORECASE)
_STATS_RE = re.compile(
    r"\b(players?|owners?|concurrent|how many people|reviews?|rating|rated|well reviewed|"
    r"popular|playtime|hours played|player count)\b", re.IGNORECASE)
_NEWS_RE = re.compile(
    r"\b(news|updates?|patches?|patch notes|announcements?|dev ?blog)\b", re.IGNORECASE)
_APP_ID_RE = re.compile(r"\bapp(?:id| id)?\s*#?\s*(\d{1,7})\b", re.IGNORECASE)
_APP_URL_RE = re.compile(r"store\.steampowered\.com/app/(\d{1,7})", re.IGNORECASE)
_QUOTED_RE = re.compile(r"[\"\u201c\u201d'\u2018\u2019]([^\"\u201c\u201d]{2,60})[\"\u201c\u201d'\u2018\u2019]")

#: Words that are asking, not naming a game.
_STOPWORDS = frozenset({
    "help", "what", "which", "who", "how", "much", "many", "does", "do", "is", "are", "was",
    "the", "a", "an", "and", "or", "of", "for", "in", "on", "at", "to", "me", "my", "you",
    "show", "find", "search", "list", "give", "get", "tell", "about", "with", "right", "now",
    "today", "please", "game", "games", "play", "playing", "players", "player", "owners",
    "concurrent", "reviews", "review", "rating", "rated", "popular", "playtime", "hours",
    "played", "news", "update", "updates", "patch", "patches", "announcements", "worth",
    "price", "prices", "cost", "costs", "compare", "comparison", "versus", "vs", "board",
    "side", "better", "best", "value", "free", "freebie", "freebies", "giveaway", "giveaways",
    "epic", "steam", "steamspy", "store", "week", "this", "that", "well", "reviewed", "any",
    "it", "can", "could", "should", "would", "will", "i", "we", "there", "hello", "hi",
    "hey", "thanks", "thank", "like", "count", "numbers", "howmany", "newest",
    "people", "users", "currently", "still", "actually", "please",
})


def usd(value) -> str:
    """A price as the store writes it, or a plain statement that the store did not price it."""
    if value is None:
        return "not priced"
    if value == 0:
        return "free"
    return f"${value:,.2f}"


def day(unix) -> str | None:
    """A Steam timestamp (seconds) as a UTC date, or None when the feed sent none."""
    try:
        return datetime.fromtimestamp(int(unix), tz=timezone.utc).strftime("%Y-%m-%d")
    except (TypeError, ValueError, OSError):
        return None


def name_from_text(text: str) -> str | None:
    """The game name in a sentence, or None. Stopwords and verbs drop out, order is kept."""
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9'&:.\-]{0,24}", text)
    kept = [word for word in words if word.lower() not in _STOPWORDS]
    if not kept:
        return None
    # "portal 2" keeps its number: a sequel is a different game from its predecessor.
    name = " ".join(kept[:4]).strip(" .,-")
    return name if len(name) >= 2 else None


def names_from_compare(text: str) -> list[str]:
    """The titles a comparison names, from quotes when given, otherwise from the sentence."""
    quoted = [q.strip() for q in _QUOTED_RE.findall(text) if len(q.strip()) >= 2]
    if len(quoted) >= 2:
        return quoted[:MAX_BOARD_GAMES]
    body = _COMPARE_RE.sub(" ", text)
    parts = re.split(r"\s*(?:,|\band\b|\bvs\.?\b|\bversus\b|\bfrom\b)\s*", body,
                     flags=re.IGNORECASE)
    names: list[str] = []
    for part in parts:
        name = name_from_text(part)
        if name and name not in names:
            names.append(name)
    return names[:MAX_BOARD_GAMES]


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or _HELP_RE.search(text):
        return SKILL_HELP, {}

    app_id = None
    url = _APP_URL_RE.search(text)
    if url:
        app_id = int(url.group(1))
    else:
        explicit = _APP_ID_RE.search(text)
        if explicit:
            app_id = int(explicit.group(1))

    if app_id is None and _FREE_RE.search(text):
        # "what is free on epic this week" is the Epic feed. "is hades free" names a game, so it
        # stays a lookup unless the sentence also points at the feed.
        if (_EPIC_RE.search(text)
                or re.search(r"\b(week|now|today|games?)\b", text, re.IGNORECASE)
                or not name_from_text(text)):
            return SKILL_FREE, {}

    if _COMPARE_RE.search(text):
        names = names_from_compare(text)
        if len(names) >= 2:
            return SKILL_BOARD, {"games": names}

    name = name_from_text(text)
    if _NEWS_RE.search(text):
        return SKILL_NEWS, {"term": name, "app_id": app_id}
    if _STATS_RE.search(text):
        return SKILL_STATS, {"term": name, "app_id": app_id}
    return SKILL_SEARCH, {"term": name, "app_id": app_id}


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def games_from_data(value) -> list[str]:
    """A `games` parameter as a list of names, whether it arrived as a list or a string."""
    if isinstance(value, list):
        names = [str(item).strip() for item in value]
    elif isinstance(value, str):
        names = [part.strip() for part in re.split(r"\s*(?:,|\band\b|\bvs\.?\b)\s*", value,
                                                   flags=re.IGNORECASE)]
    else:
        names = []
    return [name for name in names if len(name) >= 2]


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises.

    "explicit" says whether the caller actually named a skill or asked a question this server
    can route, so the protocol knows a bare game name ("portal 2") answers the question it just
    asked rather than starting a fresh search.
    """
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    term = _first(data, "term", "q", "query", "search", "name", "game")
    app_id = _first(data, "app_id", "appid", "app")
    limit = _first(data, "limit", "count")
    games = games_from_data(_first(data, "games"))

    routed_skill, routed = route(text)
    asked_for_help = bool(_HELP_RE.search(text))
    if not app_id:
        url = _APP_URL_RE.search(text)
        if url:
            app_id = int(url.group(1))
        else:
            found = _APP_ID_RE.search(text)
            if found:
                app_id = int(found.group(1))

    if requested in SKILLS:
        skill = requested
    elif games:
        skill = SKILL_BOARD
    elif (term or app_id) and routed_skill == SKILL_HELP:
        # Parameters with no prose at all (a data part): a game name is a search.
        skill = SKILL_SEARCH
    else:
        skill = routed_skill

    params: dict = {}
    if skill == SKILL_BOARD:
        params["games"] = games or routed.get("games") or []
    elif skill in (SKILL_SEARCH, SKILL_STATS, SKILL_NEWS):
        params["term"] = term or routed.get("term")
        params["app_id"] = app_id or routed.get("app_id")
        if skill == SKILL_SEARCH:
            params["limit"] = limit
    # A bare game name ("portal 2") answers the question this server just asked: it names
    # nothing new to route on, so the protocol keeps the pending skill rather than starting over.
    explicit = bool(requested or app_id or term or games or asked_for_help
                    or (text.strip() and routed_skill not in (SKILL_SEARCH, SKILL_HELP)))
    return {"skill": skill, "params": params, "explicit": explicit}


def run_search(params: dict, client: GamesClient) -> dict:
    if params.get("app_id"):
        detail = client.app(params["app_id"])
        artifact = {
            "dataset": DATASET_STEAM,
            "skill": SKILL_SEARCH,
            "summary": f"{detail['name']} (app {detail['app_id']}): {usd(detail['price'])}",
            "app_id": detail["app_id"],
            "name": detail["name"],
            "price": detail["price"],
            "is_free": detail["is_free"],
            "metascore": None,
            "url": detail["url"],
        }
        lines = [
            f"{detail['name']} (Steam app {detail['app_id']})",
            f"  • price: {usd(detail['price'])}"
            + (f" (was {usd(detail['initial'])}, -{detail['discount_percent']}%)"
               if detail["discount_percent"] else ""),
            f"  • released: {detail['release_date'] or 'not reported'}; "
            f"by {', '.join(detail['developers']) or 'not reported'}",
            f"  • genres: {', '.join(detail['genres']) or 'not reported'}",
        ]
        if detail.get("short_description"):
            lines.append(f"  • {detail['short_description']}")
        lines.append(f"\nSource: {DATASET_STEAM} (read live).")
        return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
                "watch": None}

    result = client.search(params["term"], limit=params.get("limit") or DEFAULT_LIMIT)
    artifact = {
        "dataset": DATASET_STEAM,
        "skill": SKILL_SEARCH,
        "summary": f"{DATASET_STEAM}: {len(result['rows'])} matches for {result['query']!r}, "
                   f"cheapest {usd(result['rows'][0]['price'])}",
        "query": result["query"],
        "total": result["total"],
        "rows": result["rows"],
    }
    lines = [f"Steam store matches for {result['query']!r} "
             f"({result['total']} results, cheapest first):"]
    for row in result["rows"]:
        bits = [row["name"], usd(row["price"]) if not row["is_free"] else "free"]
        if row.get("metascore"):
            bits.append(f"metascore {row['metascore']}")
        lines.append(f"  • {' — '.join(bits)}")
        if row.get("url"):
            lines.append(f"    {row['url']}")
    lines.append(f"\nSource: {DATASET_STEAM} (read live, US store prices).")
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_stats(params: dict, client: GamesClient) -> dict:
    term, app_id = params.get("term"), params.get("app_id")
    match = client.best_match(term or str(app_id), app_id)
    stats = client.stats(match["app_id"])
    ratio = stats["review_ratio"]
    artifact = {
        "dataset": DATASET_STEAMSPY,
        "skill": SKILL_STATS,
        "summary": f"{stats['name']}: owners {stats['owners'] or 'not reported'}, "
                   f"{stats['ccu']:,} playing now, {ratio * 100:.0f}% of reviews positive"
                   if ratio is not None else
                   f"{stats['name']}: owners {stats['owners'] or 'not reported'}, "
                   f"{stats['ccu']:,} playing now",
        "app_id": stats["app_id"],
        "name": stats["name"],
        "owners": stats["owners"],
        "ccu": stats["ccu"],
        "positive": stats["positive"],
        "negative": stats["negative"],
        "review_ratio": ratio,
        "average_forever_minutes": stats["average_forever_minutes"],
        "median_forever_minutes": stats["median_forever_minutes"],
        "tags": stats["tags"],
        "matched_by": match.get("matched"),
        "url": stats["url"],
    }
    lines = [f"{stats['name']} (Steam app {stats['app_id']}), from SteamSpy's estimates:"]
    lines.append(f"  • owners: {stats['owners'] or 'not reported'}")
    lines.append(f"  • playing right now: {stats['ccu']:,}")
    if ratio is not None:
        lines.append(f"  • reviews: {stats['positive']:,} positive, {stats['negative']:,} "
                     f"negative — {ratio * 100:.1f}% positive")
    else:
        lines.append("  • reviews: none recorded yet")
    if stats["average_forever_minutes"]:
        lines.append(f"  • average playtime: {stats['average_forever_minutes'] / 60:.1f} hours; "
                     f"median {stats['median_forever_minutes'] / 60:.1f} hours"
                     if stats["median_forever_minutes"] else
                     f"  • average playtime: {stats['average_forever_minutes'] / 60:.1f} hours")
    elif stats["median_forever_minutes"]:
        lines.append(f"  • median playtime: {stats['median_forever_minutes'] / 60:.1f} hours")
    else:
        lines.append("  • playtime: not reported (SteamSpy has no sample for this title)")
    if stats["tags"]:
        lines.append(f"  • SteamSpy tags: {', '.join(stats['tags'])}")
    lines.append(
        f"\nSource: {DATASET_STEAMSPY} (read live). Ownership is a published range, concurrent "
        "players is a point-in-time estimate, and 0 in a playtime field means no sample rather "
        "than no play. Steam store price for this title: "
        f"{usd(match.get('price')) if match.get('price') is not None else 'not looked up'}."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_news(params: dict, client: GamesClient) -> dict:
    term, app_id = params.get("term"), params.get("app_id")
    match = client.best_match(term or str(app_id), app_id)
    feed = client.news(match["app_id"])
    artifact = {
        "dataset": DATASET_STEAM,
        "skill": SKILL_NEWS,
        "summary": f"{match['name']}: {len(feed['rows'])} news items",
        "app_id": feed["app_id"],
        "name": match["name"],
        "rows": feed["rows"],
    }
    lines = [f"Steam news for {match['name']} (app {feed['app_id']}), newest first:"]
    for row in feed["rows"]:
        lines.append(f"  • {day(row.get('date')) or 'date not reported'} — {row['title']}"
                     + (f" ({row['feed']})" if row.get("feed") else ""))
        if row.get("url"):
            lines.append(f"    {row['url']}")
    lines.append(f"\nSource: {DATASET_STEAM}/ISteamNews (read live).")
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_free(client: GamesClient) -> dict:
    free = client.free_games()
    artifact = {
        "dataset": DATASET_EPIC,
        "skill": SKILL_FREE,
        "summary": f"{DATASET_EPIC}: {len(free['now'])} free now, {len(free['soon'])} coming",
        "now": free["now"],
        "soon": free["soon"],
    }
    lines = ["Epic's free promotions right now:"]
    if free["now"]:
        for row in free["now"]:
            window = row.get("window") or {}
            lines.append(f"  • {row['title']} — "
                         f"{'free' if row.get('free') else usd(row.get('discount_price'))}")
            if row.get("original"):
                lines.append(f"    normally {usd(row['original'])}, "
                             f"until {(window.get('ends') or 'not stated')[:10]}")
            lines.append(f"    {row['url']}")
    else:
        lines.append("  • nothing is free on Epic right now")
    if free["soon"]:
        lines.append("\nComing next:")
        for row in free["soon"]:
            window = row.get("window") or {}
            lines.append(f"  • {row['title']} from "
                         f"{(window.get('starts') or 'not stated')[:10]}")
    lines.append(
        f"\nSource: {DATASET_EPIC} (read live). A title listed as upcoming becomes free on "
        "the date Epic publishes, and the window can change before then."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_board(params: dict, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: board — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


def run_help() -> dict:
    return {
        "final_state": "completed",
        "message": HELP,
        "artifact": {"dataset": [DATASET_STEAM, DATASET_STEAMSPY, DATASET_EPIC],
                     "skill": SKILL_HELP, "skills": list(SKILLS)},
        "watch": None,
    }


class GamesAgent(SkillAgent):
    name = "games"
    card_name = "Games Agent"
    card_description = (
        "Read-only agent over Steam's keyless store API, SteamSpy's owner and concurrent-player "
        "estimates, Steam's per-app news feed and Epic's free-game promotions: a game's Steam "
        "price in US dollars, what SteamSpy estimates about its players and reviews, its recent "
        "news, and what is free on Epic this week. Nothing is estimated here — prices are "
        "Steam's own cents and ownership is SteamSpy's published range. A cross-title price "
        "board runs on a hosted service that was removed."
    )
    env_prefix = "GAMES"
    datasets = (DATASET_STEAM, DATASET_STEAMSPY, DATASET_EPIC)
    card_skills = [
        {
            "id": SKILL_SEARCH,
            "name": "Find a game and its Steam price",
            "description": (
                "Steam store search for a game name (or one app's full details by app id), "
                "cheapest first, with Steam's own US price, discount, metascore and store link."
            ),
            "tags": ["games", "steam", "prices", "store", "search"],
            "examples": [
                "How much is portal 2 on steam?",
                '{"skill": "game-search", "term": "stardew valley"}',
                '{"skill": "game-search", "app_id": 620}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_STATS,
            "name": "Player counts and reviews",
            "description": (
                "SteamSpy's estimates for a title: owners as the published range (never a single "
                "number), concurrent players, review counts and ratio, playtime where SteamSpy "
                "has a sample, and the top tags. A playtime field reported as 0 is reported as "
                "not reported."
            ),
            "tags": ["games", "steamspy", "players", "owners", "reviews"],
            "examples": [
                "How many people play rust right now?",
                "Is hades well reviewed?",
                '{"skill": "game-stats", "app_id": 1145360}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_NEWS,
            "name": "Steam news for a game",
            "description": (
                "Steam's own per-app news feed, newest first, with dates, feed labels and links."
            ),
            "tags": ["games", "steam", "news", "updates"],
            "examples": [
                "Any news for stardew valley?",
                '{"skill": "game-news", "app_id": 413150}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_FREE,
            "name": "Epic's free games",
            "description": (
                "Epic's public free-promotions feed: what is free right now with its window, and "
                "what Epic has listed as coming next."
            ),
            "tags": ["games", "epic", "free", "giveaway"],
            "examples": [
                "What is free on epic this week?",
                '{"skill": "free-games"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_BOARD,
            "name": "Cross-title price board (not implemented here)",
            "description": (
                "Two to four titles compared at once: each one's Steam price and discount, "
                "SteamSpy's owner range, concurrent players and review ratio, and then which "
                "title is cheapest, dearest, most played and best reviewed. Premium: it runs "
                "on a hosted service that was removed, so the numbers only exist for a caller "
                "with a key."
            ),
            "tags": ["games", "compare", "price-board"],
            "examples": [
                "Compare elden ring and dark souls 3",
                '{"skill": "price-board", "games": ["elden ring", "dark souls 3"]}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_HELP,
            "name": "What this agent reads",
            "description": (
                "The five feeds this agent reads, the questions it answers, the premium price "
                "board, and the two things it will not do: invent a price, or turn SteamSpy's "
                "owner range into a single number."
            ),
            "tags": ["games", "help"],
            "examples": ["What can you do?"],
            "inputModes": ["text/plain"],
            "outputModes": ["text/plain"],
        },
    ]

    def __init__(self, client: GamesClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or GamesClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill in (SKILL_SEARCH, SKILL_STATS, SKILL_NEWS) and not (
                params.get("term") or params.get("app_id")):
            return ["a game name or a Steam app id"]
        if skill == SKILL_BOARD and len(params.get("games") or []) < 2:
            return ["two to four game names"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_STATS:
            return ("Which game should I look the player numbers up for? 'rust', 'hades', or a "
                    "Steam app id like 620.")
        if skill == SKILL_NEWS:
            return "Which game's news should I read? 'stardew valley', or a Steam app id."
        if skill == SKILL_BOARD:
            return ("The premium board compares two to four titles at once — name them, like "
                    "'compare elden ring and dark souls 3'. It is not implemented here.")
        return ("Which game should I look up? A name works — 'portal 2', 'stardew valley' — or a "
                "Steam app id.")

    def run(self, request: dict) -> dict:
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(request["skill"], request["missing"]),
                "artifact": None,
                "watch": None,
            }
        skill, params = request["skill"], request["params"]
        try:
            if skill == SKILL_SEARCH:
                return run_search(params, self.client)
            if skill == SKILL_STATS:
                return run_stats(params, self.client)
            if skill == SKILL_NEWS:
                return run_news(params, self.client)
            if skill == SKILL_FREE:
                return run_free(self.client)
            if skill == SKILL_BOARD:
                return run_board(params, self.gateway)
        except (UpstreamError, ValueError) as exc:
            return {
                "final_state": "failed",
                "message": f"I could not read the games feeds: {exc}",
                "artifact": {"dataset": list(self.datasets), "skill": skill},
                "watch": None,
            }
        return run_help()


__all__ = [
    "GamesAgent",
    "HELP",
    "MAX_BOARD_GAMES",
    "PREMIUM_TOOL",
    "SKILLS",
    "SKILL_BOARD",
    "SKILL_FREE",
    "SKILL_HELP",
    "SKILL_NEWS",
    "SKILL_SEARCH",
    "SKILL_STATS",
    "day",
    "games_from_data",
    "name_from_text",
    "names_from_compare",
    "parse",
    "route",
    "run_board",
    "run_free",
    "run_help",
    "run_news",
    "run_search",
    "run_stats",
    "usd",
]
