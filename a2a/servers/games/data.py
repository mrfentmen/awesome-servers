"""Read-only games reader for the games A2A server.

  https://store.steampowered.com/api/storesearch/       Steam store search
  https://store.steampowered.com/api/appdetails         Steam app details
  https://api.steampowered.com/ISteamNews/GetNewsForApp/v2   Steam news
  https://steamspy.com/api.php?request=appdetails       SteamSpy owner and playtime estimates
  https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions   Epic free games

All five keyless, verified live on 2026-09-30 (Steam search answered "Portal 2" with a real
price and metascore; SteamSpy answered appid 730 with owners "100,000,000 .. 200,000,000" and
ccu 1,013,936; Epic's promotions feed answered 13 elements).

Two honesty rules the feed shapes force:

  - SteamSpy's owner count is a **range** ("100,000,000 .. 200,000,000"), so it is reported as
    the range SteamSpy published, never as a single number.
  - Playtime fields SteamSpy reports as 0 mean "not enough data", not "zero minutes played", so
    they are reported as not reported.
"""

from __future__ import annotations

from a2a_kit import JsonApiClient, UpstreamError

DATASET_STEAM = "store.steampowered.com/api"
DATASET_STEAMSPY = "steamspy.com/api.php"
DATASET_EPIC = "store-site-backend-static.ak.epicgames.com/freeGamesPromotions"

COUNTRY = "us"
LANGUAGE = "english"
DEFAULT_LIMIT = 5
MAX_LIMIT = 15
DEFAULT_NEWS = 3
MAX_NEWS = 8


def cents(value) -> float | None:
    """Steam prices are integer cents. None when the feed does not price the item."""
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number / 100.0 if number >= 0 else None


def review_ratio(positive, negative) -> float | None:
    """Share of reviews that are positive, or None when there are no reviews at all."""
    try:
        up, down = int(positive or 0), int(negative or 0)
    except (TypeError, ValueError):
        return None
    total = up + down
    return round(up / total, 3) if total else None


