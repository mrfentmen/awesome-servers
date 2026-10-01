# nanoleaf-mcp

Nanoleaf LAN control: info, state, power, effects. Needs host + pairing token.

## Setup

```bash
export NANOLEAF_HOST=...
```

Needs NANOLEAF_HOST (e.g. http://192.168.1.10:16021) plus NANOLEAF_TOKEN from holding power 5-7s.

## Tools

- `get_info` — Nanoleaf model, firmware, layout and current state snapshot.
- `get_state` — Nanoleaf on/off, brightness, hue, saturation, color temperature.
- `set_power` — Turn Nanoleaf panels on or off.
- `get_effects` — Nanoleaf installed effects and the active one.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
