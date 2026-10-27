# Census MCP

Read US Census population data for the nation, states, and counties. Requires a free Census API key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get_nation_population`  National population totals.
* `get_state_population`  Population by state FIPS code.
* `get_county_population`  County populations within a state.

* `get_median_income`
* `get_poverty_count`
* `get_bachelor_count`
* `get_housing_units`
* `get_unemployed_count`
* `get_median_age`
* `get_hispanic_count`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Set the CENSUS_API_KEY environment variable to your free key from the Census Bureau. Without it the server reports an honest error.
