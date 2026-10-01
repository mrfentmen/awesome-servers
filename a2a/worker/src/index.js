/**
 * Hosted A2A endpoints for the public-data agents in this repository.
 *
 *   GET  /                                                index of hosted agents
 *   GET  /agents/<name>/.well-known/agent-card.json        the card (legacy path agent.json too)
 *   GET  /agents/<name>/healthz                            liveness + which skills answer
 *   POST /agents/<name>/                                   JSON-RPC 2.0, method `message/send`
 *
 * Every skill reads the same public source the local Python server reads, live, with no
 * key and no cached answer older than the source itself would serve. Nothing here invents
 * data: if a source is unreachable the caller is told which source failed and why.
 *
 * What this endpoint deliberately does not do: streaming, push notifications, task
 * persistence and the watch skills. Those live in the local Python servers, and the cards
 * say so instead of promising something a caller would wait forever for.
 */
import cards from "../cards.json";

const PROTOCOL_VERSION = "0.3.0";
const USER_AGENT = "mrfentmen-a2a-worker/1.0 (+https://github.com/mrfentmen/a2a)";
const MAX_LIST = 50;
const SOURCE_TIMEOUT_MS = 25000;

/** A source said no, or could not be reached. Carries the source name for the caller. */
class SourceError extends Error {
  constructor(source, detail) {
    super(detail);
    this.name = "SourceError";
    this.source = source;
  }
}

/** The caller asked for something the skill cannot answer — bad or missing arguments. */
class UsageError extends Error {
  constructor(detail) {
    super(detail);
    this.name = "UsageError";
  }
}

const CARD_BY_SLUG = new Map();
for (const card of cards) {
  CARD_BY_SLUG.set(slugOf(card), card);
}

function slugOf(card) {
  return card.url.split("/agents/")[1].replace(/\/$/, "");
}

function skillIds(card) {
  return card.skills.map((skill) => skill.id);
}

// ---------------------------------------------------------------- source helpers

async function fetchJSON(source, url, options = {}) {
  const { ttl = 120, headers = {}, emptyOn404 = false } = options;
  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      cf: { cacheTtl: ttl, cacheEverything: true },
    });
  } catch (error) {
    throw new SourceError(source, `${source} could not be reached (${error.name}).`);
  }
  // openFDA answers 404 for a search that matched nothing. That is an empty result, not
  // a broken source, and the caller is told which of the two it is.
  if (response.status === 404 && emptyOn404) return null;
  if (!response.ok) {
    throw new SourceError(source, `${source} answered HTTP ${response.status}.`);
  }
  try {
    return await response.json();
  } catch {
    throw new SourceError(source, `${source} answered with something that is not JSON.`);
  }
}

function numberArg(args, names, options = {}) {
  const { required = true, min = -Infinity, max = Infinity, label = names[0] } = options;
  for (const name of names) {
    if (args[name] === undefined || args[name] === null || args[name] === "") continue;
    const value = Number(args[name]);
    if (!Number.isFinite(value)) throw new UsageError(`${label} must be a number, got "${args[name]}".`);
    if (value < min || value > max) throw new UsageError(`${label} must be between ${min} and ${max}, got ${value}.`);
    return value;
  }
  if (required) throw new UsageError(`${label} is required.`);
  return null;
}

function textArg(args, names, options = {}) {
  const { required = true, label = names[0], allowed = null } = options;
  for (const name of names) {
    const raw = args[name];
    if (raw === undefined || raw === null || String(raw).trim() === "") continue;
    const value = String(raw).trim();
    if (allowed && !allowed.includes(value.toLowerCase())) {
      throw new UsageError(`${label} must be one of ${allowed.join(", ")}, got "${value}".`);
    }
    return value;
  }
  if (required) throw new UsageError(`${label} is required.`);
  return null;
}

function limitArg(args, fallback = 10) {
  const value = numberArg(args, ["limit"], { required: false, min: 1, max: MAX_LIST, label: "limit" });
  return value === null ? fallback : Math.trunc(value);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isoOrNull(milliseconds) {
  const value = Number(milliseconds);
  return Number.isFinite(value) ? new Date(value).toISOString() : null;
}

function checkedPoint(latitude, longitude) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new UsageError(`latitude must be between -90 and 90, got ${latitude}.`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new UsageError(`longitude must be between -180 and 180, got ${longitude}.`);
  }
  return { latitude, longitude };
}

/**
 * A point, the way the local Python servers accept it: either the string the servers call
 * `point` ("39.74,-104.99") or explicit latitude/longitude. Place names are not resolved
 * here — that needs the city table the local servers carry — and the caller is told so
 * rather than being handed a guess.
 */
