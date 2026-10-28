# Missing MCP servers — research log (public; 68 monetizable servers live in the published snapshot since 2026-09-24)

Living list of MCP servers that do **not** exist yet (verified against the MCP
registry, npm, GitHub and the web), plus what was checked and skipped and why.

Updated: 2026-10-27. Repo count at time of writing: 1088 published packages, 319 with source.

Plus built 2026-10-27, a 50-server keyless wave (all on npm and in `published/`, no gate, no key):
`hgnc-mcp`, `cbioportal-mcp`, `gdc-mcp`, `ncbi-datasets-mcp`, `metabolights-mcp`, `emdb-mcp`, `jsonschema-mcp`, `ucsc-genome-mcp`, `pathway-commons-mcp`, `astronomy-mcp`, `ghcn-mcp`, `soilgrids-mcp`, `hashid-mcp`, `spaceweather-mcp`, `smk-mcp`, `tfl-mcp`, `f1-mcp`, `nasdaq-mcp`, `jsonc-mcp`, `osrs-ge-mcp`, `tcgdex-mcp`, `potterdb-mcp`, `dogceo-mcp`, `catfact-mcp`, `brewery-mcp`, `patch-mcp`, `ical-mcp`, `vcard-mcp`, `x509-mcp`, `iban-mcp`, `totp-mcp`, `unit-convert-mcp`, `timezone-mcp`, `jsondiff-mcp`, `sql-format-mcp`, `password-mcp`, `btc-address-mcp`, `ini-mcp`, `xml-mcp`, `hexdump-mcp`, `endian-mcp`, `base58-mcp`, `float-mcp`, `combinatorics-mcp`, `primes-mcp`, `dns-mcp`, `npm-registry-mcp`, `http-check-mcp`, `crc-mcp`, `qr-mcp`.
Plus built 2026-10-28, a 19-server keyless wave across gaps the registry had no
wrappers for: `ripestat-mcp` (routing), `peeringdb-mcp` (interconnect),
`aviationweather-mcp` (aviation), `celestrak-mcp` (satellites),
`launchlibrary-mcp` (launches), `deezer-mcp` (music), `openlibrary-mcp` (books),
`artic-mcp` (museum), `propublica-nonprofits-mcp` (nonprofit finance),
`fema-disasters-mcp` (emergency management), `gleif-mcp` (legal entities),
`cheapshark-mcp` (game prices), `water-quality-portal-mcp` (water quality),
`nasa-sbdb-mcp` (asteroids), `bart-mcp` (transit), `grid-carbon-mcp` (power grid),
`tvmaze-mcp` (TV), `itunes-mcp` (media catalogue), `usaspending-mcp` (procurement).

Plus built 2026-10-28, a 28-server keyless infrastructure wave (17 new, 11
existing servers expanded past five tools), all on npm and mirrored into
`published/`:
new — `amtrak-mcp` (rail stations), `drinking-water-mcp` (EPA SDWIS),
`hts-tariff-mcp` (US tariff lines), `ofac-sanctions-mcp` (sanctions screening),
`usace-water-mcp` (reservoir levels), `drug-shortages-mcp` (FDA shortages),
`fda-510k-mcp` (device clearances), `clinical-codes-mcp` (LOINC + ICD-10-CM),
`census-geocode-mcp` (address and geography lookup), `submarine-cables-mcp`
(telecom cable routes), `energy-charts-mcp` (EU generation mix and prices),
`opensky-mcp` (live aircraft and tracks), `gbfs-mcp` (bike-share feeds),
`library-of-congress-mcp`, `rail-infrastructure-mcp` (crossings and railroad
bridges), `port-throughput-mcp` (BTS cargo volumes), `bridges-mcp` (NY and NYC
bridge conditions);
expanded — `cftc-mcp`, `fdic-mcp`, `npi-registry-mcp`, `snotel-mcp`,
`drought-mcp`, `usgs-water-mcp`, `tides-mcp`, `tfl-mcp`, `nyc311-mcp`,
`ourairports-mcp`, `epa-echo-mcp`.

Checked and rejected for this wave: National Inventory of Dams API (a single
state CSV is 69 MB), FCC broadband map (403), CalFire incident feed (403),
OpenSky flight history for anonymous callers (403 — live state and tracks work),
USDM current-statistics endpoint (404 — state and county statistics work).


## Verified missing — build next

