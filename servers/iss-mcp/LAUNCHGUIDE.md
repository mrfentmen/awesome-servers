# ISS Tracker MCP

## Tagline
Live ISS position, passes and crew - no API key.

## Description
Track the International Space Station from your AI assistant: current position, altitude and speed, who is in space and on which craft, distance and direction from any point on Earth, whether it is overhead now, upcoming overhead passes, ground-track speed and an orbit summary. No key. An independent MCP server. Not affiliated with or endorsed by NASA.

## Setup Requirements
No setup. Positions come from public ISS tracking APIs and the orbit maths runs locally.

## Category
Science

## Features

- ISS position now: Where the International Space Station is right now: latitude, longitude, altitude, speed and daylight.
- Who is in space: Everyone currently in space, grouped by the spacecraft they launched on.
- Distance to the ISS: How far the ISS is from a point on the ground right now, which way to look, and whether it is overhead.
- Is the ISS overhead: Yes/no on whether the ISS is currently within a radius of a location.
- Upcoming passes: Overhead windows for a location over the next N minutes, based on sampled ISS positions. Use 120 minutes for the best chance of catching a pass.
- Ground track speed: How far the ISS moved in the last minute, its heading, and why the ground speed is slower than the orbital speed.
- Orbit summary: ISS orbit at a glance: altitude, orbital speed, period in minutes, orbits per day and ground coverage.

## Getting Started

- Ask your assistant about iss using this server once installed
- Tool: iss_position — Where the International Space Station is right now: latitude, longitude, altitude, speed and daylight.
- Tool: crew — Everyone currently in space, grouped by the spacecraft they launched on.
- Tool: distance_from — How far the ISS is from a point on the ground right now, which way to look, and whether it is overhead.
- Tool: overhead_now — Yes/no on whether the ISS is currently within a radius of a location.
- Tool: passes — Overhead windows for a location over the next N minutes, based on sampled ISS positions. Use 120 minutes for the best chance of catching a pass.
- Tool: ground_speed — How far the ISS moved in the last minute, its heading, and why the ground speed is slower than the orbital speed.
- Tool: orbit_summary — ISS orbit at a glance: altitude, orbital speed, period in minutes, orbits per day and ground coverage.

## Tags
iss, space, satellite, tracking, science, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/iss-mcp