function pointArg() {
  const args = argsOf();
  const point = textArg(args, ["point", "lat_lon"], { required: false, label: "point" });
  if (point) {
    const match = point.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!match) throw new UsageError(`point must look like "39.74,-104.99", got "${point}".`);
    return checkedPoint(Number(match[1]), Number(match[2]));
  }
  const latitude = numberArg(args, ["latitude", "lat"], { required: false, min: -90, max: 90, label: "latitude" });
  const longitude = numberArg(args, ["longitude", "lon", "lng"], { required: false, min: -180, max: 180, label: "longitude" });
  if (latitude === null && longitude === null) {
    if (args.place || args.city || args.location) {
      throw new UsageError("this hosted endpoint does not resolve place names. Give latitude and longitude, or a point like \"39.74,-104.99\"; the local Python server accepts city names.");
    }
    throw new UsageError("latitude and longitude are required, or a point like \"39.74,-104.99\".");
  }
  if ((latitude === null) !== (longitude === null)) {
    throw new UsageError("give both latitude and longitude, or neither.");
  }
  return checkedPoint(latitude, longitude);
}

/** Set by runSkill just before a handler runs, so argument helpers can read the args. */
let currentArgs = {};
function argsOf() {
  return currentArgs;
}

// ---------------------------------------------------------------- quakes

const QUAKE_FEEDS = { hour: "all_hour", day: "all_day", week: "all_week", month: "all_month" };

function quakeRow(feature) {
  const properties = feature.properties || {};
  const coordinates = (feature.geometry || {}).coordinates || [];
  return {
    magnitude: properties.mag === null || properties.mag === undefined ? null : round(properties.mag, 2),
    place: properties.place || null,
    time: isoOrNull(properties.time),
    depth_km: coordinates.length > 2 ? round(coordinates[2], 2) : null,
    latitude: coordinates.length > 1 ? round(coordinates[1], 4) : null,
    longitude: coordinates.length > 0 ? round(coordinates[0], 4) : null,
    url: properties.url || null,
  };
}

function quakeLine(row) {
  const magnitude = row.magnitude === null ? "magnitude unlisted" : `M ${row.magnitude.toFixed(1)}`;
  return `${magnitude} · ${row.place || "place unknown"} · ${row.time || "time unknown"}${
    row.depth_km === null ? "" : ` · ${row.depth_km} km deep`
  }`;
}

function largestFirst(features) {
  return features
    .slice()
    .sort((a, b) => (b.properties?.mag ?? -1) - (a.properties?.mag ?? -1));
}

async function quakesRecent() {
  const window = textArg(argsOf(), ["window"], { required: false, label: "window", allowed: Object.keys(QUAKE_FEEDS) }) || "day";
  const source = `USGS ${QUAKE_FEEDS[window]} feed`;
  const feed = await fetchJSON(source, `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${QUAKE_FEEDS[window]}.geojson`, { ttl: 120 });
  const features = feed.features || [];
  if (features.length === 0) {
    return { text: `USGS published no earthquakes in the last ${window}. That is what the feed says, not a guess.`, data: { count: 0 }, source };
  }
  const limit = limitArg(argsOf(), 10);
  const rows = largestFirst(features).slice(0, limit).map(quakeRow);
  const text = [
    `${features.length} earthquakes in the last ${window}, from the live USGS ${QUAKE_FEEDS[window]} feed (generated ${isoOrNull(feed.metadata?.generated) || "unknown"}).`,
    `Largest ${rows.length}:`,
    ...rows.map((row) => `  • ${quakeLine(row)}`),
  ].join("\n");
  return { text, data: { count: features.length, largest: rows }, source };
}

