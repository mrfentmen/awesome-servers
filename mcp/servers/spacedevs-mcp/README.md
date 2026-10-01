# spacedevs-mcp

Rocket launches, satellites and space weather - no API key.

## Tools

- `next_launches` — Upcoming orbital launches worldwide: mission, rocket, provider, pad, T-0 and launch weather. Optionally filter by provider, e.g. 'SpaceX' or 'Rocket Lab'.
- `launch_countdown` — The single soonest launch with a live countdown, its pad, weather, mission summary, how firm the launch time is, and the three launches after it.
- `satellite_search` — Search the SatNOGS satellite catalogue by name and see NORAD catalog number, status, operator, country and launch date. Use the NORAD number with satellite_orbit or satellite_frequencies.
- `satellite_orbit` — Orbital elements for one satellite by NORAD catalog number: inclination, eccentricity, period, apogee, perigee, mean orbital velocity and orbit class. The ISS is 25544.
- `satellite_frequencies` — Uplink and downlink frequencies and modes recorded for one satellite, by NORAD catalog number - what you need to receive or work a satellite by radio.
- `space_news` — Latest spaceflight news headlines from across the industry, with an optional keyword search.
- `space_blogs` — Longer spaceflight write-ups and agency blog posts, with an optional keyword search.
- `space_weather` — Current geomagnetic conditions from NOAA: Kp index, solar wind speed, interplanetary magnetic field, NOAA storm scales and the Kp forecast.
- `space_agencies` — Space agencies from Launch Library 2 with type, country and description. Optionally search by name or filter by type, e.g. 'Commercial' or 'Government'.
- `astronauts` — Astronaut and cosmonaut records from Launch Library 2: agency, nationality, status, time in space and spacewalk time. Filter by name or to those currently in space.
- `launch_vehicles` — Rocket specs from Launch Library 2: size, mass, payload capacity to LEO and GTO, launch history and maiden flight. Search by name, e.g. 'Falcon 9'.
- `upcoming_events` — Upcoming non-launch space events from Launch Library 2 - dockings, spacewalks, flybys, arrivals - with date, location and webcast flag.

## Setup

No setup. Every launch, orbit and weather figure is fetched live from public keyless APIs.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `solar_flux_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