class GamesClient(JsonApiClient):
    """Steam store, SteamSpy statistics, Steam news and Epic's weekly free games."""

    env_prefix = "GAMES"
    user_agent = "a2a-games/1.0 (+https://github.com/mrfentmen/a2a)"

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_term(value: str) -> str:
        term = " ".join(str(value or "").split())
        if len(term) < 2 or not any(ch.isalnum() for ch in term):
            raise ValueError("a game search is a name or two, like 'portal 2' or 'stardew'")
        if len(term) > 60:
            raise ValueError("keep the game name to a few words")
        return term

    @staticmethod
    def check_app_id(value) -> int:
        try:
            app_id = int(str(value).strip())
        except (TypeError, ValueError):
            raise ValueError("a Steam app id is a number, like 620 for Portal 2")
        if app_id < 1 or app_id > 10_000_000:
            raise ValueError("that does not look like a Steam app id")
        return app_id

    # -- Steam store -------------------------------------------------------

    def search(self, term: str, limit: int = DEFAULT_LIMIT) -> dict:
        """Steam store search, cheapest first, with the store's own prices."""
        query = self.check_term(term)
        count = max(1, min(int(limit), MAX_LIMIT))
        payload = self.get_json("https://store.steampowered.com/api/storesearch/",
                                {"term": query, "l": LANGUAGE, "cc": COUNTRY})
        items = payload.get("items") if isinstance(payload, dict) else None
        if not isinstance(items, list):
            raise UpstreamError("the Steam store returned an unexpected payload (no item list)")
        rows = []
        for item in items:
            price = item.get("price") or {}
            app_id = item.get("id")
            rows.append({
                "app_id": app_id,
                "name": str(item.get("name") or "").strip(),
                "type": item.get("type"),
                "price": cents(price.get("final")),
                "initial": cents(price.get("initial")),
                "currency": price.get("currency"),
                "is_free": not price,
                "metascore": item.get("metascore") or None,
                "image": item.get("tiny_image"),
                "url": f"https://store.steampowered.com/app/{app_id}" if app_id else None,
            })
        rows.sort(key=lambda row: (row["price"] is None, row["price"] or 0.0))
        if not rows:
            raise UpstreamError(f"the Steam store has nothing for {query!r}")
        return {"query": query, "rows": rows[:count], "total": payload.get("total"), "all": rows}

    def best_match(self, term: str, app_id=None) -> dict:
        """The game a search meant: an explicit app id wins, otherwise the closest name."""
        if app_id:
            detail = self.app(self.check_app_id(app_id))
            return {"app_id": detail["app_id"], "name": detail["name"], "matched": "app id"}
        result = self.search(term)
        wanted = self.check_term(term).lower()
        rows = result["all"]
        for row in rows:
            if row["name"].lower() == wanted:
                return {**row, "matched": "exact name"}
        for row in rows:
            if wanted in row["name"].lower():
                return {**row, "matched": "name contains"}
        return {**rows[0], "matched": "closest name"}

    def app(self, app_id) -> dict:
        """Steam's own app details, filtered to what an answer needs."""
        clean = self.check_app_id(app_id)
        payload = self.get_json("https://store.steampowered.com/api/appdetails",
                                {"appids": str(clean), "cc": COUNTRY, "l": LANGUAGE})
        entry = (payload or {}).get(str(clean)) if isinstance(payload, dict) else None
        if not isinstance(entry, dict) or not entry.get("success"):
            raise UpstreamError(f"the Steam store has no app {clean}")
        data = entry.get("data") or {}
        price = data.get("price_overview") or {}
        return {
            "app_id": clean,
            "name": str(data.get("name") or "").strip(),
            "type": data.get("type"),
            "is_free": bool(data.get("is_free")),
            "price": cents(price.get("final")),
            "initial": cents(price.get("initial")),
            "discount_percent": price.get("discount_percent") or 0,
            "currency": price.get("currency"),
            "release_date": ((data.get("release_date") or {}).get("date") or None),
            "developers": list(data.get("developers") or []),
            "publishers": list(data.get("publishers") or []),
            "genres": [g.get("description") for g in (data.get("genres") or []) if isinstance(g, dict)],
            "categories": [c.get("description") for c in (data.get("categories") or [])[:4]
                           if isinstance(c, dict)],
            "short_description": (data.get("short_description") or None),
            "header_image": data.get("header_image"),
            "url": f"https://store.steampowered.com/app/{clean}",
        }

    def news(self, app_id, count: int = DEFAULT_NEWS) -> dict:
        """Steam's per-app news feed, newest first."""
        clean = self.check_app_id(app_id)
        wanted = max(1, min(int(count), MAX_NEWS))
        payload = self.get_json("https://api.steampowered.com/ISteamNews/GetNewsForApp/v2",
                                {"appid": str(clean), "count": str(wanted), "maxlength": "300"})
        appnews = (payload or {}).get("appnews") if isinstance(payload, dict) else None
        items = (appnews or {}).get("newsitems") if isinstance(appnews, dict) else None
        if not isinstance(items, list):
            raise UpstreamError(f"Steam's news feed has nothing for app {clean}")
        rows = [{
            "title": str(item.get("title") or "").strip(),
            "date": item.get("date"),
            "feed": item.get("feedlabel"),
            "url": item.get("url"),
            "excerpt": (item.get("contents") or "").strip()[:200] or None,
        } for item in items]
        return {"app_id": clean, "rows": rows}

    # -- SteamSpy ----------------------------------------------------------

    def stats(self, app_id) -> dict:
        """SteamSpy's estimates: owners as a range, concurrent players, review counts."""
        clean = self.check_app_id(app_id)
        payload = self.get_json("https://steamspy.com/api.php",
                                {"request": "appdetails", "appid": str(clean)})
        if not isinstance(payload, dict) or not payload.get("name"):
            raise UpstreamError(f"SteamSpy has no data for app {clean}")
        tags = payload.get("tags") or {}
        top_tags = [name for name, _ in sorted(tags.items(), key=lambda kv: -int(kv[1] or 0))[:5]] \
            if isinstance(tags, dict) else []
        average = str(payload.get("average_forever") or "")
        median = str(payload.get("median_forever") or "")
        return {
            "app_id": clean,
            "name": str(payload.get("name") or "").strip(),
            "developer": payload.get("developer") or None,
            "publisher": payload.get("publisher") or None,
            "owners": payload.get("owners") or None,
            "ccu": int(payload.get("ccu") or 0),
            "positive": int(payload.get("positive") or 0),
            "negative": int(payload.get("negative") or 0),
            "review_ratio": review_ratio(payload.get("positive"), payload.get("negative")),
            "average_forever_minutes": int(average) if average.isdigit() and int(average) > 0 else None,
            "median_forever_minutes": int(median) if median.isdigit() and int(median) > 0 else None,
            "tags": top_tags,
            "url": f"https://steamspy.com/app/{clean}",
        }

    # -- Epic --------------------------------------------------------------

    def free_games(self) -> dict:
        """Epic's free promotions: what is free now and what is coming."""
        payload = self.get_json(
            "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions",
            {"locale": "en-US", "country": "US", "allowCountries": "US"})
        try:
            elements = payload["data"]["Catalog"]["searchStore"]["elements"]
        except (KeyError, TypeError):
            raise UpstreamError("Epic returned an unexpected payload (no catalogue elements)")
        if not isinstance(elements, list):
            raise UpstreamError("Epic returned an unexpected payload (no catalogue elements)")
        now, soon = [], []
        for element in elements:
            promotions = element.get("promotions") or {}
            current = promotions.get("promotionalOffers") or []
            upcoming = promotions.get("upcomingPromotionalOffers") or []
            price = ((element.get("price") or {}).get("totalPrice") or {})
            mapping = (element.get("catalogNs") or {}).get("mappings") or []
            slug = next((m.get("pageSlug") for m in mapping if m.get("pageSlug")), None)
            row = {
                "title": str(element.get("title") or "").strip(),
                "id": element.get("id"),
                "slug": slug,
                "url": (f"https://store.epicgames.com/en-US/p/{slug}" if slug
                        else "https://store.epicgames.com/en-US/free-games"),
                "original": cents(price.get("originalPrice")),
                "discount_price": cents(price.get("discountPrice")),
                "currency": price.get("currencyCode"),
                "image": next((img.get("url") for img in (element.get("keyImages") or [])
                               if img.get("type") == "OfferImageTall"), None),
            }
            if current:
                window = current[0] if isinstance(current[0], dict) else {}
                row["window"] = {"starts": window.get("startDate"), "ends": window.get("endDate")}
                row["free"] = price.get("discountPrice") == 0
                now.append(row)
            elif upcoming:
                window = upcoming[0] if isinstance(upcoming[0], dict) else {}
                row["window"] = {"starts": window.get("startDate"), "ends": window.get("endDate")}
                row["free"] = True
                soon.append(row)
        return {"now": now, "soon": soon}


__all__ = [
    "COUNTRY",
    "DATASET_EPIC",
    "DATASET_STEAM",
    "DATASET_STEAMSPY",
    "DEFAULT_LIMIT",
    "DEFAULT_NEWS",
    "GamesClient",
    "LANGUAGE",
    "MAX_LIMIT",
    "MAX_NEWS",
    "cents",
    "review_ratio",
]