async function quakesNear() {
  const { latitude, longitude } = pointArg();
  const radius = numberArg(argsOf(), ["radius_km", "radius"], { required: false, min: 1, max: 1000, label: "radius_km" }) ?? 100;
  const minimum = numberArg(argsOf(), ["min_magnitude", "minimum_magnitude"], { required: false, min: -1, max: 10, label: "min_magnitude" }) ?? 1;
  const limit = limitArg(argsOf(), 20);
  const source = "USGS FDSN event query";
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradiuskm=${radius}&minmagnitude=${minimum}&limit=${limit}&orderby=time`;
  const feed = await fetchJSON(source, url, { ttl: 120 });
  const features = feed.features || [];
  const rows = features.map(quakeRow);
  const text = rows.length === 0
    ? `USGS recorded no earthquake of magnitude ${minimum} or more within ${radius} km of ${latitude}, ${longitude} in its catalog window. Nothing published is not the same as nothing happening.`
    : [
        `${rows.length} earthquakes of magnitude ${minimum} or more within ${radius} km of ${latitude}, ${longitude} (USGS FDSN, newest first):`,
        ...rows.map((row) => `  • ${quakeLine(row)}${row.distance_label ? "" : ""}`),
      ].join("\n");
  return { text, data: { count: rows.length, radius_km: radius, min_magnitude: minimum, quakes: rows }, source };
}

async function quakesSummary() {
  const source = "USGS all_day feed";
  const feed = await fetchJSON(source, "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", { ttl: 120 });
  const features = feed.features || [];
  const bands = { under_2_5: 0, from_2_5_to_4_5: 0, from_4_5_to_6: 0, six_or_more: 0 };
  for (const feature of features) {
    const magnitude = feature.properties?.mag ?? 0;
    if (magnitude < 2.5) bands.under_2_5 += 1;
    else if (magnitude < 4.5) bands.from_2_5_to_4_5 += 1;
    else if (magnitude < 6) bands.from_4_5_to_6 += 1;
    else bands.six_or_more += 1;
  }
  const rows = largestFirst(features).slice(0, 3).map(quakeRow);
  const text = [
    `${features.length} earthquakes in the last 24 hours (live USGS all_day feed):`,
    `  • under M 2.5: ${bands.under_2_5}`,
    `  • M 2.5 to M 4.5: ${bands.from_2_5_to_4_5}`,
    `  • M 4.5 to M 6: ${bands.from_4_5_to_6}`,
    `  • M 6 and above: ${bands.six_or_more}`,
    rows.length ? `Largest three:\n${rows.map((row) => `  • ${quakeLine(row)}`).join("\n")}` : "No earthquakes in that window.",
  ].join("\n");
  return { text, data: { count: features.length, bands, largest: rows }, source };
}

// ---------------------------------------------------------------- NWS alerts

async function fetchAlerts() {
  const args = argsOf();
  const state = textArg(args, ["state", "area"], { required: false, label: "state" });
  if (state) {
    if (!/^[A-Za-z]{2}$/.test(state)) throw new UsageError(`state must be a two-letter code like NY, got "${state}".`);
    const source = `NWS alerts for ${state.toUpperCase()}`;
    const payload = await fetchJSON(source, `https://api.weather.gov/alerts/active?area=${state.toUpperCase()}`, { ttl: 120 });
    return { source, payload };
  }
  const { latitude, longitude } = pointArg();
  const source = `NWS alerts at ${latitude}, ${longitude}`;
  const payload = await fetchJSON(source, `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`, { ttl: 120 });
  return { source, payload };
}

function alertRow(feature) {
  const properties = feature.properties || {};
  return {
    event: properties.event || null,
    severity: properties.severity || null,
    urgency: properties.urgency || null,
    certainty: properties.certainty || null,
    area: properties.areaDesc || null,
    headline: properties.headline || null,
    effective: properties.effective || null,
    expires: properties.expires || null,
    sender: properties.senderName || null,
  };
}

async function alertsActive() {
  const { source, payload } = await fetchAlerts();
  const alerts = (payload.features || []).map(alertRow);
  if (alerts.length === 0) {
    return { text: `No alerts are in effect for that area right now (${source}). Alerts are events happening now or soon; a quiet answer does not mean nothing is coming.`, data: { count: 0 }, source };
  }
  const limit = limitArg(argsOf(), 10);
  const text = [
    `${alerts.length} alerts in effect right now (${source}, as published):`,
    ...alerts.slice(0, limit).map((alert) => `  • ${alert.severity || "severity unlisted"} · ${alert.event} — ${alert.area}${alert.expires ? ` (until ${alert.expires})` : ""}`),
  ].join("\n");
  return { text, data: { count: alerts.length, alerts: alerts.slice(0, limit) }, source };
}

async function alertsSummary() {
  const { source, payload } = await fetchAlerts();
  const alerts = (payload.features || []).map(alertRow);
  const bySeverity = {};
  const byEvent = {};
  for (const alert of alerts) {
    const severity = alert.severity || "unlisted";
    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    const event = alert.event || "unlisted";
    byEvent[event] = (byEvent[event] || 0) + 1;
  }
  const topEvents = Object.entries(byEvent).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const text = alerts.length === 0
    ? `Nothing is in effect for that area right now (${source}).`
    : [
        `${alerts.length} alerts in effect (${source}):`,
        ...Object.entries(bySeverity).sort((a, b) => b[1] - a[1]).map(([severity, count]) => `  • ${severity}: ${count}`),
        "Most common events:",
        ...topEvents.map(([event, count]) => `  • ${event}: ${count}`),
      ].join("\n");
  return { text, data: { count: alerts.length, by_severity: bySeverity, by_event: byEvent }, source };
}

// ---------------------------------------------------------------- air quality

const AQI_BANDS = [
  [50, "Good", "air quality is satisfactory and poses little or no risk"],
  [100, "Moderate", "acceptable, but there may be a risk for people unusually sensitive to air pollution"],
  [150, "Unhealthy for Sensitive Groups", "sensitive groups may feel effects; the general public is unlikely to be affected"],
  [200, "Unhealthy", "some members of the general public may feel effects; sensitive groups may feel more serious effects"],
  [300, "Very Unhealthy", "health alert: everyone may feel more serious health effects"],
  [Infinity, "Hazardous", "health warning of emergency conditions: everyone is likely to be affected"],
];

