"""Games — the store, the player counts and the freebies inside your editor.

No ACP agent could read a games catalogue before this one. It reads Steam's keyless store
API, SteamSpy's owner and concurrent-player estimates, Steam's per-app news feed and Epic's
public free-promotions feed. The fifth skill, a cross-title price and popularity board, runs
on the licence gateway.

Deterministic on purpose: routing is rules, the prices are Steam's own cents, and nothing is
invented. SteamSpy publishes ownership as a range, so the answers quote the range; a playtime
field it reports as 0 is "not reported", not "zero minutes".
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
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

from data import (  # noqa: E402
    DATASET_EPIC,
    DATASET_STEAM,
    DATASET_STEAMSPY,
    GamesData,
    GamesError,
)

HELP = (
    "I read Steam's store, SteamSpy's player estimates, Steam's news feed and Epic's free "
    "games. Ask me:\n"
    "  • how much is portal 2 on steam\n"
    "  • how many people play rust right now\n"
    "  • is hades well reviewed\n"
    "  • what is free on epic this week\n"
    "  • any news for stardew valley\n"
    "  • compare elden ring and dark souls 3 (premium — needs a licence key)\n"
    "Prices are Steam's own US store prices in dollars; ownership is SteamSpy's published "
    "range, not a count."
)

PERMISSION_KEY = "games-read-public-store-feeds"

SKILLS = ("game-search", "game-stats", "game-news", "free-games", "price-board", "help")

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
        return quoted[:4]
    body = _COMPARE_RE.sub(" ", text)
    parts = re.split(r"\s*(?:,|\band\b|\bvs\.?\b|\bversus\b|\bfrom\b)\s*", body, flags=re.IGNORECASE)
    names: list[str] = []
    for part in parts:
        name = name_from_text(part)
        if name and name not in names:
            names.append(name)
    return names[:4]


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or _HELP_RE.search(text):
        return "help", {}

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
            return "free-games", {}

    if _COMPARE_RE.search(text):
        names = names_from_compare(text)
        if len(names) >= 2:
            return "price-board", {"games": names}

    name = name_from_text(text)
    if _NEWS_RE.search(text):
        return "game-news", {"term": name, "app_id": app_id}
    if _STATS_RE.search(text):
        return "game-stats", {"term": name, "app_id": app_id}
    return "game-search", {"term": name, "app_id": app_id}


class GamesAgent(AcpAgent):
    name = "games"
    title = "Games — Steam, SteamSpy and Epic"
    version = "1.0.0"

    def __init__(self, connection=None, data: GamesData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or GamesData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Games session opened. " + HELP.split("\n", 1)[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the public Steam, SteamSpy and Epic feeds", "medium"),
            ("Report the store's own prices and the published player numbers", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I read Steam's keyless store API, SteamSpy's estimates, Steam's news "
                        "feed and Epic's free-game promotions. I never estimate a price or a "
                        "player count myself.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Read the public games feeds for {skill}", kind="fetch", name=skill,
                      raw_input={"skill": skill, **params})
        if not ctx.ask_permission(
                tool, "Allow Games to read the public Steam, SteamSpy and Epic feeds?",
                remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public games feeds before I can answer.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except (GamesError, ValueError, GatewayError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the games feeds: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        # Every skill is a few HTTP reads; nothing long-running to interrupt.
        return None

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "game-search":
            return self._search(params)
        if skill == "game-stats":
            return self._stats(params)
        if skill == "game-news":
            return self._news(params)
        if skill == "free-games":
            return self._free()
        if skill == "price-board":
            return self._board(params)
        return HELP, {"summary": "help", "dataset": None}

    def _search(self, params: dict) -> tuple[str, dict]:
        if params.get("app_id"):
            detail = self.data.app(params["app_id"])
            artifact = {
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
            return "\n".join(lines), artifact

        term = params.get("term")
        if not term:
            return (
                "Which game should I look up? A name works — 'portal 2', 'stardew valley' — or a "
                "Steam app id.",
                {"summary": "no game named", "known": False},
            )
        result = self.data.search(term)
        artifact = {
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
        return "\n".join(lines), artifact

    def _stats(self, params: dict) -> tuple[str, dict]:
        term, app_id = params.get("term"), params.get("app_id")
        if not term and not app_id:
            return (
                "Which game should I look the player numbers up for? 'rust', 'hades', or a "
                "Steam app id like 620.",
                {"summary": "no game named", "known": False},
            )
        match = self.data.best_match(term or str(app_id), app_id)
        stats = self.data.stats(match["app_id"])
        ratio = stats["review_ratio"]
        artifact = {
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
        return "\n".join(lines), artifact

    def _news(self, params: dict) -> tuple[str, dict]:
        term, app_id = params.get("term"), params.get("app_id")
        if not term and not app_id:
            return ("Which game's news should I read? 'stardew valley', or a Steam app id.",
                    {"summary": "no game named", "known": False})
        match = self.data.best_match(term or str(app_id), app_id)
        feed = self.data.news(match["app_id"])
        artifact = {
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
        return "\n".join(lines), artifact

    def _free(self) -> tuple[str, dict]:
        free = self.data.free_games()
        artifact = {
            "summary": f"{DATASET_EPIC}: {len(free['now'])} free now, "
                       f"{len(free['soon'])} coming",
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
        return "\n".join(lines), artifact

    def _board(self, params: dict) -> tuple[str, dict]:
        """Premium: the cross-title board is computed on the gateway, not here."""
        games = params.get("games") or []
        if len(games) < 2:
            return (
                "The premium board compares two to four titles at once — name them, like "
                "'compare elden ring and dark souls 3'.",
                {"summary": "too few titles for the board", "known": False},
            )
        data, refused = premium_call(
            self.gateway,
            "games_price_board",
            {"games": games[:4]},
            {"agent": "games", "skill": "price-board", "games": games[:4]},
        )
        if refused:
            return refused
        board = data.get("games") if isinstance(data, dict) else None
        if not isinstance(board, list) or not board:
            return empty_premium_answer(
                "The licence gateway returned no titles for that comparison, so I have nothing to "
                "report. Try two to four game names.",
                {"agent": "games", "skill": "price-board"},
            )
        artifact = {
            "summary": f"premium board over {len(board)} titles: cheapest "
                       f"{(data.get('cheapest') or {}).get('name')}, most played "
                       f"{(data.get('mostPlayed') or {}).get('name')}",
            "premium": True,
            "games": board,
            "cheapest": data.get("cheapest"),
            "dearest": data.get("dearest"),
            "most_played": data.get("mostPlayed"),
            "best_reviewed": data.get("bestReviewed"),
        }
        lines = ["Premium cross-title board (computed on the licence gateway):"]
        for entry in board:
            ratio = entry.get("reviewRatio")
            lines.append(
                f"  • {entry.get('name')} (asked: {entry.get('query')}): "
                f"{usd(entry.get('price'))}"
                + (f" — {ratio * 100:.0f}% of reviews positive" if ratio is not None else "")
                + f"; owners {entry.get('owners') or 'not reported'}, "
                  f"{int(entry.get('ccu') or 0):,} playing now"
            )
        cheapest, dearest = data.get("cheapest") or {}, data.get("dearest") or {}
        most, best = data.get("mostPlayed") or {}, data.get("bestReviewed") or {}
        lines.append(f"\nCheapest: {cheapest.get('name')} at {usd(cheapest.get('price'))}. "
                     f"Dearest: {dearest.get('name')} at {usd(dearest.get('price'))}.")
        if most:
            lines.append(f"Most played right now: {most.get('name')} with "
                         f"{int(most.get('ccu') or 0):,} players.")
        if best:
            ratio = best.get("reviewRatio")
            if ratio is not None:
                lines.append(f"Best reviewed: {best.get('name')} at {ratio * 100:.1f}% positive.")
        lines.append(
            f"\nSource: {DATASET_STEAM} and {DATASET_STEAMSPY}, read on the licence gateway. Same "
            "feeds as the free skills — the gateway adds the cross-title comparison, and a caller "
            "without a key never gets the numbers."
        )
        return "\n".join(lines), artifact


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        GamesAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
