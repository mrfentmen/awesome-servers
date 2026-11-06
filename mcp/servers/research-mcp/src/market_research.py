#!/usr/bin/env python3
"""
market_research.py — Etsy niche research without an Etsy API key.

Data sources (all legal, public, no login):
  1. DuckDuckGo autocomplete  -> real human query-space ("demand breadth")
  2. DuckDuckGo HTML search   -> how many Etsy pages compete for a phrase ("saturation")
  3. Google Trends (pytrends, optional) -> 12-month interest trajectory

Never touches eRank quotas, never scrapes Etsy listing pages.
Intended for the overnight bake-off driver (_night_run) and as a library
for the MCP server wrapper (research_mcp.py).
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

_CACHE_PATH = (os.environ.get("MARKET_RESEARCH_CACHE")
               or os.path.expanduser("~/.cache/market-research/cache.json"))
_CACHE = None


def _cache():
    global _CACHE
    if _CACHE is None:
        try:
            with open(_CACHE_PATH) as f:
                _CACHE = json.load(f)
        except Exception:
            _CACHE = {}
    return _CACHE


def _cache_set(key, val):
    c = _cache()
    c[key] = val
    try:
        with open(_CACHE_PATH, "w") as f:
            json.dump(c, f)
    except Exception:
        pass


def _get(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def suggest(keyword, lim=10):
    """DDG autocomplete: real query-space around a seed."""
    try:
        u = ("https://duckduckgo.com/ac/?q=" + urllib.parse.quote(keyword) +
             "&type=list")
        data = json.loads(_get(u))
        # {"query": ..., "suggestions": [{"phrase": ...}]} or legacy list form
        out = []
        if isinstance(data, dict):
            for s in data.get("suggestions", [])[:lim]:
                p = s.get("phrase") or s.get("q")
                if p:
                    out.append(p)
        elif isinstance(data, list) and len(data) >= 2:
            for s in data[1][:lim]:
                item = s.get("phrase") if isinstance(s, dict) else s
                if item:
                    out.append(item)
        return out
    except Exception as e:
        return [f"(suggest failed: {e})"]


def ddg_result_pages(query, n=10):
    """DDG HTML search; returns list of page titles (proxy for what ranks)."""
    try:
        import urllib.request as ur
        q = urllib.parse.urlencode({"q": query}).encode()
        req = ur.Request("https://html.duckduckgo.com/html/", data=q,
                         headers={"User-Agent": UA,
                                  "Content-Type": "application/x-www-form-urlencoded"})
        with ur.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", "replace")
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', html)
        titles = [re.sub("<.*?>", "", t) for t in titles]
        return titles[:n] if titles else []
    except Exception as e:
        return [f"(ddg failed: {e})"]


# ---------- engine-2: counting via Bing (real result-COUNT when exposed) ----

def _get_with_retry(url, timeout=15, retries=1):
    last = None
    for attempt in range(retries + 1):
        try:
            return _get(url, timeout=timeout)
        except Exception as e:
            last = e
            if attempt < retries:
                time.sleep(8)
    raise last


def bing_etsy_math(query):
    """Bing: prefer exposed result count; fallback: count <cite> with etsy.com."""
    u = ("https://www.bing.com/search?q=" +
         urllib.parse.quote(f'site:etsy.com {query}') + "&setlang=en")
    html = _get_with_retry(u)
    m = re.search(r"([\d,]+)\s+results", html) or \
        re.search(r"About\s+([\d,]+)", html)
    if m:
        try:
            return int(m.group(1).replace(",", "")), "bing-count"
        except ValueError:
            pass
    cites = re.findall(r"<cite[^>]*>(.*?)</cite>", html)
    n = sum(1 for c in cites if "etsy.com" in c)
    return n, "bing-cites"


def mojeek_etsy(query):
    """Mojeek: shows an integer results count and absolute etsy hrefs."""
    u = ("https://www.mojeek.com/search?q=" +
         urllib.parse.quote(f'site:etsy.com {query}'))
    html = _get_with_retry(u)
    m = re.search(r"([\d,]+)\s+results", html)
    hrefs = re.findall(r'https?://(?:www\.)?etsy\.com/[^"', html)
    count = int(m.group(1).replace(",", "")) if m else len(hrefs)
    return count, ("mojeek-count" if m else "mojeek-hrefs")


def etsy_saturation(query):
    """Competition proxy from Bing+Mojeek. Returns (count|None, engine).

    None == both engines refused us; report as unknown, never fake-zero."""
    c = _cache()
    key = "sat:" + query
    if key in c:
        return c[key]["value"], c[key]["engine"]
    try:
        val, engine = bing_etsy_math(query)
        if val and val > 0:
            out = (val, engine)
        else:
            time.sleep(3)
            val2, engine2 = mojeek_etsy(query)
            out = val2, engine2
    except Exception:
        try:
            out = mojeek_etsy(query)
        except Exception:
            out = (None, "unavailable")
    _cache_set(key, {"value": out[0], "engine": out[1]})
    return out


def trend_12mo(keyword):
    """Google Trends 12-month interest; returns (recent, past, slope) or None."""
    try:
        from pytrends.request import TrendReq
        pt = TrendReq(hl="en-US", tz=0, timeout=(10, 20))
        pt.build_payload([keyword], timeframe="today 12-m")
        df = pt.interest_over_time()
        if df is None or df.empty:
            return None
        s = df[keyword]
        first_half = float(s[: len(s)//2].mean())
        second_half = float(s[len(s)//2:].mean())
        recent = float(s[-4:].mean())
        slope = (second_half - first_half) / max(first_half, 1.0)
        return {"recent": recent, "first_half": first_half,
                "second_half": second_half, "slope": round(slope, 2)}
    except Exception as e:
        return {"error": str(e)[:120]}


def market_check(keyword):
    """Full snapshot for one keyword: breadth + saturation + engine info."""
    sugg = suggest(keyword)
    variants = [keyword] + [s for s in sugg if s and not s.startswith("[")][:8]
    sat_counts = []
    samples = []
    for v in variants:
        val, engine = etsy_saturation(v)
        if isinstance(val, int):
            sat_counts.append(val)
        samples.append({"variant": v, "etsy_hits": val, "engine": engine})
        time.sleep(3.0)
    breadth = len(suggest(keyword)) if sugg else 0
    avg_sat = (sum(sat_counts) / len(sat_counts)) if sat_counts else None
    return {
        "keyword": keyword,
        "suggest_breadth": breadth,
        "avg_etsy_saturation": avg_sat,
        "variants": samples,
        "note": "saturation = site-search count via Bing/Mojeek; None = unknown",
    }


# ---------- overnight bake-off ----------

SEEDS = {
    "beauty_pro": [
        "lash tech intake form",
        "esthetician consent form",
        "client consultation form spa",
        "spa aftercare card template",
        "microblading consent form",
    ],
    "wedding": [
        "bridal shower games bundle",
        "wedding guest book alternative",
        "wedding program template minimalist",
    ],
    "adhd_planner": [
        "adhd daily planner printable",
        "body doubling tracker",
    ],
    "clinical_biz": [
        "social worker case notes template",
        "therapy intake packet template",
        "counselor progress notes template",
    ],
    "gig_business": [
        "dog walking business forms",
        "cleaning business forms template",
    ],
}


def _night_run(out_dir=None, max_seeds=None, save=None):
    """Orchestrates research + writes a morning report JSON. Returns dict."""
    import os
    from datetime import datetime
    out_dir = out_dir or os.path.expanduser("~/research/market_bakeoff")
    os.makedirs(out_dir, exist_ok=True)
    results = {}
    for cluster, seeds in SEEDS.items():
        if max_seeds and not cluster in max_seeds and len(results) >= max_seeds:
            pass
        per = []
        for seed in seeds:
            snap = market_check(seed)
            per.append(snap)
            print(f"[{cluster}] {seed}: breadth={snap['suggest_breadth']} "
                  f"sat={snap['avg_etsy_saturation']}", flush=True)
        results[cluster] = per

    # blue-ocean verdict: more query-space, fewer competing pages;
    # unknown saturation -> breadth-scored with a flag, never a fake zero
    ranked = []
    for cluster, rows in results.items():
        for r in rows:
            wealth = r["suggest_breadth"]
            sat = r["avg_etsy_saturation"]
            if sat is not None:
                score = round(wealth / (sat ** 0.5 + 1), 3)
                flag = "known_sat"
            else:
                score = round(wealth * 0.5, 3)
                flag = "unknown_sat"
            ranked.append({"cluster": cluster, "keyword": r["keyword"],
                           "score": score, "breadth": wealth,
                           "saturation": sat, "flag": flag})
    ranked.sort(key=lambda x: -x["score"])

    payload = {"generated": datetime.utcnow().isoformat(), "ranked": ranked,
               "detail": results}
    path = os.path.join(out_dir, "bakeoff.json")
    with open(path, "w") as f:
        json.dump(payload, f, indent=1)
    print(f"WRITTEN {path}", flush=True)
    if save:
        with open(save, "w") as f:
            json.dump(payload, f, indent=1)
    return payload


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        print(json.dumps(market_check(sys.argv[2]), indent=1))
    elif len(sys.argv) > 1 and sys.argv[1] == "trend":
        print(json.dumps(trend_12mo(sys.argv[2])))
    elif len(sys.argv) > 1 and sys.argv[1] == "suggest":
        print("\n".join(suggest(sys.argv[2])))
    elif len(sys.argv) > 1 and sys.argv[1] == "night":
        _night_run()
    elif len(sys.argv) > 1 and sys.argv[1] == "oneshot":
        kw = sys.argv[2] if len(sys.argv) > 2 else "sublimation png"
        c = etsy_saturation(kw)
        print(json.dumps({"query": kw, "etsy_hits": c,
                          "titles": ddg_result_pages(kw)}))
    else:
        print(__doc__)