function aqiBand(aqi) {
  for (const [limit, band, meaning] of AQI_BANDS) {
    if (aqi <= limit) return { band, meaning };
  }
  return { band: "unknown", meaning: "outside the published EPA bands" };
}

async function airNow() {
  const { latitude, longitude } = pointArg();
  const source = "Open-Meteo air-quality model (CAMS)";
  const current = "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide";
  const payload = await fetchJSON(
    source,
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=${current}&timezone=UTC`,
    { ttl: 300 },
  );
  const values = payload.current || {};
  const aqi = values.us_aqi;
  if (aqi === undefined || aqi === null) {
    throw new SourceError(source, `${source} returned no US AQI for that point.`);
  }
  const { band, meaning } = aqiBand(aqi);
  const threshold = numberArg(argsOf(), ["threshold", "aqi"], { required: false, min: 0, max: 1000, label: "threshold" });
  const lines = [
    `US AQI ${aqi} (${band}) at ${latitude}, ${longitude} — ${meaning}.`,
    `  • PM2.5 ${values.pm2_5} µg/m³ · PM10 ${values.pm10} µg/m³ · ozone ${values.ozone} µg/m³`,
    `  • NO₂ ${values.nitrogen_dioxide} µg/m³ · SO₂ ${values.sulphur_dioxide} µg/m³ · CO ${values.carbon_monoxide} µg/m³`,
  ];
  if (threshold !== null) {
    lines.push(`Against your threshold of ${threshold}: the reading is ${aqi > threshold ? "above" : "at or below"} it right now. This endpoint reports; it does not watch, so it will not tell you when the value crosses.`);
  }
  lines.push(`Read live from ${source} at ${values.time} UTC. These are model grid values for the cell containing that point, not a monitor down the street.`);
  const text = lines.join("\n");
  return { text, data: { us_aqi: aqi, band, point: { latitude, longitude }, pollutants: values }, source };
}

async function airForecast() {
  const { latitude, longitude } = pointArg();
  const source = "Open-Meteo air-quality model (CAMS)";
  const payload = await fetchJSON(
    source,
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=us_aqi,pm2_5&forecast_days=2&timezone=UTC`,
    { ttl: 600 },
  );
  const times = payload.hourly?.time || [];
  const values = payload.hourly?.us_aqi || [];
  if (times.length === 0) throw new SourceError(source, `${source} returned no hourly forecast for that point.`);
  const now = Date.now();
  const wanted = numberArg(argsOf(), ["hours", "next_hours"], { required: false, min: 1, max: 48, label: "hours" }) ?? 24;
  const rows = [];
  for (let index = 0; index < times.length && rows.length < wanted; index += 1) {
    const when = Date.parse(`${times[index]}Z`);
    if (Number.isFinite(when) && when >= now - 3600000 && values[index] !== null && values[index] !== undefined) {
      rows.push({ time: `${times[index]}Z`, us_aqi: values[index] });
    }
  }
  if (rows.length === 0) throw new SourceError(source, `${source} forecast has no hours left to show.`);
  const peak = rows.reduce((best, row) => (row.us_aqi > best.us_aqi ? row : best), rows[0]);
  const text = [
    `US AQI hour by hour for the next ${rows.length} hours at ${latitude}, ${longitude} (${source}):`,
    ...rows.map((row) => `  • ${row.time}: AQI ${row.us_aqi}`),
    `Peak in that window: AQI ${peak.us_aqi} at ${peak.time} (${aqiBand(peak.us_aqi).band}).`,
  ].join("\n");
  return { text, data: { point: { latitude, longitude }, hours: rows, peak }, source };
}

// ---------------------------------------------------------------- openFDA recalls

const RECALL_CATEGORIES = ["food", "drug", "device"];

function recallRow(result) {
  return {
    recall_number: result.recall_number || null,
    classification: result.classification || null,
    status: result.status || null,
    product: result.product_description || null,
    reason: result.reason_for_recall || null,
    recalling_firm: result.recalling_firm || null,
    report_date: result.report_date || null,
    distribution: result.distribution_pattern || null,
  };
}

function recallLine(row) {
  return `${row.recall_number} · ${row.classification || "class unlisted"} · ${row.report_date || "date unlisted"} — ${row.product || "product unlisted"}`;
}

async function fetchRecalls(category, query) {
  const source = `openFDA ${category} enforcement reports`;
  const url = `https://api.fda.gov/${category}/enforcement.json?${query}`;
  const payload = await fetchJSON(source, url, { ttl: 300, emptyOn404: true });
  return { source, results: payload?.results || [] };
}

