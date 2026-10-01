"""Chess - a player's rating, their record, their last games, and how they actually score.

Lichess publishes every player's rating in every time control plus their public games as PGNs,
keyless, and nobody asks it from an editor. "what is thibault's rating?" gets every category
with the deviation beside it, because a rating with 3 games behind it is not the same claim as
one with 12000. Grouping a player's own games by the openings Lichess names in the headers -
and what they actually score in each - is the premium skill.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (STOP_END_TURN, STOP_REFUSAL, AcpAgent, GatewayClient,  # noqa: E402
                     GatewayError, SessionContext, empty_premium_answer, premium_call,
                     prompt_text)

from data import (CATEGORIES, DATASET, ChessData, ChessError,  # noqa: E402
                  ChessNotFound, _category_name, category_from_text, game_id_from_text,
                  username_from_text)

HELP = (
    "I read Lichess's public API (keyless) - a player's rating in every time control and their\n"
    "public games. Ask me:\n"
    "  - what is thibault's blitz rating?\n"
    "  - what is thibault's rating?\n"
    "  - show me thibault's last 10 games\n"
    "  - tell me about game JNUpaHZT\n"
    "Lichess looks players up by username, not by real name, so ask for the handle the player\n"
    "registered. A rating is printed with the number of games behind it and its rating\n"
    "deviation, because 1774 from 3 games is not the same claim as 1774 from 12000.\n"
    "Grouping a player's own games by opening is the premium skill."
)

PERMISSION_KEY = "chess-read-lichess-public-api"

SKILLS = ("chess-player", "chess-games", "chess-game", "chess-openings", "help")

_GAME_ID = re.compile(r"\b(game|game id|id)\b", re.IGNORECASE)
_GAMES_WORDS = re.compile(
    r"\b(games?|last|recent|history|played|plays|records?)\b", re.IGNORECASE,
)
_OTHER_WORDS = re.compile(
    r"\b(weather|recipe|episode|xkcd|comic|song|album|water table|package version|"
    r"next race|standings)\b",
    re.IGNORECASE,
)
#: The premium question, and the only one. The free skills list the games Lichess has; this
#: groups them by the opening in the game header and reports the score in each. It needs the
#: words, so "show me the last 10 games" stays free.
_OPENING_WORDS = re.compile(
    r"\b(openings?|repertoire|what .*play|which .*play|do(?:es)? .*(?:score|win|do) with|"
    r"repertoires?|by opening|per opening|white|black)\b",
    re.IGNORECASE,
)
_COUNT_RE = re.compile(r"\b(?:last|past|recent)\s+(\d{1,3})\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}
    # Checked before the free routes, and narrow on purpose: a question about how a player
    # scores by opening. "show me the last 10 games" carries none of these words.
    if _OPENING_WORDS.search(stripped):
        player = username_from_text(stripped)
        if not player:
            return "help", {}
        params: dict = {"player": player}
        count = _COUNT_RE.search(stripped)
        if count:
            params["games"] = min(int(count.group(1)), 100)
        return "chess-openings", params
    game_id = game_id_from_text(stripped)
    if game_id and _GAME_ID.search(stripped):
        return "chess-game", {"game_id": game_id}
    if _GAMES_WORDS.search(stripped):
        player = username_from_text(stripped)
        if not player:
            return "help", {}
        params = {"player": player}
        count = _COUNT_RE.search(stripped)
        if count:
            params["count"] = min(int(count.group(1)), 50)
        return "chess-games", params
    player = username_from_text(stripped)
    if not player:
        return "help", {}
    params = {"player": player}
    category = category_from_text(stripped)
    if category:
        params["category"] = category
    return "chess-player", params


def render_player(player: dict, only: str | None = None) -> str:
    """One player's profile and ratings."""
    lines = [f"{player['real_name'] or player['username']} (@{player['username']}) on Lichess"]
    bits = []
    if player.get("country"):
        bits.append(player["country"])
    if player.get("created"):
        bits.append(f"joined {player['created']}")
    if bits:
        lines.append("  " + ", ".join(bits))
    lines.append(f"  {player['url']}")
    lines.append("")
    perfs = player["perfs"]
    if only and only in perfs:
        perf = perfs[only]
        lines.append(f"{_category_name(only)}: {perf['rating']}"
                     + (f" (provisional)" if perf["provisional"] else "")
                     + f", {perf['games']} game(s), deviation {perf['deviation']}"
                     + (f", {perf['change']:+d} this week" if perf["change"] is not None else ""))
        return "\n".join(lines)
    if not perfs:
        lines.append("  Lichess publishes no rated category for this player")
        return "\n".join(lines)
    lines.append("  ratings, fastest first:")
    for key, _label in CATEGORIES:
        perf = perfs.get(key)
        if not perf:
            continue
        line = (f"    {_category_name(key):<15} {perf['rating']:>5}"
                f"   {perf['games']:>7} game(s)"
                f"   deviation {perf['deviation']}")
        if perf["provisional"]:
            line += "  (provisional)"
        lines.append(line.rstrip())
    return "\n".join(lines)


