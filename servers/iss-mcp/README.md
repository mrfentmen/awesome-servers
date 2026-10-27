# iss-mcp

Live ISS position, passes and crew - no API key.

## Tools

- `iss_position` — Where the International Space Station is right now: latitude, longitude, altitude, speed and daylight.
- `crew` — Everyone currently in space, grouped by the spacecraft they launched on.
- `distance_from` — How far the ISS is from a point on the ground right now, which way to look, and whether it is overhead.
- `overhead_now` — Yes/no on whether the ISS is currently within a radius of a location.
- `passes` — Overhead windows for a location over the next N minutes, based on sampled ISS positions. Use 120 minutes for the best chance of catching a pass.
- `ground_speed` — How far the ISS moved in the last minute, its heading, and why the ground speed is slower than the orbital speed.
- `orbit_summary` — ISS orbit at a glance: altitude, orbital speed, period in minutes, orbits per day and ground coverage.
- `ground_track` — Where the ISS flies over the next one to three hours: position table, daylight/eclipse state and start and end points.
- `viewing_window` — Can you see the ISS from here? Combines the closest approach, twilight times and whether the station is sunlit.

## Setup

No setup. Positions come from public ISS tracking APIs and the orbit maths runs locally.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