async function recallsRecent() {
  const category = textArg(argsOf(), ["category"], { required: false, label: "category", allowed: RECALL_CATEGORIES }) || "food";
  const limit = limitArg(argsOf(), 10);
  const { source, results } = await fetchRecalls(category, `limit=${limit}&sort=report_date:desc`);
  if (results.length === 0) {
    return { text: `${source} returned no recalls. openFDA publishes what it has; an empty answer is what the source says.`, data: { count: 0 }, source };
  }
  const rows = results.map(recallRow);
  const text = [
    `${rows.length} most recent ${category} recalls (openFDA enforcement reports, newest first):`,
    ...rows.map((row) => `  • ${recallLine(row)}`),
    "openFDA's own warning applies: this data is not validated and may be incomplete or out of date.",
  ].join("\n");
  return { text, data: { count: rows.length, category, recalls: rows }, source };
}

async function recallSearch() {
  const category = textArg(argsOf(), ["category"], { required: false, label: "category", allowed: RECALL_CATEGORIES }) || "food";
  const query = textArg(argsOf(), ["query", "search"], { label: "query" });
  const limit = limitArg(argsOf(), 10);
  const { source, results } = await fetchRecalls(category, `limit=${limit}&search=${encodeURIComponent(query)}`);
  if (results.length === 0) {
    return { text: `No ${category} recall matches "${query}" in ${source}. The search string is passed to openFDA exactly as written.`, data: { count: 0, query }, source };
  }
  const rows = results.map(recallRow);
  const text = [
    `${rows.length} ${category} recalls match "${query}" (${source}):`,
    ...rows.map((row) => `  • ${recallLine(row)}${row.reason ? ` — ${row.reason.slice(0, 140)}` : ""}`),
    "openFDA's own warning applies: this data is not validated and may be incomplete or out of date.",
  ].join("\n");
  return { text, data: { count: rows.length, category, query, recalls: rows }, source };
}

async function recallLookup() {
  const category = textArg(argsOf(), ["category"], { required: false, label: "category", allowed: RECALL_CATEGORIES }) || "food";
  const recallNumber = textArg(argsOf(), ["recall_number", "recallNumber", "number"], { label: "recall_number" });
  const { source, results } = await fetchRecalls(category, `limit=5&search=${encodeURIComponent(`recall_number:"${recallNumber}"`)}`);
  if (results.length === 0) {
    return { text: `openFDA has no ${category} recall numbered "${recallNumber}" (${source}). Recall numbers are case-sensitive in the source.`, data: { count: 0, recall_number: recallNumber }, source };
  }
  const rows = results.map(recallRow);
  const text = [
    `${rows.length} openFDA ${category} record(s) for recall number ${recallNumber} (${source}):`,
    ...rows.map((row) => [
      `  • ${recallLine(row)}`,
      `      firm: ${row.recalling_firm || "unlisted"}`,
      `      status: ${row.status || "unlisted"} · distribution: ${row.distribution || "unlisted"}`,
      `      reason: ${row.reason || "unlisted"}`,
    ].join("\n")),
    "openFDA's own warning applies: this data is not validated and may be incomplete or out of date.",
  ].join("\n");
  return { text, data: { count: rows.length, category, recall_number: recallNumber, recalls: rows }, source };
}

// ---------------------------------------------------------------- NOAA tides

const DEFAULT_TIDE_STATION = "8518750";
const DEFAULT_TIDE_STATION_NAME = "The Battery, New York (NOAA station 8518750)";