def _outcome(game: dict, username: str) -> str:
    """Win, draw or loss for the player named, from the PGN's Result tag."""
    result = game.get("result")
    lowered = str(username or "").lower()
    if result == "1/2-1/2":
        return "draw"
    if result == "1-0":
        return "win" if str(game.get("white", "")).lower() == lowered else "loss"
    if result == "0-1":
        return "win" if str(game.get("black", "")).lower() == lowered else "loss"
    return "unknown"


def render_games(player_id: str, games: list[dict]) -> str:
    """A player's recent games, newest first."""
    lines = [f"{len(games)} recent game(s) by @{player_id} on Lichess, newest first:"]
    for index, game in enumerate(games, start=1):
        outcome = _outcome(game, player_id)
        colour = "white" if str(game.get("white", "")).lower() == str(player_id).lower() else "black"
        opponent = game["black"] if colour == "white" else game["white"]
        opponent_elo = game["black_elo"] if colour == "white" else game["white_elo"]
        against = f"as {colour} vs {opponent}"
        if opponent_elo:
            against += f" ({opponent_elo})"
        bits = [against]
        if game.get("time_control"):
            bits.append(game["time_control"])
        if game.get("variant") and game["variant"] != "Standard":
            bits.append(game["variant"])
        opening = game.get("opening")
        if opening:
            eco = f" [{game['eco']}]" if game.get("eco") else ""
            bits.append(f"{opening}{eco}")
        else:
            bits.append("opening not classified by Lichess")
        when = f" on {game['date']}" if game.get("date") else ""
        lines.append(f"  {index:>2}. {outcome.upper()} - {', '.join(bits)}{when}")
        if game.get("link"):
            lines.append(f"      {game['link']}")
    return "\n".join(lines)