(none pending — all 10 below built 2026-09-22: `weatherbit-mcp`, `marketstack-mcp`,
`kucoin-mcp`, `bitwarden-mcp`, `suunto-mcp`, `netatmo-mcp`, `switchbot-mcp`,
`doppler-mcp`, `infisical-mcp`, `youtrack-mcp`. Scoped on npm: bitwarden, suunto,
youtrack — plain names were taken. Plus built 2026-09-23: `ns-mcp` (NS Dutch
Railways, Ocp-Apim key), `knmi-mcp` (KNMI open data, raw-key auth), `eccc-mcp`
(Canada GeoMet, keyless), `bom-mcp` (Australia BOM, keyless + geohash encoder),
`seoul-mcp` (Seoul air quality), `tdx-mcp` (Taiwan transport, OAuth). Plus built
2026-09-23: `mgm-mcp` (Turkey keyless + Origin header), `bmkg-mcp` (Indonesia
keyless), `kma-mcp` (Korea data.go.kr key), `bkk-mcp` (Budapest Futar key),
`chmi-mcp` (Czech open-data browser, keyless). Plus built overnight: `statuscake-mcp`,
`pingdom-mcp`, `ohdear-mcp`, `dpla-mcp`, `odysee-mcp` (Lighthouse), `delinea-mcp`,
`cyberark-mcp`, `openpanel-mcp`, `swetrix-mcp`, `split-mcp`, `goatcounter-mcp`,
`deviantart-mcp`, `nanoleaf-mcp`.) Plus built overnight: `ackee-mcp`, `shynet-mcp`,
`rybbit-mcp`, `beaconchain-mcp`, `coinmetrics-mcp`, `hikingproject-mcp`,
`energinet-mcp`, `wpengine-mcp`, `appveyor-mcp`, `isbndb-mcp`, `literal-mcp`,
`synoptic-mcp`, `doab-mcp`, `fingrid-mcp`, `stormglass-mcp`, `quip-mcp`,
`simplecast-mcp`, `blubrry-mcp`, `spreaker-mcp`, `shootproof-mcp`, `turbosquid-mcp`, `cgtrader-mcp`, `playcanvas-mcp`, `seafile-mcp`, `docspell-mcp`, `teedy-mcp`, `filerun-mcp`, `owncloud-mcp`, `pydio-mcp`, `prx-mcp`, `savvycal-mcp`, `commafeed-mcp`, `supernotes-mcp`, `guru-mcp`, `godot-mcp`, `kopia-mcp`, `hermes-mcp`, `chanel-mcp`,
`louisvuitton-mcp`, `gucci-mcp`, `prada-mcp`, `rolex-mcp`, `cartier-mcp`,
`dior-mcp`, `saintlaurent-mcp`, `balenciaga-mcp`, `fendi-mcp`,
`bottegaveneta-mcp`, `icebox-mcp`, `traxnyc-mcp`, `kith-mcp`, `stadiumgoods-mcp`,
`glossier-mcp`, `aimeleondore-mcp`.)

**Luxury brand servers (built 2026-09-24, Fashionphile + Rebag public Shopify JSON;
upgraded to 7 tools: search/list/get/price-overview/compare/find-deals/overview,
with condition/color/material parsing from Rebag data):**
hermes, chanel, louisvuitton, gucci, prada, rolex, cartier, dior,
saintlaurent, balenciaga, fendi, bottegaveneta (all `-mcp`). Brand-owned
sites excluded: edge bot-walls (LV Akamai 403, Hermès Cloudflare 403,
Gucci fingerprint-drop), no public APIs.

**Vendor-API sweep (built 2026-10-23, web research + vendor docs + npm check
before each build):** `ipdata-mcp` (ipdata.co IP intelligence: geolocation,
carrier, ASN, company, threat/VPN — free key, EU endpoint option),
`neverbounce-mcp` (NeverBounce/ZoomInfo email verification: single/check,
account credits, job status/results/delete — `secret_xxx` key from a Custom
Integration App), `docraptor-mcp` (DocRaptor HTML→PDF/XLSX, Basic auth with
the key as username, test mode default). Checked clean the same day: no
first-party MCP servers from ipdata (org ships client libraries only),
NeverBounce, or DocRaptor, and no npm MCP packages under those plain names.

Skipped in the same sweep — covered: USPS (our own `usps-mcp` already in published snapshot), Ticketmaster Discovery (@delorenj/mcp-server-ticketmaster +
@pipeworx/mcp-ticketmaster), 17TRACK (mcp-server-17track), Geocodio
(@pipeworx/mcp-geocodio), Ecwid (usefulapi hosted MCP), Clover + Braintree
(multiple community servers each).

