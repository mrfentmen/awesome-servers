# Space Launches & Satellites MCP

## Tagline
Rocket launches, satellites and space weather - no API key.

## Description
Follow space from your AI assistant: upcoming launches worldwide with pads and launch weather, a live countdown to the next T-0, satellite lookups by name with NORAD numbers, orbital elements with period, apogee and perigee, radio frequencies for any satellite, spaceflight news and blogs, and current geomagnetic conditions from NOAA. No account or key. An independent MCP server. Not affiliated with or endorsed by any launch provider.

## Setup Requirements
No setup. Every launch, orbit and weather figure is fetched live from public keyless APIs.

## Category
Other

## Features

- Upcoming launches: Upcoming orbital launches worldwide: mission, rocket, provider, pad, T-0 and launch weather. Optionally filter by provider, e.g. 'SpaceX' or 'Rocket Lab'.
- Next launch countdown: The single soonest launch with a live countdown, its pad, weather, mission summary, how firm the launch time is, and the three launches after it.
- Search satellites: Search the SatNOGS satellite catalogue by name and see NORAD catalog number, status, operator, country and launch date. Use the NORAD number with satellite_orbit or satellite_frequencies.
- Satellite orbit details: Orbital elements for one satellite by NORAD catalog number: inclination, eccentricity, period, apogee, perigee, mean orbital velocity and orbit class. The ISS is 25544.
- Satellite radio frequencies: Uplink and downlink frequencies and modes recorded for one satellite, by NORAD catalog number - what you need to receive or work a satellite by radio.
- Space news: Latest spaceflight news headlines from across the industry, with an optional keyword search.
- Space blog posts: Longer spaceflight write-ups and agency blog posts, with an optional keyword search.
- Space weather: Current geomagnetic conditions from NOAA: Kp index, solar wind speed, interplanetary magnetic field, NOAA storm scales and the Kp forecast.
- Space agencies: Space agencies from Launch Library 2 with type, country and description. Optionally search by name or filter by type, e.g. 'Commercial' or 'Government'.
- Astronauts: Astronaut and cosmonaut records from Launch Library 2: agency, nationality, status, time in space and spacewalk time. Filter by name or to those currently in space.
- Launch vehicles: Rocket specs from Launch Library 2: size, mass, payload capacity to LEO and GTO, launch history and maiden flight. Search by name, e.g. 'Falcon 9'.
- Upcoming space events: Upcoming non-launch space events from Launch Library 2 - dockings, spacewalks, flybys, arrivals - with date, location and webcast flag.

## Getting Started

- Ask your assistant about spacedevs using this server once installed
- Tool: next_launches — Upcoming orbital launches worldwide: mission, rocket, provider, pad, T-0 and launch weather. Optionally filter by provider, e.g. 'SpaceX' or 'Rocket Lab'.
- Tool: launch_countdown — The single soonest launch with a live countdown, its pad, weather, mission summary, how firm the launch time is, and the three launches after it.
- Tool: satellite_search — Search the SatNOGS satellite catalogue by name and see NORAD catalog number, status, operator, country and launch date. Use the NORAD number with satellite_orbit or satellite_frequencies.
- Tool: satellite_orbit — Orbital elements for one satellite by NORAD catalog number: inclination, eccentricity, period, apogee, perigee, mean orbital velocity and orbit class. The ISS is 25544.
- Tool: satellite_frequencies — Uplink and downlink frequencies and modes recorded for one satellite, by NORAD catalog number - what you need to receive or work a satellite by radio.
- Tool: space_news — Latest spaceflight news headlines from across the industry, with an optional keyword search.
- Tool: space_blogs — Longer spaceflight write-ups and agency blog posts, with an optional keyword search.
- Tool: space_weather — Current geomagnetic conditions from NOAA: Kp index, solar wind speed, interplanetary magnetic field, NOAA storm scales and the Kp forecast.
- Tool: space_agencies — Space agencies from Launch Library 2 with type, country and description. Optionally search by name or filter by type, e.g. 'Commercial' or 'Government'.
- Tool: astronauts — Astronaut and cosmonaut records from Launch Library 2: agency, nationality, status, time in space and spacewalk time. Filter by name or to those currently in space.
- Tool: launch_vehicles — Rocket specs from Launch Library 2: size, mass, payload capacity to LEO and GTO, launch history and maiden flight. Search by name, e.g. 'Falcon 9'.
- Tool: upcoming_events — Upcoming non-launch space events from Launch Library 2 - dockings, spacewalks, flybys, arrivals - with date, location and webcast flag.

## Tags
space, launches, satellites, orbits, news, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/spacedevs-mcp