def render_game(game: dict) -> str:
    """One game, with its headers and its moves."""
    lines = [f"game {game['id']} on Lichess"]
    lines.append(f"  event: {game.get('event') or 'not reported'}")
    lines.append(f"  date: {game.get('date') or 'not reported'}"
                 + (f" at {game['time']}" if game.get("time") else ""))
    lines.append(f"  white: {game['white']} ({game['white_elo'] or 'unrated'})")
    lines.append(f"  black: {game['black']} ({game['black_elo'] or 'unrated'})")
    lines.append(f"  result: {game['result']}  ({game.get('time_control') or 'no time control'})")
    if game.get("opening"):
        eco = f" [{game['eco']}]" if game.get("eco") else ""
        lines.append(f"  opening: {game['opening']}{eco}")
    else:
        lines.append("  opening: Lichess published no opening for this game")
    lines.append(f"  {game['link']}")
    if game.get("moves"):
        lines.append("")
        lines.append(f"  moves: {game['moves']}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_openings(data: dict) -> str:
    """How a player scores, opening by opening."""
    lines = [f"@{data.get('player', 'not reported')} - how they score by opening"]
    lines.append(f"  read {_num(data.get('gamesRead'))} game(s)"
                 + (f" of the {_num(data.get('gamesRequested'))} asked for"
                    if data.get("gamesRequested") else ""))
    lines.append(f"  overall record: {data.get('record', 'not reported')}, "
                 f"{_num(data.get('scorePercent'))}% score")
    lines.append(f"  {_num(data.get('distinctOpenings'))} distinct opening(s) in those games")
    best = data.get("bestOpening") or {}
    worst = data.get("worstOpening") or {}
    if best:
        lines.append(f"  best: {best.get('opening', 'not reported')} at "
                     f"{_num(best.get('scorePercent'))}% over {best.get('games', 'not reported')} "
                     f"game(s)")
    if worst and worst is not best:
        lines.append(f"  worst: {worst.get('opening', 'not reported')} at "
                     f"{_num(worst.get('scorePercent'))}% over "
                     f"{worst.get('games', 'not reported')} game(s)")
    lines.append("")
    for row in data.get("openings") or []:
        eco = f" [{row['eco']}]" if row.get("eco") else ""
        lines.append(f"  {row.get('opening', 'not reported')}{eco}: "
                     f"{row.get('wins', 0)}W {row.get('draws', 0)}D {row.get('losses', 0)}L "
                     f"of {row.get('games', 'not reported')} "
                     f"({_num(row.get('scorePercent'))}% score"
                     + (f", average opponent {_num(row.get('averageOpponentRating'))}"
                        if row.get("averageOpponentRating") is not None else "")
                     + ")")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class ChessAgent(AcpAgent):
    name = "chess"
    title = "Chess - a player's rating, their record, and how they score by opening"
    version = "1.0.0"

    def __init__(self, connection=None, data: ChessData | None = None, gateway=None) -> None:
        super().__init__(connection)
        self.data = data or ChessData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Chess session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read Lichess's public API", "medium"),
            ("Report the rating, the record and the openings", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Lichess looks players up by username, not by real name.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read Lichess's public API", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Chess to read Lichess's public player data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read Lichess's API first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "chess-openings":
                return self._run_skill(ctx, params, tool)
            if skill == "chess-games":
                games = self.data.games(params["player"], count=params.get("count") or 10)
                body = render_games(params["player"], games)
                summary = f"@{params['player']}: {len(games)} game(s)"
            elif skill == "chess-game":
                game = self.data.game(params["game_id"])
                body = render_game(game)
                summary = f"game {game['id']}: {game['white']} vs {game['black']} {game['result']}"
            else:
                player = self.data.player(params["player"])
                body = render_player(player, only=params.get("category"))
                wanted = params.get("category")
                best = player["perfs"].get(wanted) if wanted else None
                summary = (f"@{player['username']}: "
                           + (f"{_category_name(wanted)} {best['rating']}"
                              if best else f"{len(player['perfs'])} rating(s)"))
        except (ChessError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read Lichess's API: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. A rating is only as good as the games "
                    "behind it, so the game count and the rating deviation are printed next to "
                    "every number rather than left out.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"player": params["player"]}
        if params.get("games"):
            arguments["games"] = int(params["games"])

        data, refused = premium_call(self.gateway, "chess_opening_report", arguments,
                                     {"agent": "chess"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("openings"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back an opening report for that player.",
                {"agent": "chess"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read an opening report out of what the gateway sent.")
            return STOP_END_TURN

        body = render_openings(data)
        summary = (f"@{data['player']}: {data.get('gamesRead', 'not reported')} game(s), "
                   f"{data.get('distinctOpenings', 'not reported')} opening(s)")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, worked out on the licence gateway. "
                    "The openings are the ones Lichess itself names in the game headers, and a "
                    "score over two games is shown beside its sample size rather than as a claim "
                    "about how someone plays.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        ChessAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
