# a2a — Agent2Agent servers for public data

[![Agent2Agent Protocol 0.3.0](https://img.shields.io/badge/A2A-0.3.0-000000)](https://a2a-protocol.org)

Speaks the **Agent2Agent (A2A) protocol**, the open agent-to-agent standard now under the
Linux Foundation. Registered agents are listed in the Global A2A Registry under the GitHub
identity `mrfentmen`, so any A2A client can discover them by capability instead of by URL.

Thirty-seven A2A servers, one shared stdlib-only kit. Each server publishes a real agent card,
speaks A2A 0.3.0 JSON-RPC, streams task updates over SSE, and POSTs webhook
notifications when the public data it watches changes.

Everything runs on public open data. No API keys, no scraping, no fake fixtures in
production paths.

| Server | Agent card | Skills | Novelty |
|---|---|---|---|
| [`servers/nyc311`](servers/nyc311) | NYC Open Data Agent | `complaint-status`, `complaints-near`, `complaints-board` (premium) | First city government A2A server (public agent card for 311 data) |
| [`servers/nycflood`](servers/nycflood) | NYC Street Flooding Agent | `flood-recent`, `flood-sensors`, `flood-watch`, `flood-hotspots` (premium) | First street-flooding sensor agent; the only municipal dataset here that is genuinely event-shaped, which makes the push notification a real alert |
| [`servers/nycwater`](servers/nycwater) | NYC Drinking Water Agent | `water-quality`, `water-sites`, `water-watch`, `water-trend` (premium) | First drinking-water-quality agent of any kind (172K DEP distribution samples, published as monitoring-site codes) |
| [`servers/nws`](servers/nws) | NWS Weather Alerts Agent | `alerts-active`, `alerts-summary`, `alerts-watch`, `alerts-timeline` (premium) | First National Weather Service agent: active alerts by state, point or severity, straight from `api.weather.gov` |
| [`servers/quakes`](servers/quakes) | USGS Earthquake Agent | `quakes-recent`, `quakes-near`, `quakes-summary`, `quakes-watch`, `quakes-aftershocks` (premium) | First earthquake agent on the USGS catalog — worldwide or within N km of any point, with a magnitude-threshold watch, and the aftershock sequence of any mainshock |
| [`servers/tides`](servers/tides) | NOAA Tides Agent | `tide-predictions`, `tide-next`, `water-level`, `stations`, `tide-watch`, `tide-windows` (premium) | First tide agent: NOAA CO-OPS high/low predictions and observed water levels for 3,499 stations, placed against published flood stages, with a crossing watch |
| [`servers/recalls`](servers/recalls) | openFDA Recalls Agent | `recalls-recent`, `recall-search`, `recalls-summary`, `recall-lookup`, `recalls-watch`, `recall-trend` (premium) | First product-recall agent: openFDA drug, food and device enforcement reports (87,000+ records), with counts by classification and a new-recall watch |
| [`servers/aurora`](servers/aurora) | Aurora Space Weather Agent | `aurora-now`, `aurora-forecast`, `aurora-visibility`, `aurora-messages`, `aurora-watch`, `aurora-storm-windows` (premium) | First space-weather agent: NOAA SWPC's Kp index and storm messages, plus the OVATION model's aurora probability at any point, with a storm watch |
| [`servers/fire`](servers/fire) | Wildfire Incident Agent | `fire-active`, `fire-near`, `fire-summary`, `fire-lookup`, `fire-watch`, `fire-discovery` (premium) | First wildfire agent: the interagency WFIGS incident layer (active fires, acreage, containment, real distances), with a new-large-fire watch |
| [`servers/air`](servers/air) | Air Quality Agent | `air-now`, `air-forecast`, `air-ranking`, `air-watch`, `air-outlook` (premium) | First air-quality agent: Open-Meteo's keyless model run — US AQI with its EPA band, PM2.5/PM10, ozone, NO₂, SO₂, CO, UV and pollen by point or city, a 72-hour hourly outlook, and a band-change watch |
| [`servers/volcanoes`](servers/volcanoes) | Volcano Alert-Level Agent | `volcano-alerts`, `volcano-list`, `volcano-lookup`, `volcano-watch`, `volcano-threat` (premium) | First volcano agent: the USGS Volcano Science Center's alert levels — which volcanoes are above NORMAL with the observatory's own synopsis, the monitored list by region and level, colour code and threat ranking per volcano, and an alert-change watch |
| [`servers/buoys`](servers/buoys) | NDBC Buoy Agent | `buoy-conditions`, `buoy-trend`, `buoys-near`, `buoys-list`, `buoy-watch`, `buoy-fleet` (premium) | First marine-buoy agent: NOAA's National Data Buoy Center — the newest observation at any of 1,354 stations, the nearest reporting station to a coastal place, per-station trends with lows and highs, and a wave/wind crossing watch that states missing sensors instead of smoothing them |
| [`servers/airports`](servers/airports) | FAA Airport Status Agent | `airport-status`, `airports-delays`, `airports-closures`, `airport-watch`, `nas-board` (premium) | First airport-status agent: the FAA's NAS snapshot — ground-delay programmes, arrival and departure delay windows and closures by code or city, worst-first systemwide with the FAA's own reason text, and an appear/clear watch |
| [`servers/aviation`](servers/aviation) | Aviation Weather Agent | `metar`, `taf`, `aviation-nearby`, `aviation-watch`, `taf-timeline` (premium) | First aviation-weather agent: the Aviation Weather Center's METAR and TAF — a station's decoded observation (wind, visibility, ceiling, cloud layers, temperature, altimeter) with the raw report and the service's own VFR/MVFR/IFR/LIFR category, the TAF with every forecast period, the reporting stations within a radius of a place, and a flight-category watch |
| [`servers/mbta`](servers/mbta) | MBTA Transit Agent | `next-departures`, `stop-times`, `nearby-stops`, `route-alerts`, `service-alerts`, `headway-check` (premium) | First transit agent over the MBTA's keyless v3 API — the live arrival board at any stop with the agency's own headsigns and uncertainty, today's timetable, the stops nearest a point, and service alerts for one line or the whole network, with a headway-reliability premium skill |
| [`servers/bart`](servers/bart) | BART Transit Agent | `departures`, `lines`, `stations`, `delays`, `last-departure` (premium) | First agent over the San Francisco Bay's rail operator: the real-time departure board with platforms, directions and line colours, what each station serves, the 50-station directory, and the cancelled, limited and live-estimated trains BART is flagging — with a catchability premium skill ("if I leave at 20:40, what can I still catch") |
| [`servers/bikeshare`](servers/bikeshare) | Citi Bike Station Agent | `bikes-near`, `nearest-stations`, `station-lookup`, `availability`, `ride-pair` (premium) | First bike-share agent on the GBFS standard: live bike, e-bike and dock counts for all 2,520 Citi Bike stations, each gated on the feed's own renting and returning flags so an out-of-service dock is never counted as stock, plus a premium skill that pairs a pickup with a drop-off for a whole ride |
| [`servers/place`](servers/place) | Postal Code Agent | `uk-postcode`, `outward-code`, `nearest-postcode`, `zip-code`, `catchment-area` (premium) | First agent over two postal feeds at once: a UK postcode with the full ONS administrative geography — ward, parish, constituency, LSOA, MSOA — every postcode under an outward code, the UK postcodes nearest a point, and postal codes in about 65 other countries, with a premium skill that tallies which wards and constituencies a whole neighbourhood falls into |
| [`servers/grid`](servers/grid) | GB Grid Carbon Agent | `grid-now`, `grid-forecast`, `grid-regional`, `grid-mix`, `clean-windows` (premium) | First agent over Great Britain's carbon intensity: the current half-hour, the 48-hour forecast half-hour by half-hour, all 18 distribution regions with their own generation mix, and what the country is generating now — every band NESO's own rather than derived — plus a premium skill that turns the forecast into low-carbon windows a job can actually be scheduled into |
| [`servers/courts`](servers/courts) | CourtListener Case Law Agent | `opinion-search`, `case-lookup`, `court-info`, `judge-lookup`, `citation-census` (premium) | First case-law agent: CourtListener's published opinions on a topic with their reporter citations and inbound cite counts, RECAP docket lookups, the court list and judge profiles, and a citation census that tallies what a topic's case law leans on, computed on a licence-gated gateway |
| [`servers/companies`](servers/companies) | GLEIF Companies Agent | `entity-lookup`, `lei-lookup`, `ownership`, `entities-in-country`, `group-rollup` (premium) | First legal-entity agent: GLEIF's LEI index — a company by its filed legal name, one entity from its 20-character LEI with registration dates and corroboration level, the entities a parent owns, the entities registered in a country, and a group roll-up that reads every subsidiary individually on a licence-gated gateway |
| [`servers/worldbank`](servers/worldbank) | World Bank Indicators Agent | `indicator-value`, `country-compare`, `indicator-search`, `country-info`, `indicator-trend` (premium) | First World Bank agent: any of the 1,498 World Development Indicators for a country, the same indicator side by side for up to eight countries, a search of the indicator catalogue to find the code for a subject, a country reference, and a trend that turns a series into a change, a per-year rate and a best and worst year on a licence-gated gateway |
| [`servers/lobbying`](servers/lobbying) | Senate Lobbying Agent | `client-filings`, `filing-detail`, `lobbyist-filings`, `client-issues`, `client-spend` (premium) | First lobbying-disclosure agent: the US Senate LDA filings — a firm's filings for a year with their reported money, one filing in full with its issue areas and the lobbyists on them, the filings a named lobbyist appears on, and a spending tally that separates what was disclosed from what was never reported, computed on a licence-gated gateway |
| [`servers/votes`](servers/votes) | GovTrack Votes Agent | `roll-call-votes`, `bill-lookup`, `member-lookup`, `committee-lookup`, `chamber-scorecard` (premium) | First congressional-record agent: GovTrack's roll-call votes in the chamber's own result wording, bill lookup by term, type or status, members by state and party, the committee list with each committee's published jurisdiction, and a chamber scorecard that gives the pass rate, the average margin and how often the parties voted as one block, computed on a licence-gated gateway |
| [`servers/satellites`](servers/satellites) | CelesTrak Satellites Agent | `orbit-elements`, `overhead`, `passes`, `catalog-lookup`, `pass-windows` (premium) | First satellite agent: CelesTrak's GP element sets and space catalogue, plus the orbital propagation needed to say what is overhead, and a premium skill that turns a multi-day range into observation windows you could actually use |
| [`servers/launches`](servers/launches) | SpaceDevs Launch Library Agent | `upcoming-launches`, `launch-in-window`, `launch-lookup`, `launch-details`, `launch-board` (premium) | First launch-schedule agent over the SpaceDevs Launch Library 2.2, with a premium skill that pages and counts a whole window: totals, busiest day, by agency, tightest turnaround |
| [`servers/exoplanets`](servers/exoplanets) | NASA Exoplanet Archive Agent | `planet-lookup`, `system-planets`, `planet-search`, `planet-extremes`, `catalogue-survey` (premium) | First exoplanet-catalogue agent, querying the NASA Exoplanet Archive's TAP service directly; a premium skill reads all 6,372 rows of the composite table as a picture — by method, by decade, by spectral type, and the records |
| [`servers/species`](servers/species) | iNaturalist Species Agent | `species-count`, `recent-sightings`, `nearby-observations`, `species-info`, `range-survey` (premium) | First biodiversity-observation agent: iNaturalist's public observations by common or scientific name, the newest sightings under a name, what has been recorded within a radius of a point, and a taxon's own taxonomy record — with every count reported per grade, because a community-confirmed record and a sighting still awaiting identifiers are not the same thing, and a row saying when iNaturalist obscured its position — plus a licence-gated range survey behind the gateway |
| [`servers/stargazing`](servers/stargazing) | 7Timer Stargazing Agent | `sky-tonight`, `sky-forecast`, `sky-compare`, `sky-best-window` (premium) | First stargazing-forecast agent: 7Timer's astronomical product for the coming hours at a place, the whole 72-hour run slot by slot, two places side by side, and a licence-gated ranking of the contiguous windows with the steadiest sky — every index printed with its published scale word, all three of which run bigger-is-better, and the answers stating plainly that the product carries no daylight flag and no moon phase |
| [`servers/tv`](servers/tv) | TVMaze Agent | `show-search`, `show-episodes`, `next-airing`, `schedule-day`, `binge-plan` (premium) | First television-schedule agent: TVMaze show search with match scores, a show's episode list by season, the next air date read from the show's own episode airstamps, and everything airing on a day worldwide or for one country — with a licence-gated finish-the-season plan behind the gateway |
| [`servers/music`](servers/music) | Deezer Music Agent | `music-search`, `artist-albums`, `track-preview`, `chart`, `artist-timeline` (premium) | First music-catalogue agent: one Deezer search across tracks, artists and albums, an artist's releases as Deezer pages them, a track's 30-second preview link, the global chart, and a licence-gated release timeline behind the gateway |
| [`servers/radio`](servers/radio) | Radio Browser Agent | `stations-find`, `station-detail`, `stations-near`, `genre-list`, `station-roster` (premium) | First internet-radio-directory agent: radio-browser stations by name, country or genre tag, one station's full record by uuid, the stations nearest a point with the distances worked out from the directory's own coordinates, and the genre vocabulary it indexes — with a licence-gated multi-genre roster behind the gateway |
| [`servers/sports`](servers/sports) | ESPN Sports Agent | `scores`, `team-lookup`, `standings`, `game-detail`, `slate-brief` (premium) | First multi-league sports agent: ESPN's public site API across eight leagues — scores and fixtures for any date, team lookup with the ESPN id, standings with divisions and playoff seeds, one game by event id, and a licence-gated cross-league slate behind the gateway |
| [`servers/chess`](servers/chess) | Lichess Chess Agent | `player-profile`, `recent-games`, `game-detail`, `opening-lookup`, `player-form` (premium) | First chess agent: Lichess ratings per time control with the all-time record, the NDJSON game export with opponent and result, one game with its moves, the opening a game reached with its ECO code, and a licence-gated form report behind the gateway |
| [`servers/resale`](servers/resale) | Designer Resale Agent | `resale-search`, `brand-market`, `piece-lookup`, `price-index` (premium) | First resale-market agent: Fashionphile's and Rebag's keyless Shopify catalogues read together — the cheapest live listings for a brand and/or a word with each store's own variant price and availability, one brand's market (counts, asking-price range, median, conditions, types), one listing by handle read from the store's own product endpoint, and a licence-gated cross-brand price index behind the gateway |
| [`servers/games`](servers/games) | Games Agent | `game-search`, `game-stats`, `game-news`, `free-games`, `price-board` (premium) | First games-catalogue agent: Steam's store search and app details, SteamSpy's owner ranges and concurrent players, Steam's per-app news feed and Epic's free-promotion feed — prices quoted as Steam's own US cents, ownership as the range SteamSpy published, and a licence-gated cross-title board behind the gateway |
| [`servers/films`](servers/films) | Films Agent | `film-lookup`, `filmmaker-films`, `films-to-watch`, `archive-item`, `film-index` (premium) | First film agent: Wikidata's film facts (year, directors, runtime, genres, IMDb id) and the Internet Archive's feature_films shelf for prints you can watch, most downloaded first, with the honest note that the shelf is mixed — and a licence-gated decade index behind the gateway |

Public A2A servers today are almost all crypto bots, dev tooling, and B2B AI shops.
No city, water utility, weather service, geological survey, oceanographic service, food
safety regulator, space-weather center, land-management agency, air-quality modeller,
volcanology observatory, aviation regulator, aviation weather center, transit agency, postal service, grid operator,
legal publisher, lobbying registry, congressional record, space agency, exoplanet archive,
biodiversity observation dataset, stargazing forecast, broadcaster, music catalogue,
radio directory, sports league, chess server, luxury resale catalogue, games store,
film archive, or
hospital publishes an
agent card. These thirty-seven take
the first slots in that gap — see [`docs/gap-research.md`](docs/gap-research.md) for the
survey behind that claim (and its caveats).

## Quick start

```bash
# terminal 1 — a server (each defaults to its own port)
python3 servers/nyc311/server.py        # http://127.0.0.1:8787
python3 servers/nycflood/server.py      # http://127.0.0.1:8788
python3 servers/nycwater/server.py      # http://127.0.0.1:8789
python3 servers/nws/server.py           # http://127.0.0.1:8791  (set NWS_USER_AGENT)
python3 servers/quakes/server.py        # http://127.0.0.1:8792
python3 servers/tides/server.py         # http://127.0.0.1:8793
python3 servers/aurora/server.py        # http://127.0.0.1:8794
python3 servers/fire/server.py          # http://127.0.0.1:8795
python3 servers/recalls/server.py       # http://127.0.0.1:8796
python3 servers/air/server.py           # http://127.0.0.1:8797  (Open-Meteo, keyless)
python3 servers/volcanoes/server.py     # http://127.0.0.1:8798
python3 servers/buoys/server.py         # http://127.0.0.1:8800
python3 servers/airports/server.py      # http://127.0.0.1:8801
python3 servers/aviation/server.py      # http://127.0.0.1:8802  (Aviation Weather Center, keyless)
python3 servers/tv/server.py            # http://127.0.0.1:8804  (TVMaze, keyless)
python3 servers/music/server.py         # http://127.0.0.1:8805  (Deezer, keyless)
python3 servers/radio/server.py         # http://127.0.0.1:8806  (radio-browser, keyless)
python3 servers/sports/server.py        # http://127.0.0.1:8807  (ESPN, keyless)
python3 servers/chess/server.py         # http://127.0.0.1:8808  (Lichess, keyless)
python3 servers/satellites/server.py    # http://127.0.0.1:8812  (CelesTrak, keyless)
python3 servers/launches/server.py      # http://127.0.0.1:8813  (SpaceDevs, keyless)
python3 servers/exoplanets/server.py    # http://127.0.0.1:8814  (NASA Exoplanet Archive, keyless)
python3 servers/courts/server.py        # http://127.0.0.1:8850  (CourtListener, keyless)
python3 servers/companies/server.py     # http://127.0.0.1:8851  (GLEIF, keyless)
python3 servers/worldbank/server.py     # http://127.0.0.1:8852  (World Bank, keyless)
python3 servers/lobbying/server.py      # http://127.0.0.1:8853  (Senate LDA, keyless)
python3 servers/votes/server.py         # http://127.0.0.1:8854  (GovTrack, keyless)
python3 servers/mbta/server.py          # http://127.0.0.1:8870  (MBTA, keyless)
python3 servers/bart/server.py          # http://127.0.0.1:8871  (BART, published demo key)
python3 servers/bikeshare/server.py     # http://127.0.0.1:8872  (Citi Bike GBFS, keyless)
python3 servers/place/server.py         # http://127.0.0.1:8873  (postcodes.io + Zippopotam, keyless)
python3 servers/grid/server.py          # http://127.0.0.1:8874  (NESO carbon intensity, keyless)

# terminal 2 — optional: watch pushes arrive
python3 tools/webhook_receiver.py --port 8799

# terminal 3 — read the card, ask a question
curl -s localhost:8787/.well-known/agent-card.json | python3 -m json.tool
curl -s localhost:8787/ -H 'Content-Type: application/json' -d '{
  "jsonrpc":"2.0","id":"1","method":"message/send",
  "params":{"message":{"kind":"message","role":"user","messageId":"m1",
  "parts":[{"kind":"text","text":"Which streets flooded in the last 30 days?"}]}}}' | python3 -m json.tool
```

Ask that second question against port **8788** to see live FloodNet results.

## Protocol coverage

| A2A feature | Where it lives |
|---|---|
| Agent card at `/.well-known/agent-card.json` (plus legacy `agent.json`) | `a2a_kit/httpd.py` |
| `message/send` with `returnImmediately` (background task + polling) | `a2a_kit/protocol.py` |
| `message/stream` — SSE: task, status-update, artifact-update | `a2a_kit/httpd.py` |
| Task lifecycle: submitted → working → completed / failed / input-required / canceled | `a2a_kit/protocol.py`, `a2a_kit/store.py` |
| Multi-turn `input-required` continuation in one task | `a2a_kit/protocol.py` (`_merge`) |
| `tasks/get` (with `historyLength`), `tasks/cancel`, `tasks/resubscribe` | `a2a_kit/protocol.py` |
| `tasks/pushNotificationConfig/{set,get,list,delete}` | `a2a_kit/protocol.py` |
| Server-initiated push: poll the dataset, POST a `status-update` event | `a2a_kit/push.py` |
| Error codes per the official SDK map (-32001 … -32603) | `a2a_kit/errors.py` |
| SQLite persistence for tasks and push configs | `a2a_kit/store.py` |

## Reading the code

```
a2a_kit/          the reusable server kit (stdlib only, no dependencies)
  errors.py       error codes + the SkillAgent contract every server implements
  protocol.py     JSON-RPC methods, task lifecycle, streaming, push configs
  store.py        SQLite task + push-config store
  push.py         the watcher thread that fires webhooks
  httpd.py        agent card, HTTP routes, SSE writer
  jsonapi.py      keyless JSON API client base: caching, validation, freshness
  socrata.py      Socrata/SODA client built on jsonapi: SOQL escaping, row ids
  cli.py          one CLI for every server
  smoke.py        shared smoke-check helper
servers/<name>/   data.py (dataset client) · agent.py (skills) · server.py (main)
                  tests/ · tools/smoke.py · .env.example
tests/test_kit.py tests for the kit itself
tools/            demo webhook receiver
docs/             the gap research behind the "first of its kind" claims
```

A server is three files: a dataset client, a `SkillAgent` subclass (parse a message,
run a skill, probe a watch), and a four-line `server.py`. The kit does the rest.

## Tests

```bash
python3 tests/test_kit.py
python3 servers/nyc311/tests/test_agent.py
python3 servers/nycflood/tests/test_agent.py
python3 servers/nycwater/tests/test_agent.py
python3 servers/nws/tests/test_agent.py
python3 servers/quakes/tests/test_agent.py
python3 servers/tides/tests/test_agent.py
python3 servers/aurora/tests/test_agent.py
python3 servers/fire/tests/test_agent.py
python3 servers/recalls/tests/test_agent.py
python3 servers/air/tests/test_agent.py
python3 servers/volcanoes/tests/test_agent.py
python3 servers/buoys/tests/test_agent.py
python3 servers/airports/tests/test_agent.py
python3 servers/aviation/tests/test_agent.py
```

546 unit tests (519 across the fourteen servers, 27 for the kit): task lifecycle, streaming, push-config validation, webhook delivery
and retries, dataset validation, SOQL escaping, skill parsing, and one full
in-process HTTP + SSE test.

Live end-to-end smoke (hits the real NYC Open Data APIs):

```bash
# terminal 1
NYC311_ALLOW_PRIVATE_WEBHOOKS=1 python3 servers/nyc311/server.py
# terminal 2
python3 servers/nyc311/tools/smoke.py
```

346 checks across the fourteen smoke scripts: card, real lookup, `input-required`
continuation, SSE stream, push-config CRUD. One command runs all fourteen:

```bash
python3 tools/smoke_all.py
```

## Configuration

Every server reads `.env.example` in its own directory (or real env vars). Each has
its own prefix so all fourteen can run side by side:

| Variable | Purpose |
|---|---|
| `A2A_HOST` / `A2A_PORT` / `A2A_PUBLIC_URL` | Where the server listens and what the card advertises |
| `A2A_PROVIDER_ORG` / `A2A_PROVIDER_URL` | Optional `provider` block in the card |
| `<PREFIX>_APP_TOKEN` | Optional Socrata app token (raises rate limits; not required) |
| `<PREFIX>_CACHE_TTL`, `<PREFIX>_HTTP_TIMEOUT` | Dataset caching and HTTP timeout |
| `<PREFIX>_DB` | SQLite path for tasks + push configs |
| `<PREFIX>_WATCH_INTERVAL` | Seconds between webhook watches (floor: 5) |
| `<PREFIX>_ALLOW_PRIVATE_WEBHOOKS` | `1` allows loopback webhook URLs — local demos only |

Prefixes: `NYC311`, `NYC_FLOOD`, `NYC_WATER`, `NWS`, `USGS`, `NOAA_TIDES`, `AURORA`, `FIRE`,
`OPENFDA`, `AIR`, `VOLCANO`, `BUOY`, `FAA`, `AVIATION`.

`NWS_USER_AGENT`, `USGS_USER_AGENT` and `NOAA_TIDES_USER_AGENT` matter: those agencies
ask that callers identify themselves with a contactable address, and NWS returns 403
without one. SWPC and NIFC are happy keyless, so `AURORA_USER_AGENT` and `FIRE_USER_AGENT`
are good manners rather than requirements. `OPENFDA_API_KEY` is optional — openFDA works keyless and a key only
raises the rate limit to 240 requests/minute. Open-Meteo, the USGS Volcano Science Center,
NOAA's buoy centre, the FAA status feed and the Aviation Weather Center are keyless too, so
`AIR_USER_AGENT`, `VOLCANO_USER_AGENT`, `BUOY_USER_AGENT`, `FAA_USER_AGENT` and
`AVIATION_USER_AGENT` are manners rather than gates
(NWS and the volcano science center return 403 without any agent at all).

NOAA's tide server also reads `NOAA_TIDES_UNITS` (feet or metres), `NOAA_TIDES_DATUM`
(the reference level heights are measured from, default MLLW) and
`NOAA_TIDES_STATION_TTL` (the 2 MB station catalogue cache, default one day).

The buoys server reads `BUOY_UNITS` — `english` (mph, ft, °F, inHg; the default) or `metric`
(m/s, m, °C, hPa, which is how NDBC itself publishes).

## Honest limits

- **A dry result is not proof of no flooding.** FloodNet publishes completed events,
  so every flood answer states the window it looked at.
- **Water results are per monitoring site, not per address.** DEP publishes site codes
  without coordinates; the agent says so instead of guessing.
- **311 is read-only.** There is no public API to *file* a complaint or pay a ticket;
  the agent links and reports, never pretends.
- **Private webhook URLs are blocked by default.** Allow them only for local demos.
  Hostname webhooks are not DNS-resolved before use, so a determined caller could
  point one at an internal name — put these servers behind an egress firewall.
- **Alerts and quakes are read, not predicted.** The NWS endpoint returns what is
  *currently in effect* and drops alerts the moment they expire, so an empty answer is
  not a forecast. USGS is a catalog of what already happened.
- **Tide answers are NOAA's predictions, not measurements.** `tide-predictions` and
  `tide-next` repeat NOAA's astronomical predictions; `water-level` is the observed
  reading and says whether NOAA has verified it yet. Height datums are named in every
  answer because 2 ft over MLLW means nothing without the datum.
- **Aurora answers are model output, not sightings.** `aurora-visibility` reports NOAA's
  OVATION probability of aurora *overhead* at a point, with the model run time; it says
  nothing about clouds, so every answer tells the caller to check a weather forecast too.
  The Kp forecast beyond about a day is low-confidence by NOAA's own account, and the
  city coordinates for named places come from the server's own list, not from NOAA —
  pass a latitude/longitude for an exact point.
- **Wildfire acreage is what agencies reported, not what a satellite sees.** WFIGS holds
  only incidents that are still active, so a fire leaving the list means it closed out,
  not that it never existed; `fire-near` distances are great-circle miles to the reported
  point and are not a risk assessment or an evacuation notice.
- **openFDA records are unvalidated.** The agency's own disclaimer travels in every
  recall answer, recalls can be corrected or withdrawn after publication, and an empty
  result means "nothing published matches" — not "nothing is happening". Reports arrive in
  batches, so the newest `report_date` can be a week or more behind today and a short
  window can honestly return nothing.
- **Air-quality answers are model output on a grid, not a monitor on your street.**
  Open-Meteo serves modelled fields interpolated to the point or city you name, so the
  reading is the model's cell rather than a sensor reading; every answer names the source
  product it came from, and an unplaceable name is refused instead of guessed.
- **Volcano alert levels are an observatory's judgement, not a measurement.** USGS sets
  them by decision and they change rarely, so "unchanged" is the normal answer; the alert
  skill lists only volcanoes above NORMAL, and the catalogue is the currently monitored
  set (161 volcanoes and seamounts), not every volcano on Earth.
- **A buoy reading is one spot in one ocean.** NDBC stations are tens to hundreds of miles
  apart, so "buoys near me" means the nearest reporting station, not a local measurement;
  sensors drop out one at a time and read `MM`, which the agent reports as missing rather
  than interpolating — and a watch will not start on a field the station is not publishing
  right now.
- **The FAA snapshot only lists airports that are affected.** An airport with nothing to
  report is absent from the feed, not "on time"; the feed is revised every few minutes, so
  every answer is as-of its snapshot time; and a "closure" in the list is often a runway or
  taxiway closure, not the whole airport.
- **A METAR describes one airfield; a TAF is a forecast.** The observation answers with the
  service's own VFR/MVFR/IFR/LIFR category and the raw report behind it — no category is
  computed here — and the aviation-weather service only returns stations that reported
  recently, so an airport with no current observation is absent from a nearby list rather
  than reported as fine. Station ids are ICAO: a bare FAA code (DEN, JFK, MDW) answers with an
  empty response, which is why the server resolves DEN to KDEN before asking. The watch
  deliberately tracks only the reported flight category: temperature, wind and visibility move
  within a category all day and would page on noise.
- **Rate limits.** No app token means light use only; the kit caches per query and
  the watcher polls on a timer rather than per request.

## Deploying

These are plain `http.server` apps: fine behind a reverse proxy on a private network,
not hardened for direct public exposure. Set `A2A_PUBLIC_URL` to the real external
URL (the card embeds it), terminate TLS at the proxy, and keep
`<PREFIX>_ALLOW_PRIVATE_WEBHOOKS=0`.

## License

MIT — see [LICENSE](LICENSE).
