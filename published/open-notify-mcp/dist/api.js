const UA = 'mrfentmen-open-notify-mcp/1.0';
export async function astronauts(_args) {
    const res = await fetch('http://api.open-notify.org/astros.json', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Open Notify returned ${res.status}`);
    const d = (await res.json());
    const people = d.people ?? [];
    return `People in space right now (${d.number ?? people.length}):\n` +
        people.map((p, i) => `${i + 1}. ${p.name ?? '?'} (${p.craft ?? '?'})`).join('\n');
}
export async function iss(_args) {
    const res = await fetch('http://api.open-notify.org/iss-now.json', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Open Notify returned ${res.status}`);
    const d = (await res.json());
    const pos = d.iss_position ?? {};
    const when = d.timestamp ? new Date(d.timestamp * 1000).toISOString() : '?';
    return `ISS position at ${when}:\nLatitude: ${pos.latitude ?? '?'}\nLongitude: ${pos.longitude ?? '?'}`;
}
// ---- muxB tools:
const GROUND_UA = 'mrfentmen-open-notify-mcp/1.0';
async function issPosition() {
    const res = await fetch('http://api.open-notify.org/iss-now.json', {
        headers: { 'User-Agent': GROUND_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Open Notify returned ${res.status}`);
    const d = (await res.json());
    const lat = Number(d.iss_position?.latitude);
    const lon = Number(d.iss_position?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        throw new Error('Open Notify returned no usable ISS position');
    return { lat, lon, when: d.timestamp ? new Date(d.timestamp * 1000) : new Date() };
}
const RAD = Math.PI / 180;
const EARTH_R_KM = 6371;
const SUN_ANGULAR_RADIUS_DEG = 0.266;
function solarTerms(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const t = (jd - 2451545) / 36525;
    const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const c = Math.sin(m * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t))
        + Math.sin(2 * m * RAD) * (0.019993 - 0.000101 * t)
        + Math.sin(3 * m * RAD) * 0.000289;
    const trueLong = l0 + c;
    const omega = 125.04 - 1934.136 * t;
    const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const y = Math.tan((eps / 2) * RAD) ** 2;
    const eq = y * Math.sin(2 * l0 * RAD) - 2 * e * Math.sin(m * RAD)
        + 4 * e * y * Math.sin(m * RAD) * Math.cos(2 * l0 * RAD)
        - 0.5 * y * y * Math.sin(4 * l0 * RAD)
        - 1.25 * e * e * Math.sin(2 * m * RAD);
    return { decl, eqOfTimeMin: (4 * eq) / RAD };
}
function haversineDeg(lat1, lon1, lat2, lon2) {
    const p1 = lat1 * RAD, p2 = lat2 * RAD;
    const dp = (lat2 - lat1) * RAD, dl = (lon2 - lon1) * RAD;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * Math.asin(Math.min(1, Math.sqrt(a))) / RAD;
}
export async function issSunlight(args) {
    const { lat, lon, when } = await issPosition();
    const altitude = Math.max(200, Math.min(Number(args?.altitudeKm ?? 420) || 420, 1000));
    const { decl, eqOfTimeMin } = solarTerms(when);
    const utcMinutes = when.getUTCHours() * 60 + when.getUTCMinutes() + when.getUTCSeconds() / 60;
    let subsolarLon = -15 * ((utcMinutes + eqOfTimeMin) / 60 - 12);
    subsolarLon = ((((subsolarLon + 180) % 360) + 360) % 360) - 180;
    const gamma = haversineDeg(lat, lon, decl, subsolarLon);
    const r = EARTH_R_KM + altitude;
    const earthAngularRadius = Math.asin(EARTH_R_KM / r) / RAD;
    const umbraLimit = earthAngularRadius - SUN_ANGULAR_RADIUS_DEG;
    const penumbraLimit = earthAngularRadius + SUN_ANGULAR_RADIUS_DEG;
    let state;
    let detail;
    if (gamma < umbraLimit) {
        state = 'UMBRA - the ISS is inside Earth\'s shadow (eclipse)';
        detail = `about ${((penumbraLimit - gamma) / (360 / 92.9)).toFixed(0)} min of shadow left at this altitude`;
    }
    else if (gamma < penumbraLimit) {
        state = 'PENUMBRA - the ISS is crossing into or out of Earth\'s shadow';
        detail = 'sun partly blocked by the limb of the Earth';
    }
    else {
        state = 'SUNLIT - the ISS is in full sunlight';
        detail = `about ${((gamma - penumbraLimit) / (360 / 92.9)).toFixed(0)} min of sunlight left before an eclipse, assuming a 92.9-minute orbit`;
    }
    const tst = (((utcMinutes + eqOfTimeMin + 4 * lon) % 1440) + 1440) % 1440;
    const hourAngle = tst / 4 - 180;
    const elevation = 90 - Math.acos(Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(hourAngle * RAD)) / RAD;
    const az = (Math.atan2(-Math.cos(decl * RAD) * Math.sin(hourAngle * RAD), Math.sin(decl * RAD) * Math.cos(lat * RAD) - Math.cos(decl * RAD) * Math.sin(lat * RAD) * Math.cos(hourAngle * RAD)) / RAD + 360) % 360;
    return [
        `ISS sunlight at ${when.toISOString()} (sub-point ${lat.toFixed(4)}, ${lon.toFixed(4)}, altitude ${altitude} km):`,
        `State: ${state}`,
        `Shadow geometry: ${gamma.toFixed(2)} deg from the anti-solar point (umbra below ${umbraLimit.toFixed(2)} deg, penumbra below ${penumbraLimit.toFixed(2)} deg at ${altitude} km)`,
        `Detail: ${detail}`,
        `Solar elevation at the sub-point: ${elevation.toFixed(1)} deg, azimuth ${az.toFixed(0)} deg`,
        `Subsolar point: ${decl.toFixed(2)}, ${subsolarLon.toFixed(2)} (solar declination, equation of time ${eqOfTimeMin.toFixed(1)} min)`,
    ].join('\n');
}
