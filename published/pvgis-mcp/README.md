# pvgis-mcp

Solar yield, irradiation and system sizing - no API key.

## Tools

- `pv_yield` — Monthly and yearly solar output for a location. Give kWp and tilt, or leave tilt out to use the optimal angle.
- `radiation` — How much sun a site gets, month by month, on a tilted panel plane - with the year-to-year spread.
- `hourly_output` — Hour-by-hour solar data for one year, summarised by month: average irradiance, sun hours and temperature.
- `typical_weather` — The typical meteorological year for a site: monthly temperature, humidity, wind speed and global irradiation.
- `system_summary` — Plain-language verdict for a PV system: yearly output, yield per kWp, capacity factor, CO2 avoided and roof area.
- `compare_locations` — Compare up to 5 sites for the same system size and name the best one, e.g. '45,8; 52.5,13.4'.
- `size_system` — Work out the system size needed to cover a target annual consumption at a location, with panel count and roof area.
- `horizon_profile` — What the terrain blocks at a location: obstacle height every 7.5 degrees of azimuth, the steepest obstacle and how much of the southern arc is obstructed.
- `offgrid_sizing` — Simulate an off-grid array and battery against a real daily load: how often the load is not met, energy thrown away and the month-by-month shortfall.
- `optimal_tilt` — The tilt and azimuth PVGIS calls optimal here, and what a flat 30 degree south mount costs in kWh per kWp per year against it.

## Setup

No setup. Solar data comes from the public PVGIS API of the EU Joint Research Centre.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `solar_variability`
* `diurnal_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-pvgis-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
