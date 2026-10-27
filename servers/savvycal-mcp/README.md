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
