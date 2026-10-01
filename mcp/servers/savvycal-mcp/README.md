# savvycal-mcp

Timezone, business-day and meeting-slot maths - no API key.

## Tools

- `convert_time` — Convert a date and time from one timezone to another, using the live IANA database so daylight saving is handled correctly. No account needed.
- `timezone_info` — Show a timezone's current offset, its standard and summer offsets, whether it observes daylight saving and the exact dates its clocks change this year.
- `business_days` — Count the working days between two dates, excluding weekends and any holidays you list, with a configurable weekend.
- `add_business_days` — Move a date forward or back by a number of business days, skipping weekends and any holidays you list.
- `meeting_slots` — Given a date, a timezone, working hours and the times you are already busy, list every free meeting slot of the length you need, optionally shown in other attendees' timezones too.
- `world_clock` — Show the current local time and UTC offset in up to 12 timezones at once.
- `team_overlap` — Work out which UTC hours fall inside everyone's working hours for a distributed team, listing each attendee's local time for every workable hour.

## Setup

No setup. All timezone and calendar maths uses the IANA database shipped with Node.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `calendar_arithmetic`
* `duration_report`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