**Wave 2 of the vendor-API sweep (2026-10-23, same day, npm + registry +
web checks before each build):** `collegefootballdata-mcp` (CollegeFootball
Data.com CFBD API — free Bearer key; 20 tools over conferences, venues,
teams, games, scoreboard, box scores, betting lines, weather, polls,
player game/season stats, advanced stats, player search, recruiting,
coaches, SP+, SRS, calendar) and `stadiamaps-mcp` (Stadia Maps — free-tier
key; 12 tools over Pelias geocoding/search/autocomplete/reverse/structured,
Valhalla directions/isochrones/route-matrix/elevation, timezone lookup).
Degraded-fork angle checked and skipped honestly: the near-candidates all
turn out covered — OpenLigaDB (@pipeworx + our own openligadb-soccer-mcp),
Visual Crossing (@pipeworx), SeatGeek (our own seatgeek-mcp in the published snapshot),
Fastly (@fastly/mcp official), Regulations.gov (pipeworx + @blen + cyanheads).
OpenUV is genuinely uncovered on npm but ships only two real endpoints —
logged as a thin target rather than padded to 10 tools.

**Gaming sweep (built 2026-10-23, npm + GitHub checks before each build):**
`vgchartz-mcp` — VGChartz game-sales data had zero MCPs on npm or GitHub
(checked 2026-10-23; the closest community work is scrapers, not MCP servers).
Built as a Python standalone at
[`mrfentmen/vgchartz-mcp`](https://github.com/mrfentmen/vgchartz-mcp):
15 tools over the gamedb search (keyword/platform/publisher/developer filters,
platform-name→code mapping), per-game sales splits (total/NA/Europe/Japan/others),
game details + summaries, sales comparison, plus the weekly, yearly and
pre-order charts with their indexes. 15 unit tests and every tool smoke-tested
live against vgchartz.com.

**Keyless open-data sweep (built 2026-10-23, live-probed each API before
building; npm + PyPI + GitHub checked per candidate):**
- `crtsh-mcp` — crt.sh certificate-transparency search, zero MCPs anywhere
  (8 tools: search/subdomains/issuers/cert-detail/expiring/expired/history/
  wildcards; cert detail pages are HTML-only, parsed with regex slicing).
  14 tests, all tools live. [`mrfentmen/crtsh-mcp`](https://github.com/mrfentmen/crtsh-mcp)
- `adsbdb-mcp` — adsbdb.com open aviation database, zero MCPs (5 tools:
  aircraft by registration, callsign→airline+origin+destination, airline
  lookup, mode-s→registration, one-shot flight overview). 14 tests, all live.
  [`mrfentmen/adsbdb-mcp`](https://github.com/mrfentmen/adsbdb-mcp)
- `pskreporter-mcp` — PSK Reporter ham-radio propagation reports, zero MCPs
  (5 tools: who heard a sender, what a receiver heard, propagation summary
  with Maidenhead-locator distance math, active monitors, best-frequency
  recommender). 21 tests; 4/5 tools live-verified, the receiver-direction
  tool shares the verified fetch path (API rate-limits ~5 queries/min, so
  the server spaces live queries 30s and caches 90s).
  [`mrfentmen/pskreporter-mcp`](https://github.com/mrfentmen/pskreporter-mcp)

- `erddap-mcp` — ERDDAP ocean-data *protocol* server, zero MCPs for the
  protocol itself (GitHub probed 2026-10-23: every "ocean" MCP wraps one
  single API; none speak ERDDAP, which hundreds of servers use). 5 tools:
  list_servers (5 curated keyless servers), keyword catalogue search,
  dataset metadata+coverage+variable list, tabledap queries (time range,
  lat/lon box, `!=NaN`-style constraints, dedup, row cap), griddap queries
  (latest-grid default, stride + 20k-cell guard). 29 tests; all tools
  live-verified against coastwatch + gliders servers (real SST grids and
  buoy temps returned). [`mrfentmen/erddap-mcp`](https://github.com/mrfentmen/erddap-mcp)

Checked and skipped in the 2026-10-23 second pass (already covered):
NOAA CO-OPS tides (`cyanheads/noaa-marine-mcp-server`), aviation METAR/TAF
(5+ servers incl. cyanheads), OpenAlex (6+ servers), GWAS Catalog (official
`gwas-catalog/mcp`), USGS streamflow (`pipeworx-io/mcp-usgswater`),
Common Crawl CDX (`arturseo-geo/mcp-common-crawl`, SEO-angle). ERDDAP was
the last unclaimed keyless ocean-data layer.

Checked and skipped same day (already covered): NOAA SWPC space weather
(`space-weather-mcp` on npm), NDBC ocean buoys (`ndbc-buoy-mcp` npm +
`ndbc-mcp` PyPI), 7Timer astro weather (`@pipeworx/mcp-7timer`), OONI
(`@pipeworx/mcp-ooni`), IODA outages (`mcp-internet-outages`), iNaturalist
(3 MCPs), TheSpaceDevs launches (`spacedevs-mcp`), met.no (`yr-metno-mcp`),
Wayback Machine (`mcp-wayback-machine`), GTFOBins/LOLBAS
(living-off-the-land-lolbins-mcp-server).

## Skipped — already a thing

Do not build; covered by others or by this repo.

- itch.io — z27fang/itch-io-mcp-ts, itch-community, Vinkius, Apify
- Epic Games Store — pixfishx / meethuhu epic-free-games
- Pirate Weather — pipeworx-io/mcp-pirate-weather
- Tomorrow.io — pipeworx-io/tomorrow-io
- TfNSW — piddlingtuna alerts, danhussey stops/departures, maxim75 trip planner
- HSL Helsinki — devusvulgaris/mcp-hsl (also on npm)
- Xbox — 312-dev/xbox-mcp via OpenXBL
- Raydium — official docs MCP (docs.raydium.io/mcp), kukapay launchlab tools
- Sorare — AnythingMCP 18-tool adapter (bcrypt auth, needs user account)
- Shyft — covered by Shyft's own MCP directory
- Telegram, Strava, Fitbit, Last.fm, OpenLibrary, Brave, Neon (official), ClickHouse (official), Home Assistant (official ha-mcp), Metaplex, SNCF, Stocktwits, Sleeper, OpenWeatherMap (official), Eurostat, StatCan, AccuWeather, AEMET, EODHD — all have registry servers
- bible — this repo (`bible-mcp`) + vineverse, midvash and others
- torah — this repo (`torah-mcp`); JonathanB555/torah-mcp also exists
- Exchanges: Binance, Bybit (mcp-dir/bybit-mcp), and all local ones (coinbase, kraken, okx, bitstamp, gemini, bitfinex, mexc, gateio, bitget, upbit, bithumb, deribit)
- PM/work: Linear (official), Notion, Jira, Confluence, Airtable (official), Asana, ClickUp, Monday (official), Smartsheet, Coda (official + community), Redmine, Shortcut, Bugzilla (kud, 12 tools)
- Fitness: Garmin, Whoop, Oura, Withings, Polar
- Smart home: Home Assistant (official), Shelly, Govee, Tuya (official platform + PyPI), Homey Pro (60 tools)
- Analytics/flags: PostHog (official), Mixpanel (local), Amplitude (official), Matomo, GrowthBook (official), Plausible, Umami, Unleash (official), Flagsmith (official), LaunchDarkly, Statsig (official), Checkly, Honeybadger (official)
- Uptime: UptimeRobot (official), Better Stack
- Incidents: PagerDuty (official), incident.io (official remote MCP), FireHydrant (official), Squadcast, Rootly
- Secrets: 1Password, Vault (official)
- Rail/transit: Deutsche Bahn (3x community), ÖBB, Amtrak (pipeworx), TfNSW (3x), HSL (devusvulgaris), PTV (malamutemayhem), NS (this repo), SBB, GBFS (Gnist hosted), BKK (this repo)
- Weather: FMI (pipeworx), AEMET, Met Office (this repo), HKO (imjac0b + pongiotdevelop), JMA (pipeworx + sasonoda), NEA Singapore (vdineshk), IMGW (bartosz-kuc), KNMI (this repo), MGM (this repo), BMKG (this repo), KMA (this repo), CHMI (this repo), ECCC (this repo), BOM (this repo)
- Games/anime/comics: RAWG (pipeworx/Pipedream), IGDB (official + bielacki), GiantBomb (pipeworx), AniList (smithery), ComicVine (pipeworx), Jikan + MangaDex + OpenBrewery (this repo), Kitsu (official docs MCP + pipeworx)
- Books/music/podcasts: Google Books (pipeworx/Vinkius), Hardcover (3x), Listen Notes (pipeworx/Pipedream/Composio), AcoustID (Vinkius/cynosure), setlist.fm (chrischall/pipeworx), Bandsintown (pipeworx), TVMaze (cyanheads), CocktailDB (pipeworx)
- Energy: EIA (cyanheads + GSA-TTS + missionsquad)
- Space: Launch Library (official + pipeworx)
- Hosting: Vercel (official), Netlify (official), Render (official), Railway (official), Fly.io (official flyctl), Heroku, DigitalOcean, Hetzner, OVH, Scaleway, Linode (takashito), Vultr (rsp2k, 335 tools), Jenkins (kud 38 tools + official plugin), Drone CI (3x), TeamCity (Daghis), Bamboo (hmdmph), CircleCI (official), SonarQube (official), Bitrise (official), Azure DevOps
- HR: HiBob (official), Deel (official), BambooHR, Personio (gyopiazza), Fathom (fathomdx), Linear (official), Notion, Jira, Confluence, Airtable (official), Asana, ClickUp, Monday (official), Smartsheet, Coda (official), Redmine, Shortcut, Bugzilla (kud), YouTrack (this repo)
- Analytics: PostHog (official), Mixpanel (local), Amplitude (official), Matomo, GrowthBook (official), Plausible, Umami, Unleash (official), Flagsmith (official), LaunchDarkly, Statsig (official), Checkly, Honeybadger (official), StatusCake (this repo via Composio alt), Pingdom (this repo via Composio alt), Oh Dear (this repo)
- Secrets: Vault (official), 1Password, Bitwarden (this repo), Doppler (this repo), Infisical (this repo), Akeyless (community RTA)
- Video/social: Odysee (this repo; Apify/oanor alts), Tumblr (viaSocket/Zapier/Bright Data), Rumble (no API), Flickr (local), Vimeo (pipeworx), Twitch (local), YouTube (no verified local)
- Patents: EPO (pipeworx/navisbio/JIBSN), USPTO (cyanheads+), WIPO (no public REST found)
- Culture: Gallica (Galica-MCP), Coursera (3x), Papers Past (API uncertain)

## Dropped — no usable public API or dead endpoints

- Underdog Fantasy / PrizePicks — no public API
- Drift Protocol — api.drift.trade unreachable, no documented public REST
- SMHI — metfcst point endpoint 404s (API shape changed, needs re-research)
- Hellomoon — rest.hellomoon.io unreachable
- Kagi — API requires a paid plan
- Auckland Transport — api.at.govt.nz routes unverifiable from here (portal docs are JS-driven, no swagger found)
- Trafiklab/SL — api.sl.se + dev.trafiklab.se unreachable from here
- DMI Denmark — dmigw.govcloud.dk + api.dmi.dk unreachable from here
- Météo-France — public API base unverified (404)
- Tado / Hue / VIA Rail / Indian Railways / DSB — unofficial, pairing-gated, or no public API
- Counter.dev, Bucket.co — API hosts dead
- Maze.co, WIPO, Papers Past — API shapes unverifiable
- Rumble, Contra, Zumper, Remote.com (ambiguous squat) — no usable API or unclear ownership
- Shynet, Rybbit, Ackee — self-hosted API schemas need instance docs to verify
- Daikin, Viessmann, NIBE — vendor hosts unreachable from here, retry later
- Marvel API — RETIRED by Marvel, unusable
- JPL Horizons — ssd.jpl.nasa.gov unreachable from here (5 attempts; other .gov works, so likely bot-filtering)
- Copernicus (marine/climate) — guessed paths 404, needs account + docs
- Auckland Transport — api.at.govt.nz routes unverifiable from here (portal docs are JS-driven, no swagger found)

## To research (untouched territory)

Covered by the Build backlog below — this section retired 2026-09-23.

## Build backlog (fresh leads, free APIs known — verify then build)

Auth = free key unless noted keyless. Verify registry+npm+web before building.

**Verified missing on registry (local also missing) — prime build queue:**
- Secrets/flags: Delinea, CyberArk, Split.io, Harness.io, Bucket.co
- Analytics: GoatCounter, Ackee, Shynet, OpenPanel, Rybbit, Fathom Analytics, Counter.dev, Swetrix
- Uptime: OhDear, StatusCake, Pingdom
- Hosting/dev: Render.com, Railway.com, Fly.io, Vercel, Netlify, Linode, Vultr, Coveralls, DeepSource, Jenkins CI, Drone CI, Harness.io (OFFICIAL harness/mcp-server, skip), Maze.co, DPLA, edX
- Jobs/HR: HiBob, Deel, Remote.com, Oyster, Zumper, Personio HR API, Contra
- Legal: CaseLaw Access Project (cap.law)
- Social/video: Rumble, Odysee, DeviantArt
- Registries/IoT: Maven Central, crates.io, CRAN, Daikin, Viessmann, NIBE, Nanoleaf
- Patents: WIPO PATENTSCOPE
- Oceans: OBIS
- Outdoors: Trailforks
- Culture: Gallica BnF, Papers Past NZ, Coursera, BBC (Nitro keys staff/partners only, skip), NPR (Story API retired; CDS gated to members, skip), Radiotopia (PRX network — covered by prx-mcp, no separate API)
- Programs (genres 1-12 sweep): Quip (built), Simplecast (built), Gab (Cloudflare-walled, drop), Dreamwidth (host dead, drop), plus unverified backlog below

**Still to verify (registry not yet probed):**
- Docs/notes: Guru (built), HedgeDoc (taken 3x, skip), RemNote (backend REST disabled, plugin SDK only, skip), SuperNotes (built), Craft (OFFICIAL MCP mcp.craft.do + community craft-mcp, skip), CommaFeed (built)
- Podcast: Podbean (taken), Libsyn (no public podcast API — status-page API + cookie-scrape only, skip), Blubrry (built), Spreaker (built), RedCircle (api base 404, skip), RSS.com (Express 404 on guessed paths, skip), Acast (host blocked 000, skip), Restream (OFFICIAL MCP at developers.restream.io/mcp-server, skip), Zencastr (no public API, skip), BBC, Radiotopia, PRX (built)
- Photo: Zenfolio (SOAP .asmx API only, skip), Pixieset (unofficial only, skip), ShootProof (built), PicTime (no public API — Zapier/partners only, skip)
- 3D: TurboSquid (built — Token header required on all calls), CGTrader (built), Godot assets (built, scoped @mrfentmen — plain name taken), PlayCanvas (built), Verge3D (JS engine API only, no REST, skip), Vectary (embed postMessage API only, no REST, skip)
- EDA: OSH Park (API access by support request only, skip), Aisler (Part API key on request via form, no public docs, skip), SnapEDA/SnapMagic (API on request via form, no public docs, skip), Ultra Librarian (enterprise CAD-vendor integrations only, no public API, skip), SamacSys/CSE (subscription API + community pcbparts-mcp, skip)
- Self-hosted docs: Docspell (built), Teedy (built), FileRun (built), ownCloud (built), Seafile (built), Pydio (built), Resilio (Connect API enterprise-licensed, Sync no API, skip), Kopia (built)
- NYC/monetization research (2026-09-24): Socrata TAKEN (cyanheads 6-tool + pipeworx cityofnewyork pack + our nyc311-mcp) — skip; NYT contested (jeffmm, pipeworx, cooking — all ~1 star) — low priority; KITH/Stadium/Glossier/ALD WIDE OPEN (no npm/registry/GitHub hits, Shopify JSON live) — BUILD; MoMA open but API key-gated/unclear (/collection errors, home page exists) — secondary; B&H no self-serve API (affiliate-gated; scraper actors exist) — skip; Adorama/TodayTix/Warby no public API found — skip.
- Marketplace validity fix (2026-09-24): all 70 published packages republished locally w/ repository.url=awesome-servers.git (npm metadata fixed; 68 OK 0 FAIL). Remaining: listing GitHub URLs must be published snapshot tree paths + EXACT npm names (scoped where scoped: @mrfentmen/ashby, beehiiv, coinbase, etsy, greenhouse, helius, job-search, loops, mixpanel, pinterest, steam, wise, yfinance, youtrack, alphavantage + twilio-mcp-server) then rescan. CI on published snapshot is scheduler-blocked (even hello-world fails; billing/quota?) — publishing done locally via ~/.npmrc. Mapping: /tmp/listing-map.csv (regenerate if needed).
- Research: Mendeley (taken), SciFlow (enterprise, skip), Curvenote (CLI only, skip), PubPub (SDK only, skip)
- Scheduling: Amie (OFFICIAL MCP, skip), Ellie (first-party MCP beta, skip), Sunsama (no official API, unofficial wrappers only, skip), SavvyCal (built)
- Design/social: Penpot (paths uncertain, skip), Canva (official, skip), VK (taken 2x, skip), Minds (no official public API — session/XSRF only, skip), Framer (dead host, skip)
- CAD remainder (SketchUp, Rhino, Tekla, VectorWorks, BricsCAD, DraftSight, Shapr3D): desktop programs, no public cloud APIs — skip batch

**Still to verify (registry not yet probed):**
- Health/edu: CDC WONDER, NCES, GreatSchools, ISBNdb, Literal
- Patents: J-PlatPat, KIPRIS, IP Australia, CIPO, EUIPO, Lens.org
- Standards: ETSI, W3C, OGC, FIDO, OpenID, FHIR servers
- Oceans: PSMSL, IOOS, Argo, GEBCO, EMODnet, Observation.org, Movebank, Motus
- Outdoors: Hiking Project, Outdooractive, ABRP, Tronity, evcc
- Space data: Earthdata CMR, NSIDC, GHCN, MesoWest
- Auto: Carfax (no), Copart (member), IAAI, BringATrailer (no API), Classic.com
- Classifieds: Craigslist RSS, OLX (no), Mercari (no), Poshmark (no), Depop (no), Vinted (no), ThredUp (no)
- Logistics: Global Fishing Watch, SeaRates, project44, FourKites
- Universities: QS, THE, ARWU, Study.eu
- Lotteries: Powerball, Mega Millions, EuroMillions, UK Lotto
- Social: YouTube (key), TikTok (approval), 500px, Dribbble, BeReal, Nextdoor, Viber, Line, Kakao, ArtStation (no API), Behance (no API)
- Music: Apple Music, Tidal, Qobuz, Napster, Pandora, SiriusXM, Libby, Hoopla, Kanopy
- Smart home: Tapo/Kasa/Wyze/Eufy/Ring (unofficial), Resideo, LG ThinQ (unofficial)
- Salaries/others: Levels.fyi (no API), Glassdoor (partner-only), PayScale (no API), Zoopla (member), Idealista (paid), Justia (no API), Toptal (no API)
- Transit: VIA Rail, Indian Railways (no public API found yet — recheck)

## Monetization playbook (2026-09-24, $0 budget)
- SELL WHERE: mcp-marketplace.io = only true marketplace (15% commission, keep 85%, Stripe Connect payouts, ~24h approval, free+paid tiers). Smithery = free listing + free 50K RPC hosting, NO revenue share (bring own billing; MCP Hive offers per-response metering). Free directories: official registry (done via CI, crawled by mcp.directory/Glama/PulseMCP), mcpservers.org (free form), mcp.so (free w/ review), LobeHub (free CLI but aggressive GitHub OAuth — caution), Awesome MCP Servers PR. Glama skipped (costs). PulseMCP paused.
- EARN HOW: (1) marketplace paid tiers via Stripe (free account + payment links), (2) affiliate tags on shopping-server product URLs, (3) DEV article per server (free distribution; proven pattern: npm -> Smithery -> Stripe -> article).
- A2A: no central marketplace found (agent cards + awesome lists only) — sell via same direct channels.
- ACP = two protocols: Zed Agent Client Protocol (registry via GitHub PR, free, curated, auth required) vs IBM BeeAI ACP (self-hosted /agents + BeeAI Platform). Confirm which before listing.
- NEXT BUILDS (demand cats): jobs wave (Greenhouse/Lever/Ashby/SmartRecruiters public keyless ATS APIs), sports odds (The Odds API free NBA+MLB / BetStack free-forever), MoMA (gated, secondary), more Shopify streetwear (Supreme/Flight Club/Ben Baller unchecked).
- Wave-2 money move (2026-09-24): 34 more to published snapshot (crypto/data, dev SaaS, monitoring, analytics, validation, books, business SaaS, security, podcast hosting). Public 727 -> 693, premium 70 -> 104. All republished w/ premium repo URLs (34 OK 0 FAIL).

## Wave 187 - 52 keyless servers built 2026-10-27

Each server below was checked before the build: its npm name (plain and `@mrfentmen/`) was
free on the registry, the upstream source answered a live keyless request during the smoke
run, and both the official MCP registry and this repo's own `published/` tree were searched
for the same domain first.

- research and life sciences: `orcid-mcp`, `openaire-mcp`, `kegg-mcp`, `ncbi-taxonomy-mcp`,
  `geo-mcp` (NCBI GEO), `proteins-mcp` (EBI Proteins), `pride-mcp`, `biostudies-mcp`,
  `obis-mcp` (OBIS marine), `worms-mcp`, `hpo-mcp`, `ols-mcp`, `quickgo-mcp`, `icd10-mcp`,
  `cwe-mcp`, `epss-mcp`, `inspire-hep-mcp`
- money and state: `fiscaldata-mcp` (US Treasury), `cftc-mcp`, `ecb-mcp`, `unstats-mcp`,
  `brreg-mcp` (Norway), `mfapi-mcp` (AMFI NAVs), `ourairports-mcp`, `usno-mcp`
- live feeds: `adsb-mcp` (adsb.lol), `adsbdb-mcp`, `metar-mcp` (NOAA Aviation Weather),
  `chronam-mcp` (Library of Congress), `epa-echo-mcp` (EPA ECHO plus Envirofacts),
  `raiderio-mcp`
- local compute, no network: `ip-subnet-mcp`, `ulid-mcp`, `isbn-mcp`, `morse-mcp`,
  `truth-table-mcp`, `graph-algorithms-mcp`, `matrix-mcp`, `statistics-mcp`,
  `finance-calc-mcp`, `date-math-mcp`, `toml-mcp`, `jsonpath-mcp`, `useragent-mcp`,
  `maze-mcp`, `poker-mcp`, `nonogram-mcp`, `game-of-life-mcp`, `colorblind-mcp`,
  `locale-format-mcp`

Also completed in the same session: `punycode-mcp` (ACE/Unicode conversion, checked by
round-tripping real internationalised domains) and `color-contrast-mcp` (contrast
suggestions search for the smallest change that reaches the target ratio). Both were
smoke-run before publication and are in the snapshot with the wave.

`toml-mcp` carries the only hand-written parser in the wave. Its reader and writer were
checked against Python's `tomllib` on 33 documents - 11 parse cases, 4 emitter round-trips,
10 edge cases and 8 rejection cases - and agree on every one.

Overlap worth knowing: `aviation-weather-mcp` already sat in the snapshot with two stub
tools; `metar-mcp` implements the same NOAA Aviation Weather data for real. The stub
package was left untouched.

## Wave 188 - 50 keyless servers built 2026-10-27

Each server wraps a live public source or a small local computation. Every tool was
smoke-run before publication: the upstream answered a live keyless request during the run
(or the local input was exercised end to end), and both the official MCP registry and this
repo's own `published/` tree were searched for the same domain first.

- research and life sciences: `chembl-mcp` (bioactivity), `clinvar-mcp` (variant
  interpretations), `dailymed-mcp` (FDA drug labels), `ensembl-mcp` (genomes),
  `interpro-mcp` (protein families), `mygene-mcp` (gene annotations), `ncbi-gene-mcp`
  (NCBI Gene), `pubchem-compound-mcp` (compounds), `string-db-mcp` (interaction
  networks), `npi-registry-mcp` (CMS providers), `haveibeenpwned-mcp` (breach catalogue)
- money and state: `bls-mcp` (US labor statistics), `sec-edgar-mcp` (filings and XBRL),
  `eurostat-mcp` (EU statistics), `fdic-mcp` (US banks), `uk-parliament-mcp` (members and
  bills), `unhcr-mcp` (displacement statistics)
- earth, weather and space: `carbon-intensity-mcp` (UK grid), `drought-mcp` (US Drought
  Monitor), `nasa-power-mcp` (climate series), `nasa-neo-mcp` (near-Earth asteroids),
  `ndbc-mcp` (ocean buoys), `snotel-mcp` (snowpack), `volcano-mcp` (Smithsonian GVP),
  `nominatim-mcp` (OSM geocoding), `zippopotam-mcp` (postal codes)
- fun and culture: `bible-api-mcp`, `dadjoke-mcp`, `jokeapi-mcp`, `lorcana-mcp`,
  `open5e-mcp` (D&D 5e SRD), `openbeautyfacts-mcp`, `openligadb-mcp` (German football),
  `poetrydb-mcp`, `quran-mcp`, `randomuser-mcp`, `rickandmorty-mcp`, `scryfall-mcp` (MTG),
  `fruityvice-mcp`, `lichess-stats-mcp`, `blockchain-info-mcp`, `dictionary-mcp`
- local compute, no network: `cron-schedule-mcp`, `csv-tools-mcp`, `hash-mcp`, `jwt-mcp`,
  `numbers-mcp`, `semver-mcp`, `text-diff-mcp`, `uri-mcp`

`semver-mcp` re-implements range semantics for the wave; its parser was checked against a
corpus of `^`, `~`, hyphen and `||` ranges and the two edge cases it got wrong were fixed
before publication.

Overlap worth knowing: 23 of these slugs share their domain with an older, higher-versioned
package already in the snapshot (`bls-mcp`, `blockchain-info-mcp`, `carbon-intensity-mcp`,
`chembl-mcp`, `clinvar-mcp`, `dadjoke-mcp`, `dailymed-mcp`, `dictionary-mcp`, `ensembl-mcp`,
`eurostat-mcp`, `fdic-mcp`, `fruityvice-mcp`, `interpro-mcp`, `jokeapi-mcp`, `mygene-mcp`,
`nasa-power-mcp`, `nominatim-mcp`, `open5e-mcp`, `quran-mcp`, `randomuser-mcp`, `scryfall-mcp`,
`semver-mcp`, `string-db-mcp`). Sixteen of those older packages still answer a tool with
`Not yet implemented`; the campaign to implement them in place is separate, so those
packages were left untouched here.
