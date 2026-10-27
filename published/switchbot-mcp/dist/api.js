import { createHmac, randomUUID } from "node:crypto";
export class SwitchbotError extends Error {
    constructor(message) {
        super(message);
        this.name = "SwitchbotError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new SwitchbotError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    const token = envStrict("SWITCHBOT_TOKEN");
    const secret = envStrict("SWITCHBOT_SECRET");
    const t = String(Date.now());
    const nonce = randomUUID();
    const sign = createHmac("sha256", secret).update(token + t + nonce).digest("base64");
    return { Authorization: token, sign, nonce, t };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new SwitchbotError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function listDevices() {
    let url = `https://api.switch-bot.com/v1.1/devices`;
    const data = await req(url);
    return pretty(data);
}
export async function getDeviceStatus(deviceId) {
    let url = `https://api.switch-bot.com/v1.1/devices/${encodeURIComponent(String(deviceId))}/status`;
    const data = await req(url);
    return pretty(data);
}
export async function sendCommand(deviceId, command, parameter, commandType) {
    let url = `https://api.switch-bot.com/v1.1/devices/${encodeURIComponent(String(deviceId))}/commands`;
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command, parameter, commandType }) });
    return pretty(data);
}
