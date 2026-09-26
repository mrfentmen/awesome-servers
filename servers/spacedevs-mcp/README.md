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

## Setup

No setup. Every launch, orbit and weather figure is fetched live from public keyless APIs.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
