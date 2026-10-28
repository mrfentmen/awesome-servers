# Published snapshot

This directory is the code users install. `scripts/mirror-registry.py`
downloads every MCP package the account publishes on npm and keeps the
highest version per slug, so this tree matches the registry rather than
older local work. `servers/` holds the hand-written source and is not what
ships.

Regenerate this summary with `python3 scripts/index-published.py`. Re-run
`mirror-registry.py` only when every local fix has been published — it
overwrites `dist/` from the registry tarballs.

- packages: **1114**
- scoped under `@mrfentmen`: **366**
- total size: **19.6 MB**
- carrying a licence gate (`MCP_LICENSE_KEY`): **17**
- carrying tools that answer `Not yet implemented` in the shipped `dist/`: **392**
- whose `src/` still holds the pre-fix source (not shipped, cannot rebuild `dist/`): **35**

| package | version | src? | gate | stubs |
| --- | --- | --- | --- | --- |
| `7timer-mcp` | 1.0.5 | no |  |  |
| `8bitpeoples-mcp` | 1.0.1 | yes |  |  |
| `abuseipdb-mcp` | 1.1.0 | no |  |  |
| `ackee-mcp` | 1.0.6 | no |  |  |
| `adguardhome-mcp` | 1.0.9 | no |  |  |
| `adobe-premiere-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/adsb-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/adsbdb-mcp` | 1.0.1 | yes |  |  |
| `advice-mcp` | 1.0.6 | no |  | 2 |
| `affirmations-mcp` | 1.0.5 | no |  | 2 |
| `agify-mcp` | 1.0.6 | no |  | 2 |
| `ai-tomogotchi-mcp` | 1.0.1 | yes |  |  |
| `aimeleondore-mcp` | 1.0.8 | no |  |  |
| `@mrfentmen/air-quality-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/airtable-mcp` | 1.1.3 | no |  |  |
| `albiononline-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/algorand-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/alpaca-mcp` | 1.1.3 | no |  |  |
| `alphafold-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/alphavantage-mcp` | 1.0.8 | no |  |  |
| `amadeus-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/amtrak-mcp` | 1.0.0 | yes |  |  |
| `anagram-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/anilist-mcp` | 1.1.0 | no |  |  |
| `anime-filler-mcp` | 1.0.1 | yes |  |  |
| `ansible-galaxy-mcp` | 1.0.6 | no |  |  |
| `apexlegends-mcp` | 1.0.3 | no |  |  |
| `api-deprecation-radar-mcp` | 1.0.1 | yes |  |  |
| `apis-guru-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/apollo-mcp` | 1.1.3 | no |  |  |
| `apple-media-search-mcp` | 1.0.1 | yes |  |  |
| `appveyor-mcp` | 1.0.8 | no |  |  |
| `appwrite-mcp` | 1.0.6 | no |  |  |
| `arbeitnow-mcp` | 1.1.1 | no |  |  |
| `archive-org-mcp` | 1.0.1 | yes |  |  |
| `archlinux-mcp` | 1.0.5 | no |  | 2 |
| `art-institute-mcp` | 1.0.6 | yes |  |  |
| `@mrfentmen/artic-mcp` | 1.0.0 | yes |  |  |
| `artifact-gauge-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/artifact-hub-mcp` | 1.0.6 | no |  |  |
| `arweave-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/arxiv-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/ashby-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/assemblyai-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/astronomy-mcp` | 1.0.1 | yes |  |  |
| `audius-mcp` | 1.0.1 | yes |  |  |
| `aur-mcp` | 1.0.5 | no |  | 2 |
| `avatar-mcp` | 1.0.5 | no |  | 2 |
| `avianne-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/aviation-weather-mcp` | 1.0.6 | no |  | 2 |
| `@mrfentmen/aviationweather-mcp` | 1.0.0 | yes |  |  |
| `baconipsum-mcp` | 1.0.6 | no |  |  |
| `balenciaga-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/bandcamp-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/bankofcanada-mcp` | 1.0.5 | no |  |  |
| `barcode-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/bart-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/base58-mcp` | 1.0.1 | yes |  |  |
| `baserow-mcp` | 1.0.6 | no |  |  |
| `baywheels-mcp` | 1.0.5 | no |  | 2 |
| `beaconchain-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/beehiiv-mcp` | 1.0.7 | no |  |  |
| `beis-mcp` | 1.1.3 | no |  |  |
| `berlin-bvg-mcp` | 1.0.5 | no |  | 2 |
| `betterstack-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/bible-api-mcp` | 1.0.1 | yes |  |  |
| `bible-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bigcommerce-mcp` | 1.0.8 | no |  |  |
| `bigdatacloud-mcp` | 1.0.5 | no |  | 2 |
| `bikeindex-mcp` | 1.0.5 | no |  | 2 |
| `binance-market-mcp` | 1.1.1 | no |  |  |
| `bing-wallpaper-mcp` | 1.0.6 | no |  |  |
| `biorxiv-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/biostudies-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/bitbucket-mcp` | 1.0.5 | no |  | 3 |
| `bitcoiner-mcp` | 1.0.5 | no |  | 2 |
| `bitfinex-mcp` | 1.0.5 | no |  | 2 |
| `bitflyer-mcp` | 1.0.5 | no |  | 2 |
| `bitget-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bithumb-mcp` | 1.0.5 | no |  | 2 |
| `bitso-mcp` | 1.0.5 | no |  | 2 |
| `bitstamp-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bitwarden-mcp` | 1.0.7 | no |  |  |
| `bkk-mcp` | 1.0.3 | no |  |  |
| `blizzard-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/blockchain-info-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/blockchain-mcp` | 1.0.5 | no |  | 2 |
| `blockchair-mcp` | 1.0.5 | no |  | 2 |
| `blockcypher-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bls-mcp` | 1.0.1 | yes |  |  |
| `blubrry-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/bluesky-mcp` | 1.0.5 | no |  | 2 |
| `bmkg-mcp` | 1.0.6 | no |  | 2 |
| `boardgamegeek-mcp` | 1.1.0 | no |  |  |
| `bom-mcp` | 1.0.5 | no |  | 3 |
| `books-mcp` | 1.0.4 | no |  | 2 |
| `bored-mcp` | 1.0.5 | no |  | 2 |
| `bottegaveneta-mcp` | 1.1.1 | no |  |  |
| `brainrot-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/brave-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/brawl-stars-mcp` | 1.0.5 | no |  | 2 |
| `brevo-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/brewery-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/bridges-mcp` | 1.0.0 | yes |  |  |
| `brightsky-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/browser-mcp` | 1.0.7 | yes | 3 |  |
| `@mrfentmen/brreg-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/btc-address-mcp` | 1.0.1 | yes |  |  |
| `build-cache-mcp` | 1.0.1 | yes |  |  |
| `bulbapedia-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/bundlephobia-mcp` | 1.0.5 | no |  | 2 |
| `burberry-mcp` | 1.1.1 | no |  |  |
| `calcom-mcp` | 1.1.4 | no |  |  |
| `car-recalls-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/carbon-intensity-mcp` | 1.0.1 | yes |  |  |
| `cartesia-mcp` | 1.0.7 | no |  |  |
| `cartier-mcp` | 1.1.1 | no |  |  |
| `cat-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/catfact-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/cbioportal-mcp` | 1.0.1 | yes |  |  |
| `cbr-mcp` | 1.0.5 | no |  | 2 |
| `cdc-data-mcp` | 1.0.5 | no |  | 2 |
| `cdnjs-mcp` | 1.0.3 | yes | 3 |  |
| `@mrfentmen/celestrak-mcp` | 1.0.0 | yes |  |  |
| `census-geo-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/census-geocode-mcp` | 1.0.1 | yes |  |  |
| `census-mcp` | 1.1.0 | no |  |  |
| `censys-mcp` | 1.0.7 | no |  |  |
| `cern-mcp` | 1.0.6 | no |  |  |
| `certspotter-mcp` | 1.0.5 | no |  | 2 |
| `cex-mcp` | 1.0.5 | no |  | 2 |
| `cfpb-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/cftc-mcp` | 1.0.2 | yes |  |  |
| `cgtrader-mcp` | 1.1.2 | no |  |  |
| `chanel-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/cheapshark-mcp` | 1.0.0 | yes |  |  |
| `checkly-mcp` | 1.0.5 | no |  |  |
| `checksum-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/chembl-mcp` | 1.0.1 | yes |  |  |
| `chess-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/chesscom-mcp` | 1.0.5 | no |  | 2 |
| `chmi-mcp` | 1.0.5 | no |  | 3 |
| `chocolatey-mcp` | 1.0.5 | no |  | 2 |
| `chord-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/chronam-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/chuck-norris-mcp` | 1.0.5 | no |  | 2 |
| `cisa-kev-mcp` | 1.0.1 | yes |  |  |
| `citi-bike-mcp` | 1.0.5 | no |  | 2 |
| `citybikes-mcp` | 1.0.5 | no |  | 2 |
| `civitai-mcp` | 1.0.6 | no |  |  |
| `clerk-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/cleveland-art-mcp` | 1.0.1 | yes |  |  |
| `clevelandart-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/clinical-codes-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/clinical-trials-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/clinical-trials-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/clinvar-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/cloudflare-mcp` | 1.1.4 | no |  |  |
| `cocktaildb-mcp` | 1.1.2 | no |  |  |
| `cocktails-mcp` | 1.0.5 | no |  | 2 |
| `codeberg-mcp` | 1.0.5 | no |  | 3 |
| `codeforces-mcp` | 1.0.5 | no |  | 2 |
| `codepet-mcp` | 1.0.1 | yes |  |  |
| `codewars-mcp` | 1.0.4 | no |  | 2 |
| `coffee-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/coinbase-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/coingecko-mcp` | 1.1.2 | yes |  |  |
| `coinlore-mcp` | 1.1.1 | no |  |  |
| `coinmetrics-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/coinpaprika-mcp` | 1.1.0 | no |  |  |
| `college-scorecard-mcp` | 1.1.0 | no |  |  |
| `collegefootballdata-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/color-contrast-mcp` | 1.0.1 | yes |  |  |
| `color-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/colorblind-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/combinatorics-mcp` | 1.0.1 | yes |  |  |
| `commafeed-mcp` | 1.0.3 | no |  |  |
| `commoncrawl-mcp` | 1.0.1 | yes |  |  |
| `config-weather-mcp` | 1.0.1 | yes |  |  |
| `confluent-mcp` | 1.0.7 | no |  |  |
| `congress-gov-mcp` | 1.1.0 | no |  |  |
| `container-registry-mcp` | 1.0.1 | no |  |  |
| `contract-diff-mcp` | 1.0.1 | yes |  |  |
| `convertkit-mcp` | 1.0.8 | no |  |  |
| `@mrfentmen/core-mcp` | 1.0.4 | no |  | 2 |
| `countriesnow-mcp` | 1.0.6 | yes |  |  |
| `countryflags-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/court-records-mcp` | 1.1.0 | no |  |  |
| `courtlistener-mcp` | 1.1.0 | no |  |  |
| `coverartarchive-mcp` | 1.0.5 | no |  | 2 |
| `covid-data-mcp` | 1.0.6 | no |  | 2 |
| `crates-io-mcp` | 1.0.8 | yes |  |  |
| `@mrfentmen/crc-mcp` | 1.0.1 | yes |  |  |
| `cricapi-mcp` | 1.0.6 | no |  | 1 |
| `@mrfentmen/crisp-mcp` | 1.1.8 | no |  |  |
| `@mrfentmen/cron-mcp` | 1.0.7 | no |  | 2 |
| `@mrfentmen/cron-schedule-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/crossref-mcp` | 1.0.1 | yes |  |  |
| `crypto-com-mcp` | 1.0.5 | no |  | 2 |
| `crypto-tools-mcp` | 1.0.7 | no |  | 2 |
| `cryptorank-mcp` | 1.0.9 | no |  |  |
| `@mrfentmen/csv-mcp` | 1.0.6 | no |  | 2 |
| `@mrfentmen/csv-tools-mcp` | 1.0.1 | yes |  |  |
| `ctan-mcp` | 1.0.5 | no |  | 2 |
| `customerio-mcp` | 1.1.4 | no |  |  |
| `@mrfentmen/cwe-mcp` | 1.0.1 | yes |  |  |
| `cyberark-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/dadjoke-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/dailymed-mcp` | 1.0.1 | yes |  |  |
| `dailymotion-mcp` | 1.0.5 | no |  | 2 |
| `data-gouv-mcp` | 1.0.5 | no |  | 2 |
| `data-gov-uk-mcp` | 1.0.6 | no |  |  |
| `datacite-mcp` | 1.0.5 | no |  | 2 |
| `datahub-countries-mcp` | 1.0.5 | no |  | 2 |
| `datamuse-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/date-math-mcp` | 1.0.1 | yes |  |  |
| `db-ip-mcp` | 1.0.6 | no |  |  |
| `dblp-mcp` | 1.0.4 | no |  |  |
| `deck-of-cards-mcp` | 1.0.6 | no |  |  |
| `deepgram-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/deezer-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/defillama-mcp` | 1.1.2 | yes |  |  |
| `delinea-mcp` | 1.0.3 | no |  |  |
| `demozoo-mcp` | 1.0.5 | no |  | 2 |
| `dependency-drift-mcp` | 1.0.1 | yes |  |  |
| `dependency-license-change-mcp` | 1.0.1 | yes |  |  |
| `deps-dev-mcp` | 1.0.6 | no |  |  |
| `deribit-mcp` | 1.1.1 | no |  |  |
| `destiny2-mcp` | 1.0.3 | no |  |  |
| `deviantart-mcp` | 1.0.3 | no |  |  |
| `devrant-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/devto-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/dexscreener-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/dictionary-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/diff-mcp` | 1.0.5 | no |  |  |
| `digimon-mcp` | 1.0.6 | no |  |  |
| `digitalnz-mcp` | 1.0.5 | no |  | 2 |
| `dior-mcp` | 1.1.1 | no |  |  |
| `directus-mcp` | 1.0.7 | no |  |  |
| `@mrfentmen/discogs-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/discord-mcp` | 1.1.0 | no |  |  |
| `disify-mcp` | 1.1.1 | no |  |  |
| `disney-mcp` | 1.0.5 | no |  | 2 |
| `dnd5e-mcp` | 1.0.1 | yes |  |  |
| `dns-lookup-mcp` | 1.0.3 | yes | 3 |  |
| `@mrfentmen/dns-mcp` | 1.0.1 | yes |  |  |
| `dnstwister-mcp` | 1.0.5 | no |  | 2 |
| `doab-mcp` | 1.0.6 | no |  | 3 |
| `doaj-mcp` | 1.0.5 | no |  | 2 |
| `docker-hub-mcp` | 1.0.5 | no |  | 2 |
| `container-registry-mcp` | 1.0.2 | yes |  |  |
| `docraptor-mcp` | 1.0.0 | yes |  |  |
| `docspell-mcp` | 1.0.3 | no |  |  |
| `documenso-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/document-generator-mcp` | 1.0.6 | no |  | 1 |
| `dog-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/dogceo-mcp` | 1.0.1 | yes |  |  |
| `doh-mcp` | 1.1.1 | no |  |  |
| `doomwiki-mcp` | 1.0.1 | yes |  |  |
| `doppler-mcp` | 1.0.7 | no |  |  |
| `dpla-mcp` | 1.1.0 | no |  |  |
| `dragonball-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/drinking-water-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/drought-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/drug-shortages-mcp` | 1.0.0 | yes |  |  |
| `duck-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/duckduckgo-mcp` | 1.0.4 | no |  | 2 |
| `dummyjson-mcp` | 1.0.4 | no |  | 2 |
| `duolingo-mcp` | 1.0.4 | no |  | 2 |
| `dwarffortress-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/ebay-mcp` | 1.1.4 | no |  |  |
| `ebi-search-mcp` | 1.0.4 | no |  | 1 |
| `@mrfentmen/ecb-mcp` | 1.0.1 | yes |  |  |
| `eccc-mcp` | 1.0.4 | no |  | 3 |
| `ecobee-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/edgar-mcp` | 1.0.3 | no |  | 2 |
| `electricitymap-mcp` | 1.0.5 | no |  |  |
| `email-validator-mcp` | 1.2.1 | no |  |  |
| `emby-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/emdb-mcp` | 1.0.1 | yes |  |  |
| `emoji-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/endian-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/endoflife-mcp` | 1.0.4 | no |  | 2 |
| `energinet-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/energy-charts-mcp` | 1.0.0 | yes |  |  |
| `enrico-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/ensembl-mcp` | 1.0.1 | yes |  |  |
| `ensideas-mcp` | 1.0.4 | no |  | 1 |
| `entur-mcp` | 1.0.3 | no |  | 3 |
| `env-contract-mcp` | 1.0.1 | yes |  |  |
| `envirocar-mcp` | 1.0.4 | no |  | 2 |
| `eol-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/epa-echo-mcp` | 1.0.2 | yes |  |  |
| `epa-frs-mcp` | 1.0.4 | no |  | 1 |
| `epic-free-games-mcp` | 1.0.5 | no |  |  |
| `episodate-mcp` | 1.0.4 | no |  | 2 |
| `epo-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/epss-mcp` | 1.0.1 | yes |  |  |
| `er-api-mcp` | 1.0.5 | yes |  |  |
| `ericemanuel-mcp` | 1.1.3 | no |  |  |
| `esm-mcp` | 1.0.4 | no |  | 2 |
| `esplora-mcp` | 1.0.5 | no |  |  |
| `espn-core-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/etherscan-mcp` | 1.1.4 | no |  |  |
| `ethplorer-mcp` | 1.1.1 | no |  |  |
| `@mrfentmen/etsy-mcp` | 1.0.6 | no |  |  |
| `europepmc-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/eurostat-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/eveonline-mcp` | 1.0.3 | no |  | 2 |
| `evidence-diff-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/excel-mcp` | 1.0.5 | no |  | 2 |
| `exoplanet-mcp` | 1.0.1 | yes |  |  |
| `exoplanets-mcp` | 1.0.4 | no |  | 2 |
| `f-droid-mcp` | 1.0.4 | no |  | 1 |
| `@mrfentmen/f1-mcp` | 1.0.1 | yes |  |  |
| `faceit-mcp` | 1.0.2 | no |  |  |
| `fakestoreapi-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/fauna-mcp` | 1.0.5 | no |  | 1 |
| `fbi-crime-mcp` | 1.0.5 | no |  |  |
| `fbi-wanted-mcp` | 1.0.3 | no |  | 1 |
| `fcc-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/fda-510k-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/fdic-mcp` | 1.0.3 | yes |  |  |
| `fear-greed-mcp` | 1.0.3 | no |  | 2 |
| `fec-mcp` | 1.1.0 | no |  |  |
| `federal-register-mcp` | 1.0.1 | yes |  |  |
| `feedly-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/fema-disasters-mcp` | 1.0.0 | yes |  |  |
| `fema-mcp` | 1.0.3 | no |  | 1 |
| `fendi-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/figma-mcp` | 1.1.6 | no |  |  |
| `figshare-mcp` | 1.0.2 | no |  | 1 |
| `filerun-mcp` | 1.0.1 | no |  |  |
| `finalspace-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/finance-calc-mcp` | 1.0.1 | yes |  |  |
| `financial-data-mcp` | 1.0.3 | no |  | 3 |
| `fingrid-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/finnhub-mcp` | 1.0.1 | no |  |  |
| `firefox-addons-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/fiscaldata-mcp` | 1.0.1 | yes |  |  |
| `flaky-history-mcp` | 1.0.1 | yes |  |  |
| `flathub-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/flickr-mcp` | 1.0.2 | no |  | 1 |
| `flipside-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/float-mcp` | 1.0.1 | yes |  |  |
| `flood-mcp` | 1.0.2 | no |  | 2 |
| `fmp-mcp` | 1.1.2 | no |  |  |
| `folk-mcp` | 1.0.6 | no |  |  |
| `fontsource-mcp` | 1.0.2 | yes | 3 |  |
| `@mrfentmen/footballdata-mcp` | 1.0.1 | no |  |  |
| `formbricks-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/fortnite-mcp` | 1.0.3 | no |  | 2 |
| `fourchan-mcp` | 1.0.1 | yes |  |  |
| `fox-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/frankfurter-mcp` | 1.0.1 | yes |  |  |
| `fred-mcp` | 1.1.0 | no |  |  |
| `freegeoip-mcp` | 1.0.2 | no |  | 2 |
| `freeipapi-mcp` | 1.0.2 | no |  | 2 |
| `freetogame-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/freshdesk-mcp` | 1.1.7 | no |  |  |
| `frigate-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/fruityvice-mcp` | 1.0.2 | yes |  |  |
| `fuel-economy-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/fueleconomy-mcp` | 1.0.5 | no |  |  |
| `futurama-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/game-of-life-mcp` | 1.0.1 | yes |  |  |
| `gamebanana-mcp` | 1.0.1 | yes |  |  |
| `gateio-mcp` | 1.0.2 | no |  | 2 |
| `gatus-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/gbfs-mcp` | 1.0.0 | yes |  |  |
| `gbif-mcp` | 1.0.1 | yes |  |  |
| `gdacs-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/gdc-mcp` | 1.0.1 | yes |  |  |
| `gdelt-mcp` | 1.0.3 | no |  | 3 |
| `geckoterminal-mcp` | 1.0.8 | no |  |  |
| `@mrfentmen/gemini-mcp` | 1.0.2 | no |  | 2 |
| `genderize-mcp` | 1.0.2 | no |  | 1 |
| `genius-mcp` | 1.1.0 | no |  |  |
| `genrenator-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/geo-mcp` | 1.0.1 | yes |  |  |
| `geojs-mcp` | 1.0.2 | no |  | 1 |
| `geolocation-db-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/ghcn-mcp` | 1.0.1 | yes |  |  |
| `ghibli-mcp` | 1.0.2 | no |  | 2 |
| `gimp-mcp` | 1.0.2 | yes |  |  |
| `git-reflog-archaeologist-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/gitea-mcp` | 1.0.3 | no |  | 2 |
| `github-intel-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/github-mcp` | 1.1.6 | no |  |  |
| `github-status-mcp` | 1.1.0 | no |  |  |
| `gitignore-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/gitlab-mcp` | 1.2.2 | no |  |  |
| `@mrfentmen/gleif-mcp` | 1.0.0 | yes |  |  |
| `glossier-mcp` | 1.0.6 | no |  |  |
| `go-proxy-mcp` | 1.0.5 | yes |  | 2 |
| `goatcounter-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/godot-mcp` | 1.0.2 | no |  | 2 |
| `gog-mcp` | 1.0.6 | no |  |  |
| `gold-prices-mcp` | 1.0.6 | yes |  |  |
| `google-autocomplete-mcp` | 1.0.2 | no |  | 2 |
| `google-books-mcp` | 1.1.3 | no |  |  |
| `google-fonts-mcp` | 1.0.6 | no |  |  |
| `googlenews-mcp` | 1.0.2 | no |  | 2 |
| `gopher-mcp` | 1.0.1 | yes |  |  |
| `gorjana-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/got-mcp` | 1.0.4 | no |  | 2 |
| `gotify-mcp` | 1.0.6 | no |  |  |
| `govinfo-mcp` | 1.0.3 | no |  | 2 |
| `govtrack-mcp` | 1.0.2 | no |  | 2 |
| `gpodder-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/graph-algorithms-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/greenhouse-mcp` | 1.0.6 | no |  |  |
| `greynoise-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/grid-carbon-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/groq-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/guardian-mcp` | 1.0.3 | no |  | 2 |
| `gucci-mcp` | 1.0.6 | no |  |  |
| `guru-mcp` | 1.0.1 | no |  |  |
| `gutenberg-mcp` | 1.0.1 | yes |  |  |
| `gutendex-mcp` | 1.0.3 | yes |  | 1 |
| `gw2-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/hacker-news-mcp` | 1.0.1 | no |  | 2 |
| `@mrfentmen/hackernews-mcp` | 1.0.1 | yes |  |  |
| `hackertarget-mcp` | 1.1.3 | no |  |  |
| `harry-potter-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/hash-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/hashid-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/hashnode-mcp` | 1.1.6 | no |  |  |
| `hasura-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/haveibeenpwned-mcp` | 1.0.2 | yes |  |  |
| `hebcal-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/helius-mcp` | 1.0.7 | no |  |  |
| `hermes-mcp` | 1.0.6 | no |  |  |
| `hex-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/hexdump-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/hgnc-mcp` | 1.0.1 | yes |  |  |
| `hibp-mcp` | 1.1.5 | no |  |  |
| `hiddenpalace-mcp` | 1.0.1 | yes |  |  |
| `hikingproject-mcp` | 1.0.1 | no |  |  |
| `hipsum-mcp` | 1.0.2 | no |  | 2 |
| `hn-reddit-mcp` | 1.0.2 | no |  | 2 |
| `holidays-mcp` | 1.0.3 | yes |  | 1 |
| `homebrew-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/hpo-mcp` | 1.0.1 | yes |  |  |
| `html-meta-mcp` | 1.0.2 | yes | 3 |  |
| `@mrfentmen/html-to-markdown-mcp` | 1.0.4 | yes | 3 |  |
| `@mrfentmen/hts-tariff-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/http-check-mcp` | 1.0.1 | yes |  |  |
| `http-inspector-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/httpbin-mcp` | 1.0.2 | no |  | 3 |
| `htx-mcp` | 1.0.2 | no |  | 1 |
| `hubitat-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/hubspot-mcp` | 1.1.6 | no |  |  |
| `hudsonrock-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/huggingface-mcp` | 1.0.3 | no |  | 3 |
| `iana-tld-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/iban-mcp` | 1.0.1 | yes |  |  |
| `iban-validator-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/ical-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/icd10-mcp` | 1.0.1 | yes |  |  |
| `icebox-mcp` | 1.0.6 | no |  |  |
| `ics-generator-mcp` | 1.0.3 | no |  | 2 |
| `ietf-mcp` | 1.0.1 | yes |  |  |
| `ifandco-mcp` | 1.0.7 | no |  |  |
| `ifdb-mcp-server` | 1.0.0 | no |  |  |
| `@mrfentmen/image-tools-mcp` | 1.0.4 | yes | 3 |  |
| `imf-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/inaturalist-mcp` | 1.0.4 | no |  | 3 |
| `incident-timeline-mcp` | 1.0.1 | yes |  |  |
| `independent-reserve-mcp` | 1.0.2 | no |  | 3 |
| `infisical-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/ini-mcp` | 1.0.1 | yes |  |  |
| `inngest-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/inspire-hep-mcp` | 1.0.1 | yes |  |  |
| `inspirobot-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/interpro-mcp` | 1.0.2 | yes |  |  |
| `invoice-mcp` | 1.1.2 | no |  |  |
| `ip-geo-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/ip-subnet-mcp` | 1.0.1 | yes |  |  |
| `ipapi-mcp` | 1.0.2 | no |  | 2 |
| `ipdata-mcp` | 1.0.0 | yes |  |  |
| `ipify-mcp` | 1.0.2 | no |  | 1 |
| `ipinfo-mcp` | 1.0.2 | no |  | 1 |
| `ipma-mcp` | 1.0.2 | no |  | 2 |
| `ipwhois-mcp` | 1.0.2 | no |  | 1 |
| `irail-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/isbn-mcp` | 1.0.1 | yes |  |  |
| `isbndb-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/iss-mcp` | 1.1.3 | yes |  |  |
| `iss-tracker-mcp` | 1.0.1 | yes |  |  |
| `itis-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/itunes-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/itunes-search-api-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/itunes-search-mcp` | 1.0.0 | no |  |  |
| `jacquesmariemage-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/jellyfin-mcp` | 1.0.2 | no |  |  |
| `jetbrains-mcp` | 1.0.6 | no |  |  |
| `jikan-mcp` | 1.1.0 | no |  |  |
| `jisho-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/job-search-mcp` | 1.0.6 | no |  |  |
| `jobicy-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/jokeapi-mcp` | 1.0.2 | yes |  |  |
| `jokes-mcp` | 1.0.2 | no |  | 2 |
| `jolpica-mcp` | 1.1.3 | yes |  |  |
| `jpl-fireball-mcp` | 1.0.2 | no |  | 2 |
| `jpl-sbdb-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/jsdelivr-mcp` | 1.0.3 | yes | 3 |  |
| `json-schema-store-mcp` | 1.0.3 | no |  | 4 |
| `json-tools-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/jsonc-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/jsondiff-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/jsonpath-mcp` | 1.0.1 | yes |  |  |
| `jsonplaceholder-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/jsonschema-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/jwt-mcp` | 1.0.2 | yes |  |  |
| `jwt-tools-mcp` | 1.0.2 | no |  | 2 |
| `k6-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/kanye-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/kegg-mcp` | 1.0.1 | yes |  |  |
| `kith-mcp` | 1.0.5 | no |  |  |
| `kitsu-mcp` | 1.0.2 | no |  | 2 |
| `kiwi-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/klaviyo-mcp` | 1.1.6 | no |  |  |
| `kma-mcp` | 1.0.1 | no |  |  |
| `knmi-mcp` | 1.0.1 | no |  |  |
| `kong-mcp` | 1.0.5 | no |  |  |
| `kopia-mcp` | 1.0.1 | no |  |  |
| `kraken-mcp` | 1.0.6 | no |  |  |
| `kucoin-mcp` | 1.0.1 | no |  |  |
| `lago-mcp` | 1.0.5 | no |  |  |
| `languagetool-mcp` | 1.0.3 | no |  | 3 |
| `lastfm-mcp` | 1.0.5 | no |  |  |
| `launch-library-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/launchlibrary-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/leetcode-mcp` | 1.0.3 | no |  | 2 |
| `lemmy-mcp` | 1.0.4 | no |  | 4 |
| `lemonsqueezy-mcp` | 1.1.3 | no |  |  |
| `lever-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/library-of-congress-mcp` | 1.0.1 | yes |  |  |
| `librivox-mcp` | 1.0.6 | yes |  |  |
| `license-boundary-mcp` | 1.0.1 | yes |  |  |
| `lichess-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/lichess-stats-mcp` | 1.0.1 | yes |  |  |
| `lifx-mcp` | 1.0.3 | no |  | 1 |
| `ligo-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/linear-mcp` | 1.1.6 | no |  |  |
| `link-shortener-mcp` | 1.0.2 | no |  | 2 |
| `liquipedia-mcp` | 1.0.2 | no |  | 2 |
| `listenbrainz-mcp` | 1.0.2 | no |  | 2 |
| `listennotes-mcp` | 1.1.6 | no |  |  |
| `literal-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/lobsters-mcp` | 1.0.1 | yes |  |  |
| `loc-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/locale-format-mcp` | 1.0.1 | yes |  |  |
| `lockstep-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/logseq-mcp` | 1.0.1 | no |  |  |
| `logto-mcp` | 1.0.2 | no |  |  |
| `lol-datadragon-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/loops-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/lorcana-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/lorem-mcp` | 1.0.2 | no |  | 2 |
| `lostmedia-mcp` | 1.0.3 | no |  | 3 |
| `lotr-mcp` | 1.0.2 | no |  | 2 |
| `louisvuitton-mcp` | 1.1.2 | no |  |  |
| `luchtmeetnet-mcp` | 1.0.3 | no |  | 1 |
| `lyrics-mcp` | 1.0.2 | no |  | 2 |
| `mac-lookup-mcp` | 1.0.2 | no |  | 1 |
| `madhappy-mcp` | 1.1.3 | no |  |  |
| `mail-tm-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/mailchimp-mcp` | 1.1.6 | no |  |  |
| `mailgun-mcp` | 1.1.2 | no |  |  |
| `mailjet-mcp` | 1.0.5 | no |  |  |
| `maltiverse-mcp` | 1.0.2 | no |  | 2 |
| `mangadex-mcp` | 1.0.1 | yes |  |  |
| `marine-forecast-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/markdown-mcp` | 1.0.4 | yes | 3 |  |
| `marketstack-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/mast-mcp` | 1.0.5 | no |  | 1 |
| `@mrfentmen/mastodon-mcp` | 1.1.2 | no |  |  |
| `math-tools-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/matrix-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/maven-central-mcp` | 1.0.2 | yes |  |  |
| `maven-info-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/maze-mcp` | 1.0.1 | yes |  |  |
| `mbta-mcp` | 1.0.2 | no |  | 2 |
| `mcp-auditor-mcp` | 1.0.5 | no |  |  |
| `mcstatus-mcp` | 1.0.2 | no |  | 1 |
| `mdn-search-mcp` | 1.0.2 | no |  | 2 |
| `medrxiv-mcp` | 1.0.2 | no |  | 2 |
| `meilisearch-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/meme-generator-mcp` | 1.0.2 | yes |  | 2 |
| `meme-reference-mcp` | 1.0.1 | yes |  |  |
| `memegen-mcp` | 1.0.3 | no |  | 3 |
| `mempool-mcp` | 1.0.2 | yes |  |  |
| `meowfacts-mcp` | 1.0.2 | no |  | 1 |
| `mercury-mcp` | 1.0.5 | no |  |  |
| `merge-conflict-forecaster-mcp` | 1.0.1 | yes |  |  |
| `met-no-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/metabolights-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/metar-mcp` | 1.0.1 | yes |  |  |
| `metmuseum-mcp` | 1.0.1 | yes |  |  |
| `metoffice-mcp` | 1.0.1 | no |  |  |
| `metronome-mcp` | 1.0.2 | no |  | 2 |
| `mexc-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/mfapi-mcp` | 1.0.1 | yes |  |  |
| `mgm-mcp` | 1.0.3 | no |  | 2 |
| `microlink-mcp` | 1.0.2 | yes | 3 |  |
| `midi-tools-mcp` | 1.0.2 | no |  | 1 |
| `migration-map-mcp` | 1.0.1 | yes |  |  |
| `milvus-mcp` | 1.0.3 | no |  |  |
| `minecraft-mojang-mcp` | 1.0.2 | no |  | 2 |
| `missoma-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/mitre-attack-mcp` | 1.0.3 | no |  | 4 |
| `mixcloud-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/mixpanel-mcp` | 1.0.7 | no |  |  |
| `mlb-mcp` | 1.0.2 | no |  | 2 |
| `mlb-stats-mcp` | 1.0.1 | yes |  |  |
| `mobygames-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/modrinth-mcp` | 1.0.4 | yes |  |  |
| `moon-phase-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/morse-mcp` | 1.0.1 | yes |  |  |
| `mtg-mcp` | 1.0.2 | no |  | 3 |
| `muffinlabs-mcp` | 1.0.2 | no |  | 2 |
| `musicbrainz-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/mygene-mcp` | 1.0.2 | yes |  |  |
| `myvariant-mcp` | 1.0.2 | no |  | 1 |
| `nager-mcp` | 1.0.5 | no |  |  |
| `name-age-mcp` | 1.0.2 | no |  | 2 |
| `name-generator-mcp` | 1.0.2 | no |  | 2 |
| `nanoleaf-mcp` | 1.0.1 | no |  |  |
| `nasa-eonet-mcp` | 1.0.1 | yes |  |  |
| `nasa-epic-mcp` | 1.0.2 | no |  | 2 |
| `nasa-images-mcp` | 1.0.4 | yes |  |  |
| `@mrfentmen/nasa-mcp` | 1.1.0 | yes |  |  |
| `@mrfentmen/nasa-neo-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/nasa-power-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/nasa-sbdb-mcp` | 1.0.0 | yes |  |  |
| `nasa-tle-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/nasdaq-mcp` | 1.0.1 | yes |  |  |
| `nationalize-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/navidrome-mcp` | 1.0.1 | no |  |  |
| `nbp-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/ncbi-datasets-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/ncbi-gene-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/ncbi-taxonomy-mcp` | 1.0.1 | yes |  |  |
| `ndbc-buoy-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/ndbc-mcp` | 1.0.2 | yes |  |  |
| `netatmo-mcp` | 1.0.1 | no |  |  |
| `netdata-mcp` | 1.0.5 | no |  |  |
| `neverbounce-mcp` | 1.0.0 | yes |  |  |
| `nextbus-mcp` | 1.0.2 | no |  | 1 |
| `nhl-mcp` | 1.0.1 | yes |  |  |
| `nhtsa-mcp` | 1.0.1 | yes |  |  |
| `nix-packages-mcp` | 1.0.2 | no |  | 2 |
| `noaa-ncei-mcp` | 1.0.2 | no |  | 2 |
| `noahny-mcp` | 1.1.3 | no |  |  |
| `nobel-mcp` | 1.0.3 | no |  | 2 |
| `nodered-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/nominatim-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/nonogram-mcp` | 1.0.1 | yes |  |  |
| `nonprofit-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/notion-mcp` | 1.1.6 | no |  |  |
| `novu-mcp` | 1.1.6 | no |  |  |
| `@mrfentmen/npi-registry-mcp` | 1.0.3 | yes |  |  |
| `@mrfentmen/npm-registry-mcp` | 1.0.1 | yes |  |  |
| `npm-search-mcp` | 1.1.0 | no |  |  |
| `npms-mcp` | 1.0.3 | no |  | 2 |
| `nps-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/ns-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/ntfy-mcp` | 1.1.6 | no |  |  |
| `nuget-mcp` | 1.0.2 | no |  | 1 |
| `number-tools-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/numbers-mcp` | 1.0.2 | yes |  |  |
| `nutritionix-mcp` | 1.0.3 | no |  | 2 |
| `nvd-cve-mcp` | 1.1.0 | no |  |  |
| `nws-mcp` | 1.0.1 | yes |  |  |
| `nyc-arrests-mcp` | 1.0.5 | no |  |  |
| `nyc311-mcp` | 1.0.4 | yes |  |  |
| `nylas-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/obis-mcp` | 1.0.1 | yes |  |  |
| `ocrspace-mcp` | 1.0.5 | no |  |  |
| `odysee-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/oecd-mcp` | 1.1.0 | no |  |  |
| `oeis-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/ofac-sanctions-mcp` | 1.0.1 | yes |  |  |
| `office-quotes-mcp` | 1.0.3 | no |  | 3 |
| `ogs-mcp` | 1.0.3 | no |  | 2 |
| `ohdear-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/okx-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/ols-mcp` | 1.0.1 | yes |  |  |
| `omdb-mcp` | 1.1.4 | no |  |  |
| `on-this-day-mcp` | 1.0.2 | no |  | 2 |
| `onesignal-mcp` | 1.1.3 | no |  |  |
| `open-food-facts-mcp` | 1.0.1 | yes |  |  |
| `open-library-mcp` | 1.0.1 | yes |  |  |
| `open-meteo-mcp` | 1.0.1 | yes |  |  |
| `open-notify-mcp` | 1.0.2 | no |  | 1 |
| `open-vsx-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/open5e-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/openaire-mcp` | 1.0.1 | yes |  |  |
| `openalex-mcp` | 1.0.1 | yes |  |  |
| `openapi-scout-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/openbeautyfacts-mcp` | 1.0.2 | yes |  |  |
| `openbrewery-mcp` | 1.0.2 | yes |  | 2 |
| `openbrewerydb-mcp` | 1.0.1 | yes |  |  |
| `openchargemap-mcp` | 1.0.5 | no |  |  |
| `opendota-mcp` | 1.0.2 | no |  | 2 |
| `openf1-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/openfda-api-mcp` | 1.0.0 | no |  |  |
| `@mrfentmen/openfda-api-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/openlibrary-mcp` | 1.0.5 | yes |  |  |
| `@mrfentmen/openligadb-mcp` | 1.0.2 | yes |  |  |
| `openligadb-soccer-mcp` | 1.0.2 | no |  | 1 |
| `openmoji-mcp` | 1.0.6 | no |  |  |
| `openpanel-mcp` | 1.1.2 | no |  |  |
| `openplaques-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/openrouter-mcp` | 1.1.6 | no |  |  |
| `openrouteservice-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/opensearch-mcp` | 1.0.3 | yes |  |  |
| `opensecrets-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/opensky-mcp` | 1.0.1 | yes |  |  |
| `opentargets-mcp` | 1.0.3 | no |  | 3 |
| `opentdb-mcp` | 1.0.5 | no |  |  |
| `openverse-mcp` | 1.0.2 | no |  | 2 |
| `openwhyd-mcp` | 1.0.2 | no |  | 2 |
| `opnsense-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/opsgenie-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/orcid-mcp` | 1.0.1 | yes |  |  |
| `osf-mcp` | 1.0.3 | no |  | 3 |
| `osm-notes-mcp` | 1.0.1 | yes |  |  |
| `osrm-mcp` | 1.0.2 | no |  | 3 |
| `@mrfentmen/osrs-ge-mcp` | 1.0.1 | yes |  |  |
| `osrs-mcp` | 1.0.5 | no |  |  |
| `osv-mcp` | 1.0.1 | yes |  |  |
| `otp-mcp` | 1.0.2 | no |  | 2 |
| `otx-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/ourairports-mcp` | 1.0.2 | yes |  |  |
| `overpass-mcp` | 1.0.3 | no |  | 4 |
| `owncloud-mcp` | 1.0.3 | no |  |  |
| `oyez-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/package-registry-mcp` | 1.0.2 | no |  | 2 |
| `packagist-mcp` | 1.0.4 | yes |  |  |
| `paddle-mcp` | 1.0.5 | no |  |  |
| `password-breach-check-mcp` | 1.0.2 | no |  | 1 |
| `password-generator-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/password-mcp` | 1.0.1 | yes |  |  |
| `password-strength-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/patch-mcp` | 1.0.1 | yes |  |  |
| `patents-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/pathway-commons-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/paypal-mcp` | 1.1.6 | no |  |  |
| `pbdb-mcp` | 1.0.2 | no |  | 2 |
| `pdb-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/pdf-generator-mcp` | 1.0.4 | yes | 3 |  |
| `peakdesign-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/peeringdb-mcp` | 1.0.0 | yes |  |  |
| `peertube-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/pexels-mcp` | 1.0.1 | no |  |  |
| `phemex-mcp` | 1.0.2 | no |  | 2 |
| `phone-validator-mcp` | 1.0.2 | no |  |  |
| `photon-mcp` | 1.0.2 | no |  | 2 |
| `picsum-mcp` | 1.0.3 | no |  | 2 |
| `pihole-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/pinata-mcp` | 1.1.2 | no |  |  |
| `pingdom-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/pinterest-mcp` | 1.0.7 | no |  |  |
| `pixelfed-mcp` | 1.0.2 | no |  | 3 |
| `placehold-mcp` | 1.0.2 | no |  | 1 |
| `placeholder-images-mcp` | 1.0.2 | yes | 3 |  |
| `plaid-mcp` | 1.1.5 | no |  |  |
| `plain-mcp` | 1.1.3 | no |  |  |
| `playcanvas-mcp` | 1.1.2 | no |  |  |
| `plos-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/pocketbase-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/pod-upload-mcp` | 1.0.0 | yes |  |  |
| `poetry-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/poetrydb-mcp` | 1.0.2 | yes |  |  |
| `pokeapi-mcp` | 1.0.3 | no |  | 2 |
| `pokemon-tcg-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/poker-mcp` | 1.0.1 | yes |  |  |
| `police-transparency-mcp` | 1.0.1 | yes |  |  |
| `poloniex-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/polygon-mcp` | 1.1.6 | no |  |  |
| `port-scanner-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/port-throughput-mcp` | 1.0.0 | yes |  |  |
| `postcodes-mcp` | 1.0.2 | no |  | 2 |
| `posthog-mcp` | 1.1.6 | no |  |  |
| `postman-echo-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/postmark-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/potterdb-mcp` | 1.0.1 | yes |  |  |
| `prada-mcp` | 1.0.6 | no |  |  |
| `prayer-times-mcp` | 1.0.2 | no |  | 2 |
| `predictit-mcp` | 1.0.6 | no |  |  |
| `@mrfentmen/pride-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/primes-mcp` | 1.0.1 | yes |  |  |
| `producthunt-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/propublica-nonprofits-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/proteins-mcp` | 1.0.1 | yes |  |  |
| `protondb-mcp` | 1.0.2 | no |  | 2 |
| `prx-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/pubchem-compound-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/pubchem-mcp` | 1.1.0 | no |  |  |
| `pubg-mcp` | 1.0.1 | no |  |  |
| `public-holidays-mcp` | 1.0.1 | yes |  |  |
| `publicwww-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/pubmed-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/punycode-mcp` | 1.0.1 | yes |  |  |
| `pusher-mcp` | 1.1.4 | no |  |  |
| `pvgis-mcp` | 1.0.5 | no |  |  |
| `pydio-mcp` | 1.0.1 | no |  |  |
| `pypi-mcp` | 1.1.0 | no |  |  |
| `pypi-stats-mcp` | 1.0.1 | yes |  |  |
| `qbittorrent-mcp` | 1.0.5 | no |  |  |
| `qr-code-mcp` | 1.0.3 | yes | 3 |  |
| `@mrfentmen/qr-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/quickgo-mcp` | 1.0.1 | yes |  |  |
| `quip-mcp` | 1.1.2 | no |  |  |
| `quotes-mcp` | 1.0.2 | yes |  | 1 |
| `@mrfentmen/quran-mcp` | 1.0.2 | yes |  |  |
| `radarr-mcp` | 1.0.5 | no |  |  |
| `radio-browser-mcp` | 1.0.1 | yes |  |  |
| `radio-garden-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/raiderio-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/rail-infrastructure-mcp` | 1.0.0 | yes |  |  |
| `@mrfentmen/raindrop-mcp` | 1.0.5 | no |  |  |
| `rainviewer-mcp` | 1.0.3 | yes |  | 1 |
| `random-animals-mcp` | 1.0.3 | no |  | 2 |
| `random-word-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/randomuser-mcp` | 1.0.2 | yes |  |  |
| `rawg-mcp` | 1.1.3 | no |  |  |
| `rcsb-pdb-mcp` | 1.0.2 | no |  | 2 |
| `reactome-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/readwise-mcp` | 1.0.5 | no |  |  |
| `rebrickable-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/reddit-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/regex-mcp` | 1.0.2 | no |  | 2 |
| `release-notes-forge-mcp` | 1.0.1 | yes |  |  |
| `remoteok-mcp` | 1.0.6 | no |  |  |
| `repo-forensics-mcp` | 1.0.1 | yes |  |  |
| `repology-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/resend-mcp` | 1.1.6 | no |  |  |
| `restful-api-dev-mcp` | 1.0.2 | no |  | 2 |
| `retrogachievements-mcp` | 1.0.3 | no |  | 1 |
| `rhymebrain-mcp` | 1.0.2 | no |  | 1 |
| `rick-and-morty-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/rickandmorty-mcp` | 1.0.2 | yes |  |  |
| `riddles-mcp` | 1.0.4 | no |  | 4 |
| `riotgames-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/ripestat-mcp` | 1.0.0 | yes |  |  |
| `rng-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/roblox-mcp` | 1.0.3 | no |  | 3 |
| `robohash-mcp` | 1.0.3 | no |  | 1 |
| `rolex-mcp` | 1.0.6 | no |  |  |
| `rollbar-mcp` | 1.1.3 | no |  |  |
| `rom-mcp` | 1.2.1 | yes |  |  |
| `ron-swanson-mcp` | 1.0.2 | no |  | 2 |
| `ror-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/rss-mcp` | 1.0.5 | no |  | 2 |
| `rubygems-mcp` | 1.0.4 | yes |  |  |
| `runescape-mcp` | 1.0.2 | yes |  | 1 |
| `runtime-support-mcp` | 1.0.1 | yes |  |  |
| `rxnav-mcp` | 1.0.2 | no |  | 2 |
| `rxnorm-mcp` | 1.0.1 | yes |  |  |
| `rybbit-mcp` | 1.0.5 | no |  |  |
| `saintlaurent-mcp` | 1.0.6 | no |  |  |
| `satnogs-mcp` | 1.0.3 | no |  | 3 |
| `savvycal-mcp` | 1.1.2 | no |  |  |
| `schema-compatibility-mcp` | 1.0.1 | yes |  |  |
| `schema-sieve-mcp` | 1.0.1 | yes |  |  |
| `scrabble-mcp` | 1.0.2 | no |  | 2 |
| `screenplaywriter-mcp` | 1.0.3 | yes |  |  |
| `@mrfentmen/scryfall-mcp` | 1.0.2 | yes |  |  |
| `seafile-mcp` | 1.0.1 | no |  |  |
| `seatgeek-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/sec-edgar-mcp` | 1.0.2 | yes |  |  |
| `secret-hygiene-mcp` | 1.0.1 | yes |  |  |
| `sefaria-mcp` | 1.0.2 | no |  | 2 |
| `segaretro-mcp` | 1.0.1 | yes |  |  |
| `seismicportal-mcp` | 1.0.2 | no |  | 2 |
| `semantic-scholar-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/semver-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/sentry-mcp` | 1.1.6 | no |  |  |
| `seoul-mcp` | 1.0.1 | no |  |  |
| `septa-mcp` | 1.0.3 | yes |  | 1 |
| `@mrfentmen/setlist-mcp` | 1.0.4 | yes |  |  |
| `shebang-sherpa-mcp` | 1.0.1 | yes |  |  |
| `shields-mcp` | 1.0.2 | no |  | 2 |
| `shootproof-mcp` | 1.1.2 | no |  |  |
| `shynet-mcp` | 1.0.1 | no |  |  |
| `simbad-mcp` | 1.0.3 | no |  | 3 |
| `simplecast-mcp` | 1.1.2 | no |  |  |
| `skills-movie-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/slack-mcp` | 1.1.6 | no |  |  |
| `smartrecruiters-mcp` | 1.0.6 | no |  |  |
| `smithsonian-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/smk-mcp` | 1.0.1 | yes |  |  |
| `smogon-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/snotel-mcp` | 1.0.3 | yes |  |  |
| `@mrfentmen/soilgrids-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/solana-mcp` | 1.0.2 | no |  | 3 |
| `somafm-mcp` | 1.0.2 | no |  | 1 |
| `sourceforge-mcp` | 1.0.3 | no |  | 2 |
| `sourcegraph-mcp` | 1.0.2 | no |  | 2 |
| `space-launches-mcp` | 1.0.3 | yes |  | 2 |
| `space-weather-mcp` | 1.0.1 | yes |  |  |
| `spacedevs-mcp` | 1.1.5 | no |  |  |
| `spaceflight-news-api-mcp` | 1.0.1 | yes |  |  |
| `spaceflight-news-mcp` | 1.0.2 | no |  | 1 |
| `@mrfentmen/spaceweather-mcp` | 1.0.1 | yes |  |  |
| `spdx-mcp` | 1.0.1 | yes |  |  |
| `speedrun-mcp` | 1.0.1 | yes |  |  |
| `split-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/spoonacular-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/sports-scores-mcp` | 1.0.2 | no |  | 2 |
| `sportyandrich-mcp` | 1.1.3 | no |  |  |
| `@mrfentmen/spotify-mcp` | 1.1.6 | no |  |  |
| `spreaker-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/sql-format-mcp` | 1.0.1 | yes |  |  |
| `sql-formatter-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/sqlite-mcp` | 1.0.1 | no |  |  |
| `squarespace-mcp` | 1.0.5 | no |  |  |
| `ssl-cert-mcp` | 1.0.3 | yes | 3 |  |
| `ssl-labs-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/stackexchange-mcp` | 1.0.1 | yes |  |  |
| `stadiamaps-mcp` | 1.0.0 | yes |  |  |
| `stadiumgoods-mcp` | 1.0.6 | no |  |  |
| `stapi-mcp` | 1.0.4 | no |  | 4 |
| `star-wars-mcp` | 1.0.2 | no |  | 2 |
| `stardew-wiki-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/statistics-mcp` | 1.0.1 | yes |  |  |
| `statping-mcp` | 1.1.2 | no |  |  |
| `statuscake-mcp` | 1.1.2 | no |  |  |
| `statuspage-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/steam-mcp` | 1.0.6 | no |  |  |
| `steamspy-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/stellar-mcp` | 1.0.4 | no |  | 4 |
| `storj-mcp` | 1.0.3 | no |  | 1 |
| `stormglass-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/storyblok-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/string-db-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/stripe-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/submarine-cables-mcp` | 1.0.0 | yes |  |  |
| `sudoku-mcp` | 1.0.2 | no |  | 2 |
| `sunrise-sunset-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/supabase-mcp` | 1.1.6 | no |  |  |
| `supercell-mcp` | 1.0.1 | no |  |  |
| `supernotes-mcp` | 1.0.1 | no |  |  |
| `surrealdb-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/suunto-mcp` | 1.0.1 | no |  |  |
| `svgl-mcp` | 1.0.2 | no |  | 1 |
| `swaggerhub-mcp` | 1.0.2 | no |  | 2 |
| `swapi-mcp` | 1.0.1 | yes |  |  |
| `swetrix-mcp` | 1.1.2 | no |  |  |
| `swift-bic-mcp` | 1.0.3 | no |  | 2 |
| `swiss-sbb-mcp` | 1.0.2 | no |  | 2 |
| `switchbot-mcp` | 1.0.1 | no |  |  |
| `synoptic-mcp` | 1.0.3 | no |  | 2 |
| `tally-mcp` | 1.1.5 | no |  |  |
| `@mrfentmen/tarot-mcp` | 1.0.2 | no |  | 2 |
| `tasmota-mcp` | 1.0.2 | no |  |  |
| `@mrfentmen/tcgdex-mcp` | 1.0.1 | yes |  |  |
| `tdx-mcp` | 1.0.3 | no |  | 2 |
| `techcrunch-mcp` | 1.0.2 | no |  | 1 |
| `teedy-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/telegram-mcp` | 1.1.6 | no |  |  |
| `telnetbbs-mcp` | 1.0.1 | yes |  |  |
| `terraform-registry-mcp` | 1.0.2 | no |  | 2 |
| `test-shape-mcp` | 1.0.1 | yes |  |  |
| `tetriswiki-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/text-diff-mcp` | 1.0.1 | yes |  |  |
| `text-tools-mcp` | 1.0.3 | no |  | 2 |
| `textfiles-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/tfl-mcp` | 1.0.2 | yes |  |  |
| `tfl-status-mcp` | 1.0.2 | no |  | 2 |
| `the-trivia-api-mcp` | 1.0.2 | no |  | 1 |
| `theaudiodb-mcp` | 1.0.1 | yes |  |  |
| `thecocktaildb-mcp` | 1.0.1 | yes |  |  |
| `thegraph-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/themealdb-mcp` | 1.0.1 | yes |  |  |
| `themuse-mcp` | 1.0.5 | no |  |  |
| `theoddsapi-mcp` | 1.1.2 | no |  |  |
| `thesportsdb-mcp` | 1.0.2 | no |  | 2 |
| `tides-mcp` | 1.0.4 | yes |  |  |
| `tiingo-mcp` | 1.0.5 | no |  |  |
| `time-tools-mcp` | 1.0.2 | no |  | 2 |
| `timeapi-mcp` | 1.0.2 | yes |  | 1 |
| `@mrfentmen/timezone-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/tmdb-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/toml-mcp` | 1.0.1 | yes |  |  |
| `toolchain-lens-mcp` | 1.0.1 | yes |  |  |
| `torah-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/totp-mcp` | 1.0.1 | yes |  |  |
| `trakt-mcp` | 1.0.2 | no |  |  |
| `translation-mcp` | 1.0.2 | no |  | 1 |
| `traxnyc-mcp` | 1.0.5 | no |  |  |
| `treasury-rates-mcp` | 1.1.0 | no |  |  |
| `trivia-mcp` | 1.0.3 | yes |  | 2 |
| `@mrfentmen/trove-mcp` | 1.0.3 | no |  |  |
| `@mrfentmen/truth-table-mcp` | 1.0.1 | yes |  |  |
| `tunein-mcp` | 1.0.2 | no |  | 2 |
| `turbosquid-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/tvdb-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/tvmaze-mcp` | 1.0.0 | yes |  |  |
| `twelvedata-mcp` | 1.1.2 | no |  |  |
| `twilio-mcp-server` | 1.0.8 | no |  |  |
| `@mrfentmen/twitch-mcp` | 1.1.2 | no |  |  |
| `typeform-mcp` | 1.1.6 | no |  |  |
| `@mrfentmen/ucsc-genome-mcp` | 1.0.1 | yes |  |  |
| `ui-avatars-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/uk-parliament-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/ukparliament-mcp` | 1.0.4 | no |  | 1 |
| `@mrfentmen/ukpolice-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/ulid-mcp` | 1.0.1 | yes |  |  |
| `un-sdg-mcp` | 1.0.2 | no |  | 2 |
| `uncomtrade-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/unhcr-mcp` | 1.0.2 | yes |  |  |
| `unicode-mcp` | 1.0.1 | yes |  |  |
| `unicode-security-mcp` | 1.0.1 | yes |  |  |
| `uniprot-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/unit-convert-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/unit-converter-mcp` | 1.0.3 | no |  | 1 |
| `@mrfentmen/unpaywall-mcp` | 1.0.2 | no |  | 2 |
| `unpkg-mcp` | 1.0.2 | yes | 3 |  |
| `@mrfentmen/unstats-mcp` | 1.0.1 | yes |  |  |
| `upbit-mcp` | 1.0.2 | no |  | 2 |
| `upcitemdb-mcp` | 1.0.2 | no |  | 2 |
| `uptime-kuma-mcp` | 1.0.6 | no |  |  |
| `uptime-mcp` | 1.0.3 | no |  | 3 |
| `uptimerobot-mcp` | 1.1.2 | no |  |  |
| `@mrfentmen/urban-dictionary-mcp` | 1.0.3 | yes |  | 2 |
| `@mrfentmen/uri-mcp` | 1.0.2 | yes |  |  |
| `urlhaus-mcp` | 1.0.7 | no |  |  |
| `urlscan-mcp` | 1.1.0 | no |  |  |
| `@mrfentmen/usace-water-mcp` | 1.0.0 | yes |  |  |
| `usajobs-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/usaspending-mcp` | 1.0.1 | yes |  |  |
| `usda-food-mcp` | 1.0.3 | yes |  | 1 |
| `uselessfacts-mcp` | 1.0.2 | yes |  |  |
| `@mrfentmen/useragent-mcp` | 1.0.1 | yes |  |  |
| `usgs-earthquakes-mcp` | 1.0.2 | yes |  | 2 |
| `usgs-mcp` | 1.0.1 | yes |  |  |
| `usgs-water-mcp` | 1.0.3 | yes |  |  |
| `@mrfentmen/usno-mcp` | 1.0.1 | yes |  |  |
| `usps-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/uuid-mcp` | 1.0.5 | no |  | 2 |
| `@mrfentmen/valorant-mcp` | 1.0.2 | no |  | 1 |
| `vam-mcp` | 1.0.4 | no |  | 1 |
| `vapi-mcp` | 1.0.5 | no |  |  |
| `vatcomply-mcp` | 1.0.2 | no |  | 1 |
| `vatsim-mcp` | 1.0.2 | no |  | 2 |
| `@mrfentmen/vcard-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/vercel-mcp` | 1.1.6 | no |  |  |
| `vg-resource-mcp` | 1.0.3 | yes | 3 |  |
| `vgmdb-mcp` | 1.0.1 | yes |  |  |
| `vin-decoder-mcp` | 1.0.3 | no |  | 4 |
| `virustotal-mcp` | 1.0.1 | no |  |  |
| `vndb-mcp` | 1.0.1 | yes |  |  |
| `vocadb-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/volcano-mcp` | 1.0.2 | yes |  |  |
| `walkthrough-mcp` | 1.0.1 | yes |  |  |
| `waqi-mcp` | 1.0.3 | no |  | 2 |
| `warframe-mcp` | 1.0.3 | no |  | 3 |
| `wargaming-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/wasabi-mcp` | 1.0.1 | no |  |  |
| `@mrfentmen/water-quality-portal-mcp` | 1.0.0 | yes |  |  |
| `waterdata-mcp` | 1.0.1 | yes |  |  |
| `wayback-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/weather-mcp` | 1.0.3 | yes |  | 2 |
| `weatherbit-mcp` | 1.0.3 | no |  | 2 |
| `weaviate-mcp` | 1.0.3 | no |  | 1 |
| `weightsbiases-mcp` | 1.1.2 | no |  |  |
| `wellcome-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/wger-mcp` | 1.0.5 | no |  | 3 |
| `whiskyhunter-mcp` | 1.0.5 | no |  |  |
| `whitebit-mcp` | 1.0.3 | no |  | 4 |
| `who-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/whois-mcp` | 1.0.3 | yes |  | 3 |
| `wikibooks-mcp` | 1.0.3 | no |  | 4 |
| `wikidata-mcp` | 1.0.1 | yes |  |  |
| `wikimedia-commons-mcp` | 1.0.3 | yes |  | 2 |
| `wikinews-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/wikipedia-mcp` | 1.0.3 | no |  | 3 |
| `wikipedia-pageviews-mcp` | 1.1.0 | no |  |  |
| `wikiquote-mcp` | 1.0.3 | no |  | 3 |
| `wikisource-mcp` | 1.0.1 | yes |  |  |
| `wikispecies-mcp` | 1.0.3 | no |  | 2 |
| `wikitrending-mcp` | 1.0.3 | no |  | 3 |
| `wikivoyage-mcp` | 1.0.5 | yes |  |  |
| `wiktionary-mcp` | 1.0.3 | no |  | 3 |
| `@mrfentmen/wise-mcp` | 1.1.2 | no |  |  |
| `wordle-helper-mcp` | 1.0.3 | no |  | 4 |
| `@mrfentmen/wordpress-mcp` | 1.0.4 | yes | 3 |  |
| `workable-mcp` | 1.0.5 | no |  |  |
| `worktree-orbit-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/worldbank-mcp` | 1.0.5 | yes |  |  |
| `@mrfentmen/worms-mcp` | 1.0.1 | yes |  |  |
| `wpengine-mcp` | 1.0.2 | no |  |  |
| `wttr-mcp` | 1.0.3 | no |  | 4 |
| `wynncraft-mcp` | 1.0.4 | no |  | 2 |
| `@mrfentmen/x509-mcp` | 1.0.1 | yes |  |  |
| `xkcd-mcp` | 1.0.1 | yes |  |  |
| `@mrfentmen/xml-mcp` | 1.0.1 | yes |  |  |
| `yaml-mcp` | 1.0.2 | no |  |  |
| `yesno-mcp` | 1.0.4 | no |  |  |
| `@mrfentmen/yfinance-mcp` | 1.0.6 | yes |  |  |
| `@mrfentmen/youtrack-mcp` | 1.0.5 | no |  |  |
| `@mrfentmen/youtube-mcp` | 1.1.7 | no |  |  |
| `yr-metno-mcp` | 1.0.4 | yes |  | 3 |
| `yugioh-mcp` | 1.0.1 | yes |  |  |
| `zenodo-mcp` | 1.0.3 | no |  | 3 |
| `zip-codes-mcp` | 1.0.3 | no |  | 2 |
| `@mrfentmen/zippopotam-mcp` | 1.0.2 | yes |  |  |
| `zitadel-mcp` | 1.0.2 | no |  |  |
| `zork-mcp` | 1.0.1 | yes |  |  |