function todayStamp() {
  const now = new Date(Date.now() - 4 * 3600000); // NOAA's day starts in Eastern time; four hours back covers it.
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

function tidePredictionsUrl(station, interval, range) {
  return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=a2a-hosted&station=${station}` +
    `&begin_date=${todayStamp()}&range=${range}&datum=MLLW&time_zone=lst_ldt&units=english&interval=${interval}&format=json`;
}

function stationArg() {
  const station = textArg(argsOf(), ["station", "station_id"], { required: false, label: "station" }) || DEFAULT_TIDE_STATION;
  if (!/^[0-9]{7}$/.test(station)) {
    throw new UsageError(`station must be a 7-digit NOAA station id (like ${DEFAULT_TIDE_STATION}), got "${station}". Use the stations skill to search by name.`);
  }
  return station;
}

async function tideNext() {
  const station = stationArg();
  const source = `NOAA CO-OPS tide predictions for station ${station}`;
  const payload = await fetchJSON(source, tidePredictionsUrl(station, "hilo", 48), { ttl: 900 });
  const predictions = payload.predictions || [];
  if (predictions.length === 0) throw new SourceError(source, `${source} returned no high/low predictions; NOAA publishes them about a year ahead.`);
  const now = new Date();
  const upcoming = predictions.filter((row) => new Date(`${row.t.replace(" ", "T")}:00`) >= now).slice(0, 4);
  const rows = (upcoming.length ? upcoming : predictions.slice(-4)).map((row) => ({ time: row.t, height_ft: Number(row.v), kind: row.type === "H" ? "high" : "low" }));
  const text = [
    `Next high and low tides at ${station === DEFAULT_TIDE_STATION ? DEFAULT_TIDE_STATION_NAME : `NOAA station ${station}`}:`,
    ...rows.map((row) => `  • ${row.kind} tide ${row.height_ft} ft at ${row.time} (station local time)`),
    `Read live from ${source}, heights above MLLW in feet.${station === DEFAULT_TIDE_STATION ? " No station was given, so the default above was used." : ""}`,
  ].join("\n");
  return { text, data: { station, datum: "MLLW", units: "feet", tides: rows }, source };
}

async function tidePredictions() {
  const station = stationArg();
  const source = `NOAA CO-OPS tide predictions for station ${station}`;
  const payload = await fetchJSON(source, tidePredictionsUrl(station, "h", 24), { ttl: 900 });
  const predictions = payload.predictions || [];
  if (predictions.length === 0) throw new SourceError(source, `${source} returned no hourly predictions.`);
  const rows = predictions.slice(0, 24).map((row) => ({ time: row.t, height_ft: Number(row.v) }));
  const text = [
    `${rows.length} hourly tide predictions at ${station === DEFAULT_TIDE_STATION ? DEFAULT_TIDE_STATION_NAME : `NOAA station ${station}`} (${source}):`,
    ...rows.map((row) => `  • ${row.time}: ${row.height_ft} ft`),
    "Heights are predictions above MLLW, in feet, in station local time.",
  ].join("\n");
  return { text, data: { station, datum: "MLLW", units: "feet", hours: rows }, source };
}

async function stations() {
  const query = textArg(argsOf(), ["query", "name"], { label: "query" });
  const source = "NOAA CO-OPS station list";
  const payload = await fetchJSON(source, "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions", { ttl: 86400 });
  const all = payload.stations || [];
  const needle = query.toLowerCase();
  const matches = all.filter((station) =>
    String(station.name || "").toLowerCase().includes(needle) ||
    String(station.state || "").toLowerCase() === needle,
  );
  const limit = limitArg(argsOf(), 20);
  const rows = matches.slice(0, limit).map((station) => ({
    id: station.id,
    name: station.name,
    state: station.state || null,
    latitude: station.lat === undefined ? null : round(Number(station.lat), 4),
    longitude: station.lng === undefined ? null : round(Number(station.lng), 4),
  }));
  const text = matches.length === 0
    ? `No tide-prediction station in NOAA's list matches "${query}" (${all.length} stations checked).`
    : [
        `${matches.length} of ${all.length} tide-prediction stations match "${query}" (${source})${matches.length > rows.length ? `, first ${rows.length} shown` : ""}:`,
        ...rows.map((row) => `  • ${row.id} · ${row.name}${row.state ? `, ${row.state}` : ""}${row.latitude === null ? "" : ` (${row.latitude}, ${row.longitude})`}`),
        "Use one of these ids with tide-next or tide-predictions.",
      ].join("\n");
  return { text, data: { count: matches.length, stations: rows }, source };
}

// ---------------------------------------------------------------- space weather

function kpBand(kp) {
  if (kp < 4) return "quiet";
  if (kp < 5) return "active (unsettled to active, no storm)";
  if (kp < 6) return "G1 minor storm";
  if (kp < 7) return "G2 moderate storm";
  if (kp < 8) return "G3 strong storm";
  if (kp < 9) return "G4 severe storm";
  return "G5 extreme storm";
}

async function auroraNow() {
  const source = "NOAA SWPC 1-minute planetary K index";
  const rows = await fetchJSON(source, "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json", { ttl: 60 });
  if (!Array.isArray(rows) || rows.length === 0) throw new SourceError(source, `${source} returned no readings.`);
  const latest = rows[rows.length - 1];
  const kp = Number(latest.estimated_kp ?? latest.kp_index);
  const text = [
    `Planetary K index now: Kp ${kp} (${kpBand(kp)}).`,
    `  • reading taken ${latest.time_tag} UTC, from SWPC's one-minute feed (${rows.length} readings returned)`,
    "Kp is a measured index of how disturbed Earth's magnetic field is right now. Storms can still be on the way even when this number is low.",
  ].join("\n");
  return { text, data: { kp, band: kpBand(kp), time: latest.time_tag }, source };
}

async function auroraForecast() {
  const source = "NOAA SWPC planetary K index forecast";
  const rows = await fetchJSON(source, "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json", { ttl: 900 });
  if (!Array.isArray(rows) || rows.length === 0) throw new SourceError(source, `${source} returned no forecast.`);
  const byDay = new Map();
  for (const row of rows) {
    const day = String(row.time_tag || "").slice(0, 10);
    if (!day) continue;
    const kp = Number(row.kp);
    if (!Number.isFinite(kp)) continue;
    const current = byDay.get(day) || { day, max_kp: kp, hours: 0 };
    current.max_kp = Math.max(current.max_kp, kp);
    current.hours += 1;
    byDay.set(day, current);
  }
  const days = [...byDay.values()].slice(0, 3).map((day) => ({ ...day, max_kp: round(day.max_kp, 2), band: kpBand(day.max_kp) }));
  const stormDays = days.filter((day) => day.max_kp >= 5);
  const text = [
    `Predicted planetary K index, next ${days.length} days (${source}, ${rows.length} forecast rows):`,
    ...days.map((day) => `  • ${day.day}: peak Kp ${day.max_kp} — ${day.band}`),
    stormDays.length
      ? `Days the forecast calls storm: ${stormDays.map((day) => `${day.day} (Kp ${day.max_kp})`).join(", ")}. Forecast, not measurement.`
      : "No day in that window is forecast to reach storm level (Kp 5). Forecast, not measurement.",
  ].join("\n");
  return { text, data: { days, storm_days: stormDays.map((day) => day.day) }, source };
}

async function auroraVisibility() {
  const { latitude, longitude } = pointArg();
  if (latitude < 0) throw new UsageError("this skill reports the northern-hemisphere aurora oval; give a latitude of 0 or more.");
  const source = "NOAA SWPC OVATION aurora model";
  const payload = await fetchJSON(source, "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json", { ttl: 900 });
  const coordinates = payload.coordinates || [];
  if (coordinates.length === 0) throw new SourceError(source, `${source} returned no grid data.`);
  const lon = ((longitude % 360) + 360) % 360;
  let best = null;
  for (const cell of coordinates) {
    const cellLon = cell[0];
    const cellLat = cell[1];
    const probability = cell[2];
    const distance = Math.abs(cellLat - latitude) + Math.min(Math.abs(cellLon - lon), 360 - Math.abs(cellLon - lon));
    if (best === null || distance < best.distance) best = { distance, cellLon, cellLat, probability };
  }
  const text = [
    `Aurora probability at ${latitude}, ${longitude}: ${best.probability}% (nearest model cell ${best.cellLat}°, ${best.cellLon}°).`,
    `  • from ${source}, forecast time ${payload["Forecast Time"] || "as published"}, observation time ${payload["Observation Time"] || "as published"}`,
    "This is the model's probability that aurora is overhead — a percentage, not a promise. Cloud cover is not part of this number.",
  ].join("\n");
  return { text, data: { latitude, longitude, probability_percent: best.probability, model_cell: { latitude: best.cellLat, longitude: best.cellLon }, forecast_time: payload["Forecast Time"] || null }, source };
}

// ---------------------------------------------------------------- dispatch

const SKILL_HANDLERS = {
  air: { "air-now": airNow, "air-forecast": airForecast },
  aurora: { "aurora-now": auroraNow, "aurora-forecast": auroraForecast, "aurora-visibility": auroraVisibility },
  nws: { "alerts-active": alertsActive, "alerts-summary": alertsSummary },
  quakes: { "quakes-recent": quakesRecent, "quakes-near": quakesNear, "quakes-summary": quakesSummary },
  recalls: { "recalls-recent": recallsRecent, "recall-search": recallSearch, "recall-lookup": recallLookup },
  tides: { "tide-next": tideNext, "tide-predictions": tidePredictions, stations },
};

const NON_ARG_METADATA_KEYS = new Set(["skill", "skillId", "skill_id", "watch", "watchers"]);

function readArguments(message) {
  const metadata = message?.metadata || {};
  const fromMetadata = metadata.args || metadata.arguments;
  if (fromMetadata && typeof fromMetadata === "object") return { ...fromMetadata };
  const parts = message?.parts || [];
  // The local Python servers read a data part: {"kind":"data","data":{"skill":…, …args}}.
  // Same call works here, so a client written for one works against the other.
  for (const part of parts) {
    if (part.kind === "data" && part.data && typeof part.data === "object") return { ...part.data };
  }
  const flat = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (NON_ARG_METADATA_KEYS.has(key)) continue;
    flat[key] = value;
  }
  if (Object.keys(flat).length > 0) return flat;
  for (const part of parts) {
    if (part.kind === "text" && typeof part.text === "string" && part.text.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(part.text);
        if (parsed && typeof parsed === "object") return { ...parsed };
      } catch {
        // A text part that only looks like JSON is not an argument object; ignore it.
      }
    }
  }
  return {};
}

