/**
 * Sun and Moon Almanac — keyless public API client.
 */
export class SourceError extends Error {
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
const DEG = Math.PI / 180;
function julian(date) {
    return date.getTime() / 86400000 + 2440587.5;
}
function parseDate(value, fallback) {
    if (!value)
        return fallback;
    const text = clean(value);
    const d = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T12:00:00Z`) : new Date(text);
    if (Number.isNaN(d.getTime()))
        throw new SourceError(`"${value}" is not a date or ISO instant`);
    return d;
}
function norm(deg) {
    return ((deg % 360) + 360) % 360;
}
function sunLongitude(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
    const C = Math.sin(M) * (1.914602 - 0.004817 * T - 0.000014 * T * T) +
        Math.sin(2 * M) * (0.019993 - 0.000101 * T) +
        Math.sin(3 * M) * 0.000289;
    return norm(L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * DEG));
}
function moonLongitude(jd) {
    const T = (jd - 2451545) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * DEG;
    const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * DEG;
    const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * DEG;
    const F = (93.272095 + 483202.0175233 * T - 0.0036539 * T * T) * DEG;
    const lon = Lp +
        6.289 * Math.sin(Mp) +
        1.274 * Math.sin(2 * D - Mp) +
        0.658 * Math.sin(2 * D) +
        0.214 * Math.sin(2 * Mp) -
        0.186 * Math.sin(M) -
        0.114 * Math.sin(2 * F) +
        0.059 * Math.sin(2 * D - 2 * Mp) +
        0.057 * Math.sin(2 * D - M - Mp) +
        0.053 * Math.sin(2 * D + Mp) +
        0.046 * Math.sin(2 * D - M);
    return norm(lon);
}
function elongation(jd) {
    return norm(moonLongitude(jd) - sunLongitude(jd));
}
function sunDeclination(jd) {
    const T = (jd - 2451545) / 36525;
    const e0 = 23 + 26 / 60 + 21.448 / 3600 - (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
    const e = e0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * DEG);
    return Math.asin(Math.sin(e * DEG) * Math.sin(sunLongitude(jd) * DEG)) / DEG;
}
function equationOfTime(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const e0 = 23 + 26 / 60 + 21.448 / 3600 - (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
    const eps = (e0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * DEG)) * DEG;
    const y = Math.tan(eps / 2) ** 2;
    const eot = y * Math.sin(2 * L0 * DEG) -
        2 * e * Math.sin(M) +
        4 * e * y * Math.sin(M) * Math.cos(2 * L0 * DEG) -
        0.5 * y * y * Math.sin(4 * L0 * DEG) -
        1.25 * e * e * Math.sin(2 * M);
    return (eot / DEG) * 4;
}
function fmt(minutesUtc, offsetHours) {
    if (!Number.isFinite(minutesUtc))
        return "(none)";
    let m = minutesUtc + (offsetHours ?? 0) * 60;
    m = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = Math.round(m % 60);
    const hh = mm === 60 ? h + 1 : h;
    const stamped = `${String(hh % 24).padStart(2, "0")}:${String(mm === 60 ? 0 : mm).padStart(2, "0")}`;
    return offsetHours === undefined ? `${stamped} UTC` : `${stamped} (UTC${offsetHours >= 0 ? "+" : ""}${offsetHours})`;
}
function eventTimes(jdNoon, lat, lon) {
    const dec = sunDeclination(jdNoon + 0.5);
    const eot = equationOfTime(jdNoon + 0.5);
    const noon = 720 - 4 * lon - eot;
    const cosH = (altitude) => (Math.sin(altitude * DEG) - Math.sin(lat * DEG) * Math.sin(dec * DEG)) / (Math.cos(lat * DEG) * Math.cos(dec * DEG));
    const hours = (altitude) => {
        const c = cosH(altitude);
        if (c > 1 || c < -1)
            return null;
        return Math.acos(c) / DEG / 15;
    };
    const hSun = hours(-0.833);
    const hCivil = hours(-6);
    return {
        noon,
        rise: hSun === null ? NaN : noon - hSun * 60,
        set: hSun === null ? NaN : noon + hSun * 60,
        civil: hCivil === null ? null : hCivil * 60,
    };
}
function coords(lat, lon) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        throw new SourceError("lat must be between -90 and 90");
    if (!Number.isFinite(lon) || lon < -180 || lon > 180)
        throw new SourceError("lon must be between -180 and 180");
}
function dayStart(date) {
    const midnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    return julian(midnight) - 0.5;
}
export async function solarTimes(a) {
    coords(a.lat, a.lon);
    const date = parseDate(a.date, new Date());
    const jd0 = dayStart(date);
    const { noon, rise, set, civil } = eventTimes(jd0, a.lat, a.lon);
    const dateText = date.toISOString().slice(0, 10);
    const offset = a.utcOffset;
    if (Number.isNaN(rise) || Number.isNaN(set)) {
        const dec = sunDeclination(jd0 + 0.5);
        const polarDay = (a.lat > 0 ? 1 : -1) * dec > 0;
        return [
            `${dateText}: no sunrise or sunset at ${a.lat}, ${a.lon} - the sun stays ${polarDay ? "up all day (polar day)" : "below the horizon (polar night)"}.`,
            "",
            `Solar noon: ${fmt(noon, offset)}`,
            `Sun declination: ${dec.toFixed(2)} degrees`,
        ].join("\n");
    }
    const dayLength = (set - rise) / 60;
    return [
        `${dateText} at ${a.lat}, ${a.lon}:`,
        "",
        `Sunrise:    ${fmt(rise, offset)}`,
        `Sunset:     ${fmt(set, offset)}`,
        `Day length: ${Math.floor(dayLength)}h ${Math.round((dayLength % 1) * 60)}m`,
        `Solar noon: ${fmt(noon, offset)}`,
        civil !== null ? `Civil dawn: ${fmt(noon - civil, offset)}` : "",
        civil !== null ? `Civil dusk: ${fmt(noon + civil, offset)}` : "",
    ].filter(Boolean).join("\n");
}
export async function sunPosition(a) {
    coords(a.lat, a.lon);
    const date = parseDate(a.datetime, new Date());
    const jd = julian(date);
    const dec = sunDeclination(jd);
    const eot = equationOfTime(jd);
    const minutesUtc = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    const trueSolarMinutes = minutesUtc + eot + 4 * a.lon;
    const hourAngle = norm(trueSolarMinutes / 4 - 180);
    const altitude = Math.asin(Math.sin(a.lat * DEG) * Math.sin(dec * DEG) + Math.cos(a.lat * DEG) * Math.cos(dec * DEG) * Math.cos(hourAngle * DEG)) / DEG;
    let azimuth = Math.atan2(Math.sin(hourAngle * DEG), Math.cos(hourAngle * DEG) * Math.sin(a.lat * DEG) - Math.tan(dec * DEG) * Math.cos(a.lat * DEG)) / DEG + 180;
    azimuth = norm(azimuth);
    const subsolarLat = dec;
    const subsolarLon = norm(-15 * (minutesUtc / 60 + eot / 60 - 12));
    return [
        `${date.toISOString()}`,
        "",
        `Altitude: ${altitude.toFixed(2)} degrees${altitude < -0.833 ? " (sun is below the horizon)" : ""}`,
        `Azimuth: ${azimuth.toFixed(1)} degrees (clockwise from north)`,
        `Declination: ${dec.toFixed(2)} degrees`,
        `Hour angle: ${hourAngle.toFixed(1)} degrees`,
        `Subsolar point: ${subsolarLat.toFixed(2)}, ${subsolarLon.toFixed(2)}`,
    ].join("\n");
}
function phaseName(elongationDeg) {
    const e = elongationDeg;
    if (e < 22.5 || e >= 337.5)
        return "new moon";
    if (e < 67.5)
        return "waxing crescent";
    if (e < 112.5)
        return "first quarter";
    if (e < 157.5)
        return "waxing gibbous";
    if (e < 202.5)
        return "full moon";
    if (e < 247.5)
        return "waning gibbous";
    if (e < 292.5)
        return "last quarter";
    return "waning crescent";
}
const SYNODIC = 29.530588853;
function findNext(jdStart, target) {
    const phase = (jd) => norm(elongation(jd) - target * 360);
    let lo = jdStart;
    let step = 0.25;
    let prev = phase(lo);
    for (let jd = jdStart + step; jd < jdStart + 62; jd += step) {
        const current = phase(jd);
        if (current > 300 && prev < 60) {
            let a = jd - step;
            let b = jd;
            for (let i = 0; i < 40; i++) {
                const mid = (a + b) / 2;
                if (phase(mid) > 300)
                    b = mid;
                else
                    a = mid;
            }
            return (a + b) / 2;
        }
        prev = current;
    }
    return NaN;
}
export async function moonPhase(a) {
    const date = parseDate(a.datetime, new Date());
    const jd = julian(date);
    const elong = elongation(jd);
    const illumination = ((1 - Math.cos(elong * DEG)) / 2) * 100;
    const age = (elong / 360) * SYNODIC;
    const nextFull = findNext(jd, 0.5);
    const nextNew = findNext(jd, 0);
    const iso = (j) => (Number.isNaN(j) ? "unknown" : new Date((j - 2440587.5) * 86400000).toISOString().slice(0, 16).replace("T", " ") + " UTC");
    return [
        `${date.toISOString()} - ${phaseName(elong)}`,
        "",
        `Illumination: ${illumination.toFixed(1)}%`,
        `Phase angle: ${elong.toFixed(1)} degrees`,
        `Moon age: ${age.toFixed(1)} of ~${SYNODIC} days`,
        `Next full moon: ${iso(nextFull)}`,
        `Next new moon:  ${iso(nextNew)}`,
    ].join("\n");
}
