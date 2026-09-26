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

## Setup

No setup. Solar data comes from the public PVGIS API of the EU Joint Research Centre.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