function chosenSkill(message, slug) {
  const metadata = message?.metadata || {};
  const args = readArguments(message);
  // The local servers take the skill from the data part ({"skill": …}); clients also put
  // it in metadata or send the skill id as the only text part. All three are accepted.
  const asked = metadata.skill || metadata.skillId || metadata.skill_id ||
    args.skill || args.skillId || args.skill_id;
  const available = Object.keys(SKILL_HANDLERS[slug]);
  if (asked) {
    if (!available.includes(asked)) {
      throw new UsageError(`this agent answers ${available.join(", ")} — "${asked}" is not one of them.`);
    }
    return asked;
  }
  if (available.length === 1) return available[0];
  const text = (message?.parts || []).filter((part) => part.kind === "text").map((part) => part.text).join(" ").trim();
  if (text && available.includes(text)) return text;
  throw new UsageError(`name the skill to run. This agent answers: ${available.join(", ")}.`);
}

async function runSkill(slug, message) {
  const skill = chosenSkill(message, slug);
  const handler = SKILL_HANDLERS[slug][skill];
  currentArgs = readArguments(message);
  try {
    const result = await handler();
    return { skill, ...result };
  } finally {
    currentArgs = {};
  }
}

// ---------------------------------------------------------------- protocol

function jsonResponse(body, status = 200, maxAge = 60) {
  return new Response(JSON.stringify(body, null, 2) + "\n", {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

function rpcResult(id, result) {
  return jsonResponse({ jsonrpc: "2.0", id, result }, 200, 0);
}

function rpcError(id, code, message, data) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data ? { data } : {}) } }, 200, 0);
}

function taskFrom(slug, skill, result) {
  const parts = [{ kind: "text", text: result.text }];
  if (result.data) parts.push({ kind: "data", data: result.data });
  return {
    kind: "task",
    id: crypto.randomUUID(),
    contextId: crypto.randomUUID(),
    status: { state: "completed", timestamp: new Date().toISOString() },
    artifacts: [{ artifactId: crypto.randomUUID(), name: skill, parts }],
    metadata: { skill, source: result.source, agent: slug, hosted: true, protocolVersion: PROTOCOL_VERSION },
  };
}

async function handleRPC(request, slug) {
  let body;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "the request body is not JSON.");
  }
  const id = body?.id ?? null;
  const method = body?.method;
  if (body?.jsonrpc !== "2.0" || typeof method !== "string") {
    return rpcError(id, -32600, "expected a JSON-RPC 2.0 request with a method.");
  }
  if (method !== "message/send") {
    return rpcError(id, -32601, `this hosted endpoint answers message/send only; "${method}" is not implemented here. Streaming, task history and push notifications run in the local server.`);
  }
  const message = body?.params?.message;
  if (!message || typeof message !== "object") {
    return rpcError(id, -32602, "message/send needs params.message with at least one part.");
  }
  try {
    const result = await runSkill(slug, message);
    return rpcResult(id, taskFrom(slug, result.skill, result));
  } catch (error) {
    if (error instanceof UsageError) {
      return rpcError(id, -32602, error.message, { agent: slug, skills: Object.keys(SKILL_HANDLERS[slug]) });
    }
    if (error instanceof SourceError) {
      return rpcError(id, -32001, error.message, { source: error.source, agent: slug });
    }
    return rpcError(id, -32603, `the skill failed: ${error.message}`, { agent: slug });
  }
}

function indexBody() {
  return {
    name: "mrfentmen public-data A2A agents",
    repository: "https://github.com/mrfentmen/a2a",
    protocolVersion: PROTOCOL_VERSION,
    note: "Hosted endpoints answer message/send with live public data. Streaming, push notifications and watch skills run in the local Python servers.",
    agents: [...CARD_BY_SLUG.entries()].map(([slug, card]) => ({
      slug,
      name: card.name,
      version: card.version,
      packageName: card.metadata.registryPackageName,
      card: card.url.split("/").slice(0, 3).join("/") + `/agents/${slug}/.well-known/agent-card.json`,
      endpoint: card.url,
      skills: skillIds(card),
    })),
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type, authorization",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        },
      });
    }
    if (path === "/") return jsonResponse(indexBody(), 200, 300);

    const match = path.match(/^\/agents\/([a-z0-9-]+)(\/.*)?$/);
    if (!match) {
      return jsonResponse({ error: "not_found", path, agents: [...CARD_BY_SLUG.keys()] }, 404, 0);
    }
    const slug = match[1];
    const rest = match[2] || "";
    const card = CARD_BY_SLUG.get(slug);
    if (!card) {
      return jsonResponse({ error: "unknown_agent", agent: slug, agents: [...CARD_BY_SLUG.keys()] }, 404, 0);
    }
    if (request.method === "GET" && (rest === "/.well-known/agent-card.json" || rest === "/.well-known/agent.json")) {
      return jsonResponse(card, 200, 300);
    }
    if (request.method === "GET" && rest === "/healthz") {
      return jsonResponse({ ok: true, agent: slug, skills: skillIds(card), hosted: true }, 200, 0);
    }
    if (request.method === "GET" && rest === "") {
      return jsonResponse({ agent: slug, name: card.name, card: url.origin + `/agents/${slug}/.well-known/agent-card.json`, skills: skillIds(card), transport: "JSONRPC" }, 200, 300);
    }
    if (request.method === "POST" && rest === "") {
      return handleRPC(request, slug);
    }
    return jsonResponse({ error: "not_found", agent: slug, path }, 404, 0);
  },
};
